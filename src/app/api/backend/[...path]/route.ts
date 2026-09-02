import { NextRequest, NextResponse } from 'next/server';
import { FASTAPI_BASE } from '@/lib/config';

/**
 * Server-side proxy to the FastAPI backend.
 *
 * The JWT (fastapi_token) lives ONLY in an httpOnly, SameSite=Strict cookie, so
 * client-side fetch calls cannot read it. This route forwards API requests and
 * injects the Authorization header from the cookie server-side. All client API
 * calls should go through /api/backend/... instead of calling FastAPI directly.
 */

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path.join('/');
  const search = request.nextUrl.search;

  const rawFastapiToken = request.cookies.get('fastapi_token')?.value;
  const { getValidFastApiToken } = await import('@/lib/token');
  const validToken = getValidFastApiToken(rawFastapiToken);

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.set('Authorization', `Bearer ${validToken}`);
  headers.set('X-Forwarded-Host', request.headers.get('host') || '');

  const target = `${FASTAPI_BASE}/${pathname}${search}`;
  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const body = await upstream.arrayBuffer();

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Backend unreachable: ${err?.message || 'unknown error'}` },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
