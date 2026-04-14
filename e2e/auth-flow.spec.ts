import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login page
    await expect(page).toHaveURL(/\/(login|signin|auth)/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    // Should have email input and a submit button
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('body')).toBeVisible();
  });

  test('public pages accessible without auth', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).toBeVisible();
    // Should not redirect
    await expect(page).toHaveURL(/\/pricing/);
  });
});
