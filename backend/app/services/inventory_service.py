import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.trip import Trip, SeatHold, SeatLock
from app.models.bus import Bus, SeatLayout, Seat
from app.models.booking import Booking, BookingSeat


def clean_expired_inventory(db: Session, trip_id: str):
    now = datetime.now(timezone.utc)
    # 1. Clean expired holds
    db.query(SeatHold).filter(SeatHold.trip_id == trip_id, SeatHold.expires_at <= now).delete()

    # 2. Expire unpaid pre-bookings whose timer has passed
    db.query(Booking).filter(
        Booking.trip_id == trip_id,
        Booking.booking_status == "PAYMENT_TIMER_ACTIVE",
        Booking.payment_expires_at <= now
    ).update({"booking_status": "EXPIRED"})

    db.commit()


def get_trip_seat_inventory(db: Session, trip_id: str, staff_id: Optional[str] = None) -> Dict[str, Any]:
    clean_expired_inventory(db, trip_id)
    now = datetime.now(timezone.utc)

    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise ValueError("Trip not found")

    bus = db.query(Bus).filter(Bus.id == trip.bus_id).first()
    if not bus:
        raise ValueError("Bus not found")

    if not bus.seat_layout_id or not bus.seat_layout:
        total_seats = bus.capacity or 40
        layout = db.query(SeatLayout).filter(SeatLayout.total_seats == total_seats).first()
        if not layout:
            layout = SeatLayout(
                name=f"Standard {total_seats}-Seat Layout",
                description=f"Auto generated layout for {bus.bus_name}",
                total_rows=10 if total_seats <= 40 else 11,
                total_cols=4,
                total_seats=total_seats,
                layout_json="{}"
            )
            db.add(layout)
            db.commit()
            db.refresh(layout)

            rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
            created_count = 0
            for r_idx, r in enumerate(rows):
                cols = 5 if (r == 'K' and total_seats >= 45) else 4
                for c in range(1, cols + 1):
                    if created_count >= total_seats:
                        break
                    seat = Seat(
                        seat_layout_id=layout.id,
                        seat_number=f"{r}{c}",
                        row_index=r_idx,
                        col_index=c - 1,
                        seat_type="VIP" if r_idx < 2 else "STANDARD",
                        gender_allowed="ANY",
                        base_fare=650.0 if r_idx < 2 else (trip.base_price or 550.0)
                    )
                    db.add(seat)
                    created_count += 1
            db.commit()
            db.refresh(layout)

        bus.seat_layout_id = layout.id
        db.commit()
        db.refresh(bus)

    seats = db.query(Seat).filter(Seat.seat_layout_id == bus.seat_layout_id).order_by(Seat.row_index, Seat.col_index).all()
    if not seats:
        total_seats = bus.capacity or 40
        rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
        created_count = 0
        for r_idx, r in enumerate(rows):
            cols = 5 if (r == 'K' and total_seats >= 45) else 4
            for c in range(1, cols + 1):
                if created_count >= total_seats:
                    break
                seat = Seat(
                    seat_layout_id=bus.seat_layout_id,
                    seat_number=f"{r}{c}",
                    row_index=r_idx,
                    col_index=c - 1,
                    seat_type="VIP" if r_idx < 2 else "STANDARD",
                    gender_allowed="ANY",
                    base_fare=650.0 if r_idx < 2 else (trip.base_price or 550.0)
                )
                db.add(seat)
                created_count += 1
        db.commit()
        seats = db.query(Seat).filter(Seat.seat_layout_id == bus.seat_layout_id).order_by(Seat.row_index, Seat.col_index).all()

    # Active Bookings
    active_booking_seats = (
        db.query(BookingSeat)
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
        db.query(SeatLock)
        .filter(
            SeatLock.trip_id == trip_id,
            SeatLock.is_active == True,
            or_(SeatLock.locked_until == None, SeatLock.locked_until > now)
        )
        .all()
    )
    lock_map = {l.seat_id: l for l in active_locks}

    # Active Holds
    active_holds = db.query(SeatHold).filter(SeatHold.trip_id == trip_id, SeatHold.expires_at > now).all()
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


def hold_seat(db: Session, trip_id: str, seat_id: str, staff_id: str, duration_minutes: int = 10) -> SeatHold:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=duration_minutes)
    hold_token = f"HOLD-{int(now.timestamp())}-{uuid.uuid4().hex[:6].upper()}"

    clean_expired_inventory(db, trip_id)

    # Check if already booked
    existing = db.query(BookingSeat).join(Booking).filter(
        BookingSeat.seat_id == seat_id,
        Booking.trip_id == trip_id,
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED"])
    ).first()
    if existing:
        raise ValueError("Seat is already booked")

    hold = SeatHold(
        trip_id=trip_id,
        seat_id=seat_id,
        staff_id=staff_id,
        hold_token=hold_token,
        expires_at=expires_at
    )
    db.add(hold)
    db.commit()
    db.refresh(hold)
    return hold
