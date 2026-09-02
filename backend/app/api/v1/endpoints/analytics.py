from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Request, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.models.analytics import DailyAnalytics
from app.core.analytics import analytics_manager
from app.core.deps import get_current_user
from app.models.user import User
from datetime import date, timedelta
import asyncio

router = APIRouter()

@router.post("/visit")
async def register_visit(request: Request, background_tasks: BackgroundTasks, db: WrappedAsyncSession = Depends(get_db)):
    # 1. Update in-memory active users (using client IP as session id for simplicity)
    session_id = request.client.host
    analytics_manager.mark_visitor_active(session_id)

    # 2. Update today's total visitors in DB
    today = date.today()
    analytics = await db.query(DailyAnalytics).filter(DailyAnalytics.date == today).first()

    if not analytics:
        analytics = DailyAnalytics(date=today, total_visitors=1)
        db.add(analytics)
    else:
        analytics.total_visitors += 1

    await db.commit()

    # Fire off a background broadcast without blocking the request thread.
    background_tasks.add_task(analytics_manager.broadcast_active_visitors)

    return {"status": "ok"}

@router.get("/daily-stats")
async def get_daily_stats(
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns analytics for the last 30 days for charting (newest 30, ascending)."""
    today = date.today()
    start = today - timedelta(days=29)
    stats = (
        db.query(DailyAnalytics)
        .filter(DailyAnalytics.date >= start, DailyAnalytics.date <= today)
        .order_by(DailyAnalytics.date.asc())
        .all()
    )
    return stats

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await analytics_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # We don't really expect clients to send anything,
            # but we need to keep connection open.
            pass
    except WebSocketDisconnect:
        analytics_manager.disconnect(websocket)
    except Exception:
        analytics_manager.disconnect(websocket)
