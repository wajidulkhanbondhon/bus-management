from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.api.v1.api import api_router
import app.models  # Ensure all models are registered with Base metadata

import asyncio
from app.ai.learning_agent import run_autonomous_learning
from app.ai.security_agent import process_warning_timeouts

async def autonomous_learning_loop():
    while True:
        # Run in a separate thread so it doesn't block the async event loop
        await asyncio.to_thread(run_autonomous_learning)
        # Sleep for 4 hours
        await asyncio.sleep(4 * 60 * 60)

async def security_monitoring_loop():
    while True:
        await asyncio.to_thread(process_warning_timeouts)
        # Sleep for 1 minute
        await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed by Alembic migrations (backend/alembic). Run:
    #   alembic upgrade head
    # before starting the service in production. In dev, the SQLite fallback
    # DB is created by the migration too.

    # Start the autonomous learning loop
    task_learning = asyncio.create_task(autonomous_learning_loop())
    task_security = asyncio.create_task(security_monitoring_loop())
    yield
    task_learning.cancel()
    task_security.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    description="Enterprise Multi-Tenant SaaS Backend Engine for Bus Management & Online Pre-Booking System."
)

# Mount static directory for serving generated reports
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

from app.core.firewall import FirewallMiddleware
app.add_middleware(FirewallMiddleware)


from app.services.booking_service import SeatAlreadyBookedException


@app.exception_handler(SeatAlreadyBookedException)
async def seat_booked_exception_handler(request: Request, exc: SeatAlreadyBookedException):
    return JSONResponse(status_code=409, content={"error": "SEAT_CONFLICT", "detail": str(exc)})



app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
