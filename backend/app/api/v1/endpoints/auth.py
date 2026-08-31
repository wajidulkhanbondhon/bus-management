from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user
from app.core.rate_limiter import rate_limit
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserOut, VerifyOTPRequest
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
