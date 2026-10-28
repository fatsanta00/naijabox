import { test, expect } from '@playwright/test';

test.describe('NaijaBox Security, Headers & Auth Enforcement', () => {
  test('Homepage returns required security headers', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    // X-Content-Type-Options: nosniff
    expect(headers['x-content-type-options']).toBe('nosniff');
    // X-Frame-Options: SAMEORIGIN
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    // Referrer-Policy
    expect(headers['referrer-policy']).toBeTruthy();
    // Permissions-Policy
    expect(headers['permissions-policy']).toBeTruthy();
  });

  test('Admin API routes strictly enforce 401 without auth token', async ({ request }) => {
    const endpoints = [
      '/api/admin/questions',
      '/api/admin/content-health',
      '/api/admin/moderation',
      '/api/admin/experiences',
    ];

    for (const url of endpoints) {
      const response = await request.get(url);
      expect(response.status(), `Expected 401 for ${url}`).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    }
  });

  test('Unauthenticated access to /admin redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/settings');
    // Middleware should redirect to login with callbackUrl
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Public visits receive anonymous nb_sid cookie without personal tracking', async ({ page, context }) => {
    await page.goto('/');
    const cookies = await context.cookies();
    const nbSid = cookies.find((c) => c.name === 'nb_sid');
    expect(nbSid).toBeTruthy();
    expect(nbSid?.value.length).toBeGreaterThanOrEqual(16);
  });

  test('Admin login enforces sliding-window rate limiting on abuse', async ({ request }) => {
    // Send rapid credential login requests
    let got429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await request.post('/api/auth/callback/credentials', {
        headers: { 'x-forwarded-for': '198.51.100.99' },
        maxRedirects: 0,
        data: {
          email: 'test-attacker@example.com',
          password: 'bad-password-attempt',
        },
      });

      if (res.status() === 429) {
        got429 = true;
        const body = await res.json();
        expect(body.error).toContain('Too many login attempts');
        break;
      }
    }

    expect(got429).toBe(true);
  });
});
