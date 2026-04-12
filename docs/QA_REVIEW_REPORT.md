# UPSC PrepX-AI — QA Review Report
**Date:** 2026-04-12
**Reviewer:** Quinn (QA Engineer)
**Scope:** Full app audit against PRD v8.0, BUILD_REVIEW_COMPLETE_REPORT, env.production

---

## EXECUTIVE SUMMARY

| Category | Score | Details |
|----------|-------|---------|
| **Code Completeness** | 85% | 106 pages, 160+ API routes, 142 components, 251+ lib files |
| **PRD Alignment** | 70% | Most features exist as pages/APIs, but many lack end-to-end wiring |
| **Database Schema** | 90% | 39 migrations covering all required tables, but types are STALE |
| **Env Var Wiring** | 40% | 3 CRITICAL mismatches, 32 missing vars, 65 unused vars |
| **Security** | 75% | Middleware protection solid, RLS on all tables, but gaps exist |
| **Deployment Readiness** | 50% | Build passes, but env wiring + service deps block production |

**Verdict: NOT READY FOR PRODUCTION** — Critical env var mismatches will cause AI routing to fail. Fix the 5 blockers below before deploying.

---

## SECTION 1: CRITICAL BLOCKERS (Fix Before Deploy)

### BLOCKER 1: 9Router Env Var Name Mismatch
**Severity:** CRITICAL — AI routing will completely fail
**Finding:** Code uses `NINE_ROUTER_*` prefix but env.production has `9ROUTER_*`

| Code Expects | env.production Has | Impact |
|---|---|---|
| `NINE_ROUTER_BASE_URL` | `9ROUTER_BASE_URL` | Primary AI provider unreachable |
| `NINE_ROUTER_API_KEY` | `9ROUTER_API_KEY` | No auth to 9Router |
| `NINE_ROUTER_MODEL` | Not defined | Model selection fails |

**Files:** `src/lib/ai/ai-provider-client.ts:56-57`, `src/lib/ai/router/ai-provider-router.ts:90-91`
**Fix:** Either rename in env.production OR update code to match. Env rename is safest.

### BLOCKER 2: Supabase Anon Key Name Mismatch (Coolify)
**Severity:** CRITICAL — Auth will fail if Coolify uses wrong var name
**Finding:** Code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` but previous Coolify config had `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
**Fix:** Ensure Coolify env uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### BLOCKER 3: Groq Single Key vs Multi-Key Mismatch
**Severity:** HIGH — Groq fallback may fail
**Finding:** Code reads `GROQ_API_KEY` (single), env.production defines `GROQ_API_KEY_1` through `_7` + single `GROQ_API_KEY`
**Status:** The single `GROQ_API_KEY` IS defined in env.production, so this works. But the numbered keys and rotation settings are DEAD CODE — not used anywhere.
**Files:** `src/lib/ai/ai-provider-client.ts:87`, `src/lib/ai/router/ai-provider-router.ts:103`

### BLOCKER 4: Supabase Types File is Stale
**Severity:** HIGH — TypeScript type safety broken for 100+ tables
**Finding:** `src/types/supabase.ts` defines 26 tables. Migrations create 166+ tables. Last type generation: April 4. Last migration: April 12.
**Fix:** Run `npm run db:types` to regenerate

### BLOCKER 5: 32 Missing Env Vars Referenced in Code
**Severity:** HIGH — Multiple features will error at runtime

Key missing variables:
| Variable | Used By | Impact |
|---|---|---|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Payment UI | Payments broken on client |
| `GOOGLE_CLIENT_ID` | OAuth login | Google login broken |
| `GOOGLE_CLIENT_SECRET` | OAuth login | Google login broken |
| `RESEND_API_KEY` | Email service | Emails may fail |
| `LOKI_URL` | Observability | Logging gaps |
| `TEMPO_URL` | Observability | Tracing gaps |
| `CRON_SECRET` | Cron auth | Cron jobs unprotected |
| `ADMIN_SECRET_TOKEN` | Admin auth | Admin API gaps |
| `A4F_API_KEY` / `A4F_BASE_URL` | AI routing | Unknown provider "A4F" |
| `SUPABASE_EDGE_FUNCTION_URL` | Edge function calls | Edge functions may fail |
| `IP_HASH_SALT` | Security | IP hashing broken |
| `MAUTIC_USERNAME` / `MAUTIC_PASSWORD` | Marketing | Mautic auth broken |

---

## SECTION 2: PRD vs IMPLEMENTATION GAP ANALYSIS

### READ Mode Features (F1-F14)

