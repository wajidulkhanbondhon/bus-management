from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_tenant_id, require_role
from app.models.bus import Bus, SeatLayout, Seat
from app.models.user import User
from app.schemas.bus import BusCreate, BusOut, SeatLayoutCreate, SeatLayoutOut



router = APIRouter()


@router.get("/", response_model=List[BusOut])
def list_buses(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Bus).filter(Bus.status != "DELETED")
    if tenant_id:
        query = query.filter(Bus.tenant_id == tenant_id)
    return query.all()


@router.post("/", response_model=BusOut, status_code=status.HTTP_201_CREATED)
def create_bus(
    req: BusCreate,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    existing = db.query(Bus).filter(Bus.bus_number == req.bus_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bus with this number already exists")

    seat_layout_id = req.seat_layout_id
    if not seat_layout_id:
        total_seats = req.capacity or 40
        layout = db.query(SeatLayout).filter(SeatLayout.total_seats == total_seats).first()
        if not layout:
            layout = db.query(SeatLayout).first()
        if not layout:
            layout = SeatLayout(
                name=f"Standard {total_seats}-Seat Layout",
                description=f"Auto generated {total_seats} seat layout",
                total_rows=10 if total_seats <= 40 else 11,
                total_cols=4,
                total_seats=total_seats,
                layout_json="{}"
            )
            db.add(layout)
            db.commit()
            db.refresh(layout)

            rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
            created_count = 0
            for r_idx, r in enumerate(rows):
                cols = 5 if (r == 'K' and total_seats >= 45) else 4
                for c in range(1, cols + 1):
                    if created_count >= total_seats:
                        break
                    seat = Seat(
                        seat_layout_id=layout.id,
                        seat_number=f"{r}{c}",
                        row_index=r_idx,
                        col_index=c - 1,
                        seat_type="VIP" if r_idx < 2 else "STANDARD",
                        gender_allowed="ANY",
                        base_fare=650.0 if r_idx < 2 else 550.0
                    )
                    db.add(seat)
                    created_count += 1
            db.commit()

        seat_layout_id = layout.id

    bus_dict = req.model_dump()
    bus_dict["seat_layout_id"] = seat_layout_id
    effective_tenant = current_user.tenant_id if (current_user.role and current_user.role.name != "SUPER_ADMIN") else (tenant_id or current_user.tenant_id)
    bus = Bus(**bus_dict, tenant_id=effective_tenant)
    db.add(bus)
    db.commit()
    db.refresh(bus)
    return bus


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
