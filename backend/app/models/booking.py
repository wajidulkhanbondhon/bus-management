import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.db.types import Money


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    booking_number = Column(String, unique=True, index=True, nullable=False)  # "BK-20260827-A3F2-10042"
    trip_id = Column(String, ForeignKey("trips.id"), nullable=False, index=True)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    booking_status = Column(String, default="CONFIRMED", index=True)
    # "PRE_BOOKED", "VERIFICATION_PENDING", "PAYMENT_TIMER_ACTIVE", "HELD", "CONFIRMED", "CANCELLED", "COMPLETED", "EXPIRED"
    payment_status = Column(String, default="UNPAID", index=True)
    # "UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"

    source = Column(String, default="COUNTER")  # "ONLINE", "COUNTER"
    contact_name = Column(String, nullable=True)
    contact_phone = Column(String, index=True, nullable=True)
    passenger_gender = Column(String, nullable=True)
    is_student = Column(Boolean, default=False)
    student_admission_id = Column(String, nullable=True)
    verification_status = Column(String, default="UNVERIFIED")  # "UNVERIFIED", "VERIFIED", "REJECTED"
    verified_at = Column(DateTime, nullable=True)
    verified_by_staff_id = Column(String, nullable=True)
    verification_notes = Column(Text, nullable=True)
    payment_expires_at = Column(DateTime, nullable=True, index=True)

    # Phase 2: Booking Approval Workflow Fields
    hold_duration_hours = Column(Float, default=1.0)
    allow_partial_payment = Column(Boolean, default=False)
    min_advance_amount = Column(Float, default=0.0)
    allow_due = Column(Boolean, default=False)
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    gross_amount = Column(Money, nullable=False)
    discount_amount = Column(Money, default=0.0)
    net_amount = Column(Money, nullable=False)
    paid_amount = Column(Money, default=0.0)
    due_amount = Column(Money, nullable=False)

    # Journey Type & Boarding Points
    journey_type = Column(String, default="ROUND_TRIP")  # "ROUND_TRIP", "OUTBOUND_ONLY", "RETURN_ONLY", "ASYMMETRIC"
    boarding_point = Column(String, nullable=True)
    dropping_point = Column(String, nullable=True)
    passenger_legs_json = Column(Text, nullable=True)  # JSON mapping per-seat leg directions

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    tenant = relationship("Tenant", back_populates="bookings")
    trip = relationship("Trip", back_populates="bookings")
    created_by = relationship("User", back_populates="created_bookings", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    seats = relationship("BookingSeat", back_populates="booking", cascade="all, delete-orphan")
    passengers = relationship("BookingPassenger", back_populates="booking", cascade="all, delete-orphan")
    discounts = relationship("Discount", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="booking")
    refunds = relationship("Refund", back_populates="booking")
    ledger_entries = relationship("FinancialLedger", back_populates="booking")


class BookingSeat(Base):
    __tablename__ = "booking_seats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    seat_id = Column(String, ForeignKey("seats.id"), nullable=False, index=True)
    fare_snapshot = Column(Money, nullable=False)

    __table_args__ = (UniqueConstraint("booking_id", "seat_id", name="uq_booking_seat"),)

    # Relationships
    booking = relationship("Booking", back_populates="seats")
    seat = relationship("Seat", back_populates="booking_seats")


class BookingPassenger(Base):
    __tablename__ = "booking_passengers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=True)
    guardian_id = Column(String, ForeignKey("guardians.id"), nullable=True)
    passenger_name = Column(String, nullable=False)
    passenger_phone = Column(String, nullable=False)
    passenger_type = Column(String, nullable=False)  # "STUDENT", "GUARDIAN", "GUEST"
    gender = Column(String, nullable=False)          # "MALE", "FEMALE"
    seat_number = Column(String, nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="passengers")
    student = relationship("Student", back_populates="booking_passengers")
    guardian = relationship("Guardian", back_populates="booking_passengers")


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    discount_type = Column(String, default="FIXED")  # "FIXED", "PERCENTAGE"
    discount_rate = Column(Money, nullable=False)
    discount_amount = Column(Money, nullable=False)
    reason = Column(String, nullable=False)
    applied_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    booking = relationship("Booking", back_populates="discounts")
    applied_by = relationship("User", back_populates="applied_discounts", foreign_keys=[applied_by_id])
    approvals = relationship("DiscountApproval", back_populates="discount", cascade="all, delete-orphan")


class DiscountApproval(Base):
    __tablename__ = "discount_approvals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    discount_id = Column(String, ForeignKey("discounts.id", ondelete="CASCADE"), nullable=False)
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="APPROVED")  # "APPROVED", "REJECTED", "PENDING"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    discount = relationship("Discount", back_populates="approvals")
    approved_by = relationship("User", back_populates="approved_discounts")
