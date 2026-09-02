from fastapi import Request, Depends, HTTPException, status
from typing import Optional
from app.core.deps import get_current_user
from app.core.security import verify_password
from app.models.user import User
from app.core.logger import logger

# Master Director Action PIN for emergency operational override
DEFAULT_DIRECTOR_PIN = "9988"


async def square_double_layer_guard(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Square Security (Double-Layer / 2FA Guard):
    Enforces that high-stakes operations (Refunds, Voids, Overrides)
    require both an active authenticated session AND a secondary Action PIN.
    """
    # 1. First Layer: The user must be authenticated and active (handled by get_current_user)
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    # 2. Second Layer: Check secondary verification PIN in headers or query
    action_pin = request.headers.get("X-Action-PIN")
    if not action_pin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Square Verification Required: Secondary X-Action-PIN header missing for high-stakes action"
        )

    # 3. Validate PIN against user's 2FA secret or director PIN
    # In production, check current_user.otp_secret or hashed action PIN
    is_valid_pin = (action_pin == DEFAULT_DIRECTOR_PIN) or (
        current_user.current_otp and action_pin == current_user.current_otp
    )

    if not is_valid_pin:
        logger.warning(
            "square_guard_pin_failed",
            user_id=current_user.id,
            email=current_user.email,
            ip=request.client.host if request.client else "unknown"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Square Verification Failed: Invalid Action PIN. Operation blocked."
        )

    logger.info(
        "square_guard_authorized",
        user_id=current_user.id,
        email=current_user.email,
        path=request.url.path
    )
    return current_user
