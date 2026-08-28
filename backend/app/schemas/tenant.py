from typing import Optional
from pydantic import BaseModel


class TenantBase(BaseModel):
    name: str
    slug: str
    subdomain: Optional[str] = None
    logo_url: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    plan_tier: str = "PRO"
    commission_rate: float = 0.0


class TenantCreate(TenantBase):
    pass


class TenantOut(TenantBase):
    id: str
    is_active: bool

    class Config:
        from_attributes = True
