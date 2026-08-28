from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user
from app.core.rate_limiter import rate_limit
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserOut

router = APIRouter()


@router.post("/login", response_model=Token, dependencies=[Depends(rate_limit(requests_per_minute=5, key_prefix="login"))])
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip(), User.is_active == True).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.name,
        tenant_id=user.tenant_id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
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
