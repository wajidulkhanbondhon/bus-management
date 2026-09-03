import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import delete
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import get_current_tenant_id, require_role, apply_tenant_filter
from app.models.bus import Bus, SeatLayout, Seat
from app.models.trip import Trip, SeatLock
from app.models.booking import BookingSeat
from app.models.user import User
from app.schemas.bus import BusCreate, BusUpdate, BusOut, SeatLayoutCreate, SeatLayoutOut


router = APIRouter()


@router.get("", response_model=List[BusOut], include_in_schema=False)
@router.get("/", response_model=List[BusOut])
async def list_buses(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT", "VIEWER"]))
):
    query = db.query(Bus).filter(Bus.status != "DELETED")
    query = apply_tenant_filter(query, Bus, current_user, tenant_id)
    return await query.all()


@router.post("", response_model=BusOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=BusOut, status_code=status.HTTP_201_CREATED)
async def create_bus(
    req: BusCreate,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    # Ensure seat_layout_id exists in database; if not found, clear it to prevent foreign key error
    if req.seat_layout_id:
        layout = await db.query(SeatLayout).filter(SeatLayout.id == req.seat_layout_id).first()
        if not layout:
            req.seat_layout_id = None

    # Check if a bus with the same bus_number exists under the same fleet / bus name
    existing_bus = await db.query(Bus).filter(
        Bus.bus_number == req.bus_number,
        Bus.bus_name == req.bus_name
    ).first()
    if existing_bus:
        if existing_bus.status != "DELETED":
            raise HTTPException(status_code=400, detail=f"Bus number '{req.bus_number}' already exists under '{req.bus_name}'")
        else:
            existing_bus.status = req.status or "ACTIVE"
            existing_bus.bus_name = req.bus_name
            existing_bus.operator = req.operator
            existing_bus.reg_number = req.reg_number
            existing_bus.capacity = req.capacity
            existing_bus.bus_type = req.bus_type
            existing_bus.notes = req.notes
            existing_bus.seat_layout_id = req.seat_layout_id
            existing_bus_id = existing_bus.id
            if tenant_id:
                existing_bus.tenant_id = tenant_id
            await db.commit()
            return await db.query(Bus).filter(Bus.id == existing_bus_id).first()

    # Check reg_number
    existing_reg = await db.query(Bus).filter(Bus.reg_number == req.reg_number).first()
    if existing_reg:
        if existing_reg.status != "DELETED":
            raise HTTPException(status_code=400, detail=f"Registration number '{req.reg_number}' already exists")
        else:
            existing_reg.status = req.status or "ACTIVE"
            existing_reg.bus_name = req.bus_name
            existing_reg.bus_number = req.bus_number
            existing_reg.operator = req.operator
            existing_reg.capacity = req.capacity
            existing_reg.bus_type = req.bus_type
            existing_reg.notes = req.notes
            existing_reg.seat_layout_id = req.seat_layout_id
            existing_reg_id = existing_reg.id
            if tenant_id:
                existing_reg.tenant_id = tenant_id
            await db.commit()
            return await db.query(Bus).filter(Bus.id == existing_reg_id).first()

    bus_data = req.model_dump()
    if tenant_id and "tenant_id" not in bus_data:
        bus_data["tenant_id"] = tenant_id
    if "id" not in bus_data or not bus_data["id"]:
        bus_data["id"] = str(uuid.uuid4())
    bus_id = bus_data["id"]
    try:
        bus = Bus(**bus_data)
        db.add(bus)
        await db.commit()
        return await db.query(Bus).filter(Bus.id == bus_id).first()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create bus: {str(e)}")


@router.get("/seat-layouts", response_model=List[SeatLayoutOut])
async def list_seat_layouts(
    db: WrappedAsyncSession = Depends(get_db)
):
    all_layouts = await db.query(SeatLayout).order_by(SeatLayout.created_at.desc() if hasattr(SeatLayout, 'created_at') else SeatLayout.id.desc()).all()
    active_layouts = [l for l in all_layouts if not (l.description and l.description.startswith("[DELETED"))]

    # Pre-fetch buses count for each layout
    active_buses = await db.query(Bus).filter(Bus.status != "DELETED").all()
    bus_count_map = {}
    for b in active_buses:
        if b.seat_layout_id:
            bus_count_map[b.seat_layout_id] = bus_count_map.get(b.seat_layout_id, 0) + 1

    result = []
    for l in active_layouts:
        layout_dict = SeatLayoutOut.model_validate(l)
        layout_dict.assigned_buses_count = bus_count_map.get(l.id, 0)
        result.append(layout_dict)

    return result


@router.post("/seat-layouts", response_model=SeatLayoutOut, status_code=status.HTTP_201_CREATED)
async def create_seat_layout(
    req: SeatLayoutCreate,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    layout = SeatLayout(**req.model_dump())
    db.add(layout)
    await db.commit()
    await db.refresh(layout)
    return layout


@router.delete("/seat-layouts/{layout_id}")
async def delete_seat_layout(
    layout_id: str,
    to_recycle_bin: bool = Query(True, alias="toRecycleBin"),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "OPERATOR"]))
):
    layout = await db.query(SeatLayout).filter(SeatLayout.id == layout_id).first()
    if not layout:
        return {"success": True, "message": "Seat layout already removed"}

    # Unlink any buses using this layout so bus fleet isn't corrupted
    buses = await db.query(Bus).filter(Bus.seat_layout_id == layout_id).all()
    for b in buses:
        b.seat_layout_id = None

    if to_recycle_bin:
        # Soft delete: move to Recycle Bin by tagging description with deleted timestamp
        iso_now = datetime.now(timezone.utc).isoformat()
        clean_desc = layout.description or ""
        if not clean_desc.startswith("[DELETED"):
            layout.description = f"[DELETED:{iso_now}] {clean_desc}".strip()
        await db.commit()
        return {
            "success": True,
            "toRecycleBin": True,
            "message": f"সিট লেআউট '{layout.name}' সফলভাবে রিসাইকেল বিনে পাঠানো হয়েছে।"
        }
    else:
        # Permanent purge
        # 1. Unlink any buses using this layout
        buses = await db.query(Bus).filter(Bus.seat_layout_id == layout_id).all()
        for b in buses:
            b.seat_layout_id = None

        # 2. Clean up seats and any dependent seat locks or booking seats
        seats = await db.query(Seat).filter(Seat.seat_layout_id == layout_id).all()
        seat_ids = [s.id for s in seats]
        if seat_ids:
            await db.execute(delete(SeatLock).where(SeatLock.seat_id.in_(seat_ids)))
            await db.execute(delete(BookingSeat).where(BookingSeat.seat_id.in_(seat_ids)))
            for s in seats:
                await db.delete(s)

        layout_name = layout.name
        await db.delete(layout)
        await db.commit()
        return {
            "success": True,
            "toRecycleBin": False,
            "message": f"সিট লেআউট '{layout_name}' স্থায়ীভাবে চিরতরে মুছে ফেলা হয়েছে।"
        }


