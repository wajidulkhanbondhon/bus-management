import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, delete, update
from app.models.trip import Trip, SeatHold, SeatLock
from app.models.bus import Bus, SeatLayout, Seat
from app.models.booking import Booking, BookingSeat


async def clean_expired_inventory(db: Session, trip_id: str):
    now = datetime.now(timezone.utc)
    # 1. Clean expired holds
    await db.execute(delete(SeatHold).where(SeatHold.trip_id == trip_id, SeatHold.expires_at <= now))

    # 2. Expire unpaid pre-bookings whose timer has passed
    await db.execute(
        update(Booking)
        .where(
            Booking.trip_id == trip_id,
            Booking.booking_status == "PAYMENT_TIMER_ACTIVE",
            Booking.payment_expires_at <= now
        )
        .values(booking_status="EXPIRED")
    )

    await db.commit()


async def get_trip_seat_inventory(db: Session, trip_id: str, staff_id: Optional[str] = None) -> Dict[str, Any]:
    clean_expired_inventory(db, trip_id)
    now = datetime.now(timezone.utc)

    trip = await db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise ValueError("Trip not found")

    bus = await db.query(Bus).filter(Bus.id == trip.bus_id).first()
    if not bus:
        raise ValueError("Bus not found")

    if bus.seat_layout_id:
        seats = await db.query(Seat).filter(Seat.seat_layout_id == bus.seat_layout_id).order_by(Seat.row_index, Seat.col_index).all()
    else:
        seats = []

    if not seats:
        total_seats = bus.capacity or 40
        rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
        created_count = 0
        seats = []
        for r_idx, r in enumerate(rows):
            cols = 5 if (r == 'K' and total_seats >= 45) else 4
            for c in range(1, cols + 1):
                if created_count >= total_seats:
                    break
                class DynamicSeat:
                    pass
                s = DynamicSeat()
                s.id = f"dynamic-{trip_id}-{r}{c}"
                s.seat_number = f"{r}{c}"
                s.row_index = r_idx
                s.col_index = c - 1
                s.seat_type = "VIP" if r_idx < 2 else "STANDARD"
                s.gender_allowed = "ANY"
                s.base_fare = 650.0 if r_idx < 2 else (trip.base_price or 550.0)
                seats.append(s)
                created_count += 1

    # Active Bookings
    active_booking_seats = (
        await db.query(BookingSeat)
        .join(Booking)
        .filter(
            Booking.trip_id == trip_id,
            Booking.booking_status.in_(["CONFIRMED", "COMPLETED", "PAYMENT_TIMER_ACTIVE", "PRE_BOOKED"])
        )
        .all()
    )
    booked_seat_map = {bs.seat_id: bs.booking for bs in active_booking_seats}

    # Active Locks
    active_locks = (
        await db.query(SeatLock)
        .filter(
            SeatLock.trip_id == trip_id,
            SeatLock.is_active == True,
            or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
        )
        .all()
    )
    lock_map = {l.seat_id: l for l in active_locks}

    # Active Holds
    active_holds = await db.query(SeatHold).filter(SeatHold.trip_id == trip_id, SeatHold.expires_at > now).all()
    hold_map = {h.seat_id: h for h in active_holds}

    available_count = 0
    booked_count = 0
    held_count = 0
    locked_count = 0
    gross_sales = 0.0

    seat_details = []
    for seat in seats:
        effective_fare = seat.base_fare
        booking_info = booked_seat_map.get(seat.id)
        lock_info = lock_map.get(seat.id)
        hold_info = hold_map.get(seat.id)

        status = "AVAILABLE"
        if booking_info:
            if booking_info.booking_status in ["CONFIRMED", "COMPLETED"]:
                status = "BOOKED"
                booked_count += 1
                gross_sales += effective_fare
            else:
                status = "HELD"  # PRE_BOOKED or PAYMENT_TIMER_ACTIVE
                held_count += 1
        elif lock_info:
            status = "LOCKED"
            locked_count += 1
        elif hold_info:
            status = "HELD"
            held_count += 1
        else:
            status = "AVAILABLE"
            available_count += 1

        seat_details.append({
            "seat_id": seat.id,
            "seat_number": seat.seat_number,
            "row_index": seat.row_index,
            "col_index": seat.col_index,
            "seat_type": seat.seat_type,
            "gender_allowed": seat.gender_allowed,
            "fare": effective_fare,
            "status": status,
            "booking_number": booking_info.booking_number if booking_info else None,
            "passenger_name": booking_info.contact_name if booking_info else None,
            "payment_expires_at": booking_info.payment_expires_at.isoformat() if booking_info and booking_info.payment_expires_at else None,
        })

    total_seats = len(seats)
    occupancy_percent = round((booked_count / total_seats) * 100) if total_seats > 0 else 0

    return {
        "trip_id": trip.id,
        "trip_code": trip.trip_code,
        "bus_name": bus.bus_name,
        "total_seats": total_seats,
        "available_seats": available_count,
        "booked_seats": booked_count,
        "held_seats": held_count,
        "locked_seats": locked_count,
        "occupancy_percent": occupancy_percent,
        "gross_trip_sales": gross_sales,
        "seats": seat_details
    }


