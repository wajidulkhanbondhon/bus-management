import hmac
import hashlib
import time
from typing import Optional
from fastapi import Request, HTTPException, status
from app.core.config import settings
from app.core.logger import logger

# Maximum allowed timestamp drift to block replay attacks (in seconds)
MAX_TIMESTAMP_DRIFT_SECONDS = 300

# Cache for nonces within drift window to prevent replay
_seen_nonces: dict[str, float] = {}


def clean_expired_nonces():
    """Prunes expired nonces older than the drift window."""
    now = time.time()
    expired = [nonce for nonce, ts in _seen_nonces.items() if now - ts > MAX_TIMESTAMP_DRIFT_SECONDS]
    for nonce in expired:
        del _seen_nonces[nonce]


def generate_signature(secret: str, timestamp: str, nonce: str, body: bytes) -> str:
    """Generates an HMAC-SHA256 signature for payload integrity."""
    message = f"{timestamp}:{nonce}:".encode("utf-8") + body
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


async def verify_request_signature(request: Request) -> bool:
    """
    FastAPI dependency / verifier to validate HMAC request signature.
    Enforces payload integrity, anti-tampering, and anti-replay defense.
    """
    signature = request.headers.get("X-Signature")
    timestamp = request.headers.get("X-Timestamp")
    nonce = request.headers.get("X-Nonce")

    if not signature or not timestamp or not nonce:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing cryptographic headers (X-Signature, X-Timestamp, X-Nonce)"
        )

    # 1. Anti-Replay: Verify timestamp freshness
    try:
        req_time = float(timestamp)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid timestamp format")

    current_time = time.time()
    if abs(current_time - req_time) > MAX_TIMESTAMP_DRIFT_SECONDS:
        logger.warning("replay_attack_rejected", drift=current_time - req_time, ip=request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request timestamp expired. Replay protection active."
        )

    # 2. Anti-Replay: Verify nonce uniqueness
    clean_expired_nonces()
    if nonce in _seen_nonces:
        logger.warning("duplicate_nonce_rejected", nonce=nonce, ip=request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nonce already used. Potential replay attack."
        )
    _seen_nonces[nonce] = current_time

    # 3. Payload Integrity: Recompute and compare HMAC
    body_bytes = await request.body()
    expected_sig = generate_signature(settings.SECRET_KEY, timestamp, nonce, body_bytes)

    # Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(signature, expected_sig):
        logger.warning("tampered_signature_rejected", ip=request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cryptographic signature mismatch. Payload may have been tampered with."
        )

    return True
