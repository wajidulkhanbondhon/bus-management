from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class PaymentCreate(BaseModel):
    booking_id: str
    amount: float
    method: str
    transaction_id: Optional[str] = None
    sender_reference: Optional[str] = None
    notes: Optional[str] = None


class RefundCreate(BaseModel):
    booking_id: str
    payment_id: Optional[str] = None
    amount: float
    method: str
    reason: str


class PaymentOut(BaseModel):
    id: str
    receipt_number: str
    booking_id: str
    amount: float
    method: str
    created_at: datetime

    class Config:
        from_attributes = True


class RefundOut(BaseModel):
    id: str
    refund_number: str
    booking_id: str
    payment_id: Optional[str] = None
    amount: float
    method: str
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True
