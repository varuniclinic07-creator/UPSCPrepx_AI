# Next.js 15 Upgrade + Upstash Redis + Production Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade to Next.js 15, replace ioredis with Upstash Redis for Edge compatibility, fix Google OAuth localhost redirect, fix dashboard Server Component crash, and add metadataBase.

**Architecture:** Three-phase approach: (1) Fix production-breaking bugs first (OAuth redirect, dashboard crash, metadataBase), (2) Upgrade Next.js 14 → 15 and remove deprecated packages, (3) Replace ioredis with @upstash/redis in rate limiters, cache, OTP, and health check while keeping ioredis only for BullMQ queues (which require TCP connections).

**Tech Stack:** Next.js 15, @upstash/redis, @supabase/ssr 0.5.2, React 18, BullMQ (keeps ioredis for TCP)

---

## Phase 1: Fix Production-Breaking Bugs

### Task 1: Add metadataBase to layout.tsx

**Files:**
- Modify: `src/app/layout.tsx:22-46`

- [ ] **Step 1: Add metadataBase to metadata export**

In `src/app/layout.tsx`, change the metadata export to include `metadataBase`:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://upscbyvarunsh.aimasteryedu.in'),
  title: {
    default: 'UPSC CSE Master - AI-Powered UPSC Preparation',
    template: '%s | UPSC CSE Master',
  },
  // ... rest stays the same
```

This fixes the build warning: `metadataBase property in metadata export is not set for resolving social open graph or twitter images, using "http://localhost:3000"`.

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "fix: add metadataBase to layout — resolve localhost OG image URLs"
```

---

### Task 2: Fix dashboard Server Component crash

**Files:**
- Modify: `src/lib/auth/auth-config.ts:90-97`

The dashboard crashes because `getCurrentUser()` re-throws "not configured" errors (line 94-96). In production, if the error message doesn't contain "not configured", it returns null — but if Supabase client creation fails for other reasons (network, cookie issues), it still throws.

- [ ] **Step 1: Make getCurrentUser never throw**

In `src/lib/auth/auth-config.ts`, change the catch block (lines 90-101) to catch ALL errors and return null:

```typescript
  } catch (error) {
    // Log detailed error for debugging
    console.error('[Auth] Error getting current user:', error);

    // Never throw from getCurrentUser — return null so the page can render
    // The middleware already handles redirects for unauthenticated users
    return null;
  }
```

Remove the re-throw block (lines 94-97):
```typescript
    // DELETE THESE LINES:
    // if (error instanceof Error && error.message.includes('not configured')) {
    //   throw error;
    // }
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/auth-config.ts
git commit -m "fix: prevent getCurrentUser from throwing — return null on all errors"
```

---

### Task 3: Fix Google OAuth redirecting to localhost

**Files:**
- Modify: `src/lib/utils/url-validator.ts:9-33`

The issue: `NEXT_PUBLIC_APP_URL` is a build-time variable (prefixed with `NEXT_PUBLIC_`). If it's missing or set to a placeholder during the Docker build, it gets baked as empty into the client JS bundle. The `getAppUrl()` function on client-side then falls through to `window.location.origin` — but the Supabase OAuth redirect URL is constructed before the page loads (during `signInWithOAuth`), so it may resolve incorrectly.

The `isValidProductionUrl()` function rejects URLs containing "localhost" — but this means in the Coolify Docker build, if `NEXT_PUBLIC_APP_URL` is not passed as a build arg, the fallback chain fails.

- [ ] **Step 1: Harden getAppUrl to always prefer the production domain**

In `src/lib/utils/url-validator.ts`, update `isValidProductionUrl` to NOT reject localhost in non-production:

```typescript
function isValidProductionUrl(url: string | undefined): boolean {
  if (!url) return false;
  
  // Reject common placeholder patterns
  const placeholderPatterns = [
    'your-production-domain',
    'yourdomain',
    'example.com',
    'placeholder',
  ];
  
  const lowerUrl = url.toLowerCase();
  for (const pattern of placeholderPatterns) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }
  
  // In production, must start with https:// and NOT be localhost
  if (process.env.NODE_ENV === 'production') {
    if (!url.startsWith('https://')) return false;
    if (lowerUrl.includes('localhost')) return false;
  }
  
  return true;
}
```

