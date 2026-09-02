from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.models.security import BlockedIP, SecurityEvent

router = APIRouter()

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def honeypot_trap(path: str, request: Request, db: WrappedAsyncSession = Depends(get_db)):
    """
    Fake route to catch vulnerability scanners and malicious actors.
    Any request to this router will result in an immediate IP block.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Check if already blocked
    existing_block = await db.query(BlockedIP).filter(BlockedIP.ip_address == client_ip).first()
    if not existing_block:
        # Create block record
        new_block = BlockedIP(
            ip_address=client_ip,
            reason="Triggered honeypot API route",
            is_blocked=True,
            blocked_by="SECURITY_AI"
        )
        db.add(new_block)
        
        # Log security event
        event = SecurityEvent(
            event_type="HONEYPOT_TRIGGERED",
            ip_address=client_ip,
            details=f"Attempted to access fake route: {request.method} /{path}",
            severity="CRITICAL"
        )
        db.add(event)
        
        try:
            await db.commit()
        except Exception:
            db.rollback()
            
    # Always return 403 Forbidden to mimic a secured endpoint or just block them
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied."
    )
