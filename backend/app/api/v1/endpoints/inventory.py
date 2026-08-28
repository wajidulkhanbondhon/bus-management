from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_optional_user, get_current_user
from app.core.rate_limiter import rate_limit
from app.services.inventory_service import get_trip_seat_inventory, hold_seat
from app.models.user import User

router = APIRouter()


@router.get("/{trip_id}/seat-map")
def get_seat_map(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
) -> Dict[str, Any]:
    try:
        staff_id = current_user.id if current_user else None
        return get_trip_seat_inventory(db, trip_id, staff_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{trip_id}/hold-seat", dependencies=[Depends(rate_limit(requests_per_minute=20, key_prefix="hold"))])
def hold_single_seat(
    trip_id: str,
    seat_id: str,
    duration_minutes: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return hold_seat(db, trip_id, seat_id, current_user.id, duration_minutes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
