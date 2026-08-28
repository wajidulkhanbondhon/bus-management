from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class PassengerInput(BaseModel):
    passenger_name: str = Field(..., min_length=1)
    passenger_phone: str = Field(..., min_length=8)
    passenger_type: str = "STUDENT"  # "STUDENT", "GUARDIAN", "GUEST"
    gender: str = "FEMALE"           # "MALE", "FEMALE"
    seat_id: str
    admission_id: Optional[str] = None
    institution: Optional[str] = None
    group_category: Optional[str] = None
    address: Optional[str] = None
    guardian_relationship: Optional[str] = None


class CreateBookingRequest(BaseModel):
    trip_id: str
    seats: List[dict]  # [{"seat_id": "...", "fare": 550}]
    passengers: List[PassengerInput]
    discount_type: Optional[str] = "FIXED"
    discount_rate: Optional[float] = 0.0
    discount_reason: Optional[str] = None
    payment_method: str = "HAND_CASH"
    paid_amount: float = 0.0
    transaction_id: Optional[str] = None
    sender_reference: Optional[str] = None
    notes: Optional[str] = None


class CreatePreBookingRequest(BaseModel):
    trip_id: str
    seat_ids: List[str]
    contact_name: str
    contact_phone: str
    passenger_gender: str = "FEMALE"
    is_student: bool = False
    student_admission_id: Optional[str] = None
    notes: Optional[str] = None
    source: str = "ONLINE"


class VerifyTimerRequest(BaseModel):
    booking_id: str
    duration_minutes: int = 15
    passenger_gender: Optional[str] = None
    is_student: Optional[bool] = None
    student_admission_id: Optional[str] = None
    notes: Optional[str] = None


class ConfirmPreBookingPaymentRequest(BaseModel):
    booking_id: str
    payment_method: str = "BKASH"
    paid_amount: Optional[float] = None
    transaction_id: Optional[str] = None
    sender_reference: Optional[str] = None
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: str
    booking_number: str
    trip_id: str
    booking_status: str
    payment_status: str
    source: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    passenger_gender: Optional[str] = None
    is_student: bool
    student_admission_id: Optional[str] = None
    verification_status: str
    verification_notes: Optional[str] = None
    payment_expires_at: Optional[datetime] = None
    gross_amount: float
    discount_amount: float
    net_amount: float
    paid_amount: float
    due_amount: float
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
