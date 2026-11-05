import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { getToken } from 'next-auth/jwt';

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

/** Decrypt and verify the NextAuth session token via Web Crypto API in Edge Middleware. */
async function getAdminSession(request: NextRequest) {
  const secret = process.env.AUTH_SECRET?.replace(/^\uFEFF/, '').trim();
  if (!secret) return null;

  const isHttps = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
  const cookieName =
    isHttps && request.cookies.has('__Secure-authjs.session-token')
      ? '__Secure-authjs.session-token'
      : (request.cookies.has('authjs.session-token')
          ? 'authjs.session-token'
          : (request.cookies.has('__Secure-authjs.session-token')
              ? '__Secure-authjs.session-token'
              : 'authjs.session-token'));

  try {
    const token = await getToken({
      req: request,
      secret,
      cookieName,
    });
    return token as { role?: string; id?: string; email?: string } | null;
  } catch (err) {
    console.error('Middleware session verification failed:', err);
    return null;
  }
}

/** Routes that require the 'owner' role (moderators are denied). */
const OWNER_ONLY_PATHS = [
  '/admin/users',
  '/admin/settings',
  '/admin/analytics',
  '/api/admin/users',
];

export async function middleware(request: NextRequest) {
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
  // If already authenticated and hitting /admin/login, redirect immediately to dashboard
  if (pathname === '/admin/login') {
    const session = await getAdminSession(request);
    if (session?.role === 'owner' || session?.role === 'moderator') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Check auth session cookie for /admin (except /admin/login) and /api/admin/*
  if (
    (pathname.startsWith('/admin') && pathname !== '/admin/login') ||
    pathname.startsWith('/api/admin')
  ) {
    const session = await getAdminSession(request);

    if (!session || !session.role) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = session.role;
    if (userRole !== 'owner' && userRole !== 'moderator') {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // 1b. Owner-only route enforcement
    const isOwnerOnlyPath = OWNER_ONLY_PATHS.some((p) => pathname.startsWith(p));
    if (isOwnerOnlyPath && userRole !== 'owner') {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  request.headers.set('x-pathname', pathname);
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