| Feature | PRD Requirement | Page Exists | API Exists | Edge Fn | Status |
|---|---|---|---|---|---|
| F1: Smart Onboarding | 5-step wizard + diagnostic quiz | `/onboarding` | `/api/onboarding/*` (4 routes) | `onboarding-pipe` | PARTIAL — page + API exist, edge fn exists |
| F2: Daily Current Affairs | Daily digest + EN/HI + MCQs | `/dashboard/daily-digest` | `/api/ca/*` (4 routes) | `daily-digest-pipe` | PARTIAL — page + API exist |
| F3: AI Notes Library | Syllabus tree + 3 depth levels | `/dashboard/notes/[slug]` | `/api/notes/*` (5 routes) | `notes-generator-pipe` | PARTIAL — page + API exist |
| F4: User Content Studio | TipTap editor + AI enhance | `/dashboard/my-notes/[id]` | `/api/studio/*` (4 routes) | `custom-notes-pipe` | PARTIAL — page + API exist |
| F5: AI Doubt Solver | Text + OCR + voice input | `/dashboard/ask-doubt` | `/api/doubt/*` (5 routes) | `doubt-solver-pipe` | PARTIAL — page + API exist |
| F6: Mains Evaluator | TipTap + scoring + model answer | `/dashboard/answer-practice` | `/api/eval/mains/*` (3 routes) | `mains-evaluator-pipe` | PARTIAL — page + API exist |
| F7: Adaptive MCQ | 5 modes + adaptive difficulty | `/dashboard/quiz/*` | `/api/mcq/*` + `/api/quiz/*` | `quiz-engine-pipe` | GOOD — multiple pages + APIs |
| F8: AI Study Planner | Weekly calendar + AI regen | `/dashboard/planner` | `/api/planner/*` (6 routes) | `planner-pipe` | GOOD — 6 API routes |
| F9: Progress Dashboard | Syllabus tree + charts | `/dashboard/progress` | `/api/analytics/*` | N/A | PARTIAL — page exists |
| F10: AI Mentor Chat | RAG-powered + modes | `/dashboard/mentor` | `/api/mentor/chat` | `mentor-chat-pipe` | PARTIAL — single API |
| F11: Smart Search | Vector + FTS hybrid | `/dashboard/search` | `/api/search/query` | `search-pipe` | PARTIAL — single API |
| F12: PDF Reader | react-pdf + annotations | `/dashboard/library/[id]` | N/A | N/A | PARTIAL — page exists |
| F13: Gamification | XP + badges + leaderboard | `/dashboard/leaderboard` | `/api/leaderboard` | `gamification-pipe` | PARTIAL — basic API |
| F14: Bookmarks & Revision | Tags + SRS dates | `/dashboard/bookmarks` | `/api/bookmarks/*` (3 routes) | N/A | GOOD |

### WATCH Mode Features (F15-F18)

| Feature | PRD Requirement | Page Exists | API Exists | Status |
|---|---|---|---|---|
| F15: Animated Lectures | Custom player + hls.js + chapters | `/dashboard/lectures/[id]` | `/api/lectures/*` (4 routes) | PARTIAL — page + API exist, VPS services NOT deployed |
| F16: Manim-Enhanced Notes | Inline animated diagrams | Embedded in notes | N/A | NOT VERIFIED — depends on Manim VPS |
| F17: Animated MCQ Explanations | 30-60s Manim clips | Embedded in quiz | N/A | NOT VERIFIED — depends on Manim VPS |
| F18: Monthly Recap Video | Remotion-compiled | `/dashboard/monthly-compilation` | N/A | STUB — page exists, no video pipeline |

### Admin Features (F19)

| Admin Module | PRD Requirement | Page Exists | API Exists | Status |
|---|---|---|---|---|
| Dashboard | Users, revenue, AI usage | `/admin` | `/api/admin/metrics/*` | GOOD — 6 metric endpoints |
| Users | Search, profiles, activity | `/admin/users` | `/api/admin/users` | PARTIAL |
| Knowledge Base | Upload PDFs, chunk, embed | `/admin/knowledge-base` | N/A | PAGE ONLY — no backend |
| Content (READ) | Notes management | `/admin/content` | N/A | PAGE ONLY |
| Lectures (WATCH) | Queue, job status | `/admin/lectures` | `/api/admin/queue` | PARTIAL |
| Current Affairs | Approve/reject | N/A | N/A | MISSING PAGE |
| AI Providers | Enable/disable, priority | `/admin/ai-providers` | `/api/admin/ai-providers` | GOOD |
| Hermes Agent | Status, jobs, logs | `/admin/hermes/*` (3 pages) | N/A | PAGES ONLY — no Hermes installed |
| Subscriptions | Revenue, coupons | `/admin/subscriptions` | `/api/admin/subscriptions` | PARTIAL |
| Feedback | Issues, resolution | `/admin/feedback` | N/A | PAGE ONLY |
| System | Jobs, cache, flags | `/admin/system` | `/api/admin/system` | PARTIAL |

