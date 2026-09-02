/**
 * Central API configuration.
 *
 * The browser-facing client always talks to the Next.js proxy at /api/backend,
 * which injects the JWT from the httpOnly cookie. Server-side code (route
 * handlers, server actions) can use FASTAPI_BASE directly.
 */

// Base URL of the FastAPI backend (server-side).
export const FASTAPI_BASE =
  process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000/api/v1';

// Browser-facing proxy prefix (Next.js route handler).
export const PROXY_BASE = '/api/backend';

// WebSocket endpoint derived from the backend base URL.
export const WEBSOCKET_BASE = FASTAPI_BASE.replace(/^http/, 'ws');

export function proxyUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.replace(/^\/api\/backend/, '');
  const path = cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;
  if (typeof window === 'undefined') {
    return `${FASTAPI_BASE}${path}`;
  }
  return `${PROXY_BASE}${path}`;
}
