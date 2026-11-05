import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as registerHandler } from './register/route';
import { POST as loginHandler } from './login/route';
import { GET as meHandler } from './me/route';
import { GET as getFavsHandler, POST as postFavHandler } from './favourites/route';
import { PLAYER_TOKEN_COOKIE } from '@/server/auth/playerToken';

describe('Public Player Auth APIs', () => {
  const testEmail = `testplayer_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let playerCookie = '';

  it('registers a new player account successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/public/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Naija Test Baller',
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.email).toBe(testEmail.toLowerCase());
    expect(json.user.name).toBe('Naija Test Baller');
    expect(json.user.role).toBe('player');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain(PLAYER_TOKEN_COOKIE);
    playerCookie = setCookie?.split(';')[0] || '';
  });

  it('rejects duplicate email with 409 Conflict', async () => {
    const req = new NextRequest('http://localhost:3000/api/public/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('already exists');
  });

  it('logs in successfully with valid credentials', async () => {
    const req = new NextRequest('http://localhost:3000/api/public/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.email).toBe(testEmail.toLowerCase());

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain(PLAYER_TOKEN_COOKIE);
  });

  it('rejects login with incorrect password', async () => {
    const req = new NextRequest('http://localhost:3000/api/public/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it('me endpoint returns authenticated player with token cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/public/auth/me', {
      headers: {
        Cookie: playerCookie,
      },
    });

    const res = await meHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user).not.toBeNull();
    expect(json.user.email).toBe(testEmail.toLowerCase());
  });

  it('me endpoint returns null user when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/public/auth/me');
    const res = await meHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.user).toBeNull();
  });

  it('manages favourites for authenticated user', async () => {
    // Add favourite
    const addReq = new NextRequest('http://localhost:3000/api/public/auth/favourites', {
      method: 'POST',
      headers: {
        Cookie: playerCookie,
      },
      body: JSON.stringify({ boxSlug: 'slang-quiz' }),
    });
    const addRes = await postFavHandler(addReq);
    expect(addRes.status).toBe(200);
    const addJson = await addRes.json();
    expect(addJson.success).toBe(true);
    expect(addJson.isFavourited).toBe(true);

    // List favourites
    const listReq = new NextRequest('http://localhost:3000/api/public/auth/favourites', {
      headers: {
        Cookie: playerCookie,
      },
    });
    const listRes = await getFavsHandler(listReq);
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.success).toBe(true);
    expect(listJson.favourites).toContain('slang-quiz');
  });
});
