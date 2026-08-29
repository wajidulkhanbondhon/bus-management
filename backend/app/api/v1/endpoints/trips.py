from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_tenant_id, require_role
from app.models.trip import Trip, BusRoute
from app.models.user import User
from app.schemas.trip import TripCreate, TripOut, BusRouteCreate, BusRouteOut



router = APIRouter()


@router.get("/", response_model=List[TripOut])
def list_trips(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    bus_type: Optional[str] = None,
    date: Optional[str] = None,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Trip).join(BusRoute).filter(Trip.status.in_(["SCHEDULED", "BOARDING"]))
    if tenant_id:
        query = query.filter(Trip.tenant_id == tenant_id)
    if bus_type and bus_type != "ALL":
        query = query.filter(Trip.trip_bus_type == bus_type)
    if origin:
        query = query.filter(BusRoute.origin.ilike(f"%{origin.strip()}%"))
    if destination:
        query = query.filter(BusRoute.destination.ilike(f"%{destination.strip()}%"))
    if date:
        try:
            d = datetime.fromisoformat(date)
            start_d = d.replace(hour=0, minute=0, second=0, microsecond=0)
            end_d = d.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(Trip.departure_date >= start_d, Trip.departure_date <= end_d)
        except Exception:
            pass
    return query.order_by(Trip.departure_date.asc(), Trip.departure_time.asc()).all()


@router.post("/", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def schedule_trip(
    req: TripCreate,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    route = db.query(BusRoute).filter(BusRoute.id == req.route_id).first()
    if not route:
        route = db.query(BusRoute).first()
        if not route:
            route = BusRoute(
                route_name="Dhaka to Rajshahi University",
                origin="Dhaka Gabtoli",
                destination="Rajshahi University",
                distance_km=250.0,
                est_duration="5h 30m"
            )
            db.add(route)
            db.commit()
            db.refresh(route)

    trip_data = req.model_dump()
    trip_data["route_id"] = route.id
    if not trip_data.get("trip_code"):
        trip_data["trip_code"] = f"TRIP-RU-2026-{int(datetime.now().timestamp()) % 10000:04d}"

    effective_tenant = current_user.tenant_id if (current_user.role and current_user.role.name != "SUPER_ADMIN") else (tenant_id or current_user.tenant_id)
    trip = Trip(**trip_data, tenant_id=effective_tenant)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/routes", response_model=List[BusRouteOut])
def list_routes(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(BusRoute)
    if tenant_id:
        query = query.filter(BusRoute.tenant_id == tenant_id)
    return query.all()
