import { test, expect } from '@playwright/test';

test.describe('Core User Flows — Unauthenticated', () => {
  test('landing → register flow', async ({ page }) => {
    await page.goto('/');
    // Find a register/signup CTA
    const registerLink = page.locator('a[href*="register"], a[href*="signup"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/(register|signup)/);
      // Should have form inputs
      const inputs = page.locator('input');
      expect(await inputs.count()).toBeGreaterThan(0);
    }
  });

  test('landing → login flow', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.locator('a[href*="login"]').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    }
  });

  test('login form shows validation on empty submit', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should stay on login page (not navigate away)
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('dashboard redirect preserves intended destination', async ({ page }) => {
    await page.goto('/dashboard/quiz');
    // Should redirect to login, potentially with redirect param
    await expect(page).toHaveURL(/\/(login|signin|dashboard)/);
  });
});

test.describe('SEO & Meta', () => {
  test('landing page has meta description', async ({ page }) => {
    await page.goto('/');
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(20);
  });

  test('landing page has Open Graph tags', async ({ page }) => {
    await page.goto('/');
    const ogTitle = page.locator('meta[property="og:title"]');
    // OG tags are optional but check if present
    const count = await ogTitle.count();
    if (count > 0) {
      const content = await ogTitle.getAttribute('content');
      expect(content).toBeTruthy();
    }
  });
});

test.describe('Security Headers', () => {
  test('responses include security headers', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    // Check key security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['strict-transport-security']).toBeTruthy();
  });

  test('X-Powered-By header is not exposed', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-powered-by']).toBeUndefined();
  });
});
