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
from app.models.payment import Payment, PaymentTransaction
from app.models.finance import FinancialLedger
from app.models.audit import AuditLog
from app.schemas.booking import CreateBookingRequest, CreatePreBookingRequest, VerifyTimerRequest, ConfirmPreBookingPaymentRequest
from app.core.redis_client import hold_seat_redis, release_seat_redis, get_seat_hold_status_redis
from app.core.idempotency import check_or_set_idempotency, complete_idempotency, clear_idempotency


class SeatAlreadyBookedException(Exception):
    pass


def generate_unique_booking_number(db: Session) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = db.query(Booking).count()
    return f"BK-{date_str}-{random_part}-{count + 10001:05d}"


def generate_unique_receipt_number(db: Session) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = db.query(Payment).count()
    return f"RCT-{date_str}-{random_part}-{count + 1:04d}"


def generate_unique_ledger_number(db: Session) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = db.query(FinancialLedger).count()
    return f"LED-{date_str}-{random_part}-{count + 1:05d}"


# =====================================================================
# 1. COUNTER BOOKING WITH PESSIMISTIC ROW LOCKING (with_for_update)
# =====================================================================
def create_counter_booking(
    db: Session,
    req: CreateBookingRequest,
    staff_id: str,
    tenant_id: Optional[str] = None,
    client_ip: Optional[str] = None
) -> Booking:
    # 1. Pessimistic Row Locking on the target Trip
    trip = db.query(Trip).filter(Trip.id == req.trip_id).with_for_update(nowait=False).first()
    if not trip:
        raise ValueError("Trip not found")
    if trip.status in ["CANCELLED", "COMPLETED"]:
        raise ValueError(f"Trip is not available for booking (Status: {trip.status})")

    seat_ids = [s["seat_id"] for s in req.seats]

    # 2. Concurrency Lock: Check if any seat is already booked with with_for_update
    already_booked = (
        db.query(BookingSeat)
        .join(Booking)
        .filter(
            BookingSeat.seat_id.in_(seat_ids),
            Booking.trip_id == req.trip_id,
            Booking.booking_status.in_(["CONFIRMED", "COMPLETED"])
        )
        .with_for_update(nowait=False)
        .first()
    )
    if already_booked:
        raise SeatAlreadyBookedException(f"Seat {already_booked.seat_id} has just been booked by another transaction.")

    # 3. Financial Calculations
    gross_amount = sum(s["fare"] for s in req.seats)
    discount_amount = req.discount_rate or 0.0
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
        gross_amount=gross_amount,
        discount_amount=discount_amount,
        net_amount=net_amount,
        paid_amount=paid_amount,
        due_amount=due_amount,
        notes=req.notes
    )
    db.add(booking)
    db.flush()

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

    # 8. Record Payment & Double-Entry Ledger
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
        db.flush()

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

    # 9. Audit Log
    db.add(AuditLog(
        user_id=staff_id,
        action="BOOKING_CREATED",
        entity="Booking",
        entity_id=booking.id,
        ip_address=client_ip,
        new_value=f"Booking {booking.booking_number} created with {len(req.seats)} seats."
    ))

    db.commit()
    db.refresh(booking)
    return booking


# =====================================================================
# 2. ONLINE PRE-BOOKING WITH REDIS 15-MINUTE ANTI-HOARDING LOCK
# =====================================================================
def create_pre_booking(
    db: Session,
    req: CreatePreBookingRequest,
    tenant_id: Optional[str] = None
) -> Booking:
    trip = db.query(Trip).filter(Trip.id == req.trip_id).with_for_update(nowait=False).first()
    if not trip:
        raise ValueError("Trip not found")

    t_id = tenant_id or trip.tenant_id or "default"

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

    # 2. Concurrency Lock: Check if any seat is already booked in DB with with_for_update
    already_booked = (
        db.query(BookingSeat)
        .join(Booking)
        .filter(
            BookingSeat.seat_id.in_(req.seat_ids),
            Booking.trip_id == req.trip_id,
            Booking.booking_status.in_(["CONFIRMED", "COMPLETED"])
        )
        .with_for_update(nowait=False)
        .first()
    )
    if already_booked:
        raise SeatAlreadyBookedException(f"Seat {already_booked.seat_id} has just been booked by another transaction.")

    now = datetime.now(timezone.utc)
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
        gross_amount=gross_amount,
        discount_amount=0.0,
        net_amount=gross_amount,
        paid_amount=0.0,
        due_amount=gross_amount,
        notes=req.notes or "Online Passenger Pre-Booking (Protected by Redis 15-Min TTL Lock)"
    )
    db.add(booking)
    db.flush()

    for seat_id in req.seat_ids:
        db.add(BookingSeat(booking_id=booking.id, seat_id=seat_id, fare_snapshot=trip.base_price))
        db.add(BookingPassenger(
            booking_id=booking.id,
            passenger_name=req.contact_name,
            passenger_phone=req.contact_phone,
            passenger_type="STUDENT" if req.is_student else "GUEST",
            gender=req.passenger_gender,
            seat_number=seat_id
        ))

    db.commit()
    db.refresh(booking)
    return booking


# =====================================================================
# 3. VERIFICATION & LIVE 15-MINUTE PAYMENT COUNTDOWN TIMER
# =====================================================================
def verify_and_start_timer(db: Session, req: VerifyTimerRequest, staff_id: str) -> Booking:
    booking = db.query(Booking).filter(Booking.id == req.booking_id).with_for_update(nowait=False).first()
    if not booking:
        raise ValueError("Booking not found")
    if booking.booking_status in ["CANCELLED", "EXPIRED"]:
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

    db.commit()
    db.refresh(booking)
    return booking


# =====================================================================
# 4. IDEMPOTENT PAYMENT CONFIRMATION WITH PESSIMISTIC ROW LOCKING
# =====================================================================
def confirm_pre_booking_payment(
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
            # Return existing booking from DB
            return db.query(Booking).filter(Booking.id == cached_res.get("id", req.booking_id)).first()

    try:
        # 2. Pessimistic Row Locking on the target Booking
        booking = db.query(Booking).filter(Booking.id == req.booking_id).with_for_update(nowait=False).first()
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
        db.flush()

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

        db.commit()
        db.refresh(booking)

        # Mark Idempotency as COMPLETED
        if idempotency_key:
            complete_idempotency(idempotency_key, {"id": booking.id, "booking_number": booking.booking_number})

        return booking

    except Exception as e:
        if idempotency_key:
            clear_idempotency(idempotency_key)
        raise e
