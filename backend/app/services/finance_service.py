from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.booking import Booking
from app.models.payment import Payment, Refund
from app.models.finance import DayClosing, DayClosingPaymentSummary
from app.schemas.day_closing import SubmitDayClosingRequest


def _day_bounds(date_input: datetime) -> tuple[datetime, datetime]:
    """Build timezone-aware day boundaries (UTC) from a possibly-naive input."""
    if date_input.tzinfo is None:
        date_input = date_input.replace(tzinfo=timezone.utc)
    start_of_day = date_input.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = date_input.replace(hour=23, minute=59, second=59, microsecond=999999)
    return start_of_day, end_of_day


def calculate_day_closing_summary(db: Session, date_input: datetime) -> Dict[str, Any]:
    start_of_day, end_of_day = _day_bounds(date_input)

    # Bookings created in the day window — revenue base.
    bookings = (
        db.query(Booking)
        .filter(
            Booking.created_at >= start_of_day,
            Booking.created_at <= end_of_day,
            Booking.booking_status.in_(["CONFIRMED", "COMPLETED"])
        )
        .all()
    )

    expected_gross = sum(b.gross_amount for b in bookings)
    expected_discount = sum(b.discount_amount for b in bookings)
    expected_net = sum(b.net_amount for b in bookings)
    expected_due = sum(b.due_amount for b in bookings)

    # Payments recorded in the window — even for bookings from prior days.
    payments = (
        db.query(Payment)
        .filter(Payment.created_at >= start_of_day, Payment.created_at <= end_of_day)
        .all()
    )
    expected_collected = sum(p.amount for p in payments)

    # Refunds issued in the window — netted against collections.
    refunds = (
        db.query(Refund)
        .filter(Refund.created_at >= start_of_day, Refund.created_at <= end_of_day)
        .all()
    )
    expected_refunds = sum(r.amount for r in refunds)

    method_totals = {
        "BKASH": {"expected": 0.0, "count": 0},
        "NAGAD": {"expected": 0.0, "count": 0},
        "ROCKET": {"expected": 0.0, "count": 0},
        "HAND_CASH": {"expected": 0.0, "count": 0},
        "BANK_TRANSFER": {"expected": 0.0, "count": 0},
        "OTHER": {"expected": 0.0, "count": 0},
    }
    for p in payments:
        if p.method in method_totals:
            method_totals[p.method]["expected"] += p.amount
            method_totals[p.method]["count"] += 1

    return {
        "date": start_of_day,
        "metrics": {
            "expected_gross_sales": expected_gross,
            "expected_discount": expected_discount,
            "expected_net_sales": expected_net,
            "expected_collected": expected_collected,
            "expected_due": expected_due,
            "expected_refunds": expected_refunds,
            "booking_count": len(bookings),
            "payment_count": len(payments),
        },
        "methods": method_totals
    }


async def submit_day_closing(db: Session, req: SubmitDayClosingRequest, staff_id: str, tenant_id: Optional[str] = None) -> DayClosing:
    # Prevent double-closing the same day (closing_date is unique per row).
    start_of_day, _ = _day_bounds(req.closing_date)
    existing = (
        db.query(DayClosing)
        .filter(DayClosing.closing_date == start_of_day)
        .first()
    )
    if existing:
        raise ValueError(f"Day {start_of_day.date().isoformat()} has already been closed")

    summary = calculate_day_closing_summary(db, req.closing_date)

    cash_diff = 0.0
    payment_summaries = []
    has_short = False
    has_excess = False

    for m in req.method_actuals:
        expected = summary["methods"].get(m.method, {}).get("expected", 0.0)
        diff = round(m.actual_amount - expected, 2)
        status = "MATCHED" if diff == 0 else ("SHORT" if diff < 0 else "EXCESS")
        if status == "SHORT":
            has_short = True
        elif status == "EXCESS":
            has_excess = True

        if m.method == "HAND_CASH":
            cash_diff = diff

        payment_summaries.append(DayClosingPaymentSummary(
            method=m.method,
            expected_amount=expected,
            actual_amount=m.actual_amount,
            difference=diff,
            status=status,
            trx_count=summary["methods"].get(m.method, {}).get("count", 0)
        ))

    overall_status = "SHORT" if has_short else ("EXCESS" if has_excess else "MATCHED")

    closing = DayClosing(
        tenant_id=tenant_id,
        closing_date=start_of_day,
        closed_by_id=staff_id,
        expected_gross_sales=summary["metrics"]["expected_gross_sales"],
        expected_discount=summary["metrics"]["expected_discount"],
        expected_net_sales=summary["metrics"]["expected_net_sales"],
        expected_collected=summary["metrics"]["expected_collected"],
        expected_due=summary["metrics"]["expected_due"],
        expected_refunds=summary["metrics"]["expected_refunds"],
        actual_total_cash=req.actual_total_cash,
        cash_difference=cash_diff,
        reconcile_status=overall_status,
        notes=req.notes,
        summaries=payment_summaries
    )
    db.add(closing)
    await db.commit()
    await db.refresh(closing)
    return closing
