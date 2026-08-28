import time
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
