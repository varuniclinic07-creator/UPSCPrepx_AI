import { test, expect } from '@playwright/test';

test.describe('Admin Lecture Management', () => {
  test('admin lectures API requires authentication', async ({ request }) => {
    const response = await request.get('/api/admin/lectures');
    expect([401, 403]).toContain(response.status());
  });

  test('admin lecture detail API requires authentication', async ({ request }) => {
    const response = await request.get('/api/admin/lectures/test-id');
    expect([401, 403]).toContain(response.status());
  });

  test('admin lectures page loads', async ({ page }) => {
    await page.goto('/admin/lectures');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('compilation API requires authentication', async ({ request }) => {
    const response = await request.get('/api/compilations');
    expect([401, 403]).toContain(response.status());
  });

  test('monthly compilation page loads', async ({ page }) => {
    await page.goto('/dashboard/monthly-compilation');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
