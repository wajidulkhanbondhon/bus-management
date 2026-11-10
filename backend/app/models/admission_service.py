import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.db.types import Money


def _utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class AdmissionFeePreset(Base):
    """Configurable university + unit fee templates for quick counter entry."""
    __tablename__ = "admission_fee_presets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    university_name = Column(String, nullable=False, index=True)
    unit_name = Column(String, nullable=False)
    default_govt_fee = Column(Money, default=0.0, nullable=False)
    default_service_charge = Column(Money, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utc_now)
    updated_at = Column(DateTime, default=_utc_now, onupdate=_utc_now)

    tenant = relationship("Tenant")


class AdmissionOrder(Base):
    """One admission service slip covering 1 or more university form submissions."""
    __tablename__ = "admission_orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    slip_number = Column(String, unique=True, index=True, nullable=False)  # e.g. ADM-20261110-A1B2-0001

    # Student info
    student_name = Column(String, nullable=False, index=True)
    student_phone = Column(String, nullable=False, index=True)
    guardian_phone = Column(String, nullable=True)
    ssc_roll = Column(String, nullable=True)
    hsc_roll = Column(String, nullable=True)
    ssc_board = Column(String, nullable=True)
    hsc_board = Column(String, nullable=True)
    hsc_year = Column(String, nullable=True)
    student_group = Column(String, nullable=True)  # Science / Arts / Commerce / Quota
    notes = Column(Text, nullable=True)

    # Separate accounting totals
    total_govt_fee = Column(Money, default=0.0, nullable=False)
    total_service_charge = Column(Money, default=0.0, nullable=False)
    discount_amount = Column(Money, default=0.0, nullable=False)
    net_payable = Column(Money, default=0.0, nullable=False)
    paid_amount = Column(Money, default=0.0, nullable=False)
    due_amount = Column(Money, default=0.0, nullable=False)
    refunded_amount = Column(Money, default=0.0, nullable=False)

    payment_status = Column(String, default="PAID", index=True)  # PAID, PARTIAL, DUE, REFUNDED, CANCELLED
    order_status = Column(String, default="RECEIVED", index=True)  # RECEIVED, IN_PROGRESS, COMPLETED, CANCELLED

    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=_utc_now, index=True)
    updated_at = Column(DateTime, default=_utc_now, onupdate=_utc_now)
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    tenant = relationship("Tenant")
    created_by = relationship("User", foreign_keys=[created_by_id])
    items = relationship("AdmissionOrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("AdmissionPayment", back_populates="order", cascade="all, delete-orphan")
    ledger_entries = relationship("AdmissionLedgerEntry", back_populates="order")


class AdmissionOrderItem(Base):
    """Individual university/unit form inside an AdmissionOrder slip."""
    __tablename__ = "admission_order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("admission_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    university_name = Column(String, nullable=False)
    unit_name = Column(String, nullable=False)
    govt_fee = Column(Money, default=0.0, nullable=False)
    service_charge = Column(Money, default=0.0, nullable=False)
    subtotal = Column(Money, default=0.0, nullable=False)

    # Application tracking lifecycle
    application_status = Column(String, default="PENDING", index=True)  # PENDING, APPLIED, FAILED, CANCELLED
    portal_user_id = Column(String, nullable=True)
    portal_pin_or_ref = Column(String, nullable=True)
    payment_trx_ref = Column(String, nullable=True)
    applied_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    applied_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utc_now)
    updated_at = Column(DateTime, default=_utc_now, onupdate=_utc_now)

    order = relationship("AdmissionOrder", back_populates="items")
    applied_by = relationship("User", foreign_keys=[applied_by_id])


class AdmissionPayment(Base):
    """Payments and refunds strictly for Admission Service (isolated from Bus payments)."""
    __tablename__ = "admission_payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    order_id = Column(String, ForeignKey("admission_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    receipt_number = Column(String, unique=True, index=True, nullable=False)  # APAY-20261110-XXXX
    payment_type = Column(String, default="PAYMENT", nullable=False, index=True)  # PAYMENT, REFUND
    amount = Column(Money, nullable=False)
    method = Column(String, nullable=False, index=True)  # HAND_CASH, BKASH, NAGAD, ROCKET, BANK_TRANSFER
    transaction_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    received_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=_utc_now, index=True)

    order = relationship("AdmissionOrder", back_populates="payments")
    received_by = relationship("User", foreign_keys=[received_by_id])


class AdmissionLedgerEntry(Base):
    """Separate financial ledger solely for Admission Service accounting."""
    __tablename__ = "admission_ledger_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    entry_number = Column(String, unique=True, index=True, nullable=False)  # ALED-20261110-XXXXX
    entry_type = Column(String, nullable=False, index=True)
    # FORM_SALE, PAYMENT_RECEIVED, DUE_COLLECTED, REFUND_ISSUED, DAY_CLOSING
    order_id = Column(String, ForeignKey("admission_orders.id"), nullable=True, index=True)
    payment_id = Column(String, ForeignKey("admission_payments.id"), nullable=True)
    debit = Column(Money, default=0.0, nullable=False)
    credit = Column(Money, default=0.0, nullable=False)
    payment_method = Column(String, nullable=True, index=True)
    description = Column(Text, nullable=False)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=_utc_now, index=True)

    order = relationship("AdmissionOrder", back_populates="ledger_entries")
    payment = relationship("AdmissionPayment")
    created_by = relationship("User", foreign_keys=[created_by_id])


class AdmissionDayClosing(Base):
    """Separate day closing reconciliation for Admission Service cash & MFS."""
    __tablename__ = "admission_day_closings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    closing_date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    closed_by_id = Column(String, ForeignKey("users.id"), nullable=False)

    total_slips = Column(Integer, default=0, nullable=False)
    total_forms = Column(Integer, default=0, nullable=False)
    expected_govt_fee = Column(Money, default=0.0, nullable=False)
    expected_service_income = Column(Money, default=0.0, nullable=False)
    expected_collected = Column(Money, default=0.0, nullable=False)
    expected_due = Column(Money, default=0.0, nullable=False)
    expected_refunds = Column(Money, default=0.0, nullable=False)

    actual_total_cash = Column(Money, nullable=False)
    cash_difference = Column(Money, nullable=False)
    reconcile_status = Column(String, nullable=False)  # MATCHED, SHORT, EXCESS
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utc_now)

    closed_by = relationship("User", foreign_keys=[closed_by_id])