- [ ] **Step 2: Add COOLIFY_URL/COOLIFY_FQDN fallback to getAppUrl**

Coolify always injects `COOLIFY_URL` and `COOLIFY_FQDN` into containers. Use these as fallback if `NEXT_PUBLIC_APP_URL` is missing at runtime:

```typescript
export function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  // Coolify injects these automatically
  const coolifyUrl = process.env.COOLIFY_URL;
  
  // Server-side: use environment variables (with validation)
  if (typeof window === 'undefined') {
    if (isValidProductionUrl(envUrl)) {
      return envUrl!;
    }
    if (isValidProductionUrl(nextAuthUrl)) {
      return nextAuthUrl!;
    }
    if (isValidProductionUrl(coolifyUrl)) {
      return coolifyUrl!;
    }
    return 'http://localhost:3000';
  }

  // Client-side: prefer env var, fallback to current origin
  if (isValidProductionUrl(envUrl)) {
    return envUrl!;
  }
  
  // In production, always use window.location.origin as the most reliable source
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  
  return window.location.origin;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/url-validator.ts
git commit -m "fix: harden OAuth redirect URL — use COOLIFY_URL fallback, prefer window.location.origin in production"
```

---

### Task 4: Remove NextAuth (unused dual-auth system)

**Files:**
- Delete: `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `package.json` (remove next-auth dependency)

The login and register pages use **Supabase Auth** exclusively (`supabase.auth.signInWithOAuth`, `supabase.auth.signInWithPassword`). The NextAuth route at `src/app/api/auth/[...nextauth]/route.ts` is never called by any page. It imports `createClient` from supabase/server inside its callbacks, making it a confusing hybrid. Removing it eliminates dead code and a potential auth confusion vector.

- [ ] **Step 1: Verify NextAuth is not imported anywhere else**

Search for `next-auth` imports in the codebase (excluding the [...nextauth] route itself):

```bash
grep -r "from 'next-auth'" src/ --include="*.ts" --include="*.tsx" | grep -v "nextauth"
grep -r "from \"next-auth\"" src/ --include="*.ts" --include="*.tsx" | grep -v "nextauth"
grep -r "useSession\|getSession\|getServerSession" src/ --include="*.ts" --include="*.tsx"
```

If any files import from next-auth, they need to be migrated to Supabase Auth first.

- [ ] **Step 2: Delete the NextAuth route**

```bash
rm -rf src/app/api/auth/\[...nextauth\]
```

- [ ] **Step 3: Remove next-auth from package.json**

In `package.json`, remove:
```json
    "next-auth": "^4.24.11",
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: remove unused NextAuth — app uses Supabase Auth exclusively"
```

---

## Phase 2: Upgrade Next.js 14 → 15

### Task 5: Upgrade Next.js and remove deprecated packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update Next.js to 15 and remove deprecated auth-helpers**

```bash
npm install next@15 @next/env@15
npm uninstall @supabase/auth-helpers-nextjs
```

Note: `@supabase/ssr` 0.5.2 is already installed and used everywhere. `@supabase/auth-helpers-nextjs` is deprecated and should be removed.

- [ ] **Step 2: Verify no code imports from auth-helpers-nextjs**

```bash
grep -r "@supabase/auth-helpers" src/ --include="*.ts" --include="*.tsx"
```

The earlier exploration confirmed zero imports — safe to remove.

- [ ] **Step 3: Run the build to identify breaking changes**

```bash
npm run build 2>&1 | head -100
```

Common Next.js 15 breaking changes to check:
- `cookies()` returns a Promise (already handled in your code)
- `params` in dynamic routes/API routes is now a Promise
- `searchParams` in page components is now a Promise
- `headers()` returns a Promise

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade Next.js 14.2 → 15, remove deprecated @supabase/auth-helpers-nextjs"
```

---

### Task 6: Fix async params in dynamic routes (Next.js 15 breaking change)

**Files:**
- Modify: All files under `src/app/` that use `params.id` or `params.slug` synchronously

