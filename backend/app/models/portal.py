import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.db.session import Base

class LandingConfig(Base):
    __tablename__ = "landing_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    map_visible = Column(Boolean, default=True)
    animations_active = Column(Boolean, default=True)
    live_status_visible = Column(Boolean, default=True)
    university_portal_visible = Column(Boolean, default=True)
    custom_notice = Column(Text, nullable=True)
    primary_color = Column(String, default="#3b82f6") # Default Tailwind blue-500
    language_default = Column(String, default="bn")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class UniversityCircular(Base):
    __tablename__ = "university_circulars"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    university_name = Column(String, nullable=False)
    circular_title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    apply_deadline = Column(DateTime, nullable=True)
    exam_date = Column(DateTime, nullable=True)
    document_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
