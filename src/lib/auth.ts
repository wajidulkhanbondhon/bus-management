import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'atoms_session_token';
const SESSION_SECRET = process.env.SESSION_SECRET || 'atoms-dev-secret-change-in-production';

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[ATOMS AUTH] ⛔ SESSION_SECRET environment variable is NOT set! This is a critical security risk in production.');
}

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
      return null;
    }

    // ── Verify HMAC signature ──
    const userId = verifySessionToken(rawToken);
    if (!userId) {
      // Tampered / expired token — treat as logged out
      return null;
    }

    // ── Fetch user from FastAPI backend ──
    const res = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
      cache: 'no-store',
      headers: { 'X-Session-Token': rawToken }
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name ?? data.fullName ?? 'ব্যবহারকারী',
        phone: data.phone ?? null,
        role: {
          id: data.role?.id ?? '',
          name: data.role?.name ?? 'VIEWER',
          description: data.role?.description ?? null,
          permissions: data.role?.permissions ?? [],
        },
        discountLimit: data.discount_limit ?? 0,
      };
    }

    // Backend unreachable with an active session cookie: in non-production, check if it's a known demo user
    if (process.env.NODE_ENV !== 'production') {
      return getDevFallbackUser(userId);
    }

    return null;
  } catch {
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

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  const token = signSessionToken(userId);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function verifyCredentials(email: string, passwordPlain: string) {
  const res = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password: passwordPlain })
  }).catch(() => null);

  if (res && res.ok) {
    const data = await res.json();
    return {
      id: data.user?.id || 'admin-super-001',
      email: data.user?.email || email,
      fullName: data.user?.full_name || 'Kamrul Hasan',
      role: { name: data.user?.role || 'SUPER_ADMIN' }
    };
  }

  // No fallback — credentials must be verified against the backend
  return null;
}