In Next.js 15, `params` is a Promise in page components and API routes. Every file that does `params.id` must change to `(await params).id`.

- [ ] **Step 1: Fix dynamic page components**

For each file that accesses `params.id` or `params.slug`, change the function signature and await params.

Example pattern — for `src/app/dashboard/current-affairs/[id]/page.tsx`:

Before:
```typescript
export default async function Page({ params }: { params: { id: string } }) {
  const affair = await getCurrentAffairById(params.id);
```

After:
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const affair = await getCurrentAffairById(id);
```

For client components that use `params` via `useParams()` hook — these are UNCHANGED (the hook still returns sync values).

Apply this pattern to ALL server-side dynamic routes:
- `src/app/dashboard/current-affairs/[id]/page.tsx`
- `src/app/dashboard/notes/[slug]/page.tsx`
- `src/app/dashboard/daily-digest/[date]/page.tsx`
- `src/app/dashboard/lectures/[id]/page.tsx`
- `src/app/dashboard/library/[id]/page.tsx`
- `src/app/dashboard/videos/[id]/page.tsx`
- `src/app/dashboard/quiz/[id]/page.tsx`

And ALL API routes with dynamic segments:
- `src/app/api/ca/article/[id]/route.ts`
- `src/app/api/ca/mcq/[articleId]/route.ts`
- `src/app/api/toppers/[id]/route.ts`
- `src/app/api/current-affairs/[id]/route.ts`
- `src/app/api/doubt/thread/[id]/route.ts`
- `src/app/api/eval/mains/[id]/route.ts`
- `src/app/api/groups/[id]/messages/route.ts`
- `src/app/api/lectures/[id]/cancel/route.ts`
- `src/app/api/lectures/[id]/status/route.ts`
- `src/app/api/notes/[id]/route.ts`
- `src/app/api/quiz/[id]/route.ts`
- `src/app/api/quiz/[id]/submit/route.ts`
- `src/app/api/video/[id]/notes/route.ts`

**Client component pages (use `useParams()` — NO changes needed):**
- `src/app/dashboard/video/[id]/page.tsx` (uses `'use client'`)
- `src/app/dashboard/ask-doubt/[id]/page.tsx` (uses `'use client'`)
- `src/app/dashboard/my-notes/[id]/page.tsx` (uses `'use client'`)
- `src/app/dashboard/practice/session/[id]/page.tsx` (uses `'use client'`)
- `src/app/dashboard/practice/mock/[id]/page.tsx` (uses `'use client'`)

- [ ] **Step 2: Fix searchParams in page components**

Pages that use `searchParams` must also await them. Search for:
```bash
grep -r "searchParams" src/app/ --include="*.tsx" --include="*.ts" -l
```

Apply the same pattern: `{ searchParams }: { searchParams: Promise<{ key: string }> }` and `const { key } = await searchParams`.

- [ ] **Step 3: Run build to verify**

```bash
npm run build 2>&1 | tail -50
```

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "fix: await async params/searchParams for Next.js 15 compatibility"
```

---

### Task 7: Update next.config.js for Next.js 15

**Files:**
- Modify: `next.config.js`

- [ ] **Step 1: Update config for Next.js 15 changes**

In `next.config.js`, the `experimental.serverActions` config moved to top-level in Next.js 15:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: [
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-highlight",
    "@tiptap/extension-image",
    "@tiptap/extension-link",
    "@tiptap/extension-table",
    "@tiptap/extension-table-cell",
    "@tiptap/extension-table-header",
    "@tiptap/extension-table-row",
    "@tiptap/extension-task-item",
    "@tiptap/extension-task-list",
    "@tiptap/extension-text-align",
    "@tiptap/extension-underline",
    "@tiptap/pm",
    "@tiptap/core",
    "@tiptap/extension-paragraph",
    "@tiptap/extension-text"
  ],

  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'emotqkukvfwjycvwfvyj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: process.env.SERVER_IP || '',
        port: '9000',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  serverActions: {
    bodySizeLimit: '10mb',
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // headers() and redirects() stay the same
  async headers() {
    // ... unchanged
  },

  async redirects() {
    // ... unchanged
  },
};

