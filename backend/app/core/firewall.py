from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.db.session import SessionLocal
from app.models.security import BlockedIP
import time

class FirewallMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # We need a new db session per request to check the IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        
        # We shouldn't query the DB for EVERY single request in a high traffic app without cache,
        # but for this MVP, it acts as a real-time firewall.
        db = SessionLocal()
        try:
            blocked = db.query(BlockedIP).filter(
                BlockedIP.ip_address == client_ip,
                BlockedIP.is_blocked == True
            ).first()
            
            if blocked:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Your IP has been blocked by the ATOMS Security Firewall."
                )
        finally:
            db.close()
            
        response = await call_next(request)
        return response
