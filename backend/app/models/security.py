from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class BlockedIP(Base):
    __tablename__ = "security_blocked_ips"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    ip_address = Column(String(50), unique=True, index=True, nullable=False)
    reason = Column(String, nullable=True)
    is_blocked = Column(Boolean, default=True) # If False, it's a warning state or has been pardoned
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    blocked_by = Column(String, nullable=True) # E.g., 'SECURITY_AI' or 'ADMIN'

class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    event_type = Column(String(50), index=True, nullable=False) # E.g., RATE_LIMIT_EXCEEDED, FAILED_LOGIN, SQL_INJECTION_ATTEMPT
    ip_address = Column(String(50), index=True, nullable=False)
    user_id = Column(String(36), nullable=True, index=True)
    details = Column(Text, nullable=True)
    severity = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
