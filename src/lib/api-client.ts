const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000/api/v1';

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
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('fastapi_token');
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
  cancelBooking: (bookingId: string, reason: string = 'Customer Request') =>
    apiRequest(`/bookings/${bookingId}/cancel?reason=${encodeURIComponent(reason)}`, { method: 'POST' }),
  rejectPreBooking: (bookingId: string, reason: string = 'Verification Failed') =>
    apiRequest(`/bookings/${bookingId}/reject?reason=${encodeURIComponent(reason)}`, { method: 'POST' }),

  // Inventory & Locking
  lockSeat: (tripId: string, data: any) =>
    apiRequest(`/inventory/${tripId}/lock-seat`, { method: 'POST', body: JSON.stringify(data) }),
  unlockSeat: (tripId: string, seatId: string) =>
    apiRequest(`/inventory/${tripId}/unlock-seat?seat_id=${encodeURIComponent(seatId)}`, { method: 'POST' }),
  cleanupExpired: (token?: string) =>
    apiRequest(`/inventory/cleanup-expired${token ? `?token=${encodeURIComponent(token)}` : ''}`, { method: 'POST' }),

  // Payments & Refunds
  issueRefund: (data: { booking_id: string; amount: number; method: string; reason: string; payment_id?: string }) =>
    apiRequest('/payments/refund', { method: 'POST', body: JSON.stringify(data) }),

  // Generic helpers
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),

  // Database Backup & Migration
  getDbStats: () => apiRequest('/backup/stats'),
  exportDbBackup: () => apiRequest('/backup/export'),

  // AI Assistant
  queryAi: (prompt: string) =>
    apiRequest('/ai/query-assistant', { method: 'POST', body: JSON.stringify({ prompt }) }),
};

export default fastApiClient;
