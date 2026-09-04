import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.db.types import Money


class BusRoute(Base):
    __tablename__ = "bus_routes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    route_name = Column(String, nullable=False)  # "Rajshahi to Dhaka (Admission Express)"
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    distance_km = Column(Float, nullable=True)
    est_duration = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    tenant = relationship("Tenant", back_populates="routes")
    stops = relationship("TripStop", back_populates="route", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="route")


class TripStop(Base):
    __tablename__ = "trip_stops"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    route_id = Column(String, ForeignKey("bus_routes.id", ondelete="CASCADE"), nullable=False)
    stop_name = Column(String, nullable=False)
    sequence_no = Column(Integer, nullable=False)
    fare_offset = Column(Float, default=0.0)

    # Relationships
    route = relationship("BusRoute", back_populates="stops")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    trip_code = Column(String, unique=True, index=True, nullable=False)  # "TRIP-20260827-001"
    bus_id = Column(String, ForeignKey("buses.id"), nullable=True)
    route_id = Column(String, ForeignKey("bus_routes.id"), nullable=False)
    departure_date = Column(DateTime, nullable=False, index=True)
    departure_time = Column(DateTime, nullable=False)
    arrival_est = Column(DateTime, nullable=True)
    trip_bus_type = Column(String, nullable=True)  # "MALE", "FEMALE", "MIXED"
    status = Column(String, default="SCHEDULED", index=True)  # "SCHEDULED", "BOARDING", "ON_ROUTE", "COMPLETED", "CANCELLED"
    base_price = Column(Money, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    tenant = relationship("Tenant", back_populates="trips")
    bus = relationship("Bus", back_populates="trips", lazy="selectin")
    route = relationship("BusRoute", back_populates="trips", lazy="selectin")
    fare_rules = relationship("FareRule", back_populates="trip", cascade="all, delete-orphan", lazy="selectin")
    seat_holds = relationship("SeatHold", back_populates="trip", cascade="all, delete-orphan")
    seat_locks = relationship("SeatLock", back_populates="trip", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="trip")


class FareRule(Base):
    __tablename__ = "fare_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    fare_zone_id = Column(String, ForeignKey("fare_zones.id"), nullable=False)
    custom_price = Column(Money, nullable=False)

    __table_args__ = (UniqueConstraint("trip_id", "fare_zone_id", name="uq_trip_fare_zone"),)

    # Relationships
    trip = relationship("Trip", back_populates="fare_rules")
    fare_zone = relationship("FareZone", back_populates="fare_rules")


class SeatHold(Base):
    __tablename__ = "seat_holds"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    seat_id = Column(String, ForeignKey("seats.id", ondelete="CASCADE"), nullable=False)
    staff_id = Column(String, nullable=False)
    hold_token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    __table_args__ = (UniqueConstraint("trip_id", "seat_id", name="uq_trip_seat_hold"),)

    # Relationships
    trip = relationship("Trip", back_populates="seat_holds")
    seat = relationship("Seat", back_populates="seat_holds")


class SeatLock(Base):
    __tablename__ = "seat_locks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    seat_id = Column(String, ForeignKey("seats.id", ondelete="CASCADE"), nullable=False)
    lock_type = Column(String, default="TEMPORARY")  # "PERMANENT", "TEMPORARY"
    reason = Column(String, default="OTHER")         # "EMERGENCY", "VIP", "STAFF", "RESERVED", "MAINTENANCE"
    notes = Column(Text, nullable=True)
    locked_by = Column(String, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    trip = relationship("Trip", back_populates="seat_locks")
    seat = relationship("Seat", back_populates="seat_locks")

class SupervisorAssignment(Base):
    __tablename__ = "supervisor_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    supervisor_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    status = Column(String, default="ASSIGNED")  # "ASSIGNED", "ACTIVE", "COMPLETED", "CANCELLED"
    notes = Column(Text, nullable=True)

    trip = relationship("Trip")
    supervisor = relationship("User", foreign_keys=[supervisor_id])
