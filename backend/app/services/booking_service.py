import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, delete

from app.models.booking import Booking, BookingSeat, BookingPassenger, Discount
from app.models.trip import Trip, BusRoute, SeatHold, SeatLock
from app.models.bus import Bus, SeatLayout, Seat
from app.models.student import Student
from app.models.payment import Payment, PaymentTransaction, Refund
from app.models.finance import FinancialLedger
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.booking import (
    CreateBookingRequest,
    CreatePreBookingRequest,
    VerifyTimerRequest,
    ConfirmPreBookingPaymentRequest,
    OfflineBookingItem
)
from app.core.redis_client import hold_seat_redis, release_seat_redis, get_seat_hold_status_redis
from app.core.idempotency import check_or_set_idempotency, complete_idempotency, clear_idempotency
from app.services.seat_layout_service import (
    resolve_requested_seats,
    validate_booking_request_seats,
    find_active_conflict,
    seat_label_of,
    booking_seat_labels,
)
from app.services.notification_service import dispatch_booking_notifications



class SeatAlreadyBookedException(Exception):
    pass


ACTIVE_BOOKING_STATUSES = [
    "CONFIRMED", "COMPLETED", "PRE_BOOKED", 
    "PAYMENT_TIMER_ACTIVE", "HELD", "VERIFICATION_PENDING"
]


async def generate_unique_booking_number(db: Session) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = await db.query(Booking).count()
    return f"BK-{date_str}-{random_part}-{count + 10001:05d}"


async def generate_unique_receipt_number(db: Session) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = await db.query(Payment).count()
    return f"RCT-{date_str}-{random_part}-{count + 1:04d}"


async def generate_unique_ledger_number(db: Session) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = await db.query(FinancialLedger).count()
    return f"LED-{date_str}-{random_part}-{count + 1:05d}"


async def generate_unique_refund_number(db: Session) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = await db.query(Refund).count()
    return f"RF-{date_str}-{random_part}-{count + 1:04d}"


