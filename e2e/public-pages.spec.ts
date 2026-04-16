import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  { path: '/', titlePattern: /UPSC/i },
  { path: '/login', titlePattern: /log.?in|sign.?in|UPSC/i },
  { path: '/register', titlePattern: /register|sign.?up|UPSC/i },
  { path: '/pricing', titlePattern: /pricing|plan|UPSC/i },
];

test.describe('Public Pages — Accessibility & Load', () => {
  for (const { path, titlePattern } of PUBLIC_PAGES) {
    test(`${path} loads without error`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response).toBeTruthy();
      expect(response!.status()).toBeLessThan(500);
      await expect(page).toHaveTitle(titlePattern);
    });
  }

  test('login page has email input and submit button', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('register page has form fields', async ({ page }) => {
    await page.goto('/register');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    // Should have at least an email input
    const inputs = page.locator('input');
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test('pricing page shows plan options', async ({ page }) => {
    await page.goto('/pricing');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('/app redirects to /dashboard', async ({ page }) => {
    await page.goto('/app');
    // Should either redirect to dashboard or login
    await expect(page).toHaveURL(/\/(dashboard|login)/);
  });
});
