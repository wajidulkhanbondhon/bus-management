from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from datetime import datetime, timedelta, timezone
import random

from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    hash_passenger_pin,
    verify_passenger_pin,
)
from app.core.token_rotation import token_rotator
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.logger import logger
from app.models.user import User
from app.models.passenger_pin import PassengerPin
from app.models.booking import Booking
from app.schemas.auth import (
    LoginRequest,
    Token,
    UserOut,
    VerifyOTPRequest,
    PassengerVerifyRequest,
    PassengerVerifyResponse,
)

router = APIRouter()

# Helper to attach secure cookie
def set_auth_cookie(response: Response, token: str, key: str = "access_token", max_age: int = 604800):
    """Sets a hardened HttpOnly + SameSite cookie for access and refresh tokens."""
    is_prod = settings.ENVIRONMENT.lower() == "production"
    response.set_cookie(
        key=key,
        value=token,
        max_age=max_age,
        expires=max_age,
        path="/",
        httponly=True,
        secure=is_prod,
        samesite="lax",
    )


@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    req: LoginRequest,
    response: Response,
    db: WrappedAsyncSession = Depends(get_db)
):
    clean_email = req.email.lower().strip()
    user = await db.query(User).filter(User.email == clean_email, User.is_active == True).first()
    
    if not user or not verify_password(req.password, user.password_hash):
        logger.warning("login_failed", email=clean_email, client_ip=request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    user_role = user.role.name if user.role else "STAFF"
    access_token = create_access_token(
        subject=user.id,
        role=user_role,
        tenant_id=user.tenant_id
    )
    refresh_token, jti = create_refresh_token(
        subject=user.id,
        role=user_role,
        tenant_id=user.tenant_id
    )
    token_rotator.register_refresh_token(user.id, jti)

    # Set hardened HttpOnly cookies for both access and refresh tokens
    set_auth_cookie(response, access_token, key="access_token", max_age=86400)
    set_auth_cookie(response, refresh_token, key="refresh_token", max_age=7 * 86400)

    logger.info("login_success", user_id=user.id, role=user_role)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "id": user.id,
        "role": user_role,
        "tenant_id": user.tenant_id,
        "full_name": user.full_name,
        "email": user.email
    }


@router.post("/refresh")
@limiter.limit("10/minute")
async def refresh_tokens(request: Request, response: Response):
    """
    Single-Use Refresh Token Rotation (RTR) Endpoint:
    - Rotates refresh token and invalidates consumed token.
    - Automatic Family Revocation if token theft/reuse is detected.
    """
    # Check explicit Authorization header first, fallback to HttpOnly cookie
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        refresh_token = auth_header.split(" ")[1]
    else:
        refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")

    new_access_token, new_refresh_token = token_rotator.rotate_token(refresh_token)

    set_auth_cookie(response, new_access_token, key="access_token", max_age=86400)
    set_auth_cookie(response, new_refresh_token, key="refresh_token", max_age=7 * 86400)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(response: Response):
    """Clears both access and refresh authentication cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"status": "success", "message": "Successfully logged out"}


@router.post("/login/verify-otp", response_model=Token)
@limiter.limit("5/minute")
async def verify_otp(
    request: Request,
    req: VerifyOTPRequest,
    response: Response,
    db: WrappedAsyncSession = Depends(get_db)
):
    user = await db.query(User).filter(User.id == req.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not user.current_otp or user.current_otp != req.otp:
        logger.warning("otp_verification_failed", user_id=req.user_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")
        
    if not user.otp_expires_at or user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP expired")
        
    user.current_otp = None
    user.otp_expires_at = None
    await db.commit()
    
    access_token = create_access_token(
        subject=user.id,
        role=user.role.name if user.role else "STAFF",
        tenant_id=user.tenant_id
    )
    
    set_auth_cookie(response, access_token)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/passenger-verify", response_model=PassengerVerifyResponse)
@limiter.limit("10/minute")
async def passenger_verify(
    request: Request,
    req: PassengerVerifyRequest,
    response: Response,
    db: WrappedAsyncSession = Depends(get_db)
):
    clean_phone = req.phone.strip()
    record = await db.query(PassengerPin).filter(PassengerPin.phone == clean_phone).first()
    if not record:
        raise HTTPException(status_code=404, detail="No PIN registered for this phone number")

    if not verify_passenger_pin(clean_phone, req.pin, record.pin_hash):
        logger.warning("passenger_pin_failed", phone=clean_phone)
        raise HTTPException(status_code=401, detail="Invalid PIN")

    access_token = create_access_token(
        subject=f"passenger:{clean_phone}",
        role="PASSENGER",
        expires_delta=timedelta(hours=12)
    )
    
    set_auth_cookie(response, access_token, max_age=43200)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "PASSENGER",
        "phone": clean_phone,
        "full_name": record.full_name or req.name or clean_phone,
    }


@router.post("/passenger-register", response_model=PassengerVerifyResponse)
@limiter.limit("5/minute")
async def passenger_register(
    request: Request,
    req: PassengerVerifyRequest,
    response: Response,
    db: WrappedAsyncSession = Depends(get_db)
):
    clean_phone = req.phone.strip()
    existing_booking = await db.query(Booking).filter(Booking.contact_phone == clean_phone).first()
    if not existing_booking:
        raise HTTPException(status_code=404, detail="No booking found for this phone number")

    record = await db.query(PassengerPin).filter(PassengerPin.phone == clean_phone).first()
    if record:
        record.pin_hash = hash_passenger_pin(clean_phone, req.pin)
        if req.name:
            record.full_name = req.name.strip()
    else:
        record = PassengerPin(
            phone=clean_phone,
            pin_hash=hash_passenger_pin(clean_phone, req.pin),
            full_name=req.name.strip() if req.name else existing_booking.contact_name,
        )
        db.add(record)
    await db.commit()

    access_token = create_access_token(
        subject=f"passenger:{clean_phone}",
        role="PASSENGER",
        expires_delta=timedelta(hours=12)
    )
    
    set_auth_cookie(response, access_token, max_age=43200)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "PASSENGER",
        "phone": clean_phone,
        "full_name": record.full_name or clean_phone,
    }
