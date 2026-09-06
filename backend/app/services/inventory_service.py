import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, delete, update
from app.models.trip import Trip, SeatHold, SeatLock
from app.models.bus import Bus, SeatLayout, Seat
from app.models.booking import Booking, BookingSeat, BookingPassenger
from app.core.redis_client import hold_seat_redis, release_seat_redis, get_seat_hold_status_redis
from app.services.seat_layout_service import (
    layout_cells,
    seat_label_of,
    get_bus_layout_seats,
)


async def clean_expired_inventory(db: Session, trip_id: str):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
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


async def get_trip_seat_inventory(
    db: Session,
    trip_id: str,
    staff_id: Optional[str] = None,
    client_id: Optional[str] = None
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    trip = await db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        # Fallback 1: Look up active trip by bus ID (do NOT auto-provision a
        # phantom trip from a bus id — booking against a bus without a trip is
        # an error, not a hidden side-effect).
        trip = await db.query(Trip).filter(
            Trip.bus_id == trip_id,
            Trip.status.in_(["SCHEDULED", "BOARDING"])
        ).first()

    if not trip:
        raise ValueError("Trip not found")

    bus = await db.query(Bus).filter(Bus.id == trip.bus_id).first()
    if not bus:
        raise ValueError("Bus not found")

    # Physical seats come from the trip's bus layout (Seat rows or layout JSON
    # cells), never from a capacity-based synthetic generator.
    cells = await layout_cells(db, trip)
    # Map canonical label + seat id -> cell
    cell_by_label: Dict[str, Dict[str, Any]] = {}
    cell_by_id: Dict[str, Dict[str, Any]] = {}
    for c in cells:
        if c.get("seat_number"):
            cell_by_label[c["seat_number"].upper()] = c
        if c.get("seat_id"):
            cell_by_id[c["seat_id"].upper()] = c

    # Active Bookings, Seats and Passenger Details (avoid lazy-loading greenlet issues)
    active_bookings = (
        await db.query(Booking)
        .filter(
            Booking.trip_id == trip_id,
            Booking.booking_status.in_(["CONFIRMED", "COMPLETED", "PAYMENT_TIMER_ACTIVE", "PRE_BOOKED", "confirmed", "completed", "pre_booked", "HELD", "held"])
        )
        .all()
    )
    booking_by_id = {b.id: b for b in active_bookings}
    booking_ids = list(booking_by_id.keys())

    active_booking_seats = (
        await db.query(BookingSeat)
        .filter(BookingSeat.booking_id.in_(booking_ids))
        .all()
    ) if booking_ids else []

    active_passengers = (
        await db.query(BookingPassenger)
        .filter(BookingPassenger.booking_id.in_(booking_ids))
        .all()
    ) if booking_ids else []

    booked_seat_id_map = {}
    booked_seat_num_map = {}
    passenger_by_seat_num = {}

    for bs in active_booking_seats:
        b = booking_by_id.get(bs.booking_id)
        if not b:
            continue
        booked_seat_id_map[bs.seat_id] = b
        sid_upper = (bs.seat_id or "").strip().upper()
        booked_seat_id_map[sid_upper] = b
        booked_seat_num_map[sid_upper] = b
        if "-" in sid_upper:
            clean_num = sid_upper.split("-")[-1].strip().upper()
            if clean_num:
                booked_seat_num_map[clean_num] = b

    for p in active_passengers:
        b = booking_by_id.get(p.booking_id)
        p_seat = (p.seat_number or "").strip().upper()
        if p_seat:
            passenger_by_seat_num[p_seat] = p
            if b:
                booked_seat_num_map[p_seat] = b
            if "-" in p_seat:
                clean_p_num = p_seat.split("-")[-1].strip().upper()
                if clean_p_num:
                    passenger_by_seat_num[clean_p_num] = p
                    if b:
                        booked_seat_num_map[clean_p_num] = b
        p_sid = (getattr(p, 'seat_id', None) or "").strip().upper()
        if p_sid:
            passenger_by_seat_num[p_sid] = p
            if b:
                booked_seat_num_map[p_sid] = b
            if "-" in p_sid:
                clean_sid = p_sid.split("-")[-1].strip().upper()
                if clean_sid:
                    passenger_by_seat_num[clean_sid] = p
                    if b:
                        booked_seat_num_map[clean_sid] = b

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
    lock_id_map = {}
    lock_num_map = {}
    for l in active_locks:
        lock_id_map[l.seat_id] = l
        lid_upper = (l.seat_id or "").strip().upper()
        if "-" in lid_upper:
            clean_num = lid_upper.split("-")[-1]
            if clean_num:
                lock_num_map[clean_num] = l
        else:
            lock_num_map[lid_upper] = l

    # Active Holds
    active_holds = await db.query(SeatHold).filter(SeatHold.trip_id == trip_id, SeatHold.expires_at > now).all()
    hold_id_map = {}
    hold_num_map = {}
    for h in active_holds:
        hold_id_map[h.seat_id] = h
        hid_upper = (h.seat_id or "").strip().upper()
        if "-" in hid_upper:
            clean_num = hid_upper.split("-")[-1]
            if clean_num:
                hold_num_map[clean_num] = h
        else:
            hold_num_map[hid_upper] = h

    available_count = 0
    booked_count = 0
    held_count = 0
    locked_count = 0
    gross_sales = 0.0

    seat_details = []
    for seat in cells:
        effective_fare = float(seat.get("fare") or 0.0)
        s_num = (seat.get("seat_number") or "").strip().upper()
        seat_id = (seat.get("seat_id") or "").strip()
        booking_info = (
            booked_seat_id_map.get(seat_id)
            or (booked_seat_num_map.get(s_num) if s_num else None)
            or (booked_seat_id_map.get(f"seat-{trip_id}-{s_num}") if s_num else None)
            or (booked_seat_id_map.get(f"dynamic-{trip_id}-{s_num}") if s_num else None)
        )
        p_info = (
            passenger_by_seat_num.get(s_num)
            or (passenger_by_seat_num.get(seat_id) if seat_id else None)
            or (passenger_by_seat_num.get(f"seat-{trip_id}-{s_num}") if s_num else None)
            or (passenger_by_seat_num.get(f"dynamic-{trip_id}-{s_num}") if s_num else None)
        )

        lock_obj = (
            lock_id_map.get(seat_id)
            or (lock_num_map.get(s_num) if s_num else None)
        )
        hold_obj = (
            hold_id_map.get(seat_id)
            or (hold_num_map.get(s_num) if s_num else None)
        )

        # Check Redis hold (keyed by canonical seat label consistently)
        redis_is_held, redis_ttl, redis_user = get_seat_hold_status_redis(
            tenant_id=trip.tenant_id or "default",
            trip_id=trip.id,
            seat_number=s_num,
        )
        is_held = (hold_obj is not None) or redis_is_held
        holder = hold_obj.staff_id if hold_obj else redis_user
        remaining_ttl = int((hold_obj.expires_at - now).total_seconds()) if hold_obj else redis_ttl

        hold_dict = None
        if is_held and not booking_info:
            hold_dict = {
                "hold_token": hold_obj.hold_token if hold_obj else "REDIS-HOLD",
                "held_by": holder,
                "is_my_hold": (holder == client_id) if (client_id and holder) else False,
                "expires_at": hold_obj.expires_at.isoformat() if hold_obj else (now + timedelta(seconds=remaining_ttl)).isoformat(),
                "remaining_seconds": max(0, remaining_ttl)
            }

        lock_dict = None
        if lock_obj:
            lock_dict = {
                "lock_type": lock_obj.lock_type,
                "reason": lock_obj.reason,
                "notes": lock_obj.notes,
                "locked_until": lock_obj.locked_until.isoformat() if lock_obj.locked_until else None,
                "locked_by": lock_obj.locked_by
            }

        status = "AVAILABLE"
        if booking_info:
            if booking_info.booking_status in ["CONFIRMED", "COMPLETED"]:
                status = "BOOKED"
                booked_count += 1
                gross_sales += effective_fare
            else:
                status = "HELD"  # PRE_BOOKED or PAYMENT_TIMER_ACTIVE
                held_count += 1
        elif lock_obj:
            status = "LOCKED"
            locked_count += 1
        elif is_held:
            status = "HELD"
            held_count += 1
        else:
            status = "AVAILABLE"
            available_count += 1

        p_name = p_info.passenger_name if p_info else (booking_info.contact_name if booking_info else None)
        p_phone = p_info.passenger_phone if p_info else (booking_info.contact_phone if booking_info else None)
        p_gender = p_info.gender if p_info else (booking_info.passenger_gender if booking_info else None)

        seat_details.append({
            "seat_id": seat_id,
            "seat_number": s_num,
            "row_index": seat.get("row_index", 0),
            "col_index": seat.get("col_index", 0),
            "seat_type": seat.get("seat_type", "STANDARD"),
            "gender_allowed": seat.get("gender_allowed", "ANY"),
            "fare": effective_fare,
            "status": status,
            "booking_number": booking_info.booking_number if booking_info else None,
            "passenger_name": p_name,
            "passenger_phone": p_phone,
            "gender": p_gender,
            "payment_expires_at": booking_info.payment_expires_at.isoformat() if booking_info and booking_info.payment_expires_at else None,
            "hold_info": hold_dict,
            "lock_info": lock_dict
        })

    total_seats = len(seat_details)
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



async def acquire_seat_hold(
    db: Session,
    trip_id: str,
    seat_id: str,
    client_id: str,
    duration_minutes: int = 10
) -> Dict[str, Any]:
    await clean_expired_inventory(db, trip_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = now + timedelta(minutes=duration_minutes)
    hold_token = f"HOLD-{int(now.timestamp())}-{uuid.uuid4().hex[:6].upper()}"

    # Serialize against booking creation: lock the Trip row first (same lock
    # order as create_counter_booking / create_pre_booking) to avoid deadlocks.
    trip = await db.query(Trip).filter(Trip.id == trip_id).with_for_update(nowait=False).first()
    if not trip:
        # Fallback 1: Look up active trip by bus ID (never auto-provision here)
        trip = await db.query(Trip).filter(
            Trip.bus_id == trip_id,
            Trip.status.in_(["SCHEDULED", "BOARDING"])
        ).with_for_update(nowait=False).first()
    if not trip:
        raise ValueError("Trip not found")

    tenant_id = trip.tenant_id or "default"
    clean_num = seat_label_of(seat_id) or seat_id.strip().upper()

    # Materialize the canonical Seat row for this label (from the trip layout)
    # so holds always reference a real seat.
    from app.services.seat_layout_service import ensure_seat_rows
    await ensure_seat_rows(db, trip, labels=[clean_num])
    db_seat = await db.query(Seat).filter(
        or_(
            Seat.seat_number == clean_num,
            Seat.id == f"seat-{trip_id}-{clean_num}",
        ),
        Seat.is_active == True,
    ).first()
    actual_seat_id = db_seat.id if db_seat else f"seat-{trip_id}-{clean_num}"

    # 1. Check if already booked
    booked_seat = await db.query(BookingSeat).join(Booking).filter(
        Booking.trip_id == trip_id,
        or_(
            BookingSeat.seat_id == actual_seat_id,
            BookingSeat.seat_id == f"seat-{trip_id}-{clean_num}",
            BookingSeat.seat_id == clean_num
        ),
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED", "PRE_BOOKED", "PAYMENT_TIMER_ACTIVE", "HELD", "VERIFICATION_PENDING"])
    ).first()
    if booked_seat:
        raise ValueError(f"সিট {clean_num} ইতোমধ্যে নিশ্চিত বুকিং হয়ে গেছে।")

    booked_pass = await db.query(BookingPassenger).join(Booking).filter(
        Booking.trip_id == trip_id,
        or_(
            BookingPassenger.seat_number == clean_num,
            BookingPassenger.seat_number == actual_seat_id
        ),
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED", "PRE_BOOKED", "PAYMENT_TIMER_ACTIVE", "HELD"])
    ).first()
    if booked_pass:
        raise ValueError(f"সিট {clean_num} ইতোমধ্যে একজন যাত্রীর নামে নিশ্চিত বুকিং আছে।")

    # 2. Check if seat is locked by admin / quota
    locked = await db.query(SeatLock).filter(
        SeatLock.trip_id == trip_id,
        or_(
            SeatLock.seat_id == actual_seat_id,
            SeatLock.seat_id == clean_num,
            SeatLock.seat_id == f"seat-{trip_id}-{clean_num}"
        ),
        SeatLock.is_active == True,
        or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
    ).first()
    if locked:
        reason_label = "সংরক্ষিত কোটা"
        if locked.reason == "COUNTER_QUOTA":
            reason_label = "কাউন্টার সরাসরি বিক্রির জন্য সংরক্ষিত কোটা"
        elif locked.reason == "VIP":
            reason_label = "ভিআইপি / প্রশাসন কোটা"
        elif locked.reason == "STUDENT_BLOCKED":
            reason_label = "প্রশাসনের পক্ষ থেকে সাময়িক সংরক্ষিত"
        elif locked.reason == "MAINTENANCE":
            reason_label = "সিটটি মেরামতের জন্য বন্ধ"
        raise ValueError(f"সিট {clean_num} অনলাইনে নির্বাচনের জন্য অনুমোদিত নয় ({reason_label})।")

    # 3. Check DB SeatHold
    existing_db_hold = await db.query(SeatHold).filter(
        SeatHold.trip_id == trip_id,
        or_(
            SeatHold.seat_id == actual_seat_id,
            SeatHold.seat_id == clean_num,
            SeatHold.seat_id == f"seat-{trip_id}-{clean_num}"
        ),
        SeatHold.expires_at > now
    ).first()
    if existing_db_hold and existing_db_hold.staff_id != client_id:
        rem = int((existing_db_hold.expires_at - now).total_seconds())
        rem_min = max(1, rem // 60)
        raise ValueError(f"সিট {clean_num} এইমাত্র অন্য একজন শিক্ষার্থী নির্বাচন করেছেন (হোল্ড শেষ হতে আর {rem_min} মিনিট বাকি)।")

    # 4. Atomic Redis Hold Check
    acquired, remaining_secs, held_by = hold_seat_redis(
        tenant_id=tenant_id,
        trip_id=trip_id,
        seat_number=clean_num,
        user_id=client_id,
        ttl_seconds=duration_minutes * 60
    )
    if not acquired and held_by != client_id:
        rem_min = max(1, (remaining_secs or 0) // 60)
        raise ValueError(f"সিট {clean_num} এইমাত্র অন্য একজন শিক্ষার্থী নির্বাচন করেছেন (হোল্ড শেষ হতে আর {rem_min} মিনিট বাকি)।")

    # 5. (Seat row was materialized up front via ensure_seat_rows; no fabrication.)

    # 6. Save or Update DB SeatHold for durability
    db_hold = await db.query(SeatHold).filter(
        SeatHold.trip_id == trip_id,
        SeatHold.seat_id == actual_seat_id
    ).first()
    if not db_hold:
        db_hold = SeatHold(
            trip_id=trip_id,
            seat_id=actual_seat_id,
            staff_id=client_id,
            hold_token=hold_token,
            expires_at=expires_at
        )
        db.add(db_hold)
    else:
        db_hold.staff_id = client_id
        db_hold.hold_token = hold_token
        db_hold.expires_at = expires_at

    await db.commit()

    return {
        "success": True,
        "trip_id": trip_id,
        "seat_id": actual_seat_id,
        "seat_number": clean_num,
        "hold_token": hold_token,
        "client_id": client_id,
        "expires_at": expires_at.isoformat(),
        "remaining_seconds": duration_minutes * 60
    }


async def release_seat_hold(
    db: Session,
    trip_id: str,
    seat_id: str,
    client_id: Optional[str] = None
) -> bool:
    trip = await db.query(Trip).filter(Trip.id == trip_id).first()
    tenant_id = trip.tenant_id if trip else "default"
    clean_num = seat_label_of(seat_id) or seat_id.strip().upper()
    canonical_id = f"seat-{trip_id}-{clean_num}"

    release_seat_redis(tenant_id, trip_id, clean_num)
    release_seat_redis(tenant_id, trip_id, seat_id)
    release_seat_redis(tenant_id, trip_id, canonical_id)

    q = delete(SeatHold).where(
        SeatHold.trip_id == trip_id,
        or_(
            SeatHold.seat_id == seat_id,
            SeatHold.seat_id == clean_num,
            SeatHold.seat_id == canonical_id
        )
    )
    if client_id:
        q = q.where(SeatHold.staff_id == client_id)
    await db.execute(q)
    await db.commit()
    return True


async def hold_seat(db: Session, trip_id: str, seat_id: str, staff_id: str, duration_minutes: int = 10) -> SeatHold:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = now + timedelta(minutes=duration_minutes)
    hold_token = f"HOLD-{int(now.timestamp())}-{uuid.uuid4().hex[:6].upper()}"

    await clean_expired_inventory(db, trip_id)

    # Serialize against booking: lock the Trip row first (consistent lock order
    # with create_counter_booking / create_pre_booking).
    trip = await db.query(Trip).filter(Trip.id == trip_id).with_for_update(nowait=False).first()
    if not trip:
        raise ValueError("Trip not found")

    clean_num = seat_label_of(seat_id) or seat_id.strip().upper()
    from app.services.seat_layout_service import ensure_seat_rows
    await ensure_seat_rows(db, trip, labels=[clean_num])
    seat = await db.query(Seat).filter(
        or_(
            Seat.seat_number == clean_num,
            Seat.id == f"seat-{trip_id}-{clean_num}",
        ),
        Seat.is_active == True,
    ).with_for_update().first()
    if not seat:
        raise ValueError("Seat not found")

    # Check if already booked or held
    existing = await db.query(BookingSeat).join(Booking).filter(
        BookingSeat.seat_id == seat.id,
        Booking.trip_id == trip_id,
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED", "PRE_BOOKED", "PAYMENT_TIMER_ACTIVE", "HELD", "VERIFICATION_PENDING"])
    ).with_for_update().first()
    if existing:
        raise ValueError("Seat is already booked or held")

    # Check if seat is locked
    locked = await db.query(SeatLock).filter(
        SeatLock.trip_id == trip_id,
        SeatLock.seat_id == seat.id,
        SeatLock.is_active == True,
        or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
    ).with_for_update().first()
    if locked:
        raise ValueError(f"Seat is currently locked ({locked.reason})")

    hold = SeatHold(
        trip_id=trip_id,
        seat_id=seat.id,
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
    await clean_expired_inventory(db, trip_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if locked_until and hasattr(locked_until, "tzinfo") and locked_until.tzinfo is not None:
        locked_until = locked_until.replace(tzinfo=None)

    # Serialize against booking: lock the Trip row first.
    trip = await db.query(Trip).filter(Trip.id == trip_id).with_for_update(nowait=False).first()
    if not trip:
        raise ValueError("Trip not found")

    clean_num = seat_label_of(seat_id) or seat_id.strip().upper()
    from app.services.seat_layout_service import ensure_seat_rows
    await ensure_seat_rows(db, trip, labels=[clean_num])
    seat = await db.query(Seat).filter(
        or_(
            Seat.seat_number == clean_num,
            Seat.id == f"seat-{trip_id}-{clean_num}",
        ),
        Seat.is_active == True,
    ).with_for_update().first()
    if not seat:
        raise ValueError("Seat not found")

    # 1. Check if already booked
    existing = await db.query(BookingSeat).join(Booking).filter(
        BookingSeat.seat_id == seat.id,
        Booking.trip_id == trip_id,
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED", "PRE_BOOKED", "PAYMENT_TIMER_ACTIVE", "HELD", "VERIFICATION_PENDING"])
    ).with_for_update().first()
    if existing:
        raise ValueError("Cannot lock seat: it is already booked or held in an active booking")

    # 2. Check if already actively locked
    active_lock = await db.query(SeatLock).filter(
        SeatLock.trip_id == trip_id,
        SeatLock.seat_id == seat.id,
        SeatLock.is_active == True,
        or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
    ).with_for_update().first()
    if active_lock:
        raise ValueError(f"Seat is already locked ({active_lock.reason})")

    # 3. Create lock
    lock = SeatLock(
        trip_id=trip_id,
        seat_id=seat.id,
        lock_type=lock_type,
        reason=reason,
        notes=notes,
        locked_by=staff_id,
        locked_until=locked_until,
        is_active=True
    )
    db.add(lock)

    # Remove any temporary hold on this seat
    await db.execute(delete(SeatHold).where(
        SeatHold.trip_id == trip_id,
        or_(SeatHold.seat_id == seat.id, SeatHold.seat_id == clean_num)
    ))

    from app.models.audit import AuditLog
    db.add(AuditLog(
        user_id=staff_id,
        action="SEAT_LOCKED",
        entity="Seat",
        entity_id=seat.id,
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
    now = datetime.now(timezone.utc).replace(tzinfo=None)
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

