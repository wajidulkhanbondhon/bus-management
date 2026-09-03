import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.db.types import Money


class Bus(Base):
    __tablename__ = "buses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    bus_name = Column(String, nullable=False)
    bus_number = Column(String, index=True, nullable=False)
    operator = Column(String, default="পরে নির্ধারণ করা হবে (Pending Vendor Allocation)")
    reg_number = Column(String, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    bus_type = Column(String, default="MIXED")  # "MALE", "FEMALE", "MIXED"
    status = Column(String, default="ACTIVE")    # "ACTIVE", "INACTIVE", "MAINTENANCE"
    notes = Column(Text, nullable=True)
    seat_layout_id = Column(String, ForeignKey("seat_layouts.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    tenant = relationship("Tenant", back_populates="buses")
    seat_layout = relationship("SeatLayout", back_populates="buses", lazy="selectin")
    trips = relationship("Trip", back_populates="bus")


class SeatLayout(Base):
    __tablename__ = "seat_layouts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    total_rows = Column(Integer, nullable=False)
    total_cols = Column(Integer, nullable=False)
    total_seats = Column(Integer, nullable=False)
    layout_json = Column(Text, nullable=False)   # JSON string of layout matrix
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    buses = relationship("Bus", back_populates="seat_layout")
    seats = relationship("Seat", back_populates="seat_layout", cascade="all, delete-orphan", lazy="selectin")


class Seat(Base):
    __tablename__ = "seats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seat_layout_id = Column(String, ForeignKey("seat_layouts.id", ondelete="CASCADE"), nullable=False, index=True)
    seat_number = Column(String, nullable=False)  # "A1", "A2", "B1"
    row_index = Column(Integer, nullable=False)
    col_index = Column(Integer, nullable=False)
    seat_type = Column(String, default="STANDARD")     # "STANDARD", "VIP", "STAFF", "RESERVED", "EMERGENCY"
    gender_allowed = Column(String, default="ANY")     # "MALE_ONLY", "FEMALE_ONLY", "ANY"
    fare_zone_id = Column(String, ForeignKey("fare_zones.id"), nullable=True)
    base_fare = Column(Money, default=500.0)
    is_active = Column(Boolean, default=True)

    # Relationships
    seat_layout = relationship("SeatLayout", back_populates="seats")
    fare_zone = relationship("FareZone", back_populates="seats")
    seat_holds = relationship("SeatHold", back_populates="seat", cascade="all, delete-orphan")
    seat_locks = relationship("SeatLock", back_populates="seat", cascade="all, delete-orphan")
    booking_seats = relationship("BookingSeat", back_populates="seat")


class FareZone(Base):
    __tablename__ = "fare_zones"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)  # "VIP Front", "Standard A-E", "Rear Economy"
    description = Column(String, nullable=True)
    default_fare = Column(Money, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    seats = relationship("Seat", back_populates="fare_zone")
    fare_rules = relationship("FareRule", back_populates="fare_zone")
