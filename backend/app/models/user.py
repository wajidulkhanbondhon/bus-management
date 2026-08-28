import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.session import Base

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("id", String, primary_key=True, default=lambda: str(uuid.uuid4())),
    Column("role_id", String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False),
    Column("permission_id", String, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False),
)


class Role(Base):
    __tablename__ = "roles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)  # SUPER_ADMIN, ADMIN, MANAGER, BOOKING_STAFF, ACCOUNTANT, VIEWER
    description = Column(String, nullable=True)

    # Relationships
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", back_populates="role")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, index=True, nullable=False)  # e.g. "booking:create"
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    discount_limit = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    role = relationship("Role", back_populates="users")
    created_bookings = relationship("Booking", back_populates="created_by", foreign_keys="Booking.created_by_id")
    received_payments = relationship("Payment", back_populates="received_by")
    applied_discounts = relationship("Discount", back_populates="applied_by", foreign_keys="Discount.applied_by_id")
    approved_discounts = relationship("DiscountApproval", back_populates="approved_by")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    closed_days = relationship("DayClosing", back_populates="closed_by")
    device_sessions = relationship("DeviceSession", back_populates="user")

class DeviceSession(Base):
    __tablename__ = "device_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_type = Column(String, nullable=True)  # "MOBILE", "DESKTOP", "TABLET"
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_blocked = Column(Boolean, default=False)
    last_active_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="device_sessions")
