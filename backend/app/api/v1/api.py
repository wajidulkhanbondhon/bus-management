from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    tenants,
    buses,
    trips,
    inventory,
    bookings,
    payments,
    day_closing,
    reports,
    audit,
    ai,
    backup,
    universities,
    coupons,
    settings
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Staff & Role Management"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["SaaS Tenants"])
api_router.include_router(buses.router, prefix="/buses", tags=["Fleet & Buses"])
api_router.include_router(trips.router, prefix="/trips", tags=["Trips & Routes"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Seat Inventory & Live Engine"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings & Pre-Booking Queue"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments & Ledger"])
api_router.include_router(day_closing.router, prefix="/day-closing", tags=["Day Closing & Reconciliation"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Analytics"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Engine & OCR"])
api_router.include_router(backup.router, prefix="/backup", tags=["Database Backup & Migration"])
api_router.include_router(universities.router, prefix="/universities", tags=["University Circulars"])
api_router.include_router(coupons.router, prefix="/coupons", tags=["Marketing Coupons"])
api_router.include_router(settings.router, prefix="/settings", tags=["System & Landing Settings"])
