from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token, hash_passenger_pin, verify_passenger_pin
from app.core.deps import get_current_user
from app.core.rate_limiter import rate_limit
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
import random
from datetime import datetime, timedelta, timezone

router = APIRouter()


@router.post("/login", dependencies=[Depends(rate_limit(requests_per_minute=5, key_prefix="login"))])
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip(), User.is_active == True).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    # TODO: Re-enable OTP implementation later
    # if user.role.name in ["SUPER_ADMIN", "ADMIN", "MANAGER"]:
    #     otp = str(random.randint(100000, 999999))
    #     user.current_otp = otp
    #     user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    #     db.commit()
    #     print(f"\n==================================================")
    #     print(f"*** SECURITY OTP for {user.email}: {otp} ***")
    #     print(f"==================================================\n")
    #     return {"requires_otp": True, "user_id": user.id, "email": user.email}

    access_token = create_access_token(
        subject=user.id,
        role=user.role.name,
        tenant_id=user.tenant_id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user.id,
        "role": user.role.name,
        "tenant_id": user.tenant_id,
        "full_name": user.full_name,
        "email": user.email
    }


@router.post("/login/verify-otp", response_model=Token, dependencies=[Depends(rate_limit(requests_per_minute=5, key_prefix="verify_otp"))])
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not user.current_otp or user.current_otp != req.otp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")
        
    if not user.otp_expires_at or user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP expired")
        
    # Clear OTP
    user.current_otp = None
    user.otp_expires_at = None
    db.commit()
    
    access_token = create_access_token(
        subject=user.id,
        role=user.role.name,
        tenant_id=user.tenant_id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user.id,
        "role": user.role.name,
        "tenant_id": user.tenant_id,
        "full_name": user.full_name,
        "email": user.email
    }



@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    permissions = [p.code for p in current_user.role.permissions] if current_user.role else []
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role.name,
        "tenant_id": current_user.tenant_id,
        "discount_limit": current_user.discount_limit,
        "is_active": current_user.is_active,
        "permissions": permissions
    }


@router.post(
    "/passenger-verify",
    response_model=PassengerVerifyResponse,
    dependencies=[Depends(rate_limit(requests_per_minute=10, key_prefix="passenger_verify"))]
)
def passenger_verify(req: PassengerVerifyRequest, db: Session = Depends(get_db)):
    """Verifies a passenger phone + PIN against the server-side store.

    Replaces the old client-side localStorage PIN flow: the PIN itself is never
    persisted on the device; only a short-lived signed token is returned.
    """
    clean_phone = req.phone.strip()
    record = db.query(PassengerPin).filter(PassengerPin.phone == clean_phone).first()
    if not record:
        raise HTTPException(status_code=404, detail="No PIN registered for this phone number")

    if not verify_passenger_pin(clean_phone, req.pin, record.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    # Issue a short-lived passenger token scoped to the phone number.
    access_token = create_access_token(
        subject=f"passenger:{clean_phone}",
        role="PASSENGER",
        expires_delta=timedelta(hours=12)
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "PASSENGER",
        "phone": clean_phone,
        "full_name": record.full_name or req.name or clean_phone,
    }


@router.post(
    "/passenger-register",
    response_model=PassengerVerifyResponse,
    dependencies=[Depends(rate_limit(requests_per_minute=5, key_prefix="passenger_register"))]
)
def passenger_register(req: PassengerVerifyRequest, db: Session = Depends(get_db)):
    """Registers (or resets) a passenger PIN on the server.

    Also verifies the phone belongs to a real booking so the portal can't be
    used to squat arbitrary phone numbers.
    """
    clean_phone = req.phone.strip()
    existing_booking = db.query(Booking).filter(Booking.contact_phone == clean_phone).first()
    if not existing_booking:
        raise HTTPException(status_code=404, detail="No booking found for this phone number")

    record = db.query(PassengerPin).filter(PassengerPin.phone == clean_phone).first()
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
    db.commit()

    access_token = create_access_token(
        subject=f"passenger:{clean_phone}",
        role="PASSENGER",
        expires_delta=timedelta(hours=12)
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "PASSENGER",
        "phone": clean_phone,
        "full_name": record.full_name or clean_phone,
    }
