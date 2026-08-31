import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('atoms_session_token')?.value;

  const pathname = request.nextUrl.pathname;

  // Protect all routes except these
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isApiRoute = pathname.startsWith('/api') || pathname.startsWith('/_next');
  const isPublicRoute = pathname === '/' || pathname.startsWith('/bookings/online') || pathname.startsWith('/contact') || pathname.startsWith('/about') || pathname.startsWith('/track');

  // If no session, redirect to login unless it's a public/auth route
  if (!sessionToken && !isAuthPage && !isApiRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (sessionToken && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
