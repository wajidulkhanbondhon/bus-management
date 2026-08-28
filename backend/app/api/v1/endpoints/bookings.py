from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_tenant_id, require_role
from app.core.rate_limiter import rate_limit
from app.models.booking import Booking
from app.models.user import User
from app.schemas.booking import (
    CreateBookingRequest,
    CreatePreBookingRequest,
    VerifyTimerRequest,
    ConfirmPreBookingPaymentRequest,
    BookingOut
)
from app.services.booking_service import (
    create_counter_booking,
    create_pre_booking,
    verify_and_start_timer,
    confirm_pre_booking_payment
)

router = APIRouter()


@router.get("/", response_model=List[BookingOut])
def list_bookings(
    status: Optional[str] = None,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if tenant_id:
        query = query.filter(Booking.tenant_id == tenant_id)
    if status:
        query = query.filter(Booking.booking_status == status)
    return query.order_by(Booking.created_at.desc()).limit(100).all()


@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    req: CreateBookingRequest,
    request: Request,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    try:
        client_ip = request.client.host if request.client else None
        return create_counter_booking(db, req, current_user.id, tenant_id, client_ip)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/pre-booking", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def pre_book(
    req: CreatePreBookingRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    try:
        return create_pre_booking(db, req, tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-timer", response_model=BookingOut)
def verify_booking(
    req: VerifyTimerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    try:
        return verify_and_start_timer(db, req, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/confirm-payment",
    response_model=BookingOut,
    dependencies=[Depends(rate_limit(requests_per_minute=10, key_prefix="pay"))]
)
def confirm_payment(
    req: ConfirmPreBookingPaymentRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT"]))
):
    try:
        return confirm_pre_booking_payment(db, req, current_user.id, idempotency_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/online-requests", response_model=List[BookingOut])
def list_online_requests(
    status_filter: Optional[str] = None,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Booking).filter(
        Booking.booking_status.in_(["PRE_BOOKED", "PAYMENT_TIMER_ACTIVE", "CONFIRMED"])
    )
    if tenant_id:
        query = query.filter(Booking.tenant_id == tenant_id)
    if status_filter and status_filter != "ALL":
        query = query.filter(Booking.booking_status == status_filter)
    return query.order_by(Booking.created_at.desc()).all()


@router.get("/track/{query_str}", response_model=Optional[BookingOut])
def track_booking(query_str: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(
        (Booking.booking_number == query_str.strip()) |
        (Booking.contact_phone == query_str.strip()) |
        (Booking.id == query_str.strip())
    ).order_by(Booking.created_at.desc()).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking_by_id(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: str,
    reason: str = "Customer Request",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.booking_status = "CANCELLED"
    booking.notes = f"{booking.notes or ''} [Cancelled: {reason}]"
    db.commit()
    db.refresh(booking)
    return booking