# =====================================================================
# 1. COUNTER BOOKING WITH PESSIMISTIC ROW LOCKING (with_for_update)
# =====================================================================
async def create_counter_booking(
    db: Session,
    req: CreateBookingRequest,
    staff_id: str,
    tenant_id: Optional[str] = None,
    client_ip: Optional[str] = None
) -> Booking:
    if len(req.seats) > 6 or len(req.passengers) > 6:
        raise ValueError("এক সাথে সর্বোচ্চ ৬টির বেশি টিকিট বুকিং করা যাবে না (A4 সিঙ্গেল-পেজ প্রিন্ট নীতি অনুযায়ী)।")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Pessimistic Row Locking on the target Trip
    trip = await db.query(Trip).filter(Trip.id == req.trip_id).with_for_update(nowait=False).first()
    if not trip:
        # Fallback 1: Maybe req.trip_id is a bus ID that already has an active trip
        trip = await db.query(Trip).filter(
            Trip.bus_id == req.trip_id,
            Trip.status.in_(["SCHEDULED", "BOARDING"])
        ).with_for_update(nowait=False).first()

    if not trip:
        # Fallback 2: Maybe req.trip_id is a bus ID for which a trip needs to be auto-provisioned
        bus = await db.query(Bus).filter(Bus.id == req.trip_id).first()
        if bus and bus.status != "INACTIVE":
            # Find default or create route
            route = await db.query(BusRoute).first()
            if not route:
                route = BusRoute(
                    route_name="Dhaka to Exam Center",
                    origin="ঢাকা (গাবতলী/সায়েদাবাদ)",
                    destination="ভর্তি কেন্দ্র",
                    distance_km=250.0,
                    est_duration="5h 30m",
                    tenant_id=tenant_id or bus.tenant_id
                )
                db.add(route)
                await db.flush()

            clean_bus_num = "".join(ch for ch in (bus.bus_number or "COACH") if ch.isalnum()).upper()
            dep_date = datetime.now(timezone.utc).replace(tzinfo=None, hour=22, minute=30, second=0, microsecond=0)
            auto_trip = Trip(
                id=bus.id,  # Use bus ID so client matching remains consistent
                trip_code=f"TRIP-{clean_bus_num}-{int(datetime.now().timestamp()) % 10000:04d}",
                bus_id=bus.id,
                route_id=route.id,
                departure_date=dep_date,
                departure_time=dep_date,
                trip_bus_type=bus.bus_type or "MIXED",
                status="SCHEDULED",
                base_price=550.0,
                tenant_id=tenant_id or bus.tenant_id
            )
            db.add(auto_trip)
            await db.commit()
            trip = await db.query(Trip).filter(Trip.id == auto_trip.id).with_for_update(nowait=False).first()

    if not trip:
        raise ValueError("Trip not found")
    if trip.status in ["CANCELLED", "COMPLETED"]:
        raise ValueError(f"Trip is not available for booking (Status: {trip.status})")

    # Prevent duplicate passenger seat assignments in the request
    seen_passenger_seats = set()
    for p in req.passengers:
        if p.seat_id in seen_passenger_seats:
            raise ValueError(f"Duplicate seat {p.seat_id} in passenger list")
        seen_passenger_seats.add(p.seat_id)

    # Resolve every requested seat to a canonical layout cell and validate the
    # request against bus/seat gender rules + dynamic adjacent protection.
    normalized, rule_error = await validate_booking_request_seats(
        db,
        trip,
        req.passengers,
        journey_type=req.journey_type or "ROUND_TRIP",
    )
    if rule_error:
        raise ValueError(rule_error)

    seat_ids = [n["seat_id"] for n in normalized]
    seat_labels = [n["seat_number"] for n in normalized]

    # Post-normalization duplicate guard: two passengers referencing the same
    # physical seat via different id forms (e.g. 'A1' vs 'seat-trip-A1') must
    # be rejected.
    seen_labels = set()
    for lbl in seat_labels:
        if lbl in seen_labels:
            raise ValueError(f"Duplicate seat {lbl} in passenger list")
        seen_labels.add(lbl)

    # Rebuild req.seats so all downstream writes use canonical id + server fare.
    req.seats = [
        {
            "seat_id": n["seat_id"],
            "seat_number": n["seat_number"],
            "fare": n["fare"],
        }
        for n in normalized
    ]

    # 2. Concurrency Lock: Check if any seat is already booked or held in DB with with_for_update
    already_booked = await (
        db.query(BookingSeat)
        .join(Booking)
        .filter(
            BookingSeat.seat_id.in_(seat_ids),
            Booking.trip_id == req.trip_id,
            Booking.booking_status.in_(ACTIVE_BOOKING_STATUSES)
        )
        .with_for_update(nowait=False)
        .first()
    )
    if not already_booked and seat_labels:
        already_booked_p = await (
            db.query(BookingPassenger)
            .join(Booking)
            .filter(
                BookingPassenger.seat_number.in_(list(seat_labels)),
                Booking.trip_id == req.trip_id,
                Booking.booking_status.in_(ACTIVE_BOOKING_STATUSES)
            )
            .with_for_update(nowait=False)
            .first()
        )
        if already_booked_p:
            raise SeatAlreadyBookedException(f"Seat {already_booked_p.seat_number} is already booked or held by another transaction.")

    if already_booked:
        raise SeatAlreadyBookedException(f"Seat {already_booked.seat_id} is already booked or held by another transaction.")

    # Final serialized conflict guard (inside trip-locked transaction).
    conflict = await find_active_conflict(db, trip, seat_labels, resolve_seat_id=True)
    if conflict:
        raise SeatAlreadyBookedException(conflict["reason"])

    # Concurrency Lock: Check if any seat is actively locked (VIP, Maintenance, Staff, Emergency)
    locked = await (
        db.query(SeatLock)
        .filter(
            SeatLock.trip_id == req.trip_id,
            SeatLock.seat_id.in_(seat_ids),
            SeatLock.is_active == True,
            or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
        )
        .first()
    )
    if locked:
        raise ValueError(f"Seat {locked.seat_id} is currently locked ({locked.reason})")

    # (Seat rows are materialized by validate_booking_request_seats; BookingSeat
    # FKs resolve to the canonical layout-scoped row ids.)

    # 3. Financial Calculations & Discount Handling
    gross_amount = sum(s["fare"] for s in req.seats)
    discount_type = getattr(req, "discount_type", "FIXED") or "FIXED"
    discount_val = req.discount_rate or 0.0

    if discount_type == "PERCENTAGE":
        discount_amount = round((gross_amount * discount_val) / 100.0, 2)
    else:
        discount_amount = float(discount_val)

    if discount_amount > gross_amount:
        raise ValueError(f"Discount amount (৳{discount_amount}) cannot exceed gross ticket fare (৳{gross_amount})")

    net_amount = max(0.0, gross_amount - discount_amount)
    paid_amount = min(net_amount, max(0.0, req.paid_amount))
    due_amount = max(0.0, net_amount - paid_amount)
    payment_status = "PAID" if due_amount == 0 else ("PARTIALLY_PAID" if paid_amount > 0 else "UNPAID")

    booking_number = await generate_unique_booking_number(db)

    # Format WhatsApp summary for passengers (canonical seat label)
    whatsapp_summary = []
    for p in req.passengers:
        canon = next((n for n in normalized if n["passenger"] == p), None)
        label = canon["seat_number"] if canon else (getattr(p, "seat_number", None) or seat_label_of(p.seat_id) or p.seat_id)
        has_wa = getattr(p, "has_whatsapp", True)
        if has_wa is None:
            has_wa = getattr(p, "phone_type", "WHATSAPP") == "WHATSAPP"
        wa_num = getattr(p, "whatsapp_number", None) or (p.passenger_phone if has_wa else None)
        if wa_num:
            whatsapp_summary.append(f"Seat {label}: WhatsApp {wa_num}")
        else:
            whatsapp_summary.append(f"Seat {label}: Regular {p.passenger_phone}")
    
    notes_with_whatsapp = (req.notes or "")
    if whatsapp_summary:
        notes_with_whatsapp = (notes_with_whatsapp + " | " if notes_with_whatsapp else "") + f"[{'; '.join(whatsapp_summary)}]"

    # 4. Atomic Database Insert
    booking = Booking(
        tenant_id=tenant_id or trip.tenant_id,
        booking_number=booking_number,
        trip_id=req.trip_id,
        created_by_id=staff_id,
        booking_status="CONFIRMED",
        payment_status=payment_status,
        source="COUNTER",
        contact_name=req.passengers[0].passenger_name if req.passengers else "Passenger",
        contact_phone=req.passengers[0].passenger_phone if req.passengers else None,
        contact_email=getattr(req, "contact_email", None) or (getattr(req.passengers[0], "email", None) or getattr(req.passengers[0], "passenger_email", None) if req.passengers else None),
        passenger_gender=req.passengers[0].gender if req.passengers else "FEMALE",
        journey_type=req.journey_type or "ROUND_TRIP",
        boarding_point=req.boarding_point,
        dropping_point=req.dropping_point,
        passenger_legs_json=req.passenger_legs_json,
        gross_amount=gross_amount,
        discount_amount=discount_amount,
        net_amount=net_amount,
        paid_amount=paid_amount,
        due_amount=due_amount,
        notes=notes_with_whatsapp
    )
    db.add(booking)
    await db.flush()

    # 5. Re-map to any pre-existing DB Seat rows (by canonical label) so the
    #    FK uses the real row id; rows were materialized by ensure_seat_rows above.
    for s in req.seats:
        if await db.query(Seat).filter(Seat.id == s["seat_id"]).first():
            continue
        clean_snum = seat_label_of(s.get("seat_id") or "")
        matched_by_num = (
            await db.query(Seat).filter(
                Seat.seat_number == clean_snum,
                Seat.is_active == True,
            ).first()
        ) if clean_snum else None
        if matched_by_num:
            s["seat_id"] = matched_by_num.id

    # Attach Seats & Release Redis Holds (release by canonical seat label AND
    # the full id so no Redis hold key is orphaned).
    for s in req.seats:
        b_seat = BookingSeat(
            booking_id=booking.id,
            seat_id=s["seat_id"],
            fare_snapshot=s["fare"]
        )
        db.add(b_seat)
        # Release Redis anti-hoarding hold
        release_seat_redis(trip.tenant_id or "default", trip.id, s["seat_id"])
        label = seat_label_of(s.get("seat_id") or "")
        if label:
            release_seat_redis(trip.tenant_id or "default", trip.id, label)

    # 6. Attach Passengers (canonical seat_number from the validated layout)
    for p in req.passengers:
        canon = next((n for n in normalized if n["passenger"] == p), None)
        s_num = canon["seat_number"] if canon else (getattr(p, "seat_number", None) or seat_label_of(p.seat_id))
        p_email = getattr(p, "email", None) or getattr(p, "passenger_email", None)
        b_pass = BookingPassenger(
            booking_id=booking.id,
            passenger_name=p.passenger_name,
            passenger_phone=p.passenger_phone,
            passenger_email=p_email,
            passenger_type=p.passenger_type,
            gender=p.gender,
            seat_number=str(s_num) if s_num else p.seat_id
        )
        db.add(b_pass)

    # 7. Delete Database Holds
    await db.execute(delete(SeatHold).where(SeatHold.trip_id == req.trip_id, SeatHold.seat_id.in_(seat_ids)))

    # 8. Record Discount if applied
    if discount_amount > 0:
        ledger_no = await generate_unique_ledger_number(db)
        db.add(Discount(
            booking_id=booking.id,
            discount_type=discount_type,
            discount_rate=discount_val,
            discount_amount=discount_amount,
            reason=req.discount_reason or "Staff Counter Discount",
            applied_by_id=staff_id
        ))
        db.add(FinancialLedger(
            entry_number=ledger_no,
            entry_type="DISCOUNT",
            debit=discount_amount,
            credit=0.0,
            balance=net_amount,
            booking_id=booking.id,
            description=f"Discount of ৳{discount_amount} applied to {booking.booking_number} ({req.discount_reason or 'No reason specified'})"
        ))

    # 9. Record Payment & Double-Entry Ledger
    if paid_amount > 0:
        receipt_number = await generate_unique_receipt_number(db)
        payment = Payment(
            receipt_number=receipt_number,
            booking_id=booking.id,
            amount=paid_amount,
            method=req.payment_method,
            received_by_id=staff_id,
            notes=req.notes or "Initial Counter Payment"
        )
        db.add(payment)
        await db.flush()

        if req.transaction_id:
            trx = PaymentTransaction(
                payment_id=payment.id,
                transaction_id=req.transaction_id,
                sender_reference=req.sender_reference
            )
            db.add(trx)

        pay_ledger_no = await generate_unique_ledger_number(db)
        ledger = FinancialLedger(
            entry_number=pay_ledger_no,
            entry_type="PAYMENT_RECEIVED",
            debit=0.0,
            credit=paid_amount,
            balance=due_amount,
            payment_method=req.payment_method,
            booking_id=booking.id,
            payment_id=payment.id,
            description=f"Counter Collection for {booking.booking_number} (Receipt: {receipt_number})"
        )
        db.add(ledger)

    # 10. Audit Log
    db.add(AuditLog(
        user_id=staff_id,
        action="BOOKING_CREATED",
        entity="Booking",
        entity_id=booking.id,
        ip_address=client_ip,
        new_value=f"Booking {booking.booking_number} created with {len(req.seats)} seats."
    ))

    await db.commit()
    await db.refresh(booking)
    # Eagerly load passengers so Pydantic serialization never attempts lazy IO
    b_passengers = await db.query(BookingPassenger).filter(BookingPassenger.booking_id == booking.id).all()
    booking.passengers = b_passengers

    # Automated Notifications: Dispatch WhatsApp, SMS & Email Logs in DB
    try:
        await dispatch_booking_notifications(db, booking, triggered_by_user_id=staff_id)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Notification automated dispatch error: {e}")

    return booking


