from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

def get_client_identifier(request: Request) -> str:
    """
    Identifies clients by forwarded IP, direct client host, or tenant header.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request) or "127.0.0.1"

# Global SlowAPI Limiter instance
limiter = Limiter(
    key_func=get_client_identifier,
    default_limits=["100/minute"],
    headers_enabled=True,
)
