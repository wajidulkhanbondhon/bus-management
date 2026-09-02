import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.booking import Booking, BookingSeat, BookingPassenger, Discount
from app.models.trip import Trip, SeatHold, SeatLock
from app.models.bus import Seat
from app.models.student import Student
from app.models.payment import Payment, PaymentTransaction, Refund
from app.models.finance import FinancialLedger
from app.models.audit import AuditLog
from app.schemas.booking import CreateBookingRequest, CreatePreBookingRequest, VerifyTimerRequest, ConfirmPreBookingPaymentRequest
from app.core.redis_client import hold_seat_redis, release_seat_redis, get_seat_hold_status_redis
from app.core.idempotency import check_or_set_idempotency, complete_idempotency, clear_idempotency


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
    now = datetime.now(timezone.utc)

    # 1. Pessimistic Row Locking on the target Trip
    trip = await db.query(Trip).filter(Trip.id == req.trip_id).with_for_update(nowait=False).first()
    if not trip:
        raise ValueError("Trip not found")
    if trip.status in ["CANCELLED", "COMPLETED"]:
        raise ValueError(f"Trip is not available for booking (Status: {trip.status})")

    seat_ids = [s["seat_id"] for s in req.seats]

    # Validate that each requested seat ID actually exists on the bus for this trip
    bus = trip.bus
    if bus and bus.seat_layout:
        valid_seat_ids = {s.id for s in bus.seat_layout.seats}
        invalid_seats = [sid for sid in seat_ids if sid not in valid_seat_ids]
        if invalid_seats:
            raise ValueError(f"Seat IDs {invalid_seats} do not exist for this bus trip")

    # Prevent duplicate passenger seat assignments in the request
    seen_passenger_seats = set()
    for p in req.passengers:
        if p.seat_id in seen_passenger_seats:
            raise ValueError(f"Duplicate seat {p.seat_id} in passenger list")
        seen_passenger_seats.add(p.seat_id)

    # 2. Concurrency Lock: Check if any seat is already booked or held in DB with with_for_update
    already_booked = (
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
    if already_booked:
        raise SeatAlreadyBookedException(f"Seat {already_booked.seat_id} is already booked or held by another transaction.")

    # Concurrency Lock: Check if any seat is actively locked (VIP, Maintenance, Staff, Emergency)
    locked = (
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

    booking_number = generate_unique_booking_number(db)

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
        notes=req.notes
    )
    db.add(booking)
    await db.flush()

    # 5. Attach Seats & Release Redis Holds
    for s in req.seats:
        b_seat = BookingSeat(
            booking_id=booking.id,
            seat_id=s["seat_id"],
            fare_snapshot=s["fare"]
        )
        db.add(b_seat)
        # Release Redis anti-hoarding hold
        release_seat_redis(trip.tenant_id or "default", trip.id, s["seat_id"])

    # 6. Attach Passengers
    for p in req.passengers:
        b_pass = BookingPassenger(
            booking_id=booking.id,
            passenger_name=p.passenger_name,
            passenger_phone=p.passenger_phone,
            passenger_type=p.passenger_type,
            gender=p.gender,
            seat_number=p.seat_id
        )
        db.add(b_pass)

    # 7. Delete Database Holds
    db.query(SeatHold).filter(SeatHold.trip_id == req.trip_id, SeatHold.seat_id.in_(seat_ids)).delete()

    # 8. Record Discount if applied
    if discount_amount > 0:
        db.add(Discount(
            booking_id=booking.id,
            discount_type=discount_type,
            discount_rate=discount_val,
            discount_amount=discount_amount,
            reason=req.discount_reason or "Staff Counter Discount",
            applied_by_id=staff_id
        ))
        db.add(FinancialLedger(
            entry_number=generate_unique_ledger_number(db),
            entry_type="DISCOUNT",
            debit=discount_amount,
            credit=0.0,
            balance=net_amount,
            booking_id=booking.id,
            description=f"Discount of ৳{discount_amount} applied to {booking.booking_number} ({req.discount_reason or 'No reason specified'})"
        ))

    # 9. Record Payment & Double-Entry Ledger
    if paid_amount > 0:
        receipt_number = generate_unique_receipt_number(db)
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

        ledger = FinancialLedger(
            entry_number=generate_unique_ledger_number(db),
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
    return booking


# =====================================================================
# 2. ONLINE PRE-BOOKING WITH REDIS 15-MINUTE ANTI-HOARDING LOCK
# =====================================================================
async def create_pre_booking(
    db: Session,
    req: CreatePreBookingRequest,
    tenant_id: Optional[str] = None
) -> Booking:
    now = datetime.now(timezone.utc)
    trip = await db.query(Trip).filter(Trip.id == req.trip_id).with_for_update(nowait=False).first()
    if not trip:
        raise ValueError("Trip not found")

    t_id = tenant_id or trip.tenant_id or "default"

    # Validate that each requested seat ID actually exists on the bus for this trip
    bus = trip.bus
    if bus and bus.seat_layout:
        valid_seat_ids = {s.id for s in bus.seat_layout.seats}
        invalid_seats = [sid for sid in req.seat_ids if sid not in valid_seat_ids]
        if invalid_seats:
            raise ValueError(f"Seat IDs {invalid_seats} do not exist for this bus trip")

    # 1. Attempt Redis 15-Minute Anti-Hoarding Lock for each requested seat
    for seat_id in req.seat_ids:
        acquired, remaining_secs, held_by = hold_seat_redis(
            tenant_id=t_id,
            trip_id=trip.id,
            seat_number=seat_id,
            user_id=req.contact_phone,
            ttl_seconds=900  # 15 minutes
        )
        if not acquired:
            raise ValueError(
                f"Seat {seat_id} is currently held by another passenger ({held_by}). "
                f"Please select another seat or retry in {remaining_secs} seconds."
            )

    # 2. Concurrency Lock: Check if any seat is already booked/held in DB with with_for_update
    already_booked = (
        db.query(BookingSeat)
        .join(Booking)
        .filter(
            BookingSeat.seat_id.in_(req.seat_ids),
            Booking.trip_id == req.trip_id,
            Booking.booking_status.in_(ACTIVE_BOOKING_STATUSES)
        )
        .with_for_update(nowait=False)
        .first()
    )
    if already_booked:
        raise SeatAlreadyBookedException(f"Seat {already_booked.seat_id} is already booked or held by another passenger.")

    # Concurrency Lock: Check if any seat is actively locked
    locked = (
        db.query(SeatLock)
        .filter(
            SeatLock.trip_id == req.trip_id,
            SeatLock.seat_id.in_(req.seat_ids),
            SeatLock.is_active == True,
            or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
        )
        .first()
    )
    if locked:
        raise ValueError(f"Seat {locked.seat_id} is currently locked ({locked.reason})")

    gross_amount = trip.base_price * len(req.seat_ids)
    booking_number = generate_unique_booking_number(db)

    booking = Booking(
        tenant_id=t_id,
        booking_number=booking_number,
        trip_id=req.trip_id,
        booking_status="PRE_BOOKED",
        payment_status="UNPAID",
        source=req.source,
        contact_name=req.contact_name,
        contact_phone=req.contact_phone,
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

    for seat_id in req.seat_ids:
        db.add(BookingSeat(
            booking_id=booking.id,
            seat_id=seat_id,
            fare_snapshot=trip.base_price
        ))
        db.add(BookingPassenger(
            booking_id=booking.id,
            passenger_name=req.contact_name,
            passenger_phone=req.contact_phone,
            passenger_type="STUDENT" if req.is_student else "GUEST",
            gender=req.passenger_gender,
            seat_number=seat_id
        ))

    await db.commit()
    await db.refresh(booking)
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

    now = datetime.now(timezone.utc)
    payment_expires_at = now + timedelta(minutes=req.duration_minutes)

    # Refresh Redis TTL lock for all seats in this booking
    for bs in booking.seats:
        hold_seat_redis(
            tenant_id=booking.tenant_id or "default",
            trip_id=booking.trip_id,
            seat_number=bs.seat_id,
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

        receipt_number = generate_unique_receipt_number(db)
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

        # Release Redis anti-hoarding locks for all booked seats
        for bs in booking.seats:
            release_seat_redis(booking.tenant_id or "default", booking.trip_id, bs.seat_id)

        # Financial Ledger Entry
        ledger = FinancialLedger(
            entry_number=generate_unique_ledger_number(db),
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

    # Release any Redis seat holds
    for bs in booking.seats:
        release_seat_redis(booking.tenant_id or "default", booking.trip_id, bs.seat_id)

    # Clean up DB seat holds
    seat_ids = [bs.seat_id for bs in booking.seats]
    if seat_ids:
        db.query(SeatHold).filter(SeatHold.trip_id == booking.trip_id, SeatHold.seat_id.in_(seat_ids)).delete()

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

    # Release any Redis seat holds
    for bs in booking.seats:
        release_seat_redis(booking.tenant_id or "default", booking.trip_id, bs.seat_id)

    # Clean up DB seat holds
    seat_ids = [bs.seat_id for bs in booking.seats]
    if seat_ids:
        db.query(SeatHold).filter(SeatHold.trip_id == booking.trip_id, SeatHold.seat_id.in_(seat_ids)).delete()

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