# =====================================================================
# 2. ONLINE PRE-BOOKING WITH REDIS 15-MINUTE ANTI-HOARDING LOCK
# =====================================================================
async def create_pre_booking(
    db: Session,
    req: CreatePreBookingRequest,
    tenant_id: Optional[str] = None
) -> Booking:
    if len(req.seat_ids) > 6:
        raise ValueError("এক সাথে সর্বোচ্চ ৬টির বেশি টিকিট বুকিং করা যাবে না (A4 সিঙ্গেল-পেজ প্রিন্ট নীতি অনুযায়ী)।")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    trip = await db.query(Trip).filter(Trip.id == req.trip_id).with_for_update(nowait=False).first()
    if not trip:
        # Fallback 1: Look up active trip by bus ID
        trip = await db.query(Trip).filter(
            Trip.bus_id == req.trip_id,
            Trip.status.in_(["SCHEDULED", "BOARDING"])
        ).with_for_update(nowait=False).first()

    if not trip:
        # Fallback 2: Check if req.trip_id is a bus ID that can be auto-scheduled
        bus = await db.query(Bus).filter(Bus.id == req.trip_id).first()
        if bus and bus.status != "INACTIVE":
            route = await db.query(BusRoute).first()
            if not route:
                route = BusRoute(
                    route_name="Dhaka to Exam Center",
                    origin="ঢাকা (গাবতলী/সায়েদাবাদ)",
                    destination="ভর্তি কেন্দ্র",
                    distance_km=250.0,
                    est_duration="5h 30m",
                    tenant_id=tenant_id or bus.tenant_id
                )
                db.add(route)
                await db.flush()

            clean_bus_num = "".join(ch for ch in (bus.bus_number or "COACH") if ch.isalnum()).upper()
            dep_date = datetime.now(timezone.utc).replace(tzinfo=None, hour=22, minute=30, second=0, microsecond=0)
            auto_trip = Trip(
                id=bus.id,
                trip_code=f"TRIP-{clean_bus_num}-{int(datetime.now().timestamp()) % 10000:04d}",
                bus_id=bus.id,
                route_id=route.id,
                departure_date=dep_date,
                departure_time=dep_date,
                trip_bus_type=bus.bus_type or "MIXED",
                status="SCHEDULED",
                base_price=550.0,
                tenant_id=tenant_id or bus.tenant_id
            )
            db.add(auto_trip)
            await db.commit()
            trip = await db.query(Trip).filter(Trip.id == auto_trip.id).with_for_update(nowait=False).first()

    if not trip:
        raise ValueError("Trip not found")

    t_id = tenant_id or trip.tenant_id or "default"

    # Resolve requested seats to canonical layout cells (labels + server fares),
    # and reject any seat that does not exist on the trip's real layout.
    resolved, resolve_errors = await resolve_requested_seats(
        db,
        trip,
        [{"seat_id": sid} for sid in req.seat_ids],
    )
    if resolve_errors:
        raise ValueError("; ".join(resolve_errors))
    if not resolved:
        raise ValueError("No valid seats provided for pre-booking")

    canonical_ids = [r["seat_id"] for r in resolved]
    canonical_labels = [r["seat_number"] for r in resolved]
    server_fares = {r["seat_id"]: r["fare"] for r in resolved}

    # Duplicate guard: reject the same physical seat requested twice via
    # different id forms.
    seen = set()
    for label in canonical_labels:
        if label in seen:
            raise ValueError(f"Duplicate seat {label} in seat_ids")
        seen.add(label)

    # Canonical ids win over whatever the client sent.
    req.seat_ids = canonical_ids

    # Validate bus-type/seat gender rule for a single contact passenger.
    # The public pre-booking flow applies the passenger to every requested seat.
    from app.services.seat_layout_service import validate_passenger_on_seat, detect_five_seat_rows
    five_rows = detect_five_seat_rows([r["seat_number"] for r in resolved])
    for r in resolved:
        ok, err = validate_passenger_on_seat(
            seat_number=r["seat_number"],
            gender_allowed=r["gender_allowed"],
            bus_type=trip.trip_bus_type or "MIXED",
            passenger_type="STUDENT" if req.is_student else "GUEST",
            passenger_gender=req.passenger_gender,
            guardian_relationship=None,
            five_seat_rows=five_rows,
        )
        if not ok:
            raise ValueError(err)

    # 1. Attempt Redis 15-Minute Anti-Hoarding Lock for each requested seat
    #    (keyed by canonical seat label so the seat-map endpoint agrees).
    for label in canonical_labels:
        acquired, remaining_secs, held_by = hold_seat_redis(
            tenant_id=t_id,
            trip_id=trip.id,
            seat_number=label,
            user_id=req.contact_phone,
            ttl_seconds=900  # 15 minutes
        )
        if not acquired:
            raise ValueError(
                f"Seat {label} is currently held by another passenger ({held_by}). "
                f"Please select another seat or retry in {remaining_secs} seconds."
            )

    # 2. Concurrency Lock: Check if any seat is already booked/held in DB with with_for_update
    already_booked = await (
        db.query(BookingSeat)
        .join(Booking)
        .filter(
            BookingSeat.seat_id.in_(canonical_ids),
            Booking.trip_id == req.trip_id,
            Booking.booking_status.in_(ACTIVE_BOOKING_STATUSES)
        )
        .with_for_update(nowait=False)
        .first()
    )
    if already_booked:
        raise SeatAlreadyBookedException(f"Seat {already_booked.seat_id} is already booked or held by another passenger.")

    # Concurrency Lock: Check if any seat is actively locked
    locked = await (
        db.query(SeatLock)
        .filter(
            SeatLock.trip_id == req.trip_id,
            SeatLock.seat_id.in_(canonical_ids),
            SeatLock.is_active == True,
            or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
        )
        .first()
    )
    if locked:
        raise ValueError(f"Seat {locked.seat_id} is currently locked ({locked.reason})")

    # Final serialized conflict guard inside the trip-locked transaction.
    conflict = await find_active_conflict(db, trip, canonical_labels, resolve_seat_id=True)
    if conflict:
        raise SeatAlreadyBookedException(conflict["reason"])

    # Server-computed fare (sum of canonical seat fares, not client/trip flat).
    gross_amount = sum(server_fares[sid] for sid in canonical_ids)
    booking_number = await generate_unique_booking_number(db)

    booking = Booking(
        tenant_id=t_id,
        booking_number=booking_number,
        trip_id=req.trip_id,
        booking_status="PRE_BOOKED",
        payment_status="UNPAID",
        source=req.source,
        contact_name=req.contact_name,
        contact_phone=req.contact_phone,
        contact_email=req.contact_email,
        passenger_gender=req.passenger_gender,
        is_student=req.is_student,
        student_admission_id=req.student_admission_id,
        verification_status="UNVERIFIED",
        payment_expires_at=now + timedelta(minutes=15),
        journey_type=req.journey_type or "ROUND_TRIP",
        boarding_point=req.boarding_point,
        dropping_point=req.dropping_point,
        passenger_legs_json=req.passenger_legs_json,
        gross_amount=gross_amount,
        discount_amount=0.0,
        net_amount=gross_amount,
        paid_amount=0.0,
        due_amount=gross_amount,
        notes=req.notes
    )
    db.add(booking)
    await db.flush()

    for label in canonical_labels:
        seat_id = next((r["seat_id"] for r in resolved if r["seat_number"] == label), f"seat-{trip.id}-{label}")
        db.add(BookingSeat(
            booking_id=booking.id,
            seat_id=seat_id,
            fare_snapshot=server_fares.get(seat_id, 0.0)
        ))
        db.add(BookingPassenger(
            booking_id=booking.id,
            passenger_name=req.contact_name,
            passenger_phone=req.contact_phone,
            passenger_type="STUDENT" if req.is_student else "GUEST",
            gender=req.passenger_gender,
            seat_number=label
        ))

    await db.commit()
    await db.refresh(booking)
    b_passengers = await db.query(BookingPassenger).filter(BookingPassenger.booking_id == booking.id).all()
    booking.passengers = b_passengers
    return booking