async def hold_seat(db: Session, trip_id: str, seat_id: str, staff_id: str, duration_minutes: int = 10) -> SeatHold:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=duration_minutes)
    hold_token = f"HOLD-{int(now.timestamp())}-{uuid.uuid4().hex[:6].upper()}"

    clean_expired_inventory(db, trip_id)

    # Lock the seat row itself to serialize concurrent hold/booking attempts.
    seat = await db.query(Seat).filter(Seat.id == seat_id).with_for_update().first()
    if not seat:
        raise ValueError("Seat not found")

    # Check if already booked or held
    existing = await db.query(BookingSeat).join(Booking).filter(
        BookingSeat.seat_id == seat_id,
        Booking.trip_id == trip_id,
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED", "PRE_BOOKED", "PAYMENT_TIMER_ACTIVE", "HELD", "VERIFICATION_PENDING"])
    ).with_for_update().first()
    if existing:
        raise ValueError("Seat is already booked or held")

    # Check if seat is locked
    locked = await db.query(SeatLock).filter(
        SeatLock.trip_id == trip_id,
        SeatLock.seat_id == seat_id,
        SeatLock.is_active == True,
        or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
    ).with_for_update().first()
    if locked:
        raise ValueError(f"Seat is currently locked ({locked.reason})")

    hold = SeatHold(
        trip_id=trip_id,
        seat_id=seat_id,
        staff_id=staff_id,
        hold_token=hold_token,
        expires_at=expires_at
    )
    db.add(hold)
    await db.commit()
    await db.refresh(hold)
    return hold


async def lock_seat(
    db: Session,
    trip_id: str,
    seat_id: str,
    staff_id: str,
    lock_type: str = "TEMPORARY",
    reason: str = "OTHER",
    notes: Optional[str] = None,
    locked_until: Optional[datetime] = None
) -> SeatLock:
    clean_expired_inventory(db, trip_id)
    now = datetime.now(timezone.utc)

    # Lock the seat row to serialize concurrent lock/booking attempts.
    seat = await db.query(Seat).filter(Seat.id == seat_id).with_for_update().first()
    if not seat:
        raise ValueError("Seat not found")

    # 1. Check if already booked
    existing = await db.query(BookingSeat).join(Booking).filter(
        BookingSeat.seat_id == seat_id,
        Booking.trip_id == trip_id,
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED", "PRE_BOOKED", "PAYMENT_TIMER_ACTIVE", "HELD", "VERIFICATION_PENDING"])
    ).with_for_update().first()
    if existing:
        raise ValueError("Cannot lock seat: it is already booked or held in an active booking")

    # 2. Check if already actively locked
    active_lock = await db.query(SeatLock).filter(
        SeatLock.trip_id == trip_id,
        SeatLock.seat_id == seat_id,
        SeatLock.is_active == True,
        or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
    ).with_for_update().first()
    if active_lock:
        raise ValueError(f"Seat is already locked ({active_lock.reason})")

    # 3. Create lock
    lock = SeatLock(
        trip_id=trip_id,
        seat_id=seat_id,
        lock_type=lock_type,
        reason=reason,
        notes=notes,
        locked_by=staff_id,
        locked_until=locked_until,
        is_active=True
    )
    db.add(lock)

    # Remove any temporary hold on this seat
    await db.execute(delete(SeatHold).where(SeatHold.trip_id == trip_id, SeatHold.seat_id == seat_id))

    from app.models.audit import AuditLog
    db.add(AuditLog(
        user_id=staff_id,
        action="SEAT_LOCKED",
        entity="Seat",
        entity_id=seat_id,
        new_value=f"Seat locked for trip {trip_id}. Reason: {reason} ({lock_type})"
    ))

    await db.commit()
    await db.refresh(lock)
    return lock


async def unlock_seat(db: Session, trip_id: str, seat_id: str, staff_id: str) -> bool:
    locks = await db.query(SeatLock).filter(
        SeatLock.trip_id == trip_id,
        SeatLock.seat_id == seat_id,
        SeatLock.is_active == True
    ).all()

    if not locks:
        raise ValueError("No active lock found for this seat")

    for l in locks:
        l.is_active = False

    from app.models.audit import AuditLog
    db.add(AuditLog(
        user_id=staff_id,
        action="SEAT_UNLOCKED",
        entity="Seat",
        entity_id=seat_id,
        new_value=f"Seat unlocked for trip {trip_id} by staff {staff_id}"
    ))

    await db.commit()
    return True


async def clean_all_expired(db: Session) -> Dict[str, int]:
    now = datetime.now(timezone.utc)
    result = await db.execute(delete(SeatHold).where(SeatHold.expires_at <= now))
    deleted_holds = result.rowcount

    result = await db.execute(
        update(Booking)
        .where(
            Booking.booking_status == "PAYMENT_TIMER_ACTIVE",
            Booking.payment_expires_at <= now
        )
        .values(booking_status="EXPIRED")
    )
    expired_bookings = result.rowcount

    await db.commit()
    return {
        "expired_holds": deleted_holds,
        "expired_bookings": expired_bookings
    }

