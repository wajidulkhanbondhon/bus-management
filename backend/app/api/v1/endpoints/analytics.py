from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.analytics import DailyAnalytics
from app.core.analytics import analytics_manager
from datetime import date
import asyncio

router = APIRouter()

@router.post("/visit")
def register_visit(request: Request, db: Session = Depends(get_db)):
    # 1. Update in-memory active users (using client IP as session id for simplicity)
    session_id = request.client.host
    analytics_manager.mark_visitor_active(session_id)
    
    # 2. Update today's total visitors in DB
    today = date.today()
    analytics = db.query(DailyAnalytics).filter(DailyAnalytics.date == today).first()
    
    if not analytics:
        analytics = DailyAnalytics(date=today, total_visitors=1)
        db.add(analytics)
    else:
        analytics.total_visitors += 1
        
    db.commit()
    
    # Fire off a background broadcast
    asyncio.create_task(analytics_manager.broadcast_active_visitors())
    
    return {"status": "ok"}

@router.get("/daily-stats")
def get_daily_stats(db: Session = Depends(get_db)):
    """Returns analytics for the last 30 days for charting"""
    stats = db.query(DailyAnalytics).order_by(DailyAnalytics.date.asc()).limit(30).all()
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
