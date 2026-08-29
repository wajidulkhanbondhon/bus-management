from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class PermissionOut(BaseModel):
    id: str
    code: str
    name: str
    category: str

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: List[str] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None


class RoleOut(RoleBase):
    id: str
    permissions: List[PermissionOut] = []

    class Config:
        from_attributes = True


class StaffCounts(BaseModel):
    createdBookings: int = 0
    receivedPayments: int = 0


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role_id: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[str] = None
    discount_limit: float = 0.0


class UserCreate(UserBase):
    password: str = "staff1234"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    discount_limit: Optional[float] = None
    password: Optional[str] = None


class UserDetailOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    discount_limit: float
    created_at: datetime
    role: Optional[RoleOut] = None
    tenant_id: Optional[str] = None
    _count: StaffCounts = StaffCounts()

    class Config:
        from_attributes = True