module.exports = nextConfig;
```

Key change: `experimental.serverActions` → `serverActions` (top-level).

- [ ] **Step 2: Commit**

```bash
git add next.config.js
git commit -m "chore: update next.config.js for Next.js 15 — move serverActions to top-level"
```

---

## Phase 3: Replace ioredis with Upstash Redis

### Task 8: Install @upstash/redis and create unified Redis client

**Files:**
- Create: `src/lib/redis/client.ts`
- Modify: `package.json`

- [ ] **Step 1: Install @upstash/redis**

```bash
npm install @upstash/redis
```

- [ ] **Step 2: Create unified Redis client**

Create `src/lib/redis/client.ts`:

```typescript
import { Redis } from '@upstash/redis';

// Singleton Upstash Redis client
let redisInstance: Redis | null = null;

/**
 * Get Upstash Redis client (HTTP-based, Edge-compatible)
 * Returns null if not configured — callers must handle gracefully
 */
export function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url) {
    console.warn('[Redis] No Redis URL configured, features using Redis will be disabled');
    return null;
  }

  // Upstash REST API (preferred — Edge compatible)
  if (token) {
    redisInstance = new Redis({ url, token });
    return redisInstance;
  }

  // If only REDIS_URL is set without a token, Upstash REST won't work.
  // Log a warning — the caller's fallback logic handles this.
  console.warn('[Redis] UPSTASH_REDIS_REST_TOKEN not set. Rate limiting/cache disabled.');
  return null;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/redis/client.ts package.json package-lock.json
git commit -m "feat: add @upstash/redis client — Edge-compatible HTTP Redis"
```

---

### Task 9: Migrate rate limiters to Upstash Redis

**Files:**
- Modify: `src/lib/rate-limit/redis-rate-limiter.ts`
- Modify: `src/lib/security/rate-limiter.ts`
- Modify: `src/lib/security/enhanced-rate-limiter.ts`

- [ ] **Step 1: Rewrite `src/lib/rate-limit/redis-rate-limiter.ts`**

Replace the entire file. Key changes: `ioredis` → `@upstash/redis`, pipeline → individual commands (Upstash has pipeline but with different API):

```typescript
// ══════════════════════════════════════════════════════���════════
// REDIS RATE LIMITER
// Production-ready rate limiting using Upstash Redis (Edge-compatible)
// ══════════════════════════════════��════════════════════════════

import { getRedis } from '@/lib/redis/client';

export interface RateLimitConfig {
    maxRequests: number;
    windowSeconds: number;
    blockDurationSeconds?: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}

export const RateLimitPresets = {
    api: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,
    auth: { maxRequests: 5, windowSeconds: 60, blockDurationSeconds: 300 } as RateLimitConfig,
    payment: { maxRequests: 10, windowSeconds: 60, blockDurationSeconds: 600 } as RateLimitConfig,
    ai: { maxRequests: 20, windowSeconds: 60, blockDurationSeconds: 120 } as RateLimitConfig,
    webhook: { maxRequests: 50, windowSeconds: 60 } as RateLimitConfig,
    free: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
    premium: { maxRequests: 200, windowSeconds: 60 } as RateLimitConfig,
    admin: { maxRequests: 50, windowSeconds: 60 } as RateLimitConfig,
};

export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RateLimitPresets.api
): Promise<RateLimitResult> {
    const redis = getRedis();
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    if (!redis) {
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt: Math.floor((now + windowMs) / 1000),
        };
    }

    const key = `ratelimit:${identifier}`;

    try {
        const currentCount = await redis.get<number>(key);
        const count = currentCount ?? 0;

        if (count >= config.maxRequests) {
            const ttl = await redis.ttl(key);
            return {
                allowed: false,
                remaining: 0,
                resetAt: Math.floor((now + (ttl > 0 ? ttl * 1000 : windowMs)) / 1000),
                retryAfter: ttl > 0 ? ttl : config.windowSeconds,
            };
        }

        // Increment and set expiry atomically using Upstash pipeline
        const p = redis.pipeline();
        p.incr(key);
        p.expire(key, config.windowSeconds);
        const results = await p.exec();

        const newCount = (results[0] as number) ?? count + 1;

        return {
            allowed: true,
            remaining: Math.max(0, config.maxRequests - newCount),
            resetAt: Math.floor((now + windowMs) / 1000),
        };
    } catch (error) {
        console.error('[RateLimit] Error checking limit:', error);
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt: Math.floor((now + windowMs) / 1000),
        };
    }
}

