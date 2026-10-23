import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export const SESSION_COOKIE_NAME = 'nb_sid';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Anonymous session cookie (ADR-007)
  const existingSession = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!existingSession) {
    const sessionId = nanoid(24);
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: false, // Accessible to client-side analytics
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
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
