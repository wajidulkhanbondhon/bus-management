from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.tenant import Tenant

security_scheme = HTTPBearer(auto_error=False)


def get_current_tenant_id(
    x_tenant_id: Optional[str] = Header(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[str]:
    """Resolves current Tenant ID from Header or JWT token."""
    if x_tenant_id:
        return x_tenant_id
    if credentials:
        payload = decode_token(credentials.credentials)
        if payload and "tenant_id" in payload:
            return payload["tenant_id"]
    return None


def get_current_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user



def get_optional_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[User]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        return None
    return db.query(User).filter(User.id == payload["sub"], User.is_active == True).first()


def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name == "SUPER_ADMIN":
            return current_user
        if current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden for role [{current_user.role.name}]"
            )
        return current_user
    return role_checker


def apply_tenant_filter(query, model, current_user: User, requested_tenant_id: Optional[str] = None):
    """
    Safely applies tenant scoping to a SQLAlchemy query.
    - SUPER_ADMIN can view all tenants or optionally filter by requested_tenant_id.
    - All other roles are strictly scoped to current_user.tenant_id.
    """
    if current_user.role and current_user.role.name == "SUPER_ADMIN":
        if requested_tenant_id:
            return query.filter(model.tenant_id == requested_tenant_id)
        return query

    tenant_id = current_user.tenant_id
    if not tenant_id:
        return query.filter(model.tenant_id == "__NONE__")
    return query.filter(model.tenant_id == tenant_id)