export async function enforceRateLimit(
    identifier: string,
    config: RateLimitConfig = RateLimitPresets.api
): Promise<RateLimitResult> {
    const result = await checkRateLimit(identifier, config);
    if (!result.allowed) {
        throw new RateLimitError(
            `Rate limit exceeded. Try again in ${result.retryAfter || config.windowSeconds} seconds.`,
            result.retryAfter || config.windowSeconds
        );
    }
    return result;
}

export class RateLimitError extends Error {
    public readonly retryAfter: number;
    public readonly code = 'RATE_LIMIT_EXCEEDED';

    constructor(message: string, retryAfter: number) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toString(),
        ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
    };
}

export async function resetRateLimit(identifier: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
        await redis.del(`ratelimit:${identifier}`);
    } catch (error) {
        console.error('[RateLimit] Error resetting limit:', error);
    }
}

export async function getRateLimitStatus(
    identifier: string,
    config: RateLimitConfig = RateLimitPresets.api
): Promise<{ current: number; remaining: number; resetAt: number }> {
    const redis = getRedis();
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    if (!redis) {
        return { current: 0, remaining: config.maxRequests, resetAt: Math.floor((now + windowMs) / 1000) };
    }

    try {
        const key = `ratelimit:${identifier}`;
        const currentCount = await redis.get<number>(key);
        const count = currentCount ?? 0;
        const ttl = await redis.ttl(key);

        return {
            current: count,
            remaining: Math.max(0, config.maxRequests - count),
            resetAt: ttl > 0 ? Math.floor((now + ttl * 1000) / 1000) : Math.floor((now + windowMs) / 1000),
        };
    } catch (error) {
        console.error('[RateLimit] Error getting status:', error);
        return { current: 0, remaining: config.maxRequests, resetAt: Math.floor((now + windowMs) / 1000) };
    }
}
```

- [ ] **Step 2: Rewrite `src/lib/security/rate-limiter.ts`**

Replace the ioredis import and connection with Upstash:

```typescript
// ══════════════════════════════════════════��════════════════════════════════
// RATE LIMITER - Upstash Redis-based distributed rate limiting
// ══════════════════════════════════════════════���════════════════════════════

import { getRedis } from '@/lib/redis/client';
import { NextRequest, NextResponse } from 'next/server';

// ... keep all the interfaces (RateLimitConfig, RateLimitResult) and RATE_LIMITS unchanged ...

export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const redis = getRedis();
    const key = `${config.prefix || 'rl'}:${identifier}`;
    const now = Date.now();
    const windowMs = config.window * 1000;

    if (!redis) {
        // Fail open
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit,
            reset: Math.ceil((now + windowMs) / 1000),
        };
    }

    try {
        // Simple counter-based approach (Upstash doesn't support sorted sets in pipeline efficiently)
        const currentCount = await redis.get<number>(key);
        const count = currentCount ?? 0;
        const reset = Math.ceil((now + windowMs) / 1000);

        if (count >= config.limit) {
            return {
                success: false,
                limit: config.limit,
                remaining: 0,
                reset,
                retryAfter: Math.ceil(windowMs / 1000),
            };
        }

        const p = redis.pipeline();
        p.incr(key);
        p.expire(key, config.window + 1);
        await p.exec();

        return {
            success: true,
            limit: config.limit,
            remaining: Math.max(0, config.limit - count - 1),
            reset,
        };
    } catch (error) {
        console.error('[RateLimiter] Redis error:', error);
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit,
            reset: Math.ceil((now + windowMs) / 1000),
        };
    }
}

