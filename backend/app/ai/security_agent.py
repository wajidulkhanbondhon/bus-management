import logging
from datetime import datetime, timedelta
import pytz
from app.db.session import AsyncSessionLocal
from app.db.async_wrapper import WrappedAsyncSession
from app.models.security import BlockedIP, SecurityEvent

logger = logging.getLogger(__name__)


def get_utc_now():
    return datetime.now(pytz.utc)


async def log_security_event(ip_address: str, event_type: str, details: str, severity: str = "LOW"):
    """
    Logs a security event to the database.
    If severity is HIGH or CRITICAL, it initiates a warning block state.
    """
    try:
        async with AsyncSessionLocal() as session:
            db = WrappedAsyncSession(session)
            # Create the event
            event = SecurityEvent(
                event_type=event_type,
                ip_address=ip_address,
                details=details,
                severity=severity
            )
            db.add(event)
            
            # If it's a severe attack, initiate a warning block (is_blocked = False)
            if severity in ["HIGH", "CRITICAL"]:
                existing = await db.query(BlockedIP).filter(BlockedIP.ip_address == ip_address).first()
                if not existing:
                    warning = BlockedIP(
                        ip_address=ip_address,
                        reason=f"Auto-warning triggered by {event_type}",
                        is_blocked=False, # Warning state
                        blocked_by="SECURITY_AI"
                    )
                    db.add(warning)
                    logger.warning(f"SECURITY_AI: Warning issued for IP {ip_address}")
            await db.commit()
    except Exception as e:
        logger.error(f"Error logging security event: {e}")


async def process_warning_timeouts():
    """
    Background job to check IPs in warning state.
    If an IP has been in a warning state for more than 5 minutes without admin intervention,
    it automatically gets blocked.
    """
    try:
        async with AsyncSessionLocal() as session:
            db = WrappedAsyncSession(session)
            now = get_utc_now()
            five_mins_ago = now - timedelta(minutes=5)
            
            # Find warning states (is_blocked = False) older than 5 minutes
            warnings = await db.query(BlockedIP).filter(
                BlockedIP.is_blocked == False,
                BlockedIP.blocked_by == "SECURITY_AI",
                BlockedIP.updated_at == None,
                BlockedIP.created_at <= five_mins_ago
            ).all()
            
            for w in warnings:
                w.is_blocked = True
                w.reason = w.reason + " (Auto-blocked after warning timeout)"
                logger.warning(f"SECURITY_AI: Auto-blocking IP {w.ip_address} due to no admin response.")
                
            if warnings:
                await db.commit()
                
    except Exception as e:
        logger.error(f"Error processing warning timeouts: {e}")
