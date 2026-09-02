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


@router.get("/{trip_id}/seat-map")
async def get_seat_map(
    trip_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
) -> Dict[str, Any]:
    try:
        staff_id = current_user.id if current_user else None
        return get_trip_seat_inventory(db, trip_id, staff_id)
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
        return hold_seat(db, trip_id, seat_id, current_user.id, duration_minutes)
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
        lock = lock_seat(
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
        unlock_seat(db, trip_id, seat_id, current_user.id)
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