// ... keep withRateLimit and checkCostRateLimit — update them to use getRedis() ...
```

For `checkCostRateLimit`, replace `getRedis()` call and use `@upstash/redis` API:

```typescript
export async function checkCostRateLimit(
    userId: string,
    cost: number,
    maxCostPerDay: number = 1000
): Promise<{ allowed: boolean; remaining: number; used: number }> {
    const redis = getRedis();
    const key = `rl:cost:${userId}:${new Date().toISOString().split('T')[0]}`;

    if (!redis) {
        return { allowed: true, remaining: maxCostPerDay, used: 0 };
    }

    try {
        const current = await redis.get<number>(key);
        const used = current ?? 0;

        if (used + cost > maxCostPerDay) {
            return { allowed: false, remaining: maxCostPerDay - used, used };
        }

        await redis.incrby(key, cost);
        await redis.expire(key, 24 * 60 * 60);

        return {
            allowed: true,
            remaining: maxCostPerDay - used - cost,
            used: used + cost
        };
    } catch (error) {
        console.error('[CostRateLimiter] Error:', error);
        return { allowed: true, remaining: maxCostPerDay, used: 0 };
    }
}
```

- [ ] **Step 3: Rewrite `src/lib/security/enhanced-rate-limiter.ts`**

Same pattern — replace ioredis import with `getRedis()` from `@/lib/redis/client`. The enhanced rate limiter already has in-memory fallback which stays unchanged. Replace the Redis connection block (lines 14-33) with:

```typescript
import { getRedis } from '@/lib/redis/client';
import { NextRequest, NextResponse } from 'next/server';

