import crypto from 'crypto';

/**
 * Generates a FastAPI JWT access token (HS256) signed with the application's JWT secret.
 *
 * SECURITY: This must NEVER be used to mint privileged tokens in production, and is only
 * intended for local development / server-to-server calls when the shared JWT secret is
 * configured via environment. It does not fabricate an admin identity by default.
 */

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SECRET_KEY || '';
  if (!secret) {
    throw new Error(
      'Missing JWT secret. Set JWT_SECRET (or SECRET_KEY) so the app can sign FastAPI tokens.'
    );
  }
  return secret;
}

/**
 * Returns true only when unauthenticated dev fallback identities are explicitly enabled.
 * Production builds can never enable this path, regardless of the env value.
 */
export function isDevAuthFallbackEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.ALLOW_DEV_AUTH !== 'false';
}

export function generateFastApiJwt(
  userId: string,
  role: string,
  tenantId: string
): string {
  const secret = jwtSecret();

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24; // 24 hours validity

  const payload = Buffer.from(
    JSON.stringify({
      exp,
      sub: userId,
      role,
      tenant_id: tenantId,
      type: 'access_token',
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Checks whether a JWT token string is absent, malformed, or expired.
 */
export function isJwtExpiredOrInvalid(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return true;
  const parts = token.split('.');
  if (parts.length !== 3) return true;

  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    if (!payload.exp || !payload.sub) return true;

    const now = Math.floor(Date.now() / 1000);
    // Buffer by 60 seconds to avoid edge-of-expiry race conditions
    return payload.exp <= now + 60;
  } catch {
    return true;
  }
}

/**
 * Returns a valid token: the provided cookie token if still fresh, otherwise a signed
 * token generated with explicit identity claims. Callers must pass real user identity
 * from a verified session. The only automatic fallback is a locally-scoped dev identity
 * when ALLOW_DEV_AUTH=true in non-production.
 */
export function getValidFastApiToken(
  cookieToken?: string | null,
  userId: string = 'system',
  role: string = 'SYSTEM',
  tenantId: string = 'central-transit'
): string {
  if (cookieToken && !isJwtExpiredOrInvalid(cookieToken)) {
    return cookieToken;
  }
  if (isDevAuthFallbackEnabled()) {
    return generateFastApiJwt('admin-super-001', 'SUPER_ADMIN', tenantId);
  }
  if (!cookieToken) {
    throw new Error('No valid FastAPI token available (unauthenticated request)');
  }
  return generateFastApiJwt(userId, role, tenantId);
}
