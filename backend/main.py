import time
import os
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.core.logger import logger
from app.core.monitoring import init_sentry
from app.api.v1.api import api_router
import app.models  # Ensure all models are registered with Base metadata
from app.ai.learning_agent import run_autonomous_learning
from app.ai.security_agent import process_warning_timeouts
from app.services.booking_service import SeatAlreadyBookedException

# Initialize Sentry error monitoring
init_sentry()


async def autonomous_learning_loop():
    while True:
        await run_autonomous_learning()
        await asyncio.sleep(4 * 60 * 60)


async def security_monitoring_loop():
    while True:
        await process_warning_timeouts()
        await asyncio.sleep(60)


async def automated_backup_loop():
    """Runs automated encrypted database backup every 24 hours."""
    # Delay initial run by 60 seconds on startup
    await asyncio.sleep(60)
    while True:
        try:
            from app.db.session import AsyncSessionLocal
            from app.db.async_wrapper import WrappedAsyncSession
            from app.services.backup_service import create_encrypted_backup_service

            system_pin = settings.SECRET_KEY[:8] if settings.SECRET_KEY else "9988"
            async with AsyncSessionLocal() as session:
                wrapped_db = WrappedAsyncSession(session)
                res = await create_encrypted_backup_service(
                    db=wrapped_db,
                    user=None,
                    pin=system_pin,
                    ip_address="127.0.0.1",
                    notes="Automated Daily Scheduled Backup"
                )
                logger.info("automated_backup_success", filename=res.get("filename"), size=res.get("file_size"))
        except Exception as e:
            logger.error("automated_backup_error", error=str(e))

        await asyncio.sleep(86400)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task_learning = asyncio.create_task(autonomous_learning_loop())
    task_security = asyncio.create_task(security_monitoring_loop())
    task_backup = asyncio.create_task(automated_backup_loop())
    logger.info("application_started", project=settings.PROJECT_NAME, env=settings.ENVIRONMENT)
    yield
    task_learning.cancel()
    task_security.cancel()
    task_backup.cancel()
    logger.info("application_stopped")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    description="Enterprise Multi-Tenant SaaS Backend Engine for Bus Management & Online Pre-Booking System."
)

# SlowAPI Limiter state & Exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Structlog request lifecycle middleware
class SecurityAuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = request.client.host if request.client else "127.0.0.1"
        method = request.method
        path = request.url.path

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 2)
        # Log all non-healthcheck requests as structured JSON
        if path != "/health":
            logger.info(
                "http_request",
                method=method,
                path=path,
                status_code=response.status_code,
                client_ip=client_ip,
                duration_ms=duration_ms
            )

        return response


app.add_middleware(SecurityAuditMiddleware)

# Mount static directory for serving generated reports safely
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Strict CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
if settings.BACKEND_CORS_ORIGINS:
    for o in settings.BACKEND_CORS_ORIGINS:
        if str(o) not in origins:
            origins.append(str(o))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Application Firewall
from app.core.firewall import FirewallMiddleware
app.add_middleware(FirewallMiddleware)


@app.exception_handler(SeatAlreadyBookedException)
async def seat_booked_exception_handler(request: Request, exc: SeatAlreadyBookedException):
    return JSONResponse(status_code=409, content={"error": "SEAT_CONFLICT", "detail": str(exc)})


# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount Static Files for Uploads (Images & Documents)
os.makedirs("uploads/images", exist_ok=True)
os.makedirs("uploads/documents", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "security": {
            "rate_limiting": "SlowAPI active",
            "password_hasher": "Argon2id",
            "access_control": "Casbin RBAC active",
            "logging": "Structlog JSON active",
            "auth_storage": "HttpOnly Secure Cookies & Bearer JWT"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
