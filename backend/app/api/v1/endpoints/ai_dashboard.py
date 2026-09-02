from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.security import BlockedIP, SecurityEvent
from app.models.knowledge import KnowledgeRule

router = APIRouter()

@router.get("/rules", response_model=List[Dict[str, Any]])
async def get_learned_rules(db: WrappedAsyncSession = Depends(get_db)):
    """Fetch all autonomous learned rules."""
    rules = await db.query(KnowledgeRule).all()
    return [
        {
            "id": str(r.id),
            "topic_keywords": r.topic_keywords,
            "content": r.content,
            "allowed_roles": r.allowed_roles,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in rules
    ]

@router.get("/security-events", response_model=List[Dict[str, Any]])
async def get_security_events(db: WrappedAsyncSession = Depends(get_db)):
    """Fetch security events/warnings."""
    events = await db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(100).all()
    return [
        {
            "id": str(e.id),
            "event_type": e.event_type,
            "ip_address": e.ip_address,
            "details": e.details,
            "severity": e.severity,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in events
    ]

@router.get("/blocked-ips", response_model=List[Dict[str, Any]])
async def get_blocked_ips(db: WrappedAsyncSession = Depends(get_db)):
    """Fetch blocked IPs (including warning states)."""
    blocked = await db.query(BlockedIP).order_by(BlockedIP.created_at.desc()).all()
    return [
        {
            "id": str(b.id),
            "ip_address": b.ip_address,
            "reason": b.reason,
            "is_blocked": b.is_blocked,
            "blocked_by": b.blocked_by,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "updated_at": b.updated_at.isoformat() if b.updated_at else None
        }
        for b in blocked
    ]

@router.post("/blocked-ips/{ip_id}/unblock")
async def unblock_ip(ip_id: str, db: WrappedAsyncSession = Depends(get_db)):
    """Unblock or pardon an IP address."""
    blocked = await db.query(BlockedIP).filter(BlockedIP.id == ip_id).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="IP not found")
    
    # We remove or just set is_blocked = False and blocked_by = ADMIN (pardoned)
    await db.delete(blocked)
    await db.commit()
    return {"success": True, "message": "IP unblocked/pardoned successfully"}

@router.post("/blocked-ips/{ip_id}/block")
async def block_ip(ip_id: str, db: WrappedAsyncSession = Depends(get_db)):
    """Approve a warning and block an IP manually before timeout."""
    blocked = await db.query(BlockedIP).filter(BlockedIP.id == ip_id).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="IP not found")
    
    blocked.is_blocked = True
    blocked.blocked_by = "ADMIN"
    blocked.reason = blocked.reason + " (Approved by Admin)"
    await db.commit()
    return {"success": True, "message": "IP blocked successfully"}
