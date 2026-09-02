import json
import logging
from typing import Optional, Tuple, Dict, Any
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Synchronous and Async Redis Pool
try:
    redis_pool = redis.ConnectionPool.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=2
    )
    redis_client = redis.Redis(connection_pool=redis_pool)
    # Test ping
    redis_client.ping()
    is_redis_available = True
    logger.info("[REDIS] Connected to Redis successfully.")
except Exception as e:
    redis_client = None
    is_redis_available = False
    logger.warning(f"[REDIS] Redis is not available ({e}). Using in-memory fallback for local dev.")

# In-memory fallback dictionary for development without Redis
_memory_cache: Dict[str, Dict[str, Any]] = {}
_memory_timestamps: Dict[str, float] = {}


def get_redis():
    return redis_client


# =====================================================================
# 1. REDIS 15-MINUTE SEAT ANTI-HOARDING ENGINE
# =====================================================================
def hold_seat_redis(
    tenant_id: str,
    trip_id: str,
    seat_number: str,
    user_id: str,
    ttl_seconds: int = 900  # 15 minutes
) -> Tuple[bool, Optional[int], Optional[str]]:
    """
    Attempts to atomically lock a seat in Redis with a 15-minute TTL.
    Key Pattern: seat_hold:{tenant_id}:{trip_id}:{seat_number}
    Returns: (is_success, remaining_seconds, held_by_user)
    """
    key = f"seat_hold:{tenant_id}:{trip_id}:{seat_number}"
    payload = json.dumps({"user_id": user_id})

    if is_redis_available and redis_client:
        # Atomic SET with NX (Only if Not eXists) and EX (expire seconds)
        acquired = redis_client.set(key, payload, nx=True, ex=ttl_seconds)
        if acquired:
            return True, ttl_seconds, user_id
        else:
            # Key already held! Get remaining TTL
            remaining_ttl = redis_client.ttl(key)
            existing_data = redis_client.get(key)
            held_by = json.loads(existing_data).get("user_id") if existing_data else "Unknown"
            return False, max(0, remaining_ttl), held_by
    else:
        # In-Memory Fallback
        import time
        now = time.time()
        if key in _memory_cache and _memory_timestamps.get(key, 0) > now:
            remaining = int(_memory_timestamps[key] - now)
            return False, remaining, _memory_cache[key].get("user_id")
        
        _memory_cache[key] = {"user_id": user_id}
        _memory_timestamps[key] = now + ttl_seconds
        return True, ttl_seconds, user_id


def release_seat_redis(tenant_id: str, trip_id: str, seat_number: str) -> bool:
    """Permanently removes a seat hold from Redis upon booking or cancellation."""
    key = f"seat_hold:{tenant_id}:{trip_id}:{seat_number}"
    if is_redis_available and redis_client:
        return bool(redis_client.delete(key))
    else:
        _memory_cache.pop(key, None)
        _memory_timestamps.pop(key, None)
        return True


def get_seat_hold_status_redis(tenant_id: str, trip_id: str, seat_number: str) -> Tuple[bool, int, Optional[str]]:
    """Checks if a seat is currently held in Redis and returns (is_held, remaining_ttl, user_id)."""
    key = f"seat_hold:{tenant_id}:{trip_id}:{seat_number}"
    if is_redis_available and redis_client:
        data = redis_client.get(key)
        if data:
            ttl = max(0, redis_client.ttl(key))
            user_id = json.loads(data).get("user_id")
            return True, ttl, user_id
        return False, 0, None
    else:
        import time
        now = time.time()
        if key in _memory_cache and _memory_timestamps.get(key, 0) > now:
            return True, int(_memory_timestamps[key] - now), _memory_cache[key].get("user_id")
        return False, 0, None
