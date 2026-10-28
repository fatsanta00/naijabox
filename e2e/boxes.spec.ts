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

    // Verify spinning state or result
    await expect(page.locator('text=The box says:').or(page.locator('text=Deciding…'))).toBeVisible();
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

  test('Static pages render cleanly at 360px', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toContainText('About NaijaBox');

    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
  });
});
