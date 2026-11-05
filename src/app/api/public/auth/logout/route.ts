import { NextResponse } from 'next/server';
import { PLAYER_TOKEN_COOKIE } from '@/server/auth/playerToken';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(PLAYER_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
  return res;
}