### BONUS Features (Beyond PRD)

These exist in code but are NOT in the original PRD v8.0:
- `/dashboard/math-solver` + `math-solver-pipe` — Math equation solving
- `/dashboard/legal` + `legal-pipe` — Constitutional law explainer
- `/dashboard/memory-palace` — Memory technique tool
- `/dashboard/geography` — Geography atlas
- `/dashboard/community` + `/dashboard/groups` — Community forum
- `/dashboard/video-shorts` — Short video generation
- `/dashboard/toppers` — Topper interviews/strategies
- `/admin/ml-analytics` — ML analytics dashboard
- `/admin/ai-cost` — AI cost tracking
- `/admin/business` — Business dashboards
- `/admin/leads` — Lead management
- `/admin/revenue-analytics` — Revenue deep-dive
- `/admin/conversion` — Conversion funnel

---

## SECTION 3: SECURITY AUDIT

### Middleware Protection (src/middleware.ts)

| Check | Status | Notes |
|---|---|---|
| Dashboard routes protected | PASS | All `/dashboard/*` require auth |
| Admin routes protected | PASS | All `/admin/*` require auth + role check |
| Admin role DB verification | PASS | Queries `users` table for `admin`/`super_admin` role |
| Rate limiting per route type | PASS | Different presets for auth, payment, webhook, admin, api |
| Security headers | PASS | Applied to all responses |
| CORS preflight | PASS | Handled |
| Request ID tracing | PASS | Generated for all requests |
| Auth route redirect | PASS | Authenticated users redirected from `/login`, `/register` |

### RLS (Row-Level Security)

| Check | Status | Notes |
|---|---|---|
| RLS enabled on all tables | PASS | Migration 012 enables RLS globally |
| Audit logs restricted | PASS | Migration 039: super_admin only |
| Default restrictive policies | PASS | Migration 012 sets deny-by-default |

### Security Gaps

| Gap | Severity | Details |
|---|---|---|
| `NEXT_PUBLIC_ADMIN_SECRET` referenced | HIGH | Admin secret should NEVER be client-side |
| Missing `CRON_SECRET` | MEDIUM | Cron endpoints may be callable without auth |
| Razorpay test keys in production | HIGH | `rzp_test_*` keys — need LIVE keys for real payments |
| `RAZORPAY_WEBHOOK_SECRET` is a URL | HIGH | Should be a secret string, not a dashboard URL |

---

## SECTION 4: DATABASE AUDIT

### Migration Coverage
- **39 migration files** covering all PRD-required tables
- **166+ tables created** (includes system tables, analytics, etc.)
- **Extensions enabled:** uuid-ossp, pg_trgm, pgvector (for RAG)

### Type Safety Gap
- **Types file defines:** 26 tables
- **Migrations create:** 166+ tables
- **Gap:** 140+ tables have NO TypeScript type definitions
- **Impact:** Runtime errors when accessing untyped tables, no IDE autocomplete

### Edge Functions
- **15 edge functions deployed** (all PRD-required pipes present)
- **Shared utilities:** ai-provider, cors, entitlement, simplified-lang
- **Missing from PRD:** `lecture_trigger_pipe`, `render_webhook_pipe`, `admin_users_pipe`, `admin_content_pipe`, `admin_hermes_pipe`

---

## SECTION 5: ENV VAR AUDIT SUMMARY

| Category | Count | Action Required |
|----------|-------|---|
| **Critical name mismatches** | 3 | FIX IMMEDIATELY |
| **Missing from env.production** | 32 | Add to Coolify or add fallbacks in code |
| **In env.production but unused** | 65 | Review — many are for future phases or external services |
| **Correctly wired** | ~40 | Working |

### Unused env vars that should be wired (top priority):
- All `SMTP_*` vars — email service code uses `RESEND_API_KEY` instead of SMTP
- All `MAUTIC_DB_*` vars — only Mautic Docker needs these, not the app
- All `JAEGER_*` vars — code uses `TEMPO_URL` for tracing instead
- `NEXTAUTH_*` vars — code does use NextAuth, likely wired but not found via simple grep
- Feature flag vars (`ENABLE_*`) — code may read them but agent didn't find references

---

## SECTION 6: DEPLOYMENT READINESS CHECKLIST

