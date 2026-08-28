import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.session import Base

class MessageLog(Base):
    __tablename__ = "message_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    recipient_name = Column(String, nullable=True)
    recipient_phone = Column(String, nullable=False, index=True)
    recipient_email = Column(String, nullable=True)
    channel = Column(String, nullable=False)  # "WHATSAPP", "SMS", "EMAIL"
    message_type = Column(String, nullable=False)  # "MARKETING", "TRANSACTIONAL", "ALERT"
    content = Column(Text, nullable=False)
    status = Column(String, default="PENDING")  # "PENDING", "SENT", "FAILED", "DELIVERED"
    sent_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant")
    sent_by = relationship("User", foreign_keys=[sent_by_id])
