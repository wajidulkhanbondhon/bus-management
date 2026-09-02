from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


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

class VerifyOTPRequest(BaseModel):
    user_id: str
    otp: str


class PassengerVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    pin: str = Field(..., min_length=4, max_length=4)
    name: Optional[str] = Field(None, max_length=100)


class PassengerVerifyResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "PASSENGER"
    phone: str
    full_name: str
    requires_pin_setup: bool = False


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
