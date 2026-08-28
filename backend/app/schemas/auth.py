from typing import Optional, List
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    tenant_id: Optional[str] = None
    full_name: str
    email: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    tenant_id: Optional[str] = None
    discount_limit: float = 0.0


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: str
    is_active: bool
    permissions: List[str] = []

    class Config:
        from_attributes = True
