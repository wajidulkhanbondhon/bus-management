from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.session import get_db
from app.db.async_wrapper import WrappedAsyncSession
from app.core.security import decode_token
from app.core.casbin_enforcer import check_permission
from app.core.logger import logger
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def extract_token_from_request(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = None
) -> Optional[str]:
    """
    Extracts authentication token from:
    1. Authorization Bearer header (for mobile / API callers)
    2. HttpOnly 'access_token' cookie (for secure browser sessions)
    """
    if credentials and credentials.credentials:
        return credentials.credentials
    
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()

    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token

    return None


async def get_current_tenant_id(
    request: Request,
    x_tenant_id: Optional[str] = Header(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[str]:
    """Resolves current Tenant ID from Header or JWT token."""
    if x_tenant_id:
        return x_tenant_id
    token = extract_token_from_request(request, credentials)
    if token:
        payload = decode_token(token)
        if payload and "tenant_id" in payload:
            return payload["tenant_id"]
    return None


async def get_current_user(
    request: Request,
    db: WrappedAsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> User:
    token = extract_token_from_request(request, credentials)
    if not token:
        logger.warning("auth_failed_missing_token", path=request.url.path, client_ip=request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        logger.warning("auth_failed_invalid_token", path=request.url.path)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = await db.query(User).filter((User.id == user_id) | (User.email == user_id), User.is_active == True).first()
    if not user:
        logger.warning("auth_user_not_found", user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_optional_user(
    request: Request,
    db: WrappedAsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[User]:
    token = extract_token_from_request(request, credentials)
    if not token:
        return None
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        return None
    return await db.query(User).filter(User.id == payload["sub"], User.is_active == True).first()


def require_role(allowed_roles: List[str]):
    """Enforces role-based permissions with Casbin hierarchy fallback."""
    async def role_checker(request: Request, current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.name if current_user.role else "PASSENGER"
        
        # Super admin always bypasses
        if user_role == "SUPER_ADMIN":
            return current_user
            
        if user_role in allowed_roles:
            return current_user
            
        # Check Casbin enforcer for path-level permission
        method = request.method
        path = request.url.path
        if check_permission(user_role, path, method):
            return current_user

        logger.warn(
            "access_forbidden",
            user_id=current_user.id,
            role=user_role,
            path=path,
            method=method,
            required_roles=allowed_roles
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden for role [{user_role}]"
        )
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
