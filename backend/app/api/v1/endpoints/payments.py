from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import require_role, get_current_tenant_id, apply_tenant_filter
from app.core.square_guard import square_double_layer_guard
from app.models.payment import Payment, Refund
from app.models.booking import Booking
from app.models.finance import FinancialLedger
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentOut, RefundCreate, RefundOut
from app.services.booking_service import (
    generate_unique_receipt_number,
    generate_unique_ledger_number,
    create_refund_service
)


router = APIRouter()


@router.get("", response_model=List[PaymentOut], include_in_schema=False)
@router.get("/", response_model=List[PaymentOut])
async def list_payments(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "MANAGER", "VIEWER"]))
):
    query = db.query(Payment).join(Booking, Payment.booking_id == Booking.id)
    query = apply_tenant_filter(query, Booking, current_user, tenant_id)
    return await query.order_by(Payment.created_at.desc()).limit(100).all()


@router.post("/record", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
async def record_counter_payment(
    req: PaymentCreate,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BOOKING_STAFF"]))
):
    booking = await db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Enforce tenant scoping
    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        if booking.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied for this tenant's booking")

    receipt_number = await generate_unique_receipt_number(db)
    payment = Payment(
        receipt_number=receipt_number,
        booking_id=booking.id,
        amount=req.amount,
        method=req.method,
        received_by_id=current_user.id,
        notes=req.notes
    )
    db.add(payment)

    new_paid = booking.paid_amount + req.amount
    new_due = max(0.0, booking.net_amount - new_paid)
    booking.paid_amount = new_paid
    booking.due_amount = new_due
    booking.payment_status = "PAID" if new_due == 0 else "PARTIALLY_PAID"

    ledger_no = await generate_unique_ledger_number(db)
    ledger = FinancialLedger(
        entry_number=ledger_no,
        entry_type="PAYMENT_RECEIVED",
        debit=0.0,
        credit=req.amount,
        balance=new_due,
        payment_method=req.method,
        booking_id=booking.id,
        payment_id=payment.id,
        description=f"Collection for {booking.booking_number} (Receipt: {receipt_number})"
    )
    db.add(ledger)

    await db.commit()
    await db.refresh(payment)
    return payment


@router.post("/refund", response_model=RefundOut, status_code=status.HTTP_201_CREATED)
async def issue_refund(
    req: RefundCreate,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(square_double_layer_guard)
):
    # Verify booking exists and belongs to the caller's tenant
    booking = await db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        if booking.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied for this tenant's booking")

    try:
        return await create_refund_service(
            db=db,
            booking_id=req.booking_id,
            amount=req.amount,
            method=req.method,
            reason=req.reason,
            staff_id=current_user.id,
            payment_id=req.payment_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/refunds", response_model=List[RefundOut])
async def list_refunds(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "MANAGER"]))
):
    query = db.query(Refund).join(Booking, Refund.booking_id == Booking.id)
    query = apply_tenant_filter(query, Booking, current_user, tenant_id)
    return await query.order_by(Refund.created_at.desc()).limit(100).all()
