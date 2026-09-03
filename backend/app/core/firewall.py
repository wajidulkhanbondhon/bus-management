from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.db.session import AsyncSessionLocal
from app.db.async_wrapper import WrappedAsyncSession
from app.models.security import BlockedIP

# In-memory blocked IP set to avoid hammering DB on every request
_blocked_ips_cache = set()


def unblock_ip_cache(ip_address: str) -> None:
    """Removes an IP from the in-memory blocked cache (used by unblock operations)."""
    _blocked_ips_cache.discard(ip_address)


class FirewallMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        
        # Fast cache check
        if client_ip in _blocked_ips_cache:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Your IP has been blocked by the Security Firewall."
            )

        try:
            async with AsyncSessionLocal() as session:
                db = WrappedAsyncSession(session)
                blocked = await db.query(BlockedIP).filter(
                    BlockedIP.ip_address == client_ip,
                    BlockedIP.is_blocked == True
                ).first()
                
                if blocked:
                    _blocked_ips_cache.add(client_ip)
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied: Your IP has been blocked by the Security Firewall."
                    )
        except HTTPException:
            raise
        except Exception:
            # If DB is temporarily busy, fail open for middleware check so we don't drop legitimate traffic
            pass
            
        response = await call_next(request)
        return response
