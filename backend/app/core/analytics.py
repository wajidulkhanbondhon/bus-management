import time
import asyncio
from typing import Dict, List
from fastapi import WebSocket

class AnalyticsManager:
    def __init__(self):
        # Maps session_id (ip or browser fingerprint) to timestamp of last activity
        self.active_visitors: Dict[str, float] = {}
        # List of connected admin websockets
        self.active_connections: List[WebSocket] = []
        self.VISITOR_TIMEOUT = 300 # 5 minutes timeout

    def mark_visitor_active(self, session_id: str):
        self.active_visitors[session_id] = time.time()
        
    def get_active_visitor_count(self) -> int:
        now = time.time()
        # Clean up stale visitors
        self.active_visitors = {
            k: v for k, v in self.active_visitors.items() 
            if (now - v) <= self.VISITOR_TIMEOUT
        }
        return len(self.active_visitors)

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

    async def broadcast_active_visitors(self):
        count = self.get_active_visitor_count()
        await self.broadcast({
            "type": "visitor_update",
            "active_visitors": count
        })

analytics_manager = AnalyticsManager()
