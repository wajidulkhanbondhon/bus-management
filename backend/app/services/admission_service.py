import secrets
from datetime import datetime, timezone, date
from typing import Optional, Dict, Any, List
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.db.async_wrapper import WrappedAsyncSession
from app.core.deps import apply_tenant_filter
from app.models.user import User
from app.models.audit import AuditLog
from app.models.admission_service import (
    AdmissionFeePreset,
    AdmissionOrder,
    AdmissionOrderItem,
    AdmissionPayment,
    AdmissionLedgerEntry,
    AdmissionDayClosing,
)
from app.schemas.admission_service import (
    AdmissionOrderCreate,
    AdmissionOrderItemStatusUpdate,
    AdmissionCollectDueRequest,
    AdmissionRefundRequest,
    AdmissionDayClosingRequest,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _f(val: Any) -> float:
    return round(float(val or 0.0), 2)


def _today_bounds(target_date: Optional[date] = None):
    d = target_date or _utc_now().date()
    start = datetime(d.year, d.month, d.day, 0, 0, 0, 0)
    end = datetime(d.year, d.month, d.day, 23, 59, 59, 999999)
    return start, end


async def generate_admission_slip_number(db: WrappedAsyncSession) -> str:
    date_str = _utc_now().strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = await db.query(AdmissionOrder).count()
    return f"ADM-{date_str}-{random_part}-{count + 1:04d}"


async def generate_admission_receipt_number(db: WrappedAsyncSession) -> str:
    date_str = _utc_now().strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = await db.query(AdmissionPayment).count()
    return f"APAY-{date_str}-{random_part}-{count + 1:04d}"


async def generate_admission_ledger_number(db: WrappedAsyncSession) -> str:
    date_str = _utc_now().strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    count = await db.query(AdmissionLedgerEntry).count()
    return f"ALED-{date_str}-{random_part}-{count + 1:05d}"


DEFAULT_PRESETS = [
    {"university_name": "ঢাকা বিশ্ববিদ্যালয় (DU)", "unit_name": "A ইউনিট (বিজ্ঞান)", "default_govt_fee": 1000.0, "default_service_charge": 100.0},
    {"university_name": "ঢাকা বিশ্ববিদ্যালয় (DU)", "unit_name": "B ইউনিট (কলা ও সামাজিক বিজ্ঞান)", "default_govt_fee": 1000.0, "default_service_charge": 100.0},
    {"university_name": "ঢাকা বিশ্ববিদ্যালয় (DU)", "unit_name": "C ইউনিট (ব্যবসায় শিক্ষা)", "default_govt_fee": 1000.0, "default_service_charge": 100.0},
    {"university_name": "রাজশাহী বিশ্ববিদ্যালয় (RU)", "unit_name": "A ইউনিট (মানবিক)", "default_govt_fee": 1320.0, "default_service_charge": 100.0},
    {"university_name": "রাজশাহী বিশ্ববিদ্যালয় (RU)", "unit_name": "B ইউনিট (বাণিজ্য)", "default_govt_fee": 1100.0, "default_service_charge": 100.0},
    {"university_name": "রাজশাহী বিশ্ববিদ্যালয় (RU)", "unit_name": "C ইউনিট (বিজ্ঞান)", "default_govt_fee": 1320.0, "default_service_charge": 100.0},
    {"university_name": "চট্টগ্রাম বিশ্ববিদ্যালয় (CU)", "unit_name": "A ইউনিট (বিজ্ঞান)", "default_govt_fee": 1000.0, "default_service_charge": 100.0},
    {"university_name": "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)", "unit_name": "A ইউনিট (গাণিতিক ও পদার্থ)", "default_govt_fee": 900.0, "default_service_charge": 100.0},
    {"university_name": "গুচ্ছ ভর্তি পরীক্ষা (GST)", "unit_name": "A / B / C ইউনিট", "default_govt_fee": 1500.0, "default_service_charge": 100.0},
    {"university_name": "কৃষি গুচ্ছ (Agri GST)", "unit_name": "সম্মিলিত কৃষি", "default_govt_fee": 1200.0, "default_service_charge": 100.0},
]


async def ensure_default_presets(db: WrappedAsyncSession, tenant_id: Optional[str]):
    q = db.query(AdmissionFeePreset)
    if tenant_id:
        q = q.filter(AdmissionFeePreset.tenant_id == tenant_id)
    count = await q.count()
    if count == 0:
        for p in DEFAULT_PRESETS:
            db.add(AdmissionFeePreset(**p, tenant_id=tenant_id))
        await db.commit()


def _recompute_order_status(order: AdmissionOrder):
    """Derives overall order_status from its child items."""
    items = [i for i in (order.items or []) if i.application_status != "CANCELLED"]
    if not items:
        order.order_status = "CANCELLED"
        return
    statuses = {i.application_status for i in items}
    if statuses == {"APPLIED"}:
        order.order_status = "COMPLETED"
    elif "APPLIED" in statuses:
        order.order_status = "IN_PROGRESS"
    else:
        order.order_status = "RECEIVED"


def _recompute_payment_status(order: AdmissionOrder):
    net = _f(order.net_payable)
    paid = _f(order.paid_amount)
    refunded = _f(order.refunded_amount)
    due = max(0.0, round(net - paid, 2))
    order.due_amount = due
    if order.order_status == "CANCELLED" and refunded >= paid and paid > 0:
        order.payment_status = "REFUNDED"
    elif order.order_status == "CANCELLED":
        order.payment_status = "CANCELLED"
    elif due <= 0.0 and paid > 0:
        order.payment_status = "PAID"
    elif paid > 0:
        order.payment_status = "PARTIAL"
    else:
        order.payment_status = "DUE"


async def create_admission_order_service(
    db: WrappedAsyncSession,
    req: AdmissionOrderCreate,
    current_user: User,
    tenant_id: Optional[str],
    ip_address: str = "127.0.0.1",
) -> AdmissionOrder:
    effective_tenant = current_user.tenant_id or tenant_id

    total_govt = round(sum(_f(i.govt_fee) for i in req.items), 2)
    total_svc = round(sum(_f(i.service_charge) for i in req.items), 2)
    gross = round(total_govt + total_svc, 2)
    discount = min(_f(req.discount_amount), gross)
    net_payable = max(0.0, round(gross - discount, 2))
    paid_amount = min(_f(req.paid_amount), net_payable)
    due_amount = max(0.0, round(net_payable - paid_amount, 2))

    if due_amount <= 0.0:
        pay_status = "PAID"
    elif paid_amount > 0.0:
        pay_status = "PARTIAL"
    else:
        pay_status = "DUE"

    slip_number = await generate_admission_slip_number(db)

    order = AdmissionOrder(
        tenant_id=effective_tenant,
        slip_number=slip_number,
        student_name=req.student_name.strip(),
        student_phone=req.student_phone.strip(),
        guardian_phone=req.guardian_phone.strip() if req.guardian_phone else None,
        ssc_roll=req.ssc_roll.strip() if req.ssc_roll else None,
        hsc_roll=req.hsc_roll.strip() if req.hsc_roll else None,
        ssc_board=req.ssc_board.strip() if req.ssc_board else None,
        hsc_board=req.hsc_board.strip() if req.hsc_board else None,
        hsc_year=req.hsc_year.strip() if req.hsc_year else None,
        student_group=req.student_group.strip() if req.student_group else None,
        notes=req.notes.strip() if req.notes else None,
        total_govt_fee=total_govt,
        total_service_charge=total_svc,
        discount_amount=discount,
        net_payable=net_payable,
        paid_amount=paid_amount,
        due_amount=due_amount,
        refunded_amount=0.0,
        payment_status=pay_status,
        order_status="RECEIVED",
        created_by_id=current_user.id,
    )
    db.add(order)
    await db.flush()

    for item_in in req.items:
        item_sub = round(_f(item_in.govt_fee) + _f(item_in.service_charge), 2)
        item = AdmissionOrderItem(
            order_id=order.id,
            university_name=item_in.university_name.strip(),
            unit_name=item_in.unit_name.strip(),
            govt_fee=_f(item_in.govt_fee),
            service_charge=_f(item_in.service_charge),
            subtotal=item_sub,
            application_status="PENDING",
            remarks=item_in.remarks.strip() if item_in.remarks else None,
        )
        db.add(item)

    # Separate Ledger Entry for Form Sale
    sale_ledger_no = await generate_admission_ledger_number(db)
    db.add(
        AdmissionLedgerEntry(
            tenant_id=effective_tenant,
            entry_number=sale_ledger_no,
            entry_type="FORM_SALE",
            order_id=order.id,
            debit=net_payable,
            credit=0.0,
            payment_method=req.payment_method if paid_amount > 0 else None,
            description=f"Admission Slip {slip_number}: {req.student_name} ({len(req.items)} forms, Govt ৳{total_govt} + Svc ৳{total_svc})",
            created_by_id=current_user.id,
        )
    )

    if paid_amount > 0:
        receipt_no = await generate_admission_receipt_number(db)
        payment = AdmissionPayment(
            tenant_id=effective_tenant,
            order_id=order.id,
            receipt_number=receipt_no,
            payment_type="PAYMENT",
            amount=paid_amount,
            method=req.payment_method.upper(),
            transaction_id=req.transaction_id.strip() if req.transaction_id else None,
            notes=req.payment_notes.strip() if req.payment_notes else "Initial admission form payment",
            received_by_id=current_user.id,
        )
        db.add(payment)
        await db.flush()

        pay_ledger_no = await generate_admission_ledger_number(db)
        db.add(
            AdmissionLedgerEntry(
                tenant_id=effective_tenant,
                entry_number=pay_ledger_no,
                entry_type="PAYMENT_RECEIVED",
                order_id=order.id,
                payment_id=payment.id,
                debit=0.0,
                credit=paid_amount,
                payment_method=req.payment_method.upper(),
                description=f"Payment received for {slip_number} ({receipt_no})",
                created_by_id=current_user.id,
            )
        )

    db.add(
        AuditLog(
            user_id=current_user.id,
            action="ADMISSION_SLIP_CREATED",
            entity="AdmissionOrder",
            entity_id=order.id,
            new_value=f"{slip_number} | forms={len(req.items)} | net={net_payable} | paid={paid_amount}",
            ip_address=ip_address,
        )
    )

    await db.commit()
    return await get_admission_order_by_id(db, order.id)


async def get_admission_order_by_id(db: WrappedAsyncSession, order_id: str) -> Optional[AdmissionOrder]:
    return await (
        db.query(AdmissionOrder)
        .options(selectinload(AdmissionOrder.items), selectinload(AdmissionOrder.payments))
        .filter(AdmissionOrder.id == order_id, AdmissionOrder.deleted_at.is_(None))
        .first()
    )


async def collect_admission_due_service(
    db: WrappedAsyncSession,
    order: AdmissionOrder,
    req: AdmissionCollectDueRequest,
    current_user: User,
) -> AdmissionOrder:
    due = _f(order.due_amount)
    if due <= 0:
        raise ValueError("এই স্লিপে কোনো বকেয়া নেই (No due remaining)")

    collect_amt = min(_f(req.amount), due)
    receipt_no = await generate_admission_receipt_number(db)

    payment = AdmissionPayment(
        tenant_id=order.tenant_id,
        order_id=order.id,
        receipt_number=receipt_no,
        payment_type="PAYMENT",
        amount=collect_amt,
        method=req.method.upper(),
        transaction_id=req.transaction_id.strip() if req.transaction_id else None,
        notes=req.notes.strip() if req.notes else "Due collection",
        received_by_id=current_user.id,
    )
    db.add(payment)
    await db.flush()

    order.paid_amount = round(_f(order.paid_amount) + collect_amt, 2)
    _recompute_payment_status(order)

    ledger_no = await generate_admission_ledger_number(db)
    db.add(
        AdmissionLedgerEntry(
            tenant_id=order.tenant_id,
            entry_number=ledger_no,
            entry_type="DUE_COLLECTED",
            order_id=order.id,
            payment_id=payment.id,
            debit=0.0,
            credit=collect_amt,
            payment_method=req.method.upper(),
            description=f"Due collected for {order.slip_number} ({receipt_no})",
            created_by_id=current_user.id,
        )
    )

    await db.commit()
    return await get_admission_order_by_id(db, order.id)


async def issue_admission_refund_service(
    db: WrappedAsyncSession,
    order: AdmissionOrder,
    req: AdmissionRefundRequest,
    current_user: User,
) -> AdmissionOrder:
    net_paid = round(_f(order.paid_amount) - _f(order.refunded_amount), 2)
    if net_paid <= 0:
        raise ValueError("রিফান্ড করার মতো কোনো পরিশোধিত টাকা নেই")

    refund_amt = min(_f(req.amount), net_paid)
    receipt_no = await generate_admission_receipt_number(db)

    refund_payment = AdmissionPayment(
        tenant_id=order.tenant_id,
        order_id=order.id,
        receipt_number=receipt_no,
        payment_type="REFUND",
        amount=refund_amt,
        method=req.method.upper(),
        notes=f"Refund: {req.reason}",
        received_by_id=current_user.id,
    )
    db.add(refund_payment)
    await db.flush()

    order.refunded_amount = round(_f(order.refunded_amount) + refund_amt, 2)
    if order.refunded_amount >= _f(order.paid_amount):
        order.payment_status = "REFUNDED"
        order.order_status = "CANCELLED"
        for item in order.items:
            if item.application_status == "PENDING":
                item.application_status = "CANCELLED"

    ledger_no = await generate_admission_ledger_number(db)
    db.add(
        AdmissionLedgerEntry(
            tenant_id=order.tenant_id,
            entry_number=ledger_no,
            entry_type="REFUND_ISSUED",
            order_id=order.id,
            payment_id=refund_payment.id,
            debit=refund_amt,
            credit=0.0,
            payment_method=req.method.upper(),
            description=f"Refund for {order.slip_number}: {req.reason}",
            created_by_id=current_user.id,
        )
    )

    await db.commit()
    return await get_admission_order_by_id(db, order.id)


async def update_order_item_status_service(
    db: WrappedAsyncSession,
    item: AdmissionOrderItem,
    order: AdmissionOrder,
    req: AdmissionOrderItemStatusUpdate,
    current_user: User,
) -> AdmissionOrder:
    item.application_status = req.application_status
    if req.portal_user_id is not None:
        item.portal_user_id = req.portal_user_id.strip() or None
    if req.portal_pin_or_ref is not None:
        item.portal_pin_or_ref = req.portal_pin_or_ref.strip() or None
    if req.payment_trx_ref is not None:
        item.payment_trx_ref = req.payment_trx_ref.strip() or None
    if req.remarks is not None:
        item.remarks = req.remarks.strip() or None

    if req.application_status == "APPLIED":
        item.applied_by_id = current_user.id
        item.applied_at = _utc_now()

    _recompute_order_status(order)
    _recompute_payment_status(order)
    await db.commit()
    return await get_admission_order_by_id(db, order.id)


async def get_admission_accounts_summary(
    db: WrappedAsyncSession,
    current_user: User,
    tenant_id: Optional[str],
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> Dict[str, Any]:
    """Isolated financial summary solely for Admission Service."""
    order_q = db.query(AdmissionOrder).options(selectinload(AdmissionOrder.items)).filter(
        AdmissionOrder.deleted_at.is_(None),
        AdmissionOrder.order_status != "CANCELLED",
    )
    order_q = apply_tenant_filter(order_q, AdmissionOrder, current_user, tenant_id)
    if date_from:
        start, _ = _today_bounds(date_from)
        order_q = order_q.filter(AdmissionOrder.created_at >= start)
    if date_to:
        _, end = _today_bounds(date_to)
        order_q = order_q.filter(AdmissionOrder.created_at <= end)

    orders: List[AdmissionOrder] = await order_q.all()

    total_slips = len(orders)
    total_forms = sum(len([i for i in o.items if i.application_status != "CANCELLED"]) for o in orders)
    pending_forms = sum(len([i for i in o.items if i.application_status == "PENDING"]) for o in orders)
    applied_forms = sum(len([i for i in o.items if i.application_status == "APPLIED"]) for o in orders)

    total_govt_fee = round(sum(_f(o.total_govt_fee) for o in orders), 2)
    total_service_charge = round(sum(_f(o.total_service_charge) for o in orders), 2)
    total_discount = round(sum(_f(o.discount_amount) for o in orders), 2)
    total_net_payable = round(sum(_f(o.net_payable) for o in orders), 2)
    total_due = round(sum(_f(o.due_amount) for o in orders), 2)

    # Payments breakdown in date range
    pay_q = db.query(AdmissionPayment)
    pay_q = apply_tenant_filter(pay_q, AdmissionPayment, current_user, tenant_id)
    if date_from:
        start, _ = _today_bounds(date_from)
        pay_q = pay_q.filter(AdmissionPayment.created_at >= start)
    if date_to:
        _, end = _today_bounds(date_to)
        pay_q = pay_q.filter(AdmissionPayment.created_at <= end)
    payments: List[AdmissionPayment] = await pay_q.all()

    method_breakdown: Dict[str, float] = {
        "HAND_CASH": 0.0,
        "BKASH": 0.0,
        "NAGAD": 0.0,
        "ROCKET": 0.0,
        "BANK_TRANSFER": 0.0,
    }
    total_collected = 0.0
    total_refunded = 0.0

    for p in payments:
        amt = _f(p.amount)
        m = (p.method or "HAND_CASH").upper()
        if p.payment_type == "REFUND":
            total_refunded += amt
            if m in method_breakdown:
                method_breakdown[m] = round(method_breakdown[m] - amt, 2)
        else:
            total_collected += amt
            method_breakdown[m] = round(method_breakdown.get(m, 0.0) + amt, 2)

    net_cash_collected = round(total_collected - total_refunded, 2)
    net_service_profit = max(0.0, round(total_service_charge - total_discount, 2))

    # University-wise summary
    uni_map: Dict[str, Dict[str, Any]] = {}
    for o in orders:
        for it in o.items:
            if it.application_status == "CANCELLED":
                continue
            key = it.university_name
            if key not in uni_map:
                uni_map[key] = {
                    "university_name": key,
                    "forms_count": 0,
                    "applied_count": 0,
                    "pending_count": 0,
                    "govt_fee_total": 0.0,
                    "service_charge_total": 0.0,
                    "subtotal": 0.0,
                }
            uni_map[key]["forms_count"] += 1
            if it.application_status == "APPLIED":
                uni_map[key]["applied_count"] += 1
            elif it.application_status == "PENDING":
                uni_map[key]["pending_count"] += 1
            uni_map[key]["govt_fee_total"] = round(uni_map[key]["govt_fee_total"] + _f(it.govt_fee), 2)
            uni_map[key]["service_charge_total"] = round(uni_map[key]["service_charge_total"] + _f(it.service_charge), 2)
            uni_map[key]["subtotal"] = round(uni_map[key]["subtotal"] + _f(it.subtotal), 2)

    return {
        "total_slips": total_slips,
        "total_forms": total_forms,
        "pending_forms": pending_forms,
        "applied_forms": applied_forms,
        "total_govt_fee": total_govt_fee,
        "total_service_charge": total_service_charge,
        "total_discount": total_discount,
        "net_service_profit": net_service_profit,
        "total_net_payable": total_net_payable,
        "total_collected": round(total_collected, 2),
        "total_refunded": round(total_refunded, 2),
        "net_cash_collected": net_cash_collected,
        "total_due": total_due,
        "method_breakdown": method_breakdown,
        "university_breakdown": sorted(uni_map.values(), key=lambda x: x["forms_count"], reverse=True),
    }


async def submit_admission_day_closing_service(
    db: WrappedAsyncSession,
    req: AdmissionDayClosingRequest,
    current_user: User,
    tenant_id: Optional[str],
) -> AdmissionDayClosing:
    effective_tenant = current_user.tenant_id or tenant_id
    target_d = date.fromisoformat(req.closing_date)
    summary = await get_admission_accounts_summary(db, current_user, effective_tenant, target_d, target_d)

    expected_collected = _f(summary["net_cash_collected"])
    actual_cash = _f(req.actual_total_cash)
    diff = round(actual_cash - expected_collected, 2)
    if abs(diff) < 0.01:
        status_str = "MATCHED"
    elif diff < 0:
        status_str = "SHORT"
    else:
        status_str = "EXCESS"

    closing = AdmissionDayClosing(
        tenant_id=effective_tenant,
        closing_date=req.closing_date,
        closed_by_id=current_user.id,
        total_slips=summary["total_slips"],
        total_forms=summary["total_forms"],
        expected_govt_fee=summary["total_govt_fee"],
        expected_service_income=summary["net_service_profit"],
        expected_collected=expected_collected,
        expected_due=summary["total_due"],
        expected_refunds=summary["total_refunded"],
        actual_total_cash=actual_cash,
        cash_difference=diff,
        reconcile_status=status_str,
        notes=req.notes,
    )
    db.add(closing)

    ledger_no = await generate_admission_ledger_number(db)
    db.add(
        AdmissionLedgerEntry(
            tenant_id=effective_tenant,
            entry_number=ledger_no,
            entry_type="DAY_CLOSING",
            debit=0.0,
            credit=actual_cash,
            payment_method="HAND_CASH",
            description=f"Admission Day Closing ({req.closing_date}): Status={status_str}, Expected ৳{expected_collected}, Actual ৳{actual_cash}",
            created_by_id=current_user.id,
        )
    )

    await db.commit()
    await db.refresh(closing)
    return closing


async def get_admission_dashboard_summary(
    db: WrappedAsyncSession,
    current_user: User,
    tenant_id: Optional[str],
) -> Dict[str, Any]:
    """Combined Today + All-time summary for the main Dashboard widget."""
    today = _utc_now().date()
    today_summary = await get_admission_accounts_summary(db, current_user, tenant_id, today, today)
    overall_summary = await get_admission_accounts_summary(db, current_user, tenant_id, None, None)

    recent_q = (
        db.query(AdmissionOrder)
        .options(selectinload(AdmissionOrder.items))
        .filter(AdmissionOrder.deleted_at.is_(None))
    )
    recent_q = apply_tenant_filter(recent_q, AdmissionOrder, current_user, tenant_id)
    recent_orders = await recent_q.order_by(AdmissionOrder.created_at.desc()).limit(5).all()

    return {
        "today": today_summary,
        "overall": overall_summary,
        "recent_slips": [
            {
                "id": o.id,
                "slip_number": o.slip_number,
                "student_name": o.student_name,
                "student_phone": o.student_phone,
                "forms_count": len(o.items),
                "net_payable": _f(o.net_payable),
                "paid_amount": _f(o.paid_amount),
                "due_amount": _f(o.due_amount),
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in recent_orders
        ],
    }

