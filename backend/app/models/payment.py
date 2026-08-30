import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator
from cryptography.fernet import Fernet
from app.core.config import settings
from app.db.session import Base

try:
    fernet = Fernet(settings.FERNET_SECRET_KEY.encode())
except Exception:
    # Fallback or error if key is invalid, though config should have valid default
    fernet = None

class EncryptedString(TypeDecorator):
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None and fernet:
            return fernet.encrypt(value.encode()).decode()
        return value

    def process_result_value(self, value, dialect):
        if value is not None and fernet:
            try:
                return fernet.decrypt(value.encode()).decode()
            except Exception:
                return value
        return value


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    receipt_number = Column(String, unique=True, index=True, nullable=False)  # "RCT-20260827-B1E9-0042"
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False)  # "BKASH", "NAGAD", "ROCKET", "HAND_CASH", "BANK_TRANSFER"
    received_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    booking = relationship("Booking", back_populates="payments")
    received_by = relationship("User", back_populates="received_payments")
    transactions = relationship("PaymentTransaction", back_populates="payment", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="payment")
    ledger_entries = relationship("FinancialLedger", back_populates="payment")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_id = Column(String, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(EncryptedString, nullable=False)  # Encrypted at rest
    sender_reference = Column(String, nullable=True)
    verification_status = Column(String, default="VERIFIED")     # "PENDING", "VERIFIED", "REJECTED"
    verified_at = Column(DateTime, nullable=True)
    raw_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    payment = relationship("Payment", back_populates="transactions")


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    refund_number = Column(String, unique=True, index=True, nullable=False)  # "RF-20260827-E5A1-0012"
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False, index=True)
    payment_id = Column(String, ForeignKey("payments.id"), nullable=True)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    processed_by_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    booking = relationship("Booking", back_populates="refunds")
    payment = relationship("Payment", back_populates="refunds")
    ledger_entries = relationship("FinancialLedger", back_populates="refund")
