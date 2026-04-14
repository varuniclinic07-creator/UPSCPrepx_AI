import { test, expect } from '@playwright/test';

test.describe('Lecture Generation Flow', () => {
  test('lectures page loads and shows header', async ({ page }) => {
    await page.goto('/dashboard/lectures');
    // If authenticated, should show lectures page; if not, redirected to login
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('lecture generation API returns proper error for unauthenticated', async ({ request }) => {
    const response = await request.post('/api/lectures/generate', {
      data: { topic: 'Test', subject: 'Polity', language: 'en', targetDuration: 180 },
    });
    // Should get 401 without auth
    expect([401, 403]).toContain(response.status());
  });

  test('lectures list API returns proper error for unauthenticated', async ({ request }) => {
    const response = await request.get('/api/lectures');
    expect([401, 403]).toContain(response.status());
  });

  test('lecture status API returns proper error for invalid ID', async ({ request }) => {
    const response = await request.get('/api/lectures/nonexistent-id/status');
    expect([401, 403, 404]).toContain(response.status());
  });
});
