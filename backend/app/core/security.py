import uuid
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt, JWTError
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from app.core.config import settings

# Initialize Argon2 Password Hasher with OWASP recommended parameters
# Memory: 64MB (65536 KiB), Iterations: 2, Parallelism: 1
pwd_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=65536,
    parallelism=1,
    hash_len=32,
    salt_len=16
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password strictly using Argon2id."""
    if not plain_password or not hashed_password:
        return False

    try:
        return pwd_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hashes password with Argon2id using automatic cryptographically secure salt."""
    return pwd_hasher.hash(password)


def hash_passenger_pin(phone: str, pin: str) -> str:
    """Hashes a passenger PIN keyed by phone number (constant-time HMAC-SHA256)."""
    key = settings.SECRET_KEY.encode("utf-8")
    message = f"{phone.strip()}:{pin}".encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def verify_passenger_pin(phone: str, pin: str, pin_hash: str) -> bool:
    """Verifies a passenger PIN against the stored HMAC hash (constant-time)."""
    expected = hash_passenger_pin(phone, pin)
    return hmac.compare_digest(expected, pin_hash)


def create_access_token(
    subject: Union[str, Any],
    role: str = "STAFF",
    tenant_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generates a cryptographically signed JWT with claims and explicit expiration."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "sub": str(subject),
        "role": role,
        "tenant_id": tenant_id or settings.DEFAULT_TENANT_ID,
        "type": "access_token"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    role: str = "STAFF",
    tenant_id: Optional[str] = None,
    expires_days: int = 7
) -> tuple[str, str]:
    """
    Generates an ephemeral, single-use Refresh Token with a unique JTI (JWT ID).
    Returns (token_string, jti).
    """
    jti = uuid.uuid4().hex
    expire = datetime.now(timezone.utc) + timedelta(days=expires_days)
    to_encode = {
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "sub": str(subject),
        "role": role,
        "tenant_id": tenant_id or settings.DEFAULT_TENANT_ID,
        "type": "refresh_token",
        "jti": jti
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt, jti



def decode_token(token: str) -> Optional[dict]:
    """
    Decodes and strictly validates a JWT token.
    Enforces algorithm match, expiration, and payload integrity.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": True, "verify_sub": True}
        )
        return payload
    except (JWTError, Exception):
        return None
