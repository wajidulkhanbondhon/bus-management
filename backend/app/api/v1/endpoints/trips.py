from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_tenant_id, require_role
from app.models.trip import Trip, BusRoute, TripStop
from app.models.user import User
from app.schemas.trip import TripCreate, TripOut, BusRouteCreate, BusRouteUpdate, BusRouteOut

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
    if req.base_price <= 0:
        raise HTTPException(status_code=400, detail="Trip base fare must be greater than zero")

    # Guard: prevent scheduling in past (allow up to 24h past in case of time zone discrepancies, but reject older)
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    dep_date = req.departure_date
    if dep_date.tzinfo is None:
        dep_date = dep_date.replace(tzinfo=timezone.utc)
    if dep_date < yesterday:
        raise HTTPException(status_code=400, detail="Cannot schedule trip in the past")

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


@router.post("/routes", response_model=BusRouteOut, status_code=status.HTTP_201_CREATED)
def create_route(
    req: BusRouteCreate,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    effective_tenant = current_user.tenant_id if (current_user.role and current_user.role.name != "SUPER_ADMIN") else (tenant_id or current_user.tenant_id)
    route = BusRoute(
        route_name=req.route_name.strip(),
        origin=req.origin.strip(),
        destination=req.destination.strip(),
        distance_km=req.distance_km,
        est_duration=req.est_duration,
        tenant_id=effective_tenant
    )
    db.add(route)
    db.flush()

    for s in req.stops:
        stop = TripStop(
            route_id=route.id,
            stop_name=s.stop_name.strip(),
            sequence_no=s.sequence_no,
            fare_offset=s.fare_offset or 0.0
        )
        db.add(stop)

    db.commit()
    db.refresh(route)
    return route


@router.put("/routes/{route_id}", response_model=BusRouteOut)
def update_route(
    route_id: str,
    req: BusRouteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Bus route not found")

    if req.route_name is not None:
        route.route_name = req.route_name.strip()
    if req.origin is not None:
        route.origin = req.origin.strip()
    if req.destination is not None:
        route.destination = req.destination.strip()
    if req.distance_km is not None:
        route.distance_km = req.distance_km
    if req.est_duration is not None:
        route.est_duration = req.est_duration

    if req.stops is not None:
        db.query(TripStop).filter(TripStop.route_id == route.id).delete()
        for s in req.stops:
            stop = TripStop(
                route_id=route.id,
                stop_name=s.stop_name.strip(),
                sequence_no=s.sequence_no,
                fare_offset=s.fare_offset or 0.0
            )
            db.add(stop)

    db.commit()
    db.refresh(route)
    return route


@router.delete("/routes/{route_id}")
def delete_route(
    route_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Bus route not found")

    trips_count = db.query(Trip).filter(Trip.route_id == route.id).count()
    if trips_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete route: {trips_count} scheduled trips are using this route")

    db.delete(route)
    db.commit()
    return {"success": True, "message": "Route deleted"}
