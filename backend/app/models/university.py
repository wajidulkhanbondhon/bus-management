import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, nullable=False)  # "রাজশাহী বিশ্ববিদ্যালয়"
    name_en = Column(String, nullable=False)  # "University of Rajshahi"
    apply_status = Column(String, default="OPEN")  # "OPEN", "UPCOMING", "CLOSED"
    deadline = Column(String, nullable=True)  # "2026-09-15"
    exam_date = Column(String, nullable=True)  # "2026-10-05"
    units = Column(JSON, default=list)  # ["A ইউনিট", "B ইউনিট", "C ইউনিট"]
    fees = Column(String, nullable=True)  # "৳৫০০ - ৳৮০০"
    requirements = Column(JSON, default=list)  # list of strings
    how_to_apply = Column(Text, nullable=True)
    location = Column(String, nullable=False)  # "রাজশাহী"
    circular_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    tenant = relationship("Tenant", backref="universities")
