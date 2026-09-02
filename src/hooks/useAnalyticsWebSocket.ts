import useWebSocket from 'react-use-websocket';
import { useState, useEffect } from 'react';
import { WEBSOCKET_BASE } from '@/lib/config';

// Derive the WebSocket URL from the configured backend base URL.
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || `${WEBSOCKET_BASE}/analytics/ws`;

export function useAnalyticsWebSocket() {
  const [activeVisitors, setActiveVisitors] = useState(0);

  const { lastMessage, readyState } = useWebSocket(SOCKET_URL, {
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'visitor_update') {
          setActiveVisitors(data.active_visitors);
        }
      } catch (e) {
        console.error("Error parsing websocket message", e);
      }
    }
  }, [lastMessage]);

  return { activeVisitors, readyState };
}
