import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.session import Base


class FinancialLedger(Base):
    __tablename__ = "financial_ledgers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    entry_number = Column(String, unique=True, index=True, nullable=False)  # "LED-20260827-C7D4-00892"
    entry_type = Column(String, nullable=False, index=True)
    # "SALE", "DISCOUNT", "PAYMENT_RECEIVED", "REFUND_ISSUED", "ADJUSTMENT", "DAY_CLOSING_TRANSFER"
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    payment_method = Column(String, nullable=True, index=True)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=True)
    payment_id = Column(String, ForeignKey("payments.id"), nullable=True)
    refund_id = Column(String, ForeignKey("refunds.id"), nullable=True)
    day_closing_id = Column(String, ForeignKey("day_closings.id"), nullable=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    booking = relationship("Booking", back_populates="ledger_entries")
    payment = relationship("Payment", back_populates="ledger_entries")
    refund = relationship("Refund", back_populates="ledger_entries")
    day_closing = relationship("DayClosing", back_populates="ledger_entries")


class DayClosing(Base):
    __tablename__ = "day_closings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    closing_date = Column(DateTime, unique=True, index=True, nullable=False)
    closed_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_reopened = Column(Boolean, default=False)
    reopened_reason = Column(Text, nullable=True)
    reopened_by_id = Column(String, nullable=True)

    expected_gross_sales = Column(Float, nullable=False)
    expected_discount = Column(Float, nullable=False)
    expected_net_sales = Column(Float, nullable=False)
    expected_collected = Column(Float, nullable=False)
    expected_due = Column(Float, nullable=False)
    expected_refunds = Column(Float, default=0.0)

    actual_total_cash = Column(Float, nullable=False)
    cash_difference = Column(Float, nullable=False)
    reconcile_status = Column(String, nullable=False)  # "MATCHED", "SHORT", "EXCESS"

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="day_closings")
    closed_by = relationship("User", back_populates="closed_days")
    summaries = relationship("DayClosingPaymentSummary", back_populates="day_closing", cascade="all, delete-orphan")
    ledger_entries = relationship("FinancialLedger", back_populates="day_closing")


class DayClosingPaymentSummary(Base):
    __tablename__ = "day_closing_payment_summaries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    day_closing_id = Column(String, ForeignKey("day_closings.id", ondelete="CASCADE"), nullable=False)
    method = Column(String, nullable=False)  # "BKASH", "NAGAD", "HAND_CASH", etc.
    expected_amount = Column(Float, nullable=False)
    actual_amount = Column(Float, nullable=False)
    difference = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # "MATCHED", "SHORT", "EXCESS"
    trx_count = Column(Integer, default=0)

    # Relationships
    day_closing = relationship("DayClosing", back_populates="summaries")

class BusExpense(Base):
    __tablename__ = "bus_expenses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bus_id = Column(String, ForeignKey("buses.id"), nullable=False, index=True)
    trip_id = Column(String, ForeignKey("trips.id"), nullable=True, index=True)
    category = Column(String, nullable=False)  # "FUEL", "TOLL", "MAINTENANCE", "STAFF_ALLOWANCE", "OTHER"
    amount = Column(Float, nullable=False)
    expense_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    description = Column(Text, nullable=True)
    reported_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="PENDING")  # "PENDING", "APPROVED", "REJECTED"
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    bus = relationship("Bus")
    trip = relationship("Trip")
    reported_by = relationship("User", foreign_keys=[reported_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])

class StaffExpense(Base):
    __tablename__ = "staff_expenses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    staff_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, nullable=False)  # "SALARY", "SNACKS", "TRANSPORT", "BONUS", "OTHER"
    amount = Column(Float, nullable=False)
    expense_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    description = Column(Text, nullable=True)
    status = Column(String, default="PENDING")  # "PENDING", "PAID"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    staff = relationship("User", foreign_keys=[staff_id])
