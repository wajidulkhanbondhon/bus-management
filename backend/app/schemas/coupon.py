from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CouponBase(BaseModel):
    code: str = Field(..., example="ADMISSION100")
    title: str = Field(..., example="ভর্তি পরীক্ষা স্পেশাল ফেসবুক ক্যাম্পেইন")
    campaign_channel: str = Field("FACEBOOK", example="FACEBOOK")
    discount_type: str = Field("FIXED", example="FIXED")  # FIXED, PERCENTAGE
    discount_value: float = Field(..., gt=0, example=100.0)
    min_purchase_amount: Optional[float] = Field(None, ge=0)
    max_discount_limit: Optional[float] = Field(None, ge=0)
    target_university: str = Field("ALL", example="ALL")
    expiry_date: Optional[str] = None
    max_usage_limit: int = Field(500, gt=0)
    is_active: bool = Field(True)
    notes: Optional[str] = None


class CouponCreate(CouponBase):
    tenant_id: Optional[str] = None


class CouponUpdate(BaseModel):
    title: Optional[str] = None
    campaign_channel: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase_amount: Optional[float] = None
    max_discount_limit: Optional[float] = None
    target_university: Optional[str] = None
    expiry_date: Optional[str] = None
    max_usage_limit: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class CouponOut(CouponBase):
    id: str
    tenant_id: Optional[str] = None
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
