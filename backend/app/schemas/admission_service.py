from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Fee Presets (Universities & Units)
# ---------------------------------------------------------------------------
class AdmissionFeePresetCreate(BaseModel):
    university_name: str = Field(..., min_length=1, max_length=200)
    unit_name: str = Field(..., min_length=1, max_length=150)
    default_govt_fee: float = Field(0.0, ge=0)
    default_service_charge: float = Field(0.0, ge=0)
    is_active: bool = True
    notes: Optional[str] = None


class AdmissionFeePresetUpdate(BaseModel):
    university_name: Optional[str] = Field(None, min_length=1, max_length=200)
    unit_name: Optional[str] = Field(None, min_length=1, max_length=150)
    default_govt_fee: Optional[float] = Field(None, ge=0)
    default_service_charge: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class AdmissionFeePresetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: Optional[str] = None
    university_name: str
    unit_name: str
    default_govt_fee: float
    default_service_charge: float
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Order Items (Individual University Forms inside a Slip)
# ---------------------------------------------------------------------------
class AdmissionOrderItemCreate(BaseModel):
    university_name: str = Field(..., min_length=1, max_length=200)
    unit_name: str = Field(..., min_length=1, max_length=150)
    govt_fee: float = Field(0.0, ge=0)
    service_charge: float = Field(0.0, ge=0)
    remarks: Optional[str] = None


class AdmissionOrderItemStatusUpdate(BaseModel):
    application_status: str = Field(..., pattern="^(PENDING|APPLIED|FAILED|CANCELLED)$")
    portal_user_id: Optional[str] = None
    portal_pin_or_ref: Optional[str] = None
    payment_trx_ref: Optional[str] = None
    remarks: Optional[str] = None


class AdmissionOrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    university_name: str
    unit_name: str
    govt_fee: float
    service_charge: float
    subtotal: float
    application_status: str
    portal_user_id: Optional[str] = None
    portal_pin_or_ref: Optional[str] = None
    payment_trx_ref: Optional[str] = None
    applied_by_id: Optional[str] = None
    applied_at: Optional[datetime] = None
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Payments & Refunds (Isolated from Bus Payments)
# ---------------------------------------------------------------------------
class AdmissionPaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    receipt_number: str
    payment_type: str
    amount: float
    method: str
    transaction_id: Optional[str] = None
    notes: Optional[str] = None
    received_by_id: Optional[str] = None
    created_at: datetime


class AdmissionCollectDueRequest(BaseModel):
    amount: float = Field(..., gt=0)
    method: str = Field("HAND_CASH", min_length=2, max_length=40)
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class AdmissionRefundRequest(BaseModel):
    amount: float = Field(..., gt=0)
    method: str = Field("HAND_CASH", min_length=2, max_length=40)
    reason: str = Field(..., min_length=2, max_length=500)


# ---------------------------------------------------------------------------
# Orders / Slips
# ---------------------------------------------------------------------------
class AdmissionOrderCreate(BaseModel):
    student_name: str = Field(..., min_length=1, max_length=200)
    student_phone: str = Field(..., min_length=6, max_length=30)
    guardian_phone: Optional[str] = None
    ssc_roll: Optional[str] = None
    hsc_roll: Optional[str] = None
    ssc_board: Optional[str] = None
    hsc_board: Optional[str] = None
    hsc_year: Optional[str] = None
    student_group: Optional[str] = None
    notes: Optional[str] = None

    items: List[AdmissionOrderItemCreate] = Field(..., min_length=1)
    discount_amount: float = Field(0.0, ge=0)
    paid_amount: float = Field(0.0, ge=0)
    payment_method: str = Field("HAND_CASH", min_length=2, max_length=40)
    transaction_id: Optional[str] = None
    payment_notes: Optional[str] = None


class AdmissionOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: Optional[str] = None
    slip_number: str
    student_name: str
    student_phone: str
    guardian_phone: Optional[str] = None
    ssc_roll: Optional[str] = None
    hsc_roll: Optional[str] = None
    ssc_board: Optional[str] = None
    hsc_board: Optional[str] = None
    hsc_year: Optional[str] = None
    student_group: Optional[str] = None
    notes: Optional[str] = None

    total_govt_fee: float
    total_service_charge: float
    discount_amount: float
    net_payable: float
    paid_amount: float
    due_amount: float
    refunded_amount: float

    payment_status: str
    order_status: str
    created_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    items: List[AdmissionOrderItemOut] = []
    payments: List[AdmissionPaymentOut] = []


# ---------------------------------------------------------------------------
# Separate Accounting, Ledger & Day Closing
# ---------------------------------------------------------------------------
class AdmissionLedgerEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entry_number: str
    entry_type: str
    order_id: Optional[str] = None
    payment_id: Optional[str] = None
    debit: float
    credit: float
    payment_method: Optional[str] = None
    description: str
    created_by_id: Optional[str] = None
    created_at: datetime


class AdmissionDayClosingRequest(BaseModel):
    closing_date: str = Field(..., pattern="^\\d{4}-\\d{2}-\\d{2}$")
    actual_total_cash: float = Field(..., ge=0)
    notes: Optional[str] = None


class AdmissionDayClosingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    closing_date: str
    closed_by_id: str
    total_slips: int
    total_forms: int
    expected_govt_fee: float
    expected_service_income: float
    expected_collected: float
    expected_due: float
    expected_refunds: float
    actual_total_cash: float
    cash_difference: float
    reconcile_status: str
    notes: Optional[str] = None
    created_at: datetime