// Remove the old let redisClient / function getRedis() block entirely
// The rest of the file uses getRedis() which now comes from the import
```

Update the `checkRateLimit` function to use Upstash pipeline API instead of ioredis pipeline. Replace sorted set operations (`zadd`, `zremrangebyscore`, `zcard`) with simple counter pattern (same as Task 9 Step 2).

- [ ] **Step 4: Commit**

```bash
git add src/lib/rate-limit/redis-rate-limiter.ts src/lib/security/rate-limiter.ts src/lib/security/enhanced-rate-limiter.ts
git commit -m "feat: migrate all rate limiters from ioredis to @upstash/redis"
```

---

### Task 10: Migrate cache modules to Upstash Redis

**Files:**
- Modify: `src/lib/cache/redis-cache.ts`
- Modify: `src/lib/cache/cache-manager.ts`

- [ ] **Step 1: Rewrite `src/lib/cache/redis-cache.ts`**

Replace `import { Redis } from 'ioredis'` and the singleton block (lines 6-43) with:

```typescript
import { getRedis } from '@/lib/redis/client';
```

Remove the entire `getRedisClient()` function and `redisInstance` variable. Replace every `getRedisClient()` call with `getRedis()`.

Update method signatures — Upstash Redis has slightly different API:
- `redis.setex(key, ttl, value)` → `redis.setex(key, ttl, value)` (same)
- `redis.set(key, value, 'NX', 'EX', ttl)` → `redis.set(key, value, { nx: true, ex: ttl })`
- `redis.pipeline()` is available in `@upstash/redis`
- `redis.keys(pattern)` → `redis.keys(pattern)` (same, but avoid in production — use scan)
- `redis.get(key)` returns typed — no need to JSON.parse for non-string types

Key changes for the lock functions:
```typescript
// acquireLock — change NX/EX syntax
const result = await redis.set(fullKey, lockValue, { nx: true, ex: ttlSeconds });
```

- [ ] **Step 2: Rewrite `src/lib/cache/cache-manager.ts`**

Replace the ioredis import and connection block (lines 6-12) with:

```typescript
import { getRedis } from '@/lib/redis/client';
```

Remove the `_redis` variable and `getRedis()` function. Update all calls — `getRedis()` now returns `Redis | null`, so add null checks:

```typescript
export async function cacheResponse(
    key: string,
    data: any,
    ttl: number = 3600
): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        const serialized = JSON.stringify(data);
        await redis.setex(`cache:${key}`, ttl, serialized);
    } catch (error) {
        console.error('Cache write error:', error);
    }
}
```

Apply same null-check pattern to `getCachedResponse`, `invalidateCache`, `getCacheStats`, `clearCache`, `withCache`.

For `getCacheStats`, the `redis.info()` command is not available in Upstash REST API. Replace with a simpler implementation:

```typescript
export async function getCacheStats(): Promise<CacheStats> {
    const redis = getRedis();
    if (!redis) return { hits: 0, misses: 0, keys: 0, memory: '0B' };

    try {
        const keys = await redis.dbsize();
        return { hits: 0, misses: 0, keys, memory: 'N/A' };
    } catch (error) {
        console.error('Cache stats error:', error);
        return { hits: 0, misses: 0, keys: 0, memory: '0B' };
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cache/redis-cache.ts src/lib/cache/cache-manager.ts
git commit -m "feat: migrate cache modules from ioredis to @upstash/redis"
```

---

### Task 11: Migrate OTP service and API rate limiter to Upstash

**Files:**
- Modify: `src/lib/sms/otp-service.ts`
- Modify: `src/lib/rate-limiter/api-manager.ts`

- [ ] **Step 1: Update `src/lib/sms/otp-service.ts`**

Replace lines 6-12:

```typescript
import { getRedis } from '@/lib/redis/client';
```

Remove the old `_redis` variable and `getRedis()` function. Add null checks to all Redis operations. OTP operations (`setex`, `get`, `del`) are directly compatible with Upstash.

- [ ] **Step 2: Update `src/lib/rate-limiter/api-manager.ts`**

Replace lines 7-13:

```typescript
import { getRedis } from '@/lib/redis/client';
```

Remove the old `_redis` variable and `getRedis()` function. The `A4FRateLimiter` class uses sorted sets (`zadd`, `zremrangebyscore`, `zcard`, `zrange`, `zpopmax`). These are supported by Upstash Redis. Update calls to handle null:

```typescript
async canMakeRequest(): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return true; // fail open

    const now = Date.now();
    const windowStart = now - this.window;

    await redis.zremrangebyscore(this.key, 0, windowStart);
    const count = await redis.zcard(this.key);

    if (count < this.limit) {
        await redis.zadd(this.key, { score: now, member: `${now}-${Math.random()}` });
        return true;
    }

    return false;
}
```

Note: Upstash `zadd` syntax is `redis.zadd(key, { score, member })` instead of `redis.zadd(key, score, member)`.

The `UserRateLimiter` class uses `get`, `incr`, `expire`, `ttl`, `multi` — all supported by Upstash. Replace `redis.multi()` with `redis.pipeline()`:

```typescript
async incrementUsage(userId: string, feature: keyof UserLimits): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    const isHourly = feature.includes('PerHour');
    const window = isHourly ? 3600 : 86400;
    const key = `user:${userId}:${feature}`;

    const current = await redis.get(key);

    const p = redis.pipeline();
    p.incr(key);
    if (!current) {
        p.expire(key, window);
    }
    await p.exec();
}
```

Also fix `apiQueue` initialization (line 148) — it uses `connection: redis` which references ioredis. BullMQ requires ioredis, so import ioredis specifically for this:

```typescript
import IORedis from 'ioredis';

const bullmqRedis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

