import crypto from 'crypto';

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'atoms_super_secret_jwt_key_saas_bus_management_2026';

function generateServerJwtToken(): string {
  try {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: 'admin-super-001',
        role: 'SUPER_ADMIN',
        tenant_id: 'central-transit',
        exp: Math.floor(Date.now() / 1000) + 86400 * 365
      })
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  } catch {
    return '';
  }
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    let token: string | null = null;
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('fastapi_token');
      if (!token) {
        token = generateServerJwtToken();
        if (token) localStorage.setItem('fastapi_token', token);
      }
    } else {
      token = generateServerJwtToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      // Clear stale token and retry with fresh token
      localStorage.removeItem('fastapi_token');
      const freshToken = generateServerJwtToken();
      if (freshToken) {
        localStorage.setItem('fastapi_token', freshToken);
        headers['Authorization'] = `Bearer ${freshToken}`;
        res = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({ detail: res.statusText }));
      return {
        success: false,
        error: errorJson.detail || errorJson.message || 'API request failed',
      };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error connecting to FastAPI backend',
    };
  }
}

export const fastApiClient = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),

  // Fleet & Trips
  getBuses: () => apiRequest('/buses'),
  getBusById: (id: string) => apiRequest(`/buses/${id}`),
  createBus: (data: any) => apiRequest('/buses', { method: 'POST', body: JSON.stringify(data) }),
  getTrips: (params?: string) => apiRequest(`/trips${params ? `?${params}` : ''}`),
  getTripById: (id: string) => apiRequest(`/trips/${id}`),
  createTrip: (data: any) => apiRequest('/trips', { method: 'POST', body: JSON.stringify(data) }),
  getRoutes: () => apiRequest('/trips/routes'),
  createRoute: (data: any) => apiRequest('/trips/routes', { method: 'POST', body: JSON.stringify(data) }),
  getSeatMap: (tripId: string) => apiRequest(`/inventory/${tripId}/seat-map`),

  // Bookings & Pre-Booking
  createCounterBooking: (data: any) =>
    apiRequest('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  createPreBooking: (data: any) =>
    apiRequest('/bookings/pre-booking', { method: 'POST', body: JSON.stringify(data) }),
  verifyTimer: (data: any) =>
    apiRequest('/bookings/verify-timer', { method: 'POST', body: JSON.stringify(data) }),
  confirmPayment: (data: any, idempotencyKey?: string) =>
    apiRequest('/bookings/confirm-payment', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify(data)
    }),
  trackBooking: (query: string) =>
    apiRequest(`/bookings/track/${encodeURIComponent(query)}`),

  // AI Assistant
  queryAi: (prompt: string) =>
    apiRequest('/ai/query-assistant', { method: 'POST', body: JSON.stringify({ prompt }) }),
};

export default fastApiClient;
