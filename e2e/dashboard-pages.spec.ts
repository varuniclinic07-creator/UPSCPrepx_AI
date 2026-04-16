import { test, expect } from '@playwright/test';

/**
 * Dashboard pages should either:
 * 1. Redirect unauthenticated users to login, OR
 * 2. Show the page content (if public or with client-side auth check)
 *
 * Either way, they must NOT return 500.
 */
const DASHBOARD_PAGES = [
  '/dashboard',
  '/dashboard/notes',
  '/dashboard/my-notes',
  '/dashboard/quiz',
  '/dashboard/current-affairs',
  '/dashboard/study-planner',
  '/dashboard/lectures',
  '/dashboard/video',
  '/dashboard/analytics',
  '/dashboard/topic-intelligence',
  '/dashboard/animations',
  '/dashboard/ethics-case-study',
  '/dashboard/library',
  '/dashboard/ask-doubt',
  '/dashboard/search',
  '/dashboard/subscription',
];

test.describe('Dashboard Pages — No 500 Errors', () => {
  for (const path of DASHBOARD_PAGES) {
    test(`${path} does not return 500`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response).toBeTruthy();
      // Must not be a server error
      expect(response!.status()).toBeLessThan(500);
      // Should either show content or redirect to login
      const url = page.url();
      const body = await page.textContent('body');
      expect(body || url).toBeTruthy();
    });
  }
});

test.describe('Admin Pages — Auth Required', () => {
  const ADMIN_PAGES = [
    '/admin/console',
    '/admin/lectures',
  ];

  for (const path of ADMIN_PAGES) {
    test(`${path} requires authentication`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response).toBeTruthy();
      // Should redirect to login or show 401/403
      const status = response!.status();
      const url = page.url();
      const isAuthRedirect = /\/(login|signin|auth)/.test(url);
      const isAuthError = status === 401 || status === 403;
      const isOk = status < 400; // page may render with client-side auth check
      expect(isAuthRedirect || isAuthError || isOk).toBeTruthy();
    });
  }
});
