import time
from typing import Optional, Dict, Set, Tuple
from fastapi import HTTPException, status
from app.core.security import decode_token, create_access_token, create_refresh_token
from app.core.logger import logger

class TokenRotationManager:
    """
    Refresh Token Rotation (RTR) Engine with Reuse Detection.
    - Tracks active single-use refresh token JTIs.
    - Tracks previously consumed JTIs to detect token reuse / theft.
    - Enforces Automatic Family Revocation upon reuse detection.
    """

    def __init__(self):
        # Maps user_id -> Set of active JTIs
        self._active_tokens: Dict[str, Set[str]] = {}
        # Maps user_id -> Set of consumed JTIs (with timestamp)
        self._consumed_tokens: Dict[str, Dict[str, float]] = {}

    def register_refresh_token(self, user_id: str, jti: str):
        """Registers a newly issued refresh token."""
        if user_id not in self._active_tokens:
            self._active_tokens[user_id] = set()
        self._active_tokens[user_id].add(jti)

    def rotate_token(self, refresh_token: str) -> Tuple[str, str]:
        """
        Validates the refresh token, revokes the consumed token, and returns a new (access_token, refresh_token).
        Raises 401 if invalid, expired, or stolen.
        """
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh_token":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        user_id = payload.get("sub")
        jti = payload.get("jti")
        role = payload.get("role", "STAFF")
        tenant_id = payload.get("tenant_id")

        if not user_id or not jti:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed refresh token claims"
            )

        # 1. Check for Token Reuse (Breach Detection)
        consumed_for_user = self._consumed_tokens.get(user_id, {})
        if jti in consumed_for_user:
            # Token Reuse Detected! An attacker attempted to replay a consumed refresh token.
            # Perform Family Revocation: Invalidate ALL active sessions for this user.
            self.revoke_all_user_tokens(user_id)
            logger.error(
                "token_theft_detected",
                user_id=user_id,
                jti=jti,
                action="family_revocation_triggered"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Security alert: Token reuse detected. All sessions terminated."
            )

        # 2. Check if token is active
        active_for_user = self._active_tokens.get(user_id, set())
        if jti not in active_for_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is no longer active"
            )

        # 3. Rotate: Consume the old token
        active_for_user.remove(jti)
        if user_id not in self._consumed_tokens:
            self._consumed_tokens[user_id] = {}
        self._consumed_tokens[user_id][jti] = time.time()

        # 4. Generate new Access Token + new single-use Refresh Token
        new_access_token = create_access_token(subject=user_id, role=role, tenant_id=tenant_id)
        new_refresh_token, new_jti = create_refresh_token(subject=user_id, role=role, tenant_id=tenant_id)
        self.register_refresh_token(user_id, new_jti)

        logger.info("refresh_token_rotated", user_id=user_id, old_jti=jti, new_jti=new_jti)
        return new_access_token, new_refresh_token

    def revoke_token(self, user_id: str, jti: str):
        """Revokes a specific token upon explicit logout."""
        if user_id in self._active_tokens and jti in self._active_tokens[user_id]:
            self._active_tokens[user_id].remove(jti)

    def revoke_all_user_tokens(self, user_id: str):
        """Terminates all active sessions for a user."""
        if user_id in self._active_tokens:
            self._active_tokens[user_id].clear()


token_rotator = TokenRotationManager()
