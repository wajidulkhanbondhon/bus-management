from datetime import date, datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy import or_
from sqlalchemy.orm import selectinload

from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import (
    require_role,
    get_current_tenant_id,
    apply_tenant_filter,
)
from app.models.user import User
from app.models.admission_service import (
    AdmissionFeePreset,
    AdmissionOrder,
    AdmissionOrderItem,
    AdmissionLedgerEntry,
    AdmissionDayClosing,
)
from app.schemas.admission_service import (
    AdmissionFeePresetCreate,
    AdmissionFeePresetUpdate,
    AdmissionFeePresetOut,
    AdmissionOrderCreate,
    AdmissionOrderOut,
    AdmissionOrderItemStatusUpdate,
    AdmissionCollectDueRequest,
    AdmissionRefundRequest,
    AdmissionLedgerEntryOut,
    AdmissionDayClosingRequest,
    AdmissionDayClosingOut,
)
from app.services.admission_service import (
    ensure_default_presets,
    create_admission_order_service,
    get_admission_order_by_id,
    collect_admission_due_service,
    issue_admission_refund_service,
    update_order_item_status_service,
    get_admission_accounts_summary,
    submit_admission_day_closing_service,
    get_admission_dashboard_summary,
)

router = APIRouter()

STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "ACCOUNTANT", "BOOKING_STAFF", "COUNTER_STAFF", "OPERATOR"]
ACCOUNT_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "ACCOUNTANT"]


def _check_tenant_access(record_tenant_id: Optional[str], current_user: User):
    if current_user.role and current_user.role.name == "SUPER_ADMIN":
        return
    if record_tenant_id and current_user.tenant_id and record_tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Access denied for this tenant")


# ---------------------------------------------------------------------------
# Presets (Universities & Units Fee Setup)
# ---------------------------------------------------------------------------
@router.get("/presets", response_model=List[AdmissionFeePresetOut])
async def list_fee_presets(
    include_inactive: bool = False,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(STAFF_ROLES)),
):
    effective_tenant = current_user.tenant_id or tenant_id
    await ensure_default_presets(db, effective_tenant)

    q = db.query(AdmissionFeePreset)
    q = apply_tenant_filter(q, AdmissionFeePreset, current_user, tenant_id)
    if not include_inactive:
        q = q.filter(AdmissionFeePreset.is_active == True)
    return await q.order_by(AdmissionFeePreset.university_name.asc(), AdmissionFeePreset.unit_name.asc()).all()


@router.post("/presets", response_model=AdmissionFeePresetOut, status_code=status.HTTP_201_CREATED)
async def create_fee_preset(
    req: AdmissionFeePresetCreate,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "ACCOUNTANT"])),
):
    effective_tenant = current_user.tenant_id or tenant_id
    preset = AdmissionFeePreset(**req.model_dump(), tenant_id=effective_tenant)
    db.add(preset)
    await db.commit()
    await db.refresh(preset)
    return preset


@router.put("/presets/{preset_id}", response_model=AdmissionFeePresetOut)
async def update_fee_preset(
    preset_id: str,
    req: AdmissionFeePresetUpdate,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "ACCOUNTANT"])),
):
    preset = await db.query(AdmissionFeePreset).filter(AdmissionFeePreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Fee preset not found")
    _check_tenant_access(preset.tenant_id, current_user)

    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(preset, k, v)
    await db.commit()
    await db.refresh(preset)
    return preset


@router.delete("/presets/{preset_id}")
async def delete_fee_preset(
    preset_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"])),
):
    preset = await db.query(AdmissionFeePreset).filter(AdmissionFeePreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Fee preset not found")
    _check_tenant_access(preset.tenant_id, current_user)
    await db.delete(preset)
    await db.commit()
    return {"status": "deleted", "id": preset_id}


# ---------------------------------------------------------------------------
# Orders / Slips
# ---------------------------------------------------------------------------
@router.post("/orders", response_model=AdmissionOrderOut, status_code=status.HTTP_201_CREATED)
async def create_admission_order(
    req: AdmissionOrderCreate,
    request: Request,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(STAFF_ROLES)),
):
    ip = request.client.host if request.client else "127.0.0.1"
    return await create_admission_order_service(db, req, current_user, tenant_id, ip)


@router.get("/orders", response_model=List[AdmissionOrderOut])
async def list_admission_orders(
    search: Optional[str] = None,
    payment_status: Optional[str] = None,
    order_status: Optional[str] = None,
    has_due: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(STAFF_ROLES)),
):
    q = (
        db.query(AdmissionOrder)
        .options(selectinload(AdmissionOrder.items), selectinload(AdmissionOrder.payments))
        .filter(AdmissionOrder.deleted_at.is_(None))
    )
    q = apply_tenant_filter(q, AdmissionOrder, current_user, tenant_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                AdmissionOrder.slip_number.ilike(term),
                AdmissionOrder.student_name.ilike(term),
                AdmissionOrder.student_phone.ilike(term),
                AdmissionOrder.hsc_roll.ilike(term),
            )
        )
    if payment_status:
        q = q.filter(AdmissionOrder.payment_status == payment_status.upper())
    if order_status:
        q = q.filter(AdmissionOrder.order_status == order_status.upper())
    if has_due is True:
        q = q.filter(AdmissionOrder.due_amount > 0)
    if date_from:
        d_from = date.fromisoformat(date_from)
        q = q.filter(AdmissionOrder.created_at >= datetime(d_from.year, d_from.month, d_from.day, 0, 0, 0))
    if date_to:
        d_to = date.fromisoformat(date_to)
        q = q.filter(AdmissionOrder.created_at <= datetime(d_to.year, d_to.month, d_to.day, 23, 59, 59, 999999))

    return await q.order_by(AdmissionOrder.created_at.desc()).limit(limit).all()


