import json
import time
from typing import Optional, Tuple, Dict, Any
from fastapi import HTTPException, status
from app.core.redis_client import redis_client, is_redis_available

# In-memory store fallback
_idempotency_store: Dict[str, Dict[str, Any]] = {}
_idempotency_expiry: Dict[str, float] = {}


def check_or_set_idempotency(key: str, lock_ttl_seconds: int = 120) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Checks or atomically initializes an Idempotency-Key.
    Returns: (state, cached_response)
    - "NEW": Key set to PROCESSING state for the first time.
    - "PROCESSING": Request currently being handled (raises HTTP 409).
    - "COMPLETED": Request already finished, returns cached response payload.
    """
    redis_key = f"idempotency:{key}"
    now = time.time()

    if is_redis_available and redis_client:
        # Atomic lock with NX (120s processing TTL)
        is_new = redis_client.set(
            redis_key,
            json.dumps({"status": "PROCESSING", "created_at": now}),
            nx=True,
            ex=lock_ttl_seconds
        )
        if is_new:
            return "NEW", None

        # Key exists: check current status
        raw_val = redis_client.get(redis_key)
        if not raw_val:
            return "NEW", None

        data = json.loads(raw_val)
        if data.get("status") == "PROCESSING":
            return "PROCESSING", None
        elif data.get("status") == "COMPLETED":
            return "COMPLETED", data.get("response")
        return "NEW", None
    else:
        # In-Memory Fallback
        if redis_key in _idempotency_store and _idempotency_expiry.get(redis_key, 0) > now:
            existing = _idempotency_store[redis_key]
            if existing.get("status") == "PROCESSING":
                return "PROCESSING", None
            elif existing.get("status") == "COMPLETED":
                return "COMPLETED", existing.get("response")

        _idempotency_store[redis_key] = {"status": "PROCESSING", "created_at": now}
        _idempotency_expiry[redis_key] = now + lock_ttl_seconds
        return "NEW", None


def complete_idempotency(key: str, response_payload: Dict[str, Any], final_ttl_seconds: int = 86400):
    """Marks Idempotency-Key as COMPLETED and caches the response for 24 hours."""
    redis_key = f"idempotency:{key}"
    val = json.dumps({
        "status": "COMPLETED",
        "response": response_payload,
        "completed_at": time.time()
    })
    if is_redis_available and redis_client:
        redis_client.set(redis_key, val, ex=final_ttl_seconds)
    else:
        _idempotency_store[redis_key] = {
            "status": "COMPLETED",
            "response": response_payload,
            "completed_at": time.time()
        }
        _idempotency_expiry[redis_key] = time.time() + final_ttl_seconds


def clear_idempotency(key: str):
    """Rollback helper on unhandled exceptions."""
    redis_key = f"idempotency:{key}"
    if is_redis_available and redis_client:
        redis_client.delete(redis_key)
    else:
        _idempotency_store.pop(redis_key, None)
        _idempotency_expiry.pop(redis_key, None)