# =====================================================================
# 3. VERIFICATION & LIVE 15-MINUTE PAYMENT COUNTDOWN TIMER
# =====================================================================
async def verify_and_start_timer(db: Session, req: VerifyTimerRequest, staff_id: str) -> Booking:
    booking = await db.query(Booking).filter(Booking.id == req.booking_id).with_for_update(nowait=False).first()
    if not booking:
        raise ValueError("Booking not found")
    if booking.booking_status in ["CANCELLED", "EXPIRED", "REJECTED"]:
        raise ValueError(f"Cannot verify booking with status: {booking.booking_status}")
    if booking.verification_status == "VERIFIED":
        raise ValueError("Booking has already been verified.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    payment_expires_at = now + timedelta(minutes=req.duration_minutes)

    # Refresh Redis TTL lock for all seats in this booking (keyed by label so
    # the seat-map endpoint sees the same hold keys it queries by label).
    for label in await booking_seat_labels(db, booking):
        hold_seat_redis(
            tenant_id=booking.tenant_id or "default",
            trip_id=booking.trip_id,
            seat_number=label,
            user_id=booking.contact_phone or staff_id,
            ttl_seconds=req.duration_minutes * 60
        )

    booking.verification_status = "VERIFIED"
    booking.verified_at = now
    booking.verified_by_staff_id = staff_id
    booking.booking_status = "PAYMENT_TIMER_ACTIVE"
    booking.payment_expires_at = payment_expires_at
    if req.passenger_gender:
        booking.passenger_gender = req.passenger_gender
    if req.is_student is not None:
        booking.is_student = req.is_student
    if req.student_admission_id:
        booking.student_admission_id = req.student_admission_id
    booking.verification_notes = req.notes or f"Verified by staff. {req.duration_minutes}-minute live payment window active."

    await db.commit()
    await db.refresh(booking)
    b_passengers = await db.query(BookingPassenger).filter(BookingPassenger.booking_id == booking.id).all()
    booking.passengers = b_passengers
    return booking


# =====================================================================
# 4. IDEMPOTENT PAYMENT CONFIRMATION WITH PESSIMISTIC ROW LOCKING
# =====================================================================
async def confirm_pre_booking_payment(
    db: Session,
    req: ConfirmPreBookingPaymentRequest,
    staff_id: str,
    idempotency_key: Optional[str] = None
) -> Booking:
    # 1. Idempotency Check: Prevent duplicate payment processing on network glitch/double-clicks
    if idempotency_key:
        state, cached_res = check_or_set_idempotency(idempotency_key, lock_ttl_seconds=120)
        if state == "PROCESSING":
            raise ValueError("This payment request is currently being handled. Please wait.")
        elif state == "COMPLETED" and cached_res:
            return await db.query(Booking).filter(Booking.id == cached_res.get("id", req.booking_id)).first()

    try:
        # 2. Pessimistic Row Locking on the target Booking
        booking = await db.query(Booking).filter(Booking.id == req.booking_id).with_for_update(nowait=False).first()
        if not booking:
            raise ValueError("Booking not found")
        if booking.booking_status == "CONFIRMED":
            raise ValueError("Booking is already confirmed.")

        paid = req.paid_amount if req.paid_amount is not None else booking.net_amount
        due_amount = max(0.0, booking.net_amount - paid)
        payment_status = "PAID" if due_amount == 0 else "PARTIALLY_PAID"

        receipt_number = await generate_unique_receipt_number(db)
        payment = Payment(
            receipt_number=receipt_number,
            booking_id=booking.id,
            amount=paid,
            method=req.payment_method,
            received_by_id=staff_id,
            notes=req.notes or "Pre-booking payment confirmed after staff verification"
        )
        db.add(payment)
        await db.flush()

        if req.transaction_id:
            db.add(PaymentTransaction(
                payment_id=payment.id,
                transaction_id=req.transaction_id,
                sender_reference=req.sender_reference
            ))

        booking.booking_status = "CONFIRMED"
        booking.payment_status = payment_status
        booking.paid_amount = paid
        booking.due_amount = due_amount
        booking.payment_expires_at = None  # Clear live timer
        booking.notes = f"{booking.notes or ''} [Payment Confirmed via {req.payment_method}]"

        # Release Redis anti-hoarding locks for all booked seats (label keys)
        for label in await booking_seat_labels(db, booking):
            release_seat_redis(booking.tenant_id or "default", booking.trip_id, label)

        # Financial Ledger Entry
        conf_ledger_no = await generate_unique_ledger_number(db)
        ledger = FinancialLedger(
            entry_number=conf_ledger_no,
            entry_type="PAYMENT_RECEIVED",
            debit=0.0,
            credit=paid,
            balance=due_amount,
            payment_method=req.payment_method,
            booking_id=booking.id,
            payment_id=payment.id,
            description=f"Pre-booking payment for {booking.booking_number} (Receipt: {receipt_number})"
        )
        db.add(ledger)

        # Audit Log
        db.add(AuditLog(
            user_id=staff_id,
            action="PAYMENT_CONFIRMED",
            entity="Booking",
            entity_id=booking.id,
            new_value=f"Payment of {paid} BDT confirmed via {req.payment_method}."
        ))

        await db.commit()
        await db.refresh(booking)
        b_passengers = await db.query(BookingPassenger).filter(BookingPassenger.booking_id == booking.id).all()
        booking.passengers = b_passengers

        # Mark Idempotency as COMPLETED
        if idempotency_key:
            complete_idempotency(idempotency_key, {"id": booking.id, "booking_number": booking.booking_number})

        return booking

    except Exception as e:
        if idempotency_key:
            clear_idempotency(idempotency_key)
        raise e


# =====================================================================
# 5. CANCELLATION, REJECTION & REFUND SERVICE WORKFLOWS
# =====================================================================
async def cancel_booking_service(
    db: Session,
    booking_id: str,
    staff_id: str,
    reason: str = "Customer Request"
) -> Booking:
    booking = await db.query(Booking).filter(Booking.id == booking_id).with_for_update(nowait=False).first()
    if not booking:
        raise ValueError("Booking not found")
    if booking.booking_status == "CANCELLED":
        return booking

    booking.booking_status = "CANCELLED"
    booking.notes = f"{booking.notes or ''} [Cancelled: {reason}]"

    # Release any Redis seat holds (label keys)
    seat_labels = await booking_seat_labels(db, booking)
    for label in seat_labels:
        release_seat_redis(booking.tenant_id or "default", booking.trip_id, label)

    # Clean up DB seat holds (by booking_seat ids and canonical labels)
    b_seats = await db.query(BookingSeat).filter(BookingSeat.booking_id == booking.id).all()
    seat_ids = [bs.seat_id for bs in b_seats]
    if seat_ids:
        await db.execute(delete(SeatHold).where(
            SeatHold.trip_id == booking.trip_id,
            or_(SeatHold.seat_id.in_(seat_ids), SeatHold.seat_id.in_(seat_labels))
        ))

    db.add(AuditLog(
        user_id=staff_id,
        action="BOOKING_CANCELLED",
        entity="Booking",
        entity_id=booking.id,
        new_value=f"Booking {booking.booking_number} cancelled. Reason: {reason}"
    ))

    await db.commit()
    await db.refresh(booking)
    return booking


async def reject_pre_booking_service(
    db: Session,
    booking_id: str,
    staff_id: str,
    reason: str = "Verification Failed"
) -> Booking:
    booking = await db.query(Booking).filter(Booking.id == booking_id).with_for_update(nowait=False).first()
    if not booking:
        raise ValueError("Booking not found")

    booking.booking_status = "REJECTED"
    booking.verification_status = "REJECTED"
    booking.rejection_reason = reason
    booking.payment_expires_at = None
    booking.notes = f"{booking.notes or ''} [Rejected: {reason}]"

    # Release any Redis seat holds (label keys)
    seat_labels = await booking_seat_labels(db, booking)
    for label in seat_labels:
        release_seat_redis(booking.tenant_id or "default", booking.trip_id, label)

    # Clean up DB seat holds (by booking_seat ids and canonical labels)
    b_seats = await db.query(BookingSeat).filter(BookingSeat.booking_id == booking.id).all()
    seat_ids = [bs.seat_id for bs in b_seats]
    if seat_ids:
        await db.execute(delete(SeatHold).where(
            SeatHold.trip_id == booking.trip_id,
            or_(SeatHold.seat_id.in_(seat_ids), SeatHold.seat_id.in_(seat_labels))
        ))

    db.add(AuditLog(
        user_id=staff_id,
        action="PRE_BOOKING_REJECTED",
        entity="Booking",
        entity_id=booking.id,
        new_value=f"Pre-booking {booking.booking_number} rejected. Reason: {reason}"
    ))

    await db.commit()
    await db.refresh(booking)
    return booking


async def create_refund_service(
    db: Session,
    booking_id: str,
    amount: float,
    method: str,
    reason: str,
    staff_id: str,
    payment_id: Optional[str] = None
) -> Refund:
    if amount <= 0:
        raise ValueError("Refund amount must be greater than zero")

    booking = await db.query(Booking).filter(Booking.id == booking_id).with_for_update(nowait=False).first()
    if not booking:
        raise ValueError("Booking not found")

    paid_float = float(booking.paid_amount or 0.0)
    if amount > paid_float:
        raise ValueError(f"Refund amount (৳{amount}) cannot exceed total paid amount (৳{paid_float})")

    refund_number = await generate_unique_refund_number(db)
    refund = Refund(
        refund_number=refund_number,
        booking_id=booking.id,
        payment_id=payment_id,
        amount=amount,
        method=method,
        reason=reason,
        processed_by_id=staff_id
    )
    db.add(refund)
    await db.flush()

    new_paid = max(0.0, paid_float - float(amount))
    new_due = max(0.0, float(booking.net_amount or 0.0) - new_paid)
    booking.paid_amount = new_paid
    booking.due_amount = new_due
    if new_paid == 0:
        booking.payment_status = "REFUNDED"
    else:
        booking.payment_status = "PARTIALLY_PAID"

    ledger = FinancialLedger(
        entry_number=await generate_unique_ledger_number(db),
        entry_type="REFUND_ISSUED",
        debit=amount,
        credit=0.0,
        balance=new_due,
        payment_method=method,
        booking_id=booking.id,
        refund_id=refund.id,
        payment_id=payment_id,
        description=f"Refund for {booking.booking_number} ({refund_number}): {reason}"
    )
    db.add(ledger)

    db.add(AuditLog(
        user_id=staff_id,
        action="REFUND_ISSUED",
        entity="Booking",
        entity_id=booking.id,
        new_value=f"Refund of ৳{amount} issued via {method}. Refund Number: {refund_number}"
    ))

    await db.commit()
    await db.refresh(refund)
    return refund


async def sync_offline_bookings(
    db: Session,
    bookings: List[OfflineBookingItem],
    staff_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    if not staff_id:
        default_user = await db.query(User).first()
        staff_id = default_user.id if default_user else None

    results = []
    for item in bookings:
        try:
            # 1. Idempotency check
            existing = await db.query(Booking).filter(
                Booking.notes.contains(item.offline_ref_id)
            ).first()
            if existing:
                results.append({
                    "offline_ref_id": item.offline_ref_id,
                    "sync_status": "ALREADY_SYNCED",
                    "booking_id": existing.id,
                    "booking_number": existing.booking_number,
                    "message": "Booking was already synced previously."
                })
                continue

            # 2. Build CreateBookingRequest
            req = CreateBookingRequest(
                trip_id=item.trip_id,
                seats=item.seats,
                passengers=item.passengers,
                journey_type=item.journey_type or "ROUND_TRIP",
                boarding_point=item.boarding_point,
                dropping_point=item.dropping_point,
                payment_method=item.payment_method or "HAND_CASH",
                paid_amount=item.paid_amount or 0.0,
                transaction_id=item.transaction_id or item.offline_ref_id,
                sender_reference=item.offline_ref_id,
                notes=f"[OFFLINE_SYNC: {item.offline_ref_id}] {item.notes or ''}"
            )

            created_booking = await create_counter_booking(
                db=db,
                req=req,
                staff_id=staff_id
            )

            results.append({
                "offline_ref_id": item.offline_ref_id,
                "sync_status": "SYNCED",
                "booking_id": created_booking.id,
                "booking_number": created_booking.booking_number,
                "message": "Offline booking synced successfully."
            })
        except SeatAlreadyBookedException as e:
            results.append({
                "offline_ref_id": item.offline_ref_id,
                "sync_status": "CONFLICT",
                "conflict_reason": str(e),
                "message": f"সিট কনফ্লিক্ট: {str(e)}। কাউন্টার থেকে বিকল্প সিট নির্ধারণ করুন।"
            })
        except Exception as e:
            results.append({
                "offline_ref_id": item.offline_ref_id,
                "sync_status": "FAILED",
                "message": str(e)
            })
    return results