@router.get("/orders/{order_id}", response_model=AdmissionOrderOut)
async def get_admission_order(
    order_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(STAFF_ROLES)),
):
    order = await get_admission_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Admission slip not found")
    _check_tenant_access(order.tenant_id, current_user)
    return order


@router.patch("/items/{item_id}/status", response_model=AdmissionOrderOut)
async def update_order_item_status(
    item_id: str,
    req: AdmissionOrderItemStatusUpdate,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(STAFF_ROLES)),
):
    item = await db.query(AdmissionOrderItem).filter(AdmissionOrderItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Form item not found")
    order = await get_admission_order_by_id(db, item.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Parent order not found")
    _check_tenant_access(order.tenant_id, current_user)
    return await update_order_item_status_service(db, item, order, req, current_user)


@router.post("/orders/{order_id}/collect-due", response_model=AdmissionOrderOut)
async def collect_admission_due(
    order_id: str,
    req: AdmissionCollectDueRequest,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(STAFF_ROLES)),
):
    order = await get_admission_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Admission slip not found")
    _check_tenant_access(order.tenant_id, current_user)
    try:
        return await collect_admission_due_service(db, order, req, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/refund", response_model=AdmissionOrderOut)
async def refund_admission_order(
    order_id: str,
    req: AdmissionRefundRequest,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(ACCOUNT_ROLES)),
):
    order = await get_admission_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Admission slip not found")
    _check_tenant_access(order.tenant_id, current_user)
    try:
        return await issue_admission_refund_service(db, order, req, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/orders/{order_id}")
async def soft_delete_admission_order(
    order_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"])),
):
    order = await get_admission_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Admission slip not found")
    _check_tenant_access(order.tenant_id, current_user)
    order.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    return {"status": "deleted", "id": order_id}


# ---------------------------------------------------------------------------
# Separate Accounting, Ledger, Day Closing & Dashboard Summary
# ---------------------------------------------------------------------------
@router.get("/accounts/summary")
async def admission_accounts_summary(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(STAFF_ROLES)),
) -> Dict[str, Any]:
    d_from = date.fromisoformat(date_from) if date_from else None
    d_to = date.fromisoformat(date_to) if date_to else None
    return await get_admission_accounts_summary(db, current_user, tenant_id, d_from, d_to)


@router.get("/accounts/ledger", response_model=List[AdmissionLedgerEntryOut])
async def admission_accounts_ledger(
    limit: int = Query(150, ge=1, le=500),
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(ACCOUNT_ROLES)),
):
    q = db.query(AdmissionLedgerEntry)
    q = apply_tenant_filter(q, AdmissionLedgerEntry, current_user, tenant_id)
    return await q.order_by(AdmissionLedgerEntry.created_at.desc()).limit(limit).all()


@router.get("/accounts/day-closings", response_model=List[AdmissionDayClosingOut])
async def list_admission_day_closings(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(ACCOUNT_ROLES)),
):
    q = db.query(AdmissionDayClosing)
    q = apply_tenant_filter(q, AdmissionDayClosing, current_user, tenant_id)
    return await q.order_by(AdmissionDayClosing.created_at.desc()).limit(30).all()


@router.post("/accounts/day-closing", response_model=AdmissionDayClosingOut, status_code=status.HTTP_201_CREATED)
async def submit_admission_day_closing(
    req: AdmissionDayClosingRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(ACCOUNT_ROLES)),
):
    return await submit_admission_day_closing_service(db, req, current_user, tenant_id)


@router.get("/dashboard-summary")
async def admission_dashboard_summary(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(STAFF_ROLES)),
) -> Dict[str, Any]:
    return await get_admission_dashboard_summary(db, current_user, tenant_id)

