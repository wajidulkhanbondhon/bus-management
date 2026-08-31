from sqlalchemy import Column, String, Integer, Date, Float
from app.db.session import Base
from datetime import date
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class DailyAnalytics(Base):
    __tablename__ = "daily_analytics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    date = Column(Date, unique=True, index=True, default=date.today)
    total_visitors = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    total_tickets_sold = Column(Integer, default=0)
