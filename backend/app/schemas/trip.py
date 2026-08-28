from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class TripStopSchema(BaseModel):
    stop_name: str
    sequence_no: int
    fare_offset: float = 0.0


class BusRouteBase(BaseModel):
    route_name: str
    origin: str
    destination: str
    distance_km: Optional[float] = None
    est_duration: Optional[str] = None


class BusRouteCreate(BusRouteBase):
    stops: List[TripStopSchema] = []


class BusRouteOut(BusRouteBase):
    id: str
    stops: List[TripStopSchema] = []

    class Config:
        from_attributes = True


class TripBase(BaseModel):
    trip_code: Optional[str] = None
    bus_id: str
    route_id: str
    departure_date: datetime
    departure_time: datetime
    arrival_est: Optional[datetime] = None
    trip_bus_type: Optional[str] = None
    status: str = "SCHEDULED"
    base_price: float
    notes: Optional[str] = None


class TripCreate(TripBase):
    pass


class TripOut(TripBase):
    id: str
    tenant_id: Optional[str] = None
    route: Optional[BusRouteOut] = None

    class Config:
        from_attributes = True

