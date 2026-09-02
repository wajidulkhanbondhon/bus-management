import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.db.types import Money


class MarketingCoupon(Base):
    __tablename__ = "marketing_coupons"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)  # e.g. "ADMISSION100"
    title = Column(String, nullable=False)
    campaign_channel = Column(String, default="FACEBOOK")  # "FACEBOOK", "CAMPUS_BOOTH", "LEAFLET", "STUDENT_REFERRAL", "SMS_CAMPAIGN", "SPECIAL_EVENT"
    discount_type = Column(String, default="FIXED")  # "FIXED", "PERCENTAGE"
    discount_value = Column(Money, nullable=False)
    min_purchase_amount = Column(Money, nullable=True)
    max_discount_limit = Column(Money, nullable=True)
    target_university = Column(String, default="ALL")
    expiry_date = Column(String, nullable=True)
    max_usage_limit = Column(Integer, default=500)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    tenant = relationship("Tenant", backref="coupons")
