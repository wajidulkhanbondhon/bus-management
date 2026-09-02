from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import get_current_tenant_id, require_role, apply_tenant_filter, get_optional_user, get_current_user
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
    confirm_pre_booking_payment,
    cancel_booking_service,
    reject_pre_booking_service,
    SeatAlreadyBookedException,
)

router = APIRouter()


@router.get("", response_model=List[BookingOut], include_in_schema=False)
@router.get("/", response_model=List[BookingOut])
async def list_bookings(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    has_due: Optional[bool] = None,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT", "VIEWER"]))
):
    query = db.query(Booking)
    query = apply_tenant_filter(query, Booking, current_user, tenant_id)
    if status:
        query = query.filter(Booking.booking_status == status)
    if payment_status:
        query = query.filter(Booking.payment_status == payment_status)
    if has_due:
        query = query.filter(Booking.due_amount > 0)
    return await query.order_by(Booking.created_at.desc()).limit(100).all()


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    req: CreateBookingRequest,
    request: Request,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    try:
        client_ip = request.client.host if request.client else None
        effective_tenant = current_user.tenant_id if (current_user.role and current_user.role.name != "SUPER_ADMIN") else (tenant_id or current_user.tenant_id)
        return create_counter_booking(db, req, current_user.id, effective_tenant, client_ip)
    except SeatAlreadyBookedException as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/pre-booking", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def pre_book(
    req: CreatePreBookingRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "VIEWER"]))
):
    try:
        # Non-super-admin staff are always scoped to their own tenant.
        effective_tenant = current_user.tenant_id if (current_user.role and current_user.role.name != "SUPER_ADMIN") else (tenant_id or current_user.tenant_id)
        return create_pre_booking(db, req, effective_tenant)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-timer", response_model=BookingOut)
async def verify_booking(
    req: VerifyTimerRequest,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    try:
        booking = await db.query(Booking).filter(Booking.id == req.booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if current_user.role and current_user.role.name != "SUPER_ADMIN":
            if booking.tenant_id != current_user.tenant_id:
                raise HTTPException(status_code=403, detail="Access denied for this tenant's booking")
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
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT"]))
):
    try:
        return confirm_pre_booking_payment(db, req, current_user.id, idempotency_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/online-requests", response_model=List[BookingOut])
async def list_online_requests(
    status_filter: Optional[str] = None,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    query = db.query(Booking).filter(
        Booking.booking_status.in_(["PRE_BOOKED", "PAYMENT_TIMER_ACTIVE", "CONFIRMED"])
    )
    query = apply_tenant_filter(query, Booking, current_user, tenant_id)
    if status_filter and status_filter != "ALL":
        query = query.filter(Booking.booking_status == status_filter)
    return await query.order_by(Booking.created_at.desc()).all()


@router.get("/track/{query_str}", response_model=Optional[BookingOut], dependencies=[Depends(rate_limit(requests_per_minute=10, key_prefix="track"))])
async def track_booking(
    query_str: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    booking = db.query(Booking).filter(
        (Booking.booking_number == query_str.strip()) |
        (Booking.contact_phone == query_str.strip()) |
        (Booking.id == query_str.strip())
    ).order_by(Booking.created_at.desc()).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Staff may track any booking within their tenant scope; anonymous callers
    # may only retrieve their own booking via its public booking number.
    if current_user is None:
        if query_str.strip() != booking.booking_number:
            raise HTTPException(status_code=403, detail="Tracking by phone/ID requires authentication")
    else:
        if current_user.role and current_user.role.name != "SUPER_ADMIN":
            if booking.tenant_id != current_user.tenant_id:
                raise HTTPException(status_code=403, detail="Access denied for this tenant's booking")
    return booking


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking_by_id(
    booking_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT", "VIEWER"]))
):
    booking = await db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        if booking.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied for this tenant's booking")
    return booking


@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: str,
    reason: str = "Customer Request",
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    booking = await db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        if booking.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied for this tenant's booking")
    try:
        return cancel_booking_service(db, booking_id, current_user.id, reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{booking_id}/reject", response_model=BookingOut)
async def reject_pre_booking(
    booking_id: str,
    reason: str = "Verification Failed",
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF"]))
):
    booking = await db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        if booking.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied for this tenant's booking")
    try:
        return reject_pre_booking_service(db, booking_id, current_user.id, reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
