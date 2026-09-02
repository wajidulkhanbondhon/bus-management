from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from sqlalchemy import func
from app.db.session import get_db
from app.core.deps import get_current_user, require_role, get_current_tenant_id, apply_tenant_filter
from app.models.booking import Booking, BookingSeat
from app.models.bus import Bus
from app.models.trip import Trip
from app.models.payment import Payment
from app.models.finance import FinancialLedger
from app.models.user import User
from app.models.audit import AuditLog

router = APIRouter()


@router.get("/dashboard-kpi")
async def get_dashboard_kpi(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "ACCOUNTANT", "VIEWER"]))
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    # 1. Booking Sales & Tickets aggregated at SQL level
    booking_q = db.query(
        func.coalesce(func.sum(Booking.net_amount), 0.0).label("sales")
    ).filter(
        Booking.created_at >= today_start,
        Booking.created_at <= today_end,
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED"])
    )
    booking_q = apply_tenant_filter(booking_q, Booking, current_user, tenant_id)
    today_sales = float(booking_q.scalar() or 0.0)

    ticket_q = db.query(func.count(BookingSeat.id)).join(Booking).filter(
        Booking.created_at >= today_start,
        Booking.created_at <= today_end,
        Booking.booking_status.in_(["CONFIRMED", "COMPLETED"])
    )
    ticket_q = apply_tenant_filter(ticket_q, Booking, current_user, tenant_id)
    today_tickets = int(ticket_q.scalar() or 0)

    # 2. Payments collected today
    payment_q = db.query(
        func.coalesce(func.sum(Payment.amount), 0.0)
    ).join(Booking, Payment.booking_id == Booking.id).filter(
        Payment.created_at >= today_start,
        Payment.created_at <= today_end
    )
    payment_q = apply_tenant_filter(payment_q, Booking, current_user, tenant_id)
    today_collected = float(payment_q.scalar() or 0.0)
    today_due = max(0.0, today_sales - today_collected)

    # 3. Active buses & trips
    bus_q = db.query(func.count(Bus.id)).filter(Bus.status == "ACTIVE")
    bus_q = apply_tenant_filter(bus_q, Bus, current_user, tenant_id)
    active_buses = int(bus_q.scalar() or 0)

    trip_q = db.query(func.count(Trip.id)).filter(
        Trip.departure_date >= today_start,
        Trip.departure_date <= today_end,
        Trip.status.in_(["SCHEDULED", "BOARDING", "ON_ROUTE"])
    )
    trip_q = apply_tenant_filter(trip_q, Trip, current_user, tenant_id)
    active_trips = int(trip_q.scalar() or 0)

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
async def get_financial_ledger(
    request: Request,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]))
) -> List[Dict[str, Any]]:
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="LEDGER_VIEWED",
        entity="FinancialLedger",
        entity_id="ALL",
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "Unknown")
    )
    db.add(audit_entry)
    await db.commit()
    
    query = db.query(FinancialLedger).outerjoin(Booking, FinancialLedger.booking_id == Booking.id)
    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        query = query.filter(Booking.tenant_id == current_user.tenant_id)
    elif tenant_id:
        query = query.filter(Booking.tenant_id == tenant_id)

    entries = await query.order_by(FinancialLedger.created_at.desc()).limit(100).all()
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
