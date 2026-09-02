from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant_id, require_role
from app.models.finance import DayClosing
from app.models.user import User
from app.schemas.day_closing import SubmitDayClosingRequest, DayClosingOut
from app.services.finance_service import calculate_day_closing_summary, submit_day_closing

router = APIRouter()


@router.get("/summary")
async def get_daily_summary(
    date_str: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "MANAGER"]))
) -> Dict[str, Any]:
    try:
        date_obj = datetime.fromisoformat(date_str)
        return calculate_day_closing_summary(db, date_obj)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/submit", response_model=DayClosingOut)
async def close_business_day(
    req: SubmitDayClosingRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]))
):
    try:
        return submit_day_closing(db, req, current_user.id, tenant_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
