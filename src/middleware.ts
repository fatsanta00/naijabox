import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export const SESSION_COOKIE_NAME = 'nb_sid';

// In-memory sliding window rate limiter for admin login attempts (10 attempts / 5 mins)
const loginAttempts = new Map<string, { count: number; expiresAt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.expiresAt < now) {
    loginAttempts.set(ip, { count: 1, expiresAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Admin login rate limiting (max 10 attempts per 5 minutes per IP)
  if (
    request.method === 'POST' &&
    (pathname.startsWith('/api/auth/callback/credentials') || pathname === '/admin/login')
  ) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 5 minutes.' },
        { status: 429 }
      );
    }
  }

  // 1. Admin route protection (ADR-005)
  // Check auth session cookie for /admin (except /admin/login) and /api/admin/*
  if (
    (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) ||
    pathname.startsWith('/api/admin')
  ) {
    // Check NextAuth session token cookie (either secure or standard)
    const token =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value;

    if (!token) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // 2. Anonymous session cookie for public usage (ADR-007)
  const existingSession = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!existingSession) {
    const sessionId = nanoid(24);
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
