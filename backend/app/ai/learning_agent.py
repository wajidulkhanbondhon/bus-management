import logging
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.knowledge import KnowledgeRule
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def run_autonomous_learning():
    """
    Periodically scans the database for insights and automatically creates KnowledgeRules.
    This runs every 4 hours.
    """
    db = SessionLocal()
    try:
        now = datetime.now()
        four_hours_ago = now - timedelta(hours=4)
        
        # Example Insight 1: Recent Booking Volume
        recent_bookings = db.query(Booking).filter(Booking.created_at >= four_hours_ago).count()
        if recent_bookings > 50:
            content = f"গত ৪ ঘণ্টায় {recent_bookings} টি নতুন বুকিং হয়েছে। এটি একটি হাই-ডিমান্ড সময়।"
            _save_learned_rule(db, "recent booking surge", content, ["SUPER_ADMIN", "MANAGER"])

        # Example Insight 2: Total Revenue in last 4 hours
        payments = db.query(Payment).filter(Payment.created_at >= four_hours_ago).all()
        total_revenue = sum(float(p.amount) for p in payments)
        if total_revenue > 0:
            content = f"গত ৪ ঘণ্টায় মোট রেভিনিউ হয়েছে ৳{total_revenue:,.2f}।"
            _save_learned_rule(db, "recent revenue 4 hours", content, ["SUPER_ADMIN"])
            
        logger.info("Autonomous learning scan completed successfully.")
        
    except Exception as e:
        logger.error(f"Error in autonomous learning: {e}")
    finally:
        db.close()

def _save_learned_rule(db: Session, topic: str, content: str, roles: list):
    """Saves a generated rule if it doesn't already exist for today"""
    # Simple check to prevent spamming the same insight
    today = datetime.now().date()
    existing = db.query(KnowledgeRule).filter(KnowledgeRule.topic_keywords == topic).first()
    
    if existing:
        existing.content = content
        existing.allowed_roles = roles
    else:
        new_rule = KnowledgeRule(
            topic_keywords=topic,
            content=content,
            added_by="AUTONOMOUS_AI"
        )
        new_rule.allowed_roles = roles
        db.add(new_rule)
        
    db.commit()
