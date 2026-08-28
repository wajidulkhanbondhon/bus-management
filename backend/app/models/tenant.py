import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)                         # e.g. "Hanif Enterprise", "RU Admission Transit"
    slug = Column(String, unique=True, index=True, nullable=False)# e.g. "hanif", "ru-transit"
    subdomain = Column(String, unique=True, index=True)           # e.g. "hanif.yourbus.com"
    logo_url = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    plan_tier = Column(String, default="PRO")                     # "BASIC", "PRO", "ENTERPRISE"
    commission_rate = Column(Float, default=0.0)                  # Platform SaaS fee %
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    buses = relationship("Bus", back_populates="tenant", cascade="all, delete-orphan")
    routes = relationship("BusRoute", back_populates="tenant", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="tenant", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="tenant", cascade="all, delete-orphan")
    day_closings = relationship("DayClosing", back_populates="tenant", cascade="all, delete-orphan")
