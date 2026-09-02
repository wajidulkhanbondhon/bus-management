from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from typing import Any, List
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.security import BlockedIP, SecurityEvent
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class BlockedIPResponse(BaseModel):
    id: str
    ip_address: str
    reason: str
    is_blocked: bool
    created_at: datetime
    blocked_by: str

    class Config:
        from_attributes = True

class SecurityEventResponse(BaseModel):
    id: str
    event_type: str
    ip_address: str
    severity: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/blocked-ips", response_model=List[BlockedIPResponse])
async def get_blocked_ips(
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve all blocked IPs. Only accessible to SUPER_ADMIN.
    """
    if current_user.role.name not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await db.query(BlockedIP).order_by(BlockedIP.created_at.desc()).all()

@router.post("/unblock/{ip_address}")
async def unblock_ip(
    ip_address: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Unblocks a specific IP address.
    """
    if current_user.role.name not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    blocked = await db.query(BlockedIP).filter(BlockedIP.ip_address == ip_address).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="IP not found")
    
    blocked.is_blocked = False
    blocked.reason = f"Unblocked by {current_user.email}"
    await db.commit()
    return {"message": "IP unblocked successfully"}

@router.get("/events", response_model=List[SecurityEventResponse])
async def get_security_events(
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve recent security events.
    """
    if current_user.role.name not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(50).all()
