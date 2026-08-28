from typing import Dict, Any, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.booking import Booking
from app.models.bus import Bus
from app.models.trip import Trip
from app.models.payment import Payment
from app.models.finance import FinancialLedger
from app.models.user import User

router = APIRouter()


@router.get("/dashboard-kpi")
def get_dashboard_kpi(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "ACCOUNTANT", "VIEWER"]))
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    today_bookings = db.query(Booking).filter(
        Booking.created_at >= today_start,
        Booking.created_at <= today_end,
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED"])
    ).all()

    today_sales = sum(b.net_amount for b in today_bookings)
    today_tickets = sum(len(b.seats) for b in today_bookings)

    today_payments = db.query(Payment).filter(
        Payment.created_at >= today_start,
        Payment.created_at <= today_end
    ).all()
    today_collected = sum(p.amount for p in today_payments)
    today_due = max(0.0, today_sales - today_collected)

    active_buses = db.query(Bus).filter(Bus.status == "ACTIVE").count()
    active_trips = db.query(Trip).filter(
        Trip.departure_date >= today_start,
        Trip.departure_date <= today_end,
        Trip.status.in_(["SCHEDULED", "BOARDING", "ON_ROUTE"])
    ).count()

    return {
        "today_sales": today_sales,
        "today_tickets": today_tickets,
        "today_collected": today_collected,
        "today_due": today_due,
        "active_buses": active_buses,
        "active_trips": active_trips,
        "timestamp": now.isoformat()
    }


@router.get("/financial-ledger")
def get_financial_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]))
) -> List[Dict[str, Any]]:
    entries = db.query(FinancialLedger).order_by(FinancialLedger.created_at.desc()).limit(100).all()
    return [
        {
            "id": e.id,
            "entry_number": e.entry_number,
            "entry_type": e.entry_type,
            "debit": e.debit,
            "credit": e.credit,
            "balance": e.balance,
            "payment_method": e.payment_method,
            "description": e.description,
            "created_at": e.created_at.isoformat()
        }
        for e in entries
    ]
