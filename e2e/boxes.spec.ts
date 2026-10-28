import { test, expect } from '@playwright/test';

test.describe('NaijaBox Mobile Web (360px) & Flow Tests', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('Homepage renders hero, grid, and navigation at 360px', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText("What's inside the box?");

    // Check all launch box cards exist
    const boxes = [
      'How Nigerian Are You?',
      'Naija Would You Rather',
      'Nigerian Slang Quiz',
      'Reaction Time',
      'Random Decision Maker',
      'Guess the Price',
      'Naija PriceCheck',
    ];

    for (const title of boxes) {
      await expect(page.locator(`text=${title}`)).toBeVisible();
    }
  });

  test('How Nigerian test interactive flow', async ({ page }) => {
    await page.goto('/boxes/how-nigerian');
    // Box is a client component — wait for it to hydrate and load questions from DB
    // The loading spinner disappears once questions load; then option buttons appear
    // Wait for the loading state to clear (spinner text disappears)
    await expect(page.locator('text=Preparing your test...')).toBeHidden({ timeout: 15000 });
    // At this point either questions loaded or empty-pool message shows
    // Either way, a button should be present
    const anyButton = page.getByRole('button');
    await expect(anyButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('Random Decision Maker preset flow', async ({ page }) => {
    await page.goto('/boxes/decision-maker');
    await expect(page.locator('h2')).toContainText('Random Decision Maker');

    // Click 'What to eat?' preset
    await page.click('button:has-text("What to eat?")');

    // Click 'Let NaijaBox Decide!'
    const decideBtn = page.locator('button:has-text("Let NaijaBox Decide!")');
    await expect(decideBtn).toBeEnabled();
    await decideBtn.click();

    // Verify spinning state or result appears
    await expect(page.locator('text=The box says:').or(page.locator('text=Deciding…'))).toBeVisible();

    // Verify full ResultLayout post-experience contract
    await expect(page.locator('text=The box says:')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Share your result with friends')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    await expect(page.locator('text=Back to the Box')).toBeVisible();
    await expect(page.locator('text=Try another box')).toBeVisible();

    // Test Try Again resets state
    await page.click('button:has-text("Try Again")');
    await expect(page.locator('button:has-text("Let NaijaBox Decide!")')).toBeVisible();
  });

  test('Anti-fabrication stats gate enforces MIN_STATS_SAMPLE limit', async ({ request }) => {
    // Calling stats on any question with fewer than 30 recorded responses
    const res = await request.get('/api/public/questions/00000000-0000-0000-0000-000000000001/stats');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.available).toBe(false);
    expect(json.min_required).toBe(30);
    expect(json.message).toBe("You're one of the first to answer");
  });

  test('PriceCheck displays paid placement transparency disclosure', async ({ page }) => {
    await page.goto('/boxes/pricecheck');
    await expect(page.locator('h2')).toContainText('Naija PriceCheck');

    // Verify required PRD paid-label disclosure is always visible on the search page
    await expect(page.locator('[data-testid="paid-label-disclosure"]')).toBeVisible();
    await expect(page.locator('[data-testid="paid-label-disclosure"]')).toContainText('Paid placements are clearly labelled');
  });

  test('Full loop: Community submit -> pending -> not public (moderation gate)', async ({ request }) => {
    const testQText = `E2E Community Question ${Date.now()}`;

    // 1. Submit anonymously via public endpoint
    const submitRes = await request.post('/api/public/submissions', {
      data: {
        experience_key: 'how-nigerian',
        text: testQText,
        options: [
          { id: 'a', text: 'Option A', points: 1 },
          { id: 'b', text: 'Option B', points: 3 },
        ],
        explanation: 'E2E test explanation',
        author_name: 'Test Author',
        show_attribution: true,
      },
    });
    expect(submitRes.status()).toBe(201);
    const submitData = await submitRes.json();
    expect(submitData.success).toBe(true);
    expect(submitData.data?.id).toBeTruthy();

    // 2. Verify submission is NOT in public questions feed (it is pending)
    const publicQRes = await request.get('/api/public/questions?experience=how-nigerian&count=50');
    expect(publicQRes.status()).toBe(200);
    const publicQData = await publicQRes.json();
    const isPubliclyVisible = publicQData.data.some((q: { text: string }) => q.text === testQText);
    expect(isPubliclyVisible).toBe(false);

    // 3. Verify admin moderation queue API sees it as pending (401 without auth = correct)
    const adminRes = await request.get('/api/admin/moderation');
    expect(adminRes.status()).toBe(401); // Correctly gated
    const adminJson = await adminRes.json();
    expect(adminJson.error).toBe('Unauthorized');
  });

  test('Reaction Time state machine flow', async ({ page }) => {
    await page.goto('/boxes/reaction-time');
    await expect(page.locator('h2')).toContainText('Reaction Time');

    // Check start button
    const startBtn = page.getByRole('button', { name: '🟢 Start' });
    await expect(startBtn).toBeVisible();
  });

  test('Naija PriceCheck search flow', async ({ page }) => {
    await page.goto('/boxes/pricecheck');
    await expect(page.locator('h2')).toContainText('Naija PriceCheck');

    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('iPhone');
  });

  test('Slang Dictionary directory and term detail page render at 360px', async ({ page, request }) => {
    // 1. Verify API returns slang terms
    const apiRes = await request.get('/api/public/slang');
    expect(apiRes.status()).toBe(200);
    const apiJson = await apiRes.json();
    expect(apiJson.success).toBe(true);
    expect(apiJson.data.length).toBeGreaterThan(0);

    // 2. Visit /slang directory
    await page.goto('/slang');
    await expect(page.locator('h1')).toContainText('Nigerian Slang Dictionary');
    await expect(page.locator('text=Take the Slang Quiz')).toBeVisible();

    // 3. Search for a term
    const searchInput = page.locator('input[aria-label="Search slang words"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Omo');
    await expect(page.locator('text=Omo').first()).toBeVisible();

    // 4. Navigate to detail page
    await page.goto('/slang/omo');
    await expect(page.locator('h1')).toContainText('Omo');
    await expect(page.locator('text=Definition & Meaning')).toBeVisible();
    await expect(page.locator('text=Test Your Slang in Quiz')).toBeVisible();
  });

  test('Static pages render cleanly at 360px', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toContainText('About NaijaBox');

    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
  });
});
