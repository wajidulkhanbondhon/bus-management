from sqlalchemy.orm import Session
from app.models.security import BlockedIP, SecurityEvent
import logging

logger = logging.getLogger(__name__)

def block_ip(db: Session, ip_address: str, reason: str, blocked_by: str = "SECURITY_AI") -> str:
    """
    Blocks an IP address to prevent it from accessing the system.
    Returns a success message if blocked, or an error if already blocked.
    """
    try:
        existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip_address).first()
        if existing:
            if existing.is_blocked:
                return f"IP {ip_address} is already blocked."
            else:
                existing.is_blocked = True
                existing.reason = reason
                existing.blocked_by = blocked_by
                db.commit()
                return f"Re-blocked IP {ip_address} for reason: {reason}"
        
        new_block = BlockedIP(ip_address=ip_address, reason=reason, is_blocked=True, blocked_by=blocked_by)
        db.add(new_block)
        db.commit()
        return f"Successfully blocked IP {ip_address}. Reason: {reason}"
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to block IP {ip_address}: {e}")
        return f"Error blocking IP: {e}"

def unblock_ip(db: Session, ip_address: str, admin_user: str) -> str:
    """
    Unblocks a previously blocked IP.
    """
    try:
        existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip_address).first()
        if existing and existing.is_blocked:
            existing.is_blocked = False
            existing.reason = f"Unblocked by {admin_user}"
            db.commit()
            return f"IP {ip_address} has been successfully unblocked."
        return f"IP {ip_address} is not currently blocked."
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to unblock IP {ip_address}: {e}")
        return f"Error unblocking IP: {e}"

def get_security_status(db: Session) -> str:
    """
    Gets the current firewall status and recent security events.
    """
    try:
        blocked_count = db.query(BlockedIP).filter(BlockedIP.is_blocked == True).count()
        recent_events = db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(5).all()
        
        status = f"Firewall Status: ACTIVE\nTotal Blocked IPs: {blocked_count}\n\nRecent Security Events:\n"
        if not recent_events:
            status += "No recent security events detected.\n"
        else:
            for event in recent_events:
                status += f"- [{event.severity}] {event.event_type} from IP {event.ip_address} (User: {event.user_id})\n"
        return status
    except Exception as e:
        logger.error(f"Failed to get security status: {e}")
        return f"Error retrieving security status: {e}"
