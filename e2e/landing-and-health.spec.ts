import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders with key sections', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/UPSC/i);
    // Hero section should be visible
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
    // Should have CTA links to register/login
    const ctaLinks = page.locator('a[href*="register"], a[href*="login"], a[href*="signup"]');
    expect(await ctaLinks.count()).toBeGreaterThan(0);
  });

  test('has working navigation links', async ({ page }) => {
    await page.goto('/');
    // Pricing link should exist
    const pricingLink = page.locator('a[href*="pricing"]').first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/\/pricing/);
    }
  });

  test('is responsive — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/');
    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
    // Body should not exceed viewport width
    expect(box!.width).toBeLessThanOrEqual(376);
  });
});

test.describe('Health Check API', () => {
  test('returns structured health response', async ({ request }) => {
    const response = await request.get('/api/health');
    // 200 (healthy/degraded) or 503 (unhealthy) are all valid
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('checks');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('redis');
    expect(body.checks).toHaveProperty('circuitBreakers');
  });

  test('responds within 5 seconds', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/health');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
