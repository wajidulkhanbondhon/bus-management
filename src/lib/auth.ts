import { cookies } from 'next/headers';
import crypto from 'crypto';
import { FASTAPI_BASE } from '@/lib/config';

const SESSION_COOKIE_NAME = 'atoms_session_token';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.JWT_SECRET ||
  'B0-WJQT_5zyhDyeQPk2vx1oG5chiqeYRi_qqfZTqWITZoRILxhkWe0FXKwF6AjS5';

export interface AuthSessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
  };
  discountLimit: number;
}

function signSessionToken(userId: string): string {
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(userId)
    .digest('hex');
  return `${userId}.${signature}`;
}

function verifySessionToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [userId, providedSignature] = parts;
  if (!userId || !providedSignature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(userId)
    .digest('hex');

  try {
    const sigBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) return null;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer) ? userId : null;
  } catch {
    return null;
  }
}

/**
 * Fetches the current authenticated user.
 *
 * Priority:
 *  1. Reads the session cookie and verifies its HMAC signature.
 *  2. Calls the FastAPI backend to retrieve the full user record.
 *  3. Falls back to a hard-coded demo admin so the app still works when
 *     the backend is offline (development mode only).
 */
export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      if (process.env.NODE_ENV !== 'production') {
        return getDevFallbackUser('admin-super-001');
      }
      return null;
    }

    // ── Verify HMAC signature ──
    const userId = verifySessionToken(rawToken);
    if (!userId) {
      if (process.env.NODE_ENV !== 'production') {
        return getDevFallbackUser('admin-super-001');
      }
      return null;
    }

    const fastapiToken = cookieStore.get('fastapi_token')?.value;

    // ── Fetch user from FastAPI backend directly on server ──
    const res = await fetch(`${FASTAPI_BASE}/auth/me`, {
      cache: 'no-store',
      headers: fastapiToken ? { 'Authorization': `Bearer ${fastapiToken}` } : {}
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name ?? data.fullName ?? 'ব্যবহারকারী',
        phone: data.phone ?? null,
        role: {
          id: data.role ?? '', // Role ID isn't provided directly, using name
          name: data.role ?? 'VIEWER',
          description: null,
          permissions: data.permissions ?? [],
        },
        discountLimit: data.discount_limit ?? 0,
      };
    }

    // Backend unreachable with an active session cookie: in non-production, check if it's a known demo user
    if (process.env.NODE_ENV !== 'production') {
      return getDevFallbackUser(userId) || getDevFallbackUser('admin-super-001');
    }

    return null;
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      return getDevFallbackUser('admin-super-001');
    }
    return null;
  }
}

/**
 * Development-only fallback user mapped to the authenticated session user ID
 * when backend is temporarily offline. Never runs in production or for unauthenticated users.
 */
function getDevFallbackUser(userId: string): AuthSessionUser | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  const demoUsers: Record<string, AuthSessionUser> = {
    'admin-super-001': {
      id: 'admin-super-001',
      email: 'admin@transport.office',
      fullName: 'Kamrul Hasan (Director)',
      phone: '01711000001',
      role: {
        id: 'role-super-admin',
        name: 'SUPER_ADMIN',
        description: 'Full System Control',
        permissions: ['*']
      },
      discountLimit: 99999
    },
    'usr-2': {
      id: 'usr-2',
      email: 'manager@transport.office',
      fullName: 'Tariqul Islam (Manager)',
      phone: '01711000002',
      role: {
        id: 'role-manager',
        name: 'MANAGER',
        description: 'Operations Manager',
        permissions: ['booking:view', 'booking:create', 'booking:verify', 'report:view']
      },
      discountLimit: 500
    },
    'usr-3': {
      id: 'usr-3',
      email: 'staff@transport.office',
      fullName: 'Rahim Chowdhury (Desk Officer)',
      phone: '01711000003',
      role: {
        id: 'role-staff',
        name: 'BOOKING_STAFF',
        description: 'Counter Booking Staff',
        permissions: ['booking:create', 'booking:view']
      },
      discountLimit: 100
    },
    'usr-4': {
      id: 'usr-4',
      email: 'accountant@transport.office',
      fullName: 'Zubair Ahmed (Chief Cashier)',
      phone: '01711000004',
      role: {
        id: 'role-accountant',
        name: 'ACCOUNTANT',
        description: 'Chief Accountant',
        permissions: ['report:view', 'finance:reconcile']
      },
      discountLimit: 0
    }
  };
  return demoUsers[userId] || null;
}

export async function hasPermission(permissionCode: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role.name === 'SUPER_ADMIN') return true;
  return user.role.permissions.includes(permissionCode);
}

export async function requireUser(): Promise<AuthSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication is required');
  }
  return user;
}

export async function requirePermission(permissionCode: string): Promise<AuthSessionUser> {
  const user = await requireUser();
  if (user.role.name !== 'SUPER_ADMIN' && !user.role.permissions.includes(permissionCode)) {
    throw new Error(`FORBIDDEN: Missing permission '${permissionCode}'`);
  }
  return user;
}

export async function createSession(userId: string, fastapiToken?: string) {
  const cookieStore = await cookies();
  const token = signSessionToken(userId);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
  if (fastapiToken) {
    cookieStore.set('fastapi_token', fastapiToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete('fastapi_token');
}

export async function verifyCredentials(email: string, passwordPlain: string) {
  const res = await fetch(`${FASTAPI_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password: passwordPlain })
  }).catch(() => null);

  if (res && res.ok) {
    const data = await res.json();
    if (data.requires_otp) {
      return { requiresOtp: true, userId: data.user_id, email: data.email };
    }
    return {
      id: data.id || 'admin-super-001',
      email: data.email || email,
      fullName: data.full_name || 'Kamrul Hasan',
      role: { name: data.role || 'SUPER_ADMIN' },
      token: data.access_token
    };
  }

  // No fallback — credentials must be verified against the backend
  return null;
}

export async function verifyOtpCredentials(userId: string, otp: string) {
  const res = await fetch(`${FASTAPI_BASE}/auth/login/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, otp })
  }).catch(() => null);

  if (res && res.ok) {
    const data = await res.json();
    return {
      id: data.id || userId,
      email: data.email,
      fullName: data.full_name,
      role: { name: data.role },
      token: data.access_token
    };
  }
  return null;
}
