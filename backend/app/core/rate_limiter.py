import time
from datetime import datetime
from typing import Optional
from fastapi import Request, HTTPException, status
from app.core.redis_client import redis_client, is_redis_available

# In-memory rate limit store fallback
_rate_limit_store = {}


def rate_limit(requests_per_minute: int, key_prefix: str = "rl"):
    """
    FastAPI dependency for Redis-backed rate limiting with client IP and tenant_id.
    Returns HTTP 429 Too Many Requests with Retry-After header.
    """
    async def rate_limiter_dependency(request: Request):
        client_ip = request.client.host if request.client else "127.0.0.1"
        tenant_id = request.headers.get("X-Tenant-ID", "global")
        path = request.url.path

        key = f"rate_limit:{key_prefix}:{tenant_id}:{client_ip}:{path}"
        now = int(time.time())
        window_start = now - 60

        async def log_and_maybe_block() -> None:
            """Records a RATE_LIMIT_EXCEEDED event and auto-blocks repeat offenders."""
            from app.db.session import AsyncSessionLocal
            from app.db.async_wrapper import WrappedAsyncSession
            from app.models.security import SecurityEvent, BlockedIP
            try:
                async with AsyncSessionLocal() as session:
                    db = WrappedAsyncSession(session)
                    db.add(SecurityEvent(
                        event_type="RATE_LIMIT_EXCEEDED",
                        ip_address=client_ip,
                        details=f"Path: {path}"
                    ))
                    await db.commit()

                    # Brute force protection: count recent violations for this IP
                    from datetime import datetime as dt
                    window_start_dt = dt.fromtimestamp(window_start)
                    recent_violations = await db.query(SecurityEvent).filter(
                        SecurityEvent.ip_address == client_ip,
                        SecurityEvent.event_type == "RATE_LIMIT_EXCEEDED",
                        SecurityEvent.created_at >= window_start_dt
                    ).count()

                    if recent_violations >= 3:
                        existing = await db.query(BlockedIP).filter(BlockedIP.ip_address == client_ip).first()
                        if not existing:
                            db.add(BlockedIP(
                                ip_address=client_ip,
                                reason="Repeated rate limit violations",
                                blocked_by="SECURITY_AI"
                            ))
                            await db.commit()
            except Exception:
                # Rate-limit enforcement must never crash the request path
                pass

        if is_redis_available and redis_client:
            pipe = redis_client.pipeline()
            # Remove hits older than 60 seconds
            pipe.zremrangebyscore(key, 0, window_start)
            # Count hits in the current window
            pipe.zcard(key)
            # Add current hit
            pipe.zadd(key, {str(now): now})
            # Expire key in 60s
            pipe.expire(key, 60)
            results = pipe.execute()

            current_count = results[1]
            if current_count >= requests_per_minute:
                retry_after = 60 - (now - window_start)
                await log_and_maybe_block()

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": f"Maximum {requests_per_minute} requests per minute allowed. Please try again shortly.",
                        "retry_after_seconds": max(1, retry_after)
                    },
                    headers={"Retry-After": str(max(1, retry_after))}
                )
        else:
            # In-Memory Sliding Window
            hits = _rate_limit_store.get(key, [])
            hits = [h for h in hits if h > window_start]
            if len(hits) >= requests_per_minute:
                await log_and_maybe_block()

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": f"Maximum {requests_per_minute} requests per minute allowed.",
                        "retry_after_seconds": 30
                    },
                    headers={"Retry-After": "30"}
                )
            hits.append(now)
            _rate_limit_store[key] = hits

    return rate_limiter_dependency


class RateLimiter:
    """
    Sliding-window in-memory rate limiter per key (user_id, IP, etc.)
    """
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._store = {}

    def allow(self, key: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds
        hits = self._store.get(key, [])
        hits = [h for h in hits if h > window_start]
        if len(hits) >= self.max_requests:
            self._store[key] = hits
            return False
        hits.append(now)
        self._store[key] = hits
        return True

    def reset(self, key: Optional[str] = None):
        if key:
            self._store.pop(key, None)
        else:
            self._store.clear()

