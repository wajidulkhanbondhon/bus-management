from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_tenant_id, require_role, apply_tenant_filter
from app.models.bus import Bus, SeatLayout, Seat
from app.models.user import User
from app.schemas.bus import BusCreate, BusUpdate, BusOut, SeatLayoutCreate, SeatLayoutOut


router = APIRouter()


@router.get("", response_model=List[BusOut], include_in_schema=False)
@router.get("/", response_model=List[BusOut])
def list_buses(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT", "VIEWER"]))
):
    query = db.query(Bus).filter(Bus.status != "DELETED")
    query = apply_tenant_filter(query, Bus, current_user, tenant_id)
    return query.all()


@router.post("", response_model=BusOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=BusOut, status_code=status.HTTP_201_CREATED)
def create_bus(
    req: BusCreate,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    # Check if a bus with the same bus_number exists
    existing_bus = db.query(Bus).filter(Bus.bus_number == req.bus_number).first()
    if existing_bus:
        if existing_bus.status != "DELETED":
            raise HTTPException(status_code=400, detail=f"Bus number '{req.bus_number}' already exists")
        else:
            existing_bus.status = req.status or "ACTIVE"
            existing_bus.bus_name = req.bus_name
            existing_bus.operator = req.operator
            existing_bus.reg_number = req.reg_number
            existing_bus.capacity = req.capacity
            existing_bus.bus_type = req.bus_type
            existing_bus.notes = req.notes
            existing_bus.seat_layout_id = req.seat_layout_id
            if tenant_id:
                existing_bus.tenant_id = tenant_id
            db.commit()
            db.refresh(existing_bus)
            return existing_bus

    # Check reg_number
    existing_reg = db.query(Bus).filter(Bus.reg_number == req.reg_number).first()
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
            if tenant_id:
                existing_reg.tenant_id = tenant_id
            db.commit()
            db.refresh(existing_reg)
            return existing_reg

    bus_data = req.model_dump()
    if tenant_id and "tenant_id" not in bus_data:
        bus_data["tenant_id"] = tenant_id
    bus = Bus(**bus_data)
    db.add(bus)
    db.commit()
    db.refresh(bus)
    return bus


@router.get("/seat-layouts", response_model=List[SeatLayoutOut])
def list_seat_layouts(
    db: Session = Depends(get_db)
):
    return db.query(SeatLayout).order_by(SeatLayout.created_at.desc() if hasattr(SeatLayout, 'created_at') else SeatLayout.id.desc()).all()


@router.post("/seat-layouts", response_model=SeatLayoutOut, status_code=status.HTTP_201_CREATED)
def create_seat_layout(
    req: SeatLayoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    layout = SeatLayout(**req.model_dump())
    db.add(layout)
    db.commit()
    db.refresh(layout)
    return layout


@router.delete("/seat-layouts/{layout_id}")
def delete_seat_layout(
    layout_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    layout = db.query(SeatLayout).filter(SeatLayout.id == layout_id).first()
    if not layout:
        raise HTTPException(status_code=404, detail="Seat layout not found")

    # Unlink any buses using this layout
    db.query(Bus).filter(Bus.seat_layout_id == layout_id).update({"seat_layout_id": None})
    # Delete child seats
    db.query(Seat).filter(Seat.seat_layout_id == layout_id).delete()
    db.delete(layout)
    db.commit()
    return {"success": True, "message": "Seat layout deleted successfully"}


@router.get("/{bus_id}", response_model=BusOut)
def get_bus(
    bus_id: str,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT", "VIEWER"]))
):
    bus = db.query(Bus).filter(Bus.id == bus_id, Bus.status != "DELETED").first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    return bus


@router.put("/{bus_id}", response_model=BusOut)
def update_bus(
    bus_id: str,
    req: BusUpdate,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    bus = db.query(Bus).filter(Bus.id == bus_id, Bus.status != "DELETED").first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(bus, field, value)

    db.commit()
    db.refresh(bus)
    return bus


@router.delete("/{bus_id}")
def delete_bus(
    bus_id: str,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus or bus.status == "DELETED":
        raise HTTPException(status_code=404, detail="Bus not found")

    bus.status = "DELETED"
    db.commit()
    return {"success": True, "message": f"Bus {bus.bus_name} ({bus.bus_number}) deleted successfully"}


