from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel


class SeatBase(BaseModel):
    seat_number: str
    row_index: int
    col_index: int
    seat_type: str = "STANDARD"
    gender_allowed: str = "ANY"
    base_fare: float = 500.0
    fare_zone_id: Optional[str] = None


class SeatOut(SeatBase):
    id: str
    is_active: bool

    class Config:
        from_attributes = True


class SeatLayoutCreate(BaseModel):
    name: str
    description: Optional[str] = None
    total_rows: int
    total_cols: int
    total_seats: int
    layout_json: str


class SeatLayoutOut(SeatLayoutCreate):
    id: str
    seats: List[SeatOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assigned_buses_count: Optional[int] = 0

    class Config:
        from_attributes = True


class BusBase(BaseModel):
    bus_name: str
    bus_number: str
    operator: str = "পরে নির্ধারণ করা হবে (Pending Vendor Allocation)"
    reg_number: str
    capacity: int
    bus_type: str = "MIXED"
    status: str = "ACTIVE"
    notes: Optional[str] = None
    seat_layout_id: Optional[str] = None


class BusCreate(BusBase):
    pass


class BusUpdate(BaseModel):
    bus_name: Optional[str] = None
    bus_number: Optional[str] = None
    operator: Optional[str] = None
    reg_number: Optional[str] = None
    capacity: Optional[int] = None
    bus_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    seat_layout_id: Optional[str] = None


class BusOut(BusBase):
    id: str
    tenant_id: Optional[str] = None
    seat_layout: Optional[SeatLayoutOut] = None

    class Config:
        from_attributes = True