export const apiQueue = new Queue<APIRequest>('api-requests', {
    connection: bullmqRedis,
    // ... rest unchanged
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/sms/otp-service.ts src/lib/rate-limiter/api-manager.ts
git commit -m "feat: migrate OTP service and API rate limiter to @upstash/redis"
```

---

### Task 12: Migrate health check and admin system routes

**Files:**
- Modify: `src/app/api/health/route.ts`
- Modify: `src/app/api/admin/system/route.ts`

- [ ] **Step 1: Update health check route**

In `src/app/api/health/route.ts`, replace ioredis with Upstash:

```typescript
import { getRedis, isRedisAvailable } from '@/lib/redis/client';
```

Replace the `checkRedis()` function:

```typescript
async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const available = await isRedisAvailable();
    if (!available) {
      return {
        status: 'fail',
        error: 'Redis not available or not configured',
        responseTime: Date.now() - start,
      };
    }
    return {
      status: 'pass',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

- [ ] **Step 2: Update admin system route**

In `src/app/api/admin/system/route.ts`, replace the `require('ioredis')` calls (lines 48, 149, 157) with imports from the unified client:

```typescript
import { getRedis } from '@/lib/redis/client';
```

Replace inline Redis instantiation with `getRedis()` calls and handle null.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/health/route.ts src/app/api/admin/system/route.ts
git commit -m "feat: migrate health check and admin routes to @upstash/redis"
```

---

### Task 13: Keep ioredis ONLY for BullMQ queues

**Files:**
- Verify: `src/lib/queue/worker-queue.ts` (keep ioredis)
- Verify: `src/lib/queues/lecture-queue.ts` (keep ioredis)
- Verify: `src/workers/bullmq-worker.js` (keep ioredis)

BullMQ requires TCP Redis connections (ioredis). These files run server-side only (never in Edge middleware), so ioredis is fine here.

- [ ] **Step 1: Verify BullMQ files are untouched**

These files should still use `ioredis` directly:
- `src/lib/queue/worker-queue.ts` — uses `new Redis()` for BullMQ Queue/Worker
- `src/lib/queues/lecture-queue.ts` — uses `new Redis()` for BullMQ Queue
- `src/workers/bullmq-worker.js` — uses `require('ioredis')` for BullMQ Worker

No changes needed. ioredis stays in `package.json` for these files.

- [ ] **Step 2: Commit (if any adjustments needed)**

```bash
git add -A
git commit -m "chore: verify BullMQ queues retain ioredis for TCP connections"
```

---

### Task 14: Update environment variables documentation

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add Upstash env vars to .env.example**

Add these new variables:

```bash
# Upstash Redis (Edge-compatible — preferred over REDIS_URL for rate limiting/cache)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Traditional Redis (still needed for BullMQ job queues)
REDIS_URL=redis://localhost:6379
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add Upstash Redis env vars to .env.example"
```

---

### Task 15: Build and verify

- [ ] **Step 1: Run full build**

```bash
npm run build 2>&1
```

Expected: Build succeeds with no ioredis-related Edge runtime errors. The `pino` warning may remain (separate issue).

- [ ] **Step 2: Check middleware size**

Look for `Middleware` line in build output. Should be smaller now that rate limiting is not bundled.

- [ ] **Step 3: Verify no ioredis imports remain in non-BullMQ files**

```bash
grep -r "from.*ioredis\|require.*ioredis" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```

Expected: Only these files should still import ioredis:
- `src/lib/queue/worker-queue.ts`
- `src/lib/queues/lecture-queue.ts`
- `src/workers/bullmq-worker.js`
- `src/lib/rate-limiter/api-manager.ts` (for BullMQ Queue only)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Next.js 15 upgrade + Upstash Redis migration

- Upgrade Next.js 14.2 → 15
- Replace ioredis with @upstash/redis for rate limiters, cache, OTP, health check
- Keep ioredis only for BullMQ queues (requires TCP)
- Fix Google OAuth localhost redirect
- Fix dashboard Server Component crash
- Add metadataBase to layout
- Remove unused NextAuth dual-auth system
- Await async params/searchParams for Next.js 15"
```

---

## Post-Deployment Checklist

After deploying to Coolify:

1. **Supabase Dashboard** — Set Site URL to `https://upscbyvarunsh.aimasteryedu.in` and add `https://upscbyvarunsh.aimasteryedu.in/auth/callback` to Redirect URLs
2. **Google Cloud Console** — Update OAuth redirect URI to `https://upscbyvarunsh.aimasteryedu.in/auth/callback`
3. **Coolify Environment Variables** — Add:
   - `UPSTASH_REDIS_REST_URL` (get from Upstash dashboard)
   - `UPSTASH_REDIS_REST_TOKEN` (get from Upstash dashboard)
   - Verify `NEXT_PUBLIC_APP_URL=https://upscbyvarunsh.aimasteryedu.in` is set as **build-time** variable
   - Verify `NEXTAUTH_URL=https://upscbyvarunsh.aimasteryedu.in`
4. **Test Google OAuth** — Sign up with Google, verify redirect goes to production URL
5. **Test Dashboard** — Navigate to /dashboard, verify no Server Component error