| Check | Status | Notes |
|---|---|---|
| `next build` passes | PASS | Build succeeds after tiptap fix |
| All pages compile | PASS | 106 pages compile |
| Middleware active | PASS | Auth + rate limiting active |
| Database migrations | PASS | 39 migrations ready |
| Edge functions | PASS | 15 functions deployed |
| Redis required | BLOCKED | Not deployed on Coolify yet |
| MinIO required | BLOCKED | Not deployed on Coolify yet |
| Env vars correct | FAIL | 3 critical mismatches |
| Supabase types current | FAIL | 140+ tables untyped |
| Razorpay live keys | FAIL | Still using test keys |
| VPS services (Manim/Remotion) | BLOCKED | Not deployed |
| Hermes Agent | BLOCKED | Not installed |
| SSL/HTTPS | PASS | Coolify handles Let's Encrypt |

---

## SECTION 7: RECOMMENDED FIX PRIORITY

### P0 — Fix Today (Blocks Deployment)

1. **Fix env var naming** — Add to Coolify:
   ```
   NINE_ROUTER_BASE_URL=https://r94p885.9router.com/v1
   NINE_ROUTER_API_KEY=sk-da7a2ad945e26f3a-qsxe57-15d6ca9a
   NINE_ROUTER_MODEL=upsc
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
   GROQ_API_KEY=<your groq key>
   ```

2. **Fix Razorpay webhook secret** — The value `https://dashboard.razorpay.com/app/webhooks/S44p5tYvYIOh61` is a URL, not a secret. Get the actual webhook signing secret from Razorpay dashboard.

3. **Deploy Redis + MinIO on Coolify** (see COOLIFY_DEPLOYMENT_GUIDE.md)

### P1 — Fix This Week

4. **Regenerate Supabase types** — `npm run db:types`
5. **Add missing env vars** — At minimum: `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `CRON_SECRET`, `SUPABASE_EDGE_FUNCTION_URL`
6. **Remove `NEXT_PUBLIC_ADMIN_SECRET`** from any client-side code — admin secrets must never be in the browser
7. **Switch Razorpay to LIVE keys** when ready

### P2 — Fix Before Beta

8. **Deploy VPS services** (Manim, Remotion, TTS, Search proxy)
9. **Install Hermes Agent** for automated content generation
10. **Add Google OAuth credentials** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
11. **Wire missing admin API backends** (knowledge-base, feedback, current-affairs management)
12. **End-to-end test all 14 READ mode features**

### P3 — Fix Before GA

13. **Complete WATCH mode pipeline** (lectures depend on VPS services)
14. **Load test with 50+ concurrent users**
15. **WCAG 2.1 AA accessibility audit**
16. **Bilingual content verification** (EN + HI on all pages)
17. **Mobile responsiveness test** (360px minimum viewport)

---

## SECTION 8: FEATURE WIRING STATUS (End-to-End)

Legend: UI = Page exists | API = Route handler exists | SVC = Service/lib logic exists | DB = Migration/table exists | EF = Edge function exists

| Feature | UI | API | SVC | DB | EF | E2E Wired? |
|---|---|---|---|---|---|---|
| Onboarding | Y | Y | Y | Y | Y | LIKELY YES |
| Daily Digest | Y | Y | Y | Y | Y | LIKELY YES |
| Notes Library | Y | Y | Y | Y | Y | LIKELY YES |
| Content Studio | Y | Y | Y | Y | Y | LIKELY YES |
| Doubt Solver | Y | Y | Y | Y | Y | LIKELY YES |
| Mains Evaluator | Y | Y | Y | Y | Y | LIKELY YES |
| MCQ Practice | Y | Y | Y | Y | Y | LIKELY YES |
| Study Planner | Y | Y | Y | Y | N/A | LIKELY YES |
| Progress Dashboard | Y | Y | Y | Y | N/A | PARTIAL — needs analytics wiring |
| Mentor Chat | Y | Y | Y | Y | Y | LIKELY YES |
| Smart Search | Y | Y | Y | Y | Y | LIKELY YES |
| PDF Reader | Y | N | Y | Y | N/A | PARTIAL — no API route |
| Gamification | Y | Y | Y | Y | Y | LIKELY YES |
| Bookmarks/SRS | Y | Y | Y | Y | N/A | LIKELY YES |
| Lectures | Y | Y | Y | Y | N/A | BLOCKED — VPS not deployed |
| Admin Dashboard | Y | Y | Y | Y | N/A | PARTIAL — some panels page-only |
| Payments | Y | Y | Y | Y | N/A | BLOCKED — test keys only |

---

**Report generated by Quinn — QA Engineer**
**Next step:** Fix P0 blockers, then redeploy to Coolify
