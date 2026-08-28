from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import require_role
from app.models.payment import Payment, Refund
from app.models.finance import FinancialLedger
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentOut, RefundCreate
from app.services.booking_service import generate_unique_receipt_number, generate_unique_ledger_number


router = APIRouter()


@router.get("/", response_model=List[PaymentOut])
def list_payments(db: Session = Depends(get_db)):
    return db.query(Payment).order_by(Payment.created_at.desc()).limit(100).all()


@router.post("/record", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def record_counter_payment(
    req: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BOOKING_STAFF"]))
):
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    receipt_number = generate_unique_receipt_number(db)
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

    ledger = FinancialLedger(
        entry_number=generate_unique_ledger_number(db),
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

    db.commit()
    db.refresh(payment)
    return payment
