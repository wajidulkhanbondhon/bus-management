import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'atoms_session_token';
const SESSION_SECRET = process.env.SESSION_SECRET || 'atoms-dev-secret-change-in-production';

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

    // ── If no token at all, fall through to dev-only fallback ──
    if (!rawToken) {
      return getDevFallbackUser();
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

    // Backend unreachable — use dev fallback so the UI doesn't break locally
    return getDevFallbackUser();

  } catch {
    return getDevFallbackUser();
  }
}

/**
 * Development-only fallback user.
 * In production, ensure SESSION_SECRET is set and the backend is reachable
 * so that this code path is never hit for real users.
 */
function getDevFallbackUser(): AuthSessionUser | null {
  if (process.env.NODE_ENV === 'production') {
    // Never auto-login in production — force the real login page
    return null;
  }
  // Dev / local convenience: return the super-admin so the UI is usable
  return {
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
  };
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

  // Fallback demo matching (dev only)
  if (process.env.NODE_ENV !== 'production' && passwordPlain === 'admin1234') {
    return {
      id: 'admin-super-001',
      email: email,
      fullName: 'Kamrul Hasan',
      role: { name: 'SUPER_ADMIN' }
    };
  }

  return null;
}
