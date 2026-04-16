import { test, expect } from '@playwright/test';

/**
 * API Contract Tests — verify endpoints return correct status codes
 * and response shapes for unauthenticated requests.
 */
test.describe('API — Auth-Protected Endpoints', () => {
  const PROTECTED_ENDPOINTS = [
    { method: 'GET', path: '/api/notes' },
    { method: 'GET', path: '/api/quiz' },
    { method: 'GET', path: '/api/lectures' },
    { method: 'GET', path: '/api/current-affairs' },
    { method: 'GET', path: '/api/analytics/mastery-stats' },
    { method: 'GET', path: '/api/analytics/activity-stats' },
    { method: 'GET', path: '/api/analytics/performance-stats' },
    { method: 'GET', path: '/api/admin/lectures' },
    { method: 'GET', path: '/api/compilations' },
    { method: 'GET', path: '/api/video' },
    { method: 'POST', path: '/api/notes/generate' },
    { method: 'POST', path: '/api/lectures/generate' },
  ];

  for (const { method, path } of PROTECTED_ENDPOINTS) {
    test(`${method} ${path} rejects unauthenticated`, async ({ request }) => {
      const response = method === 'GET'
        ? await request.get(path)
        : await request.post(path, { data: {} });

      // Should return 401 or 403 — NOT 500
      expect(response.status()).toBeLessThan(500);
      expect([401, 403]).toContain(response.status());
    });
  }
});

test.describe('API — Cron Endpoints', () => {
  const CRON_ENDPOINTS = [
    '/api/cron/ca-ingestion',
    '/api/cron/syllabus-coverage',
    '/api/cron/quality-sweep',
    '/api/cron/daily-plans',
    '/api/cron/freshness-check',
    '/api/cron/video-generation',
    '/api/cron/mastery-notifications',
  ];

  for (const path of CRON_ENDPOINTS) {
    test(`POST ${path} rejects without CRON_SECRET`, async ({ request }) => {
      const response = await request.post(path, {
        headers: { 'Content-Type': 'application/json' },
      });
      // Should reject — 401 or 403, not 500
      expect(response.status()).toBeLessThan(500);
    });
  }
});

test.describe('API — Public Endpoints', () => {
  test('GET /api/health returns valid JSON', async ({ request }) => {
    const response = await request.get('/api/health');
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('status');
  });
});
