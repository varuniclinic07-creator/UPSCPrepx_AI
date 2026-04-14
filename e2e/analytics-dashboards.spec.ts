import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboards', () => {
  test('analytics hub page loads', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('mastery analytics page loads', async ({ page }) => {
    await page.goto('/dashboard/analytics/mastery');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('activity analytics page loads', async ({ page }) => {
    await page.goto('/dashboard/analytics/activity');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('performance analytics page loads', async ({ page }) => {
    await page.goto('/dashboard/analytics/performance');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('analytics API returns proper error for unauthenticated', async ({ request }) => {
    const endpoints = [
      '/api/analytics/mastery-stats',
      '/api/analytics/activity-stats',
      '/api/analytics/performance-stats',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect([401, 403]).toContain(response.status());
    }
  });
});
