from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.core.deps import get_optional_user, get_current_user, require_role
from app.core.rate_limiter import rate_limit
from app.services.inventory_service import (
    get_trip_seat_inventory,
    hold_seat,
    lock_seat,
    unlock_seat,
    clean_all_expired
)
from app.models.user import User
from app.models.trip import Trip
from app.models.booking import Booking, BookingPassenger
from app.models.bus import Bus

router = APIRouter()


class LockSeatRequest(BaseModel):
    seat_id: Optional[str] = None
    seatId: Optional[str] = None
    lock_type: Optional[str] = "TEMPORARY"
    lockType: Optional[str] = None
    reason: Optional[str] = "OTHER"
    notes: Optional[str] = None
    locked_until: Optional[str] = None
    lockedUntil: Optional[str] = None


@router.get("/check-exam-duplicate-phone")
async def check_exam_duplicate_phone(
    phone: str = Query(..., min_length=6),
    trip_id: Optional[str] = None,
    db: WrappedAsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    clean_phone = phone.replace("+88", "").replace(" ", "").replace("-", "").strip()
    if len(clean_phone) > 11:
        clean_phone = clean_phone[-11:]

    matches = []
    if not clean_phone:
        return {"has_duplicate": False, "matches": []}

    target_trip = None
    if trip_id:
        target_trip = await db.query(Trip).filter(Trip.id == trip_id).first()

    exam_trip_ids = set()
    if target_trip and target_trip.departure_date:
        t_date = target_trip.departure_date.date()
        date_start = datetime.combine(t_date, datetime.min.time())
        date_end = datetime.combine(t_date, datetime.max.time())
        same_date_trips = await db.query(Trip).filter(
            Trip.departure_date >= date_start,
            Trip.departure_date <= date_end,
            Trip.status != "CANCELLED"
        ).all()
        for st in same_date_trips:
            exam_trip_ids.add(st.id)

    if trip_id:
        exam_trip_ids.add(trip_id)

    b_query = db.query(Booking).filter(
        Booking.booking_status.in_(["CONFIRMED", "HELD", "PRE_BOOKED", "PAYMENT_TIMER_ACTIVE"])
    )
    if exam_trip_ids:
        b_query = b_query.filter(Booking.trip_id.in_(list(exam_trip_ids)))

    bookings = await b_query.all()

    seen_key = set()
    for b in bookings:
        t = await db.query(Trip).filter(Trip.id == b.trip_id).first()
        bus_name = "বাস"
        if t and t.bus:
            bus_name = t.bus.bus_name or t.bus.bus_number or t.trip_code
        elif t:
            bus_name = t.trip_code

        # Check contact phone
        b_contact = (b.contact_phone or "").replace("+88", "").replace(" ", "").replace("-", "").strip()
        if b_contact and (b_contact == clean_phone or b_contact.endswith(clean_phone)):
            k = f"{b.trip_id}-contact"
            if k not in seen_key:
                seen_key.add(k)
                matches.append({
                    "trip_id": b.trip_id,
                    "bus_name": bus_name,
                    "seat_number": "বুকিং",
                    "passenger_name": b.contact_name or "যাত্রী",
                    "is_current_bus": b.trip_id == trip_id
                })

        # Check passenger records
        passengers = await db.query(BookingPassenger).filter(BookingPassenger.booking_id == b.id).all()
        for p in passengers:
            p_phone = (p.passenger_phone or "").replace("+88", "").replace(" ", "").replace("-", "").strip()
            if p_phone and (p_phone == clean_phone or p_phone.endswith(clean_phone)):
                k = f"{b.trip_id}-{p.seat_number}"
                if k not in seen_key:
                    seen_key.add(k)
                    matches.append({
                        "trip_id": b.trip_id,
                        "bus_name": bus_name,
                        "seat_number": p.seat_number,
                        "passenger_name": p.passenger_name,
                        "is_current_bus": b.trip_id == trip_id
                    })

    return {
        "has_duplicate": len(matches) > 0,
        "clean_phone": clean_phone,
        "matches": matches
    }


@router.get("/{trip_id}/seat-map")
async def get_seat_map(
    trip_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
) -> Dict[str, Any]:
    try:
        staff_id = current_user.id if current_user else None
        return await get_trip_seat_inventory(db, trip_id, staff_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{trip_id}/hold-seat", dependencies=[Depends(rate_limit(requests_per_minute=20, key_prefix="hold"))])
async def hold_single_seat(
    trip_id: str,
    seat_id: str,
    duration_minutes: int = 10,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return await hold_seat(db, trip_id, seat_id, current_user.id, duration_minutes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{trip_id}/lock-seat")
async def lock_single_seat(
    trip_id: str,
    req: LockSeatRequest,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    target_seat_id = req.seat_id or req.seatId
    if not target_seat_id:
        raise HTTPException(status_code=400, detail="seat_id is required")

    effective_lock_type = req.lock_type or req.lockType or "TEMPORARY"
    effective_reason = req.reason or "OTHER"
    until_str = req.locked_until or req.lockedUntil
    locked_until_dt = None
    if until_str:
        try:
            locked_until_dt = datetime.fromisoformat(until_str.replace("Z", "+00:00"))
        except Exception:
            pass

    try:
        lock = await lock_seat(
            db=db,
            trip_id=trip_id,
            seat_id=target_seat_id,
            staff_id=current_user.id,
            lock_type=effective_lock_type,
            reason=effective_reason,
            notes=req.notes,
            locked_until=locked_until_dt
        )
        return {"success": True, "lock_id": lock.id, "seat_id": target_seat_id, "status": "LOCKED"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{trip_id}/unlock-seat")
async def unlock_single_seat(
    trip_id: str,
    seat_id: Optional[str] = Query(None),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    if not seat_id:
        raise HTTPException(status_code=400, detail="seat_id query parameter is required")
    try:
        await unlock_seat(db, trip_id, seat_id, current_user.id)
        return {"success": True, "seat_id": seat_id, "status": "AVAILABLE"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cleanup-expired")
async def cleanup_expired(
    token: Optional[str] = Query(None),
    x_cron_secret: Optional[str] = Header(None, alias="X-Cron-Secret"),
    db: WrappedAsyncSession = Depends(get_db)
):
    provided_token = token or x_cron_secret
    if provided_token != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid cron authorization secret")

    stats = clean_all_expired(db)
    return {
        "success": True,
        "message": "Expired holds and bookings cleaned up",
        "stats": stats
    }
