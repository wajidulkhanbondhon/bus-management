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
  createCounterBooking: (data: any, options?: RequestInit) =>
    apiRequest('/bookings', { method: 'POST', body: JSON.stringify(data), ...options }),
  createPreBooking: (data: any, options?: RequestInit) =>
    apiRequest('/bookings/pre-booking', { method: 'POST', body: JSON.stringify(data), ...options }),
  verifyTimer: (data: any, options?: RequestInit) =>
    apiRequest('/bookings/verify-timer', { method: 'POST', body: JSON.stringify(data), ...options }),
  confirmPayment: (data: any, idempotencyKey?: string, options?: RequestInit) =>
    apiRequest('/bookings/confirm-payment', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey, ...(options?.headers as any || {}) } : options?.headers,
      body: JSON.stringify(data),
      ...options
    }),
  trackBooking: (query: string) =>
    apiRequest(`/bookings/track/${encodeURIComponent(query)}`),
  cancelBooking: (bookingId: string, reason: string = 'Customer Request', options?: RequestInit) =>
    apiRequest(`/bookings/${bookingId}/cancel?reason=${encodeURIComponent(reason)}`, { method: 'POST', ...options }),
  rejectPreBooking: (bookingId: string, reason: string = 'Verification Failed', options?: RequestInit) =>
    apiRequest(`/bookings/${bookingId}/reject?reason=${encodeURIComponent(reason)}`, { method: 'POST', ...options }),

  // Inventory & Locking
  lockSeat: (tripId: string, data: any) =>
    apiRequest(`/inventory/${tripId}/lock-seat`, { method: 'POST', body: JSON.stringify(data) }),
  unlockSeat: (tripId: string, seatId: string) =>
    apiRequest(`/inventory/${tripId}/unlock-seat?seat_id=${encodeURIComponent(seatId)}`, { method: 'POST' }),
  cleanupExpired: (token?: string) =>
    apiRequest(`/inventory/cleanup-expired${token ? `?token=${encodeURIComponent(token)}` : ''}`, { method: 'POST' }),

  // Payments & Refunds
  getPayments: () => apiRequest('/payments/'),
  recordPayment: (data: { booking_id: string; amount: number; method: string; notes?: string }) =>
    apiRequest('/payments/record', { method: 'POST', body: JSON.stringify(data) }),
  getRefunds: () => apiRequest('/payments/refunds'),
  issueRefund: (data: { booking_id: string; amount: number; method: string; reason: string; payment_id?: string }) =>
    apiRequest('/payments/refund', { method: 'POST', body: JSON.stringify(data) }),

  // Day Closing & Ledger
  getDayClosingSummary: (dateStr: string) =>
    apiRequest(`/day-closing/summary?date_str=${encodeURIComponent(dateStr)}`),
  submitDayClosing: (data: any) =>
    apiRequest('/day-closing/submit', { method: 'POST', body: JSON.stringify(data) }),
  getFinancialLedger: () =>
    apiRequest('/reports/financial-ledger'),
  getDashboardKpi: () =>
    apiRequest('/reports/dashboard-kpi'),

  // Audit Logs
  getAuditLogs: () => apiRequest('/audit/'),

  // Staff & Roles
  getStaff: () => apiRequest('/users/'),
  getStaffById: (id: string) => apiRequest(`/users/${id}`),
  createStaff: (data: any) => apiRequest('/users/', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id: string, data: any) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleStaffActive: (id: string) => apiRequest(`/users/${id}/toggle-active`, { method: 'PATCH' }),
  updateDiscountLimit: (id: string, discountLimit: number) =>
    apiRequest(`/users/${id}/discount-limit`, { method: 'PATCH', body: JSON.stringify({ discount_limit: discountLimit }) }),
  getRoles: () => apiRequest('/users/roles'),
  createRole: (data: any) => apiRequest('/users/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: string, data: any) => apiRequest(`/users/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getPermissions: () => apiRequest('/users/permissions'),

  // Universities
  getUniversities: () => apiRequest('/universities/'),
  getUniversityById: (id: string) => apiRequest(`/universities/${id}`),
  createUniversity: (data: any) => apiRequest('/universities/', { method: 'POST', body: JSON.stringify(data) }),
  updateUniversity: (id: string, data: any) => apiRequest(`/universities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUniversity: (id: string) => apiRequest(`/universities/${id}`, { method: 'DELETE' }),

  // Marketing Coupons
  getCoupons: () => apiRequest('/coupons/'),
  validateCoupon: (code: string, amount: number = 0, university?: string) =>
    apiRequest(`/coupons/validate/${encodeURIComponent(code)}?purchase_amount=${amount}${university ? `&university=${encodeURIComponent(university)}` : ''}`),
  createCoupon: (data: any) => apiRequest('/coupons/', { method: 'POST', body: JSON.stringify(data) }),
  toggleCoupon: (id: string) => apiRequest(`/coupons/${id}/toggle`, { method: 'POST' }),
  deleteCoupon: (id: string) => apiRequest(`/coupons/${id}`, { method: 'DELETE' }),

  // Routes Management
  updateRoute: (id: string, data: any) => apiRequest(`/trips/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoute: (id: string) => apiRequest(`/trips/routes/${id}`, { method: 'DELETE' }),

  // Settings & Landing Page Control
  getLandingSettings: () => apiRequest('/settings/landing-control'),
  saveLandingSettings: (data: any) => apiRequest('/settings/landing-control', { method: 'POST', body: JSON.stringify(data) }),

  // Generic helpers
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),

  // Database Backup & Migration
  getDbStats: () => apiRequest('/backup/stats'),
  exportDbBackup: () => apiRequest('/backup/export'),

  // AI Assistant & Dashboard
  queryAi: (prompt: string) =>
    apiRequest('/ai/query-assistant', { method: 'POST', body: JSON.stringify({ prompt }) }),
  getAiRules: () => apiRequest('/ai-dashboard/rules'),
  getSecurityEvents: () => apiRequest('/ai-dashboard/security-events'),
  getBlockedIps: () => apiRequest('/ai-dashboard/blocked-ips'),
  unblockIp: (id: string) => apiRequest(`/ai-dashboard/blocked-ips/${id}/unblock`, { method: 'POST' }),
  blockIp: (id: string) => apiRequest(`/ai-dashboard/blocked-ips/${id}/block`, { method: 'POST' }),
};

export default fastApiClient;
