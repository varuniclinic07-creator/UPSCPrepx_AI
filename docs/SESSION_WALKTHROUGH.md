# Session Walkthrough — 500 Fix + Cleanup + Guides

## 1. Internal Server Error Fix ✅

**Root Cause:** Three Edge Runtime incompatibilities in the middleware stack.

### Fix 1: `src/lib/security/headers.ts` — Edge-incompatible CSRF validation
The `validateCsrfToken()` function used `Buffer.from()` and `require('crypto')` — both Node.js-only APIs. The middleware imports this module, causing the Edge bundler to fail.

**Before:** `Buffer.from()` + `require('crypto').timingSafeEqual()`
**After:** Edge-compatible `TextEncoder` + XOR constant-time comparison

### Fix 2: `src/middleware.ts` — No error boundary
An unhandled error in Edge middleware kills the entire request with a 500. 

**Added:** Top-level `try/catch` around the entire middleware body. On error, it now `console.error`s and returns `NextResponse.next()` instead of crashing.

### Fix 3: `src/lib/logging/logger.ts` — Eager `require('pino')` at import
The top-level `require('pino')` was executed during module initialization, which can fail in Edge environments.

**Changed:** Lazy initialization via `getPino()` function, only called on first actual log.

### After Coolify Redeploy
After triggering a redeploy on Coolify, the middleware will no longer crash. The landing page (`/`) and health check (`/api/health`) should return 200.

> [!IMPORTANT]
> You still need to **trigger a redeploy from Coolify** at `http://89.117.60.144:8000` to pick up these fixes.

---

## 2. Orphan File Cleanup ✅

| Category | Files Moved | Destination |
|---|---|---|
| Old session reports (`.md`) | 90 | `_archive/old-docs/` |
| Old scripts (`.py`, `.sh`, `.bat`, `.ps1`) | 19 | `_archive/old-scripts/` |
| Orphan directories | 16 | `_archive/old-services/` |
| Redundant docker-compose variants | 8 | `_archive/old-docker-compose/` |
| **Total** | **133 files + 16 dirs** | `_archive/` (gitignored) |

**Clean root now has only 22 essential files** (Dockerfile, package.json, next.config.js, README.md, etc.)

Nothing was deleted — everything is in `_archive/` locally in case you need to reference it.

---

## 3. How-To Guides

### Content Seeding — CA Ingestion + Syllabus Coverage

Your app has cron API routes that can be triggered to seed content. Here's how:

**Step 1: Set the CRON_SECRET**
```bash
# In your .env.production.deploy, make sure CRON_SECRET is set:
CRON_SECRET=your-random-secret-here
```

**Step 2: Trigger Current Affairs Ingestion**
```bash
# From your VPS or any machine with curl:
curl -X POST https://upscbyvarunsh.aimasteryedu.in/api/cron/ca-ingest \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

This calls the CA ingestion cron which:
- Scrapes current affairs sources via Crawl4AI
- Processes and categorizes articles by UPSC relevance
- Stores them in the `current_affairs` table

**Step 3: Trigger Syllabus Coverage Scan**
```bash
curl -X POST https://upscbyvarunsh.aimasteryedu.in/api/cron/syllabus-scan \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Step 4: Set Up Automated Cron (Optional)**
In Coolify or your VPS crontab:
```bash
# Daily at 6 AM IST — ingest current affairs
0 0 * * * curl -s -X POST https://upscbyvarunsh.aimasteryedu.in/api/cron/ca-ingest -H "Authorization: Bearer YOUR_CRON_SECRET"

# Weekly on Sunday — syllabus coverage scan
0 2 * * 0 curl -s -X POST https://upscbyvarunsh.aimasteryedu.in/api/cron/syllabus-scan -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

### Lighthouse Audit — Performance Baseline

**Step 1: Run from Chrome DevTools (Easiest)**
1. Open `https://upscbyvarunsh.aimasteryedu.in` in Chrome
2. Press `F12` → Go to the **Lighthouse** tab
3. Select: Performance, Accessibility, Best Practices, SEO
4. Choose: Mobile (for mobile metrics) or Desktop
5. Click **Analyze page load**
6. Save the report (HTML) for your baseline

**Step 2: Run from CLI (Automatable)**
```bash
# Install globally
npm install -g lighthouse

# Run audit
lighthouse https://upscbyvarunsh.aimasteryedu.in --output html --output-path ./lighthouse-report.html

# Run for mobile simulation
lighthouse https://upscbyvarunsh.aimasteryedu.in --preset=perf --emulated-form-factor=mobile --output json --output-path ./lighthouse-mobile.json
```

**Step 3: Key Metrics to Track**
| Metric | Target | What It Measures |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Main content visible |
| FID (First Input Delay) | < 100ms | Interactivity |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability |
| Performance Score | > 80 | Overall |
| Bundle Size | < 300KB (first load JS) | Transfer size |

**Step 4: Common Optimizations if Scores are Low**
- Enable `next/image` for all images (lazy loading + WebP/AVIF)
- Use `dynamic(() => import(...))` for heavy dashboard components
- Check for unused npm packages: `npx depcheck`
- Add `loading="lazy"` to below-fold content

---

### E2E Tests — Future Enhancement

Your project already has a `playwright.config.ts` and an `e2e/` directory. Here's how to set up and run:

**Step 1: Install Playwright**
```bash
npm install -D @playwright/test
npx playwright install
```

**Step 2: Create Your First Test**
Create `e2e/landing.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('UPSC');
  await expect(page.locator('a[href="/register"]')).toBeVisible();
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('health check returns ok', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe('ok');
});
```

**Step 3: Run Tests**
```bash
# Run all E2E tests
npx playwright test

# Run with browser visible
npx playwright test --headed

# Run specific test file
npx playwright test e2e/landing.spec.ts

# View HTML report
npx playwright show-report
```

**Step 4: Add to CI (GitHub Actions)**
Your `.github/` directory already exists. Add a workflow:
```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci --legacy-peer-deps
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Commits This Session

| Commit | Description |
|---|---|
| `132fe05` | CSP hardening + alignment audit verification |
| `3dac0d8` | 500 fix (3 Edge patches) + 133 orphan files archived |