@router.get("/{bus_id}", response_model=BusOut)
async def get_bus(
    bus_id: str,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT", "VIEWER"]))
):
    bus = await db.query(Bus).filter(Bus.id == bus_id, Bus.status != "DELETED").first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    return bus


@router.put("/{bus_id}", response_model=BusOut)
async def update_bus(
    bus_id: str,
    req: BusUpdate,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    bus = await db.query(Bus).filter(Bus.id == bus_id, Bus.status != "DELETED").first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    update_data = req.model_dump(exclude_unset=True)
    if "seat_layout_id" in update_data and update_data["seat_layout_id"]:
        layout = await db.query(SeatLayout).filter(SeatLayout.id == update_data["seat_layout_id"]).first()
        if not layout:
            update_data["seat_layout_id"] = None

    for field, value in update_data.items():
        if value is not None:
            setattr(bus, field, value)

    await db.commit()
    return await db.query(Bus).filter(Bus.id == bus.id).first()


@router.delete("/{bus_id}")
async def delete_bus(
    bus_id: str,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    try:
        bus = await db.query(Bus).filter(Bus.id == bus_id).first()
        if not bus or bus.status == "DELETED":
            raise HTTPException(status_code=404, detail="Bus not found")

        bus_name = bus.bus_name
        bus_number = bus.bus_number
        bus.status = "DELETED"
        await db.commit()
        return {"success": True, "message": f"Bus {bus_name} ({bus_number}) deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete bus: {str(e)}")


@router.post("/{bus_id}/restore")
async def restore_bus(
    bus_id: str,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    try:
        bus = await db.query(Bus).filter(Bus.id == bus_id).first()
        if not bus:
            raise HTTPException(status_code=404, detail="Bus not found")
        if bus.status != "DELETED":
            return {"success": True, "message": f"Bus '{bus.bus_name}' is already active"}

        bus_name = bus.bus_name
        bus_number = bus.bus_number
        bus.status = "ACTIVE"
        await db.commit()
        return {"success": True, "message": f"Bus '{bus_name}' ({bus_number}) successfully restored"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to restore bus: {str(e)}")


@router.delete("/{bus_id}/purge")
async def purge_bus(
    bus_id: str,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    try:
        bus = await db.query(Bus).filter(Bus.id == bus_id).first()
        if not bus:
            raise HTTPException(status_code=404, detail="Bus not found")

        bus_name = bus.bus_name
        bus_number = bus.bus_number

        # Unlink any attached trips to protect booking history and avoid FK violation
        attached_trips = await db.query(Trip).filter(Trip.bus_id == bus.id).all()
        for at in attached_trips:
            at.bus_id = None

        # Unlink any attached bus expenses
        try:
            from app.models.finance import BusExpense
            attached_expenses = await db.query(BusExpense).filter(BusExpense.bus_id == bus.id).all()
            for exp in attached_expenses:
                exp.bus_id = None
        except Exception:
            pass

        await db.delete(bus)
        await db.commit()
        return {"success": True, "message": f"Bus '{bus_name}' ({bus_number}) permanently purged from database"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to permanently purge bus: {str(e)}")
