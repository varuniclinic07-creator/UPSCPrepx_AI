# Admin Panel Route Audit — Phase 1 (D3)

**Date:** 2026-04-18
**Scope:** `src/app/(admin)/admin/**/page.tsx` — 26 routes, 7,835 total lines.

## Method

Each page classified by signal:

- **Real** — page fetches production data (Supabase client, internal API route, or react-query hook).
- **Stubbed** — page renders hardcoded or procedurally-generated fake data (`Math.random`, literal arrays) OR has no data-access at all and under ~150 lines.
- **Missing** — referenced in nav but no `page.tsx`. (None found in this sweep.)

Signals grepped: `from('…')`, `.select(…)`, `.rpc(…)`, `createClient`, `fetch('/api/`, `useQuery`, plus anti-signals `Math.random`, `mockData`, `// TODO`, `// FIXME`.

## Inventory

| Route | LOC | Data Access | Anti-Signals | Category | Next Action |
|---|---|---|---|---|---|
| `/admin` | 433 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/ai-cost` | 436 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/ai-providers` | 418 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/ai-usage` | 379 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/analytics` | 434 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/billing` | 381 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/business` | 444 | ✅ 3 hits | — | **Real** | Keep |
| `/admin/console` | 197 | ✅ 9 hits | — | **Real** | Keep |
| `/admin/content` | 233 | ✅ 2 hits | — | **Real** | Keep |
| `/admin/conversion` | 347 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/features` | 216 | ✅ 3 hits | — | **Real** | Keep |
| `/admin/feedback` | 45 | ❌ none | — | **Stubbed** | Phase-3 replace |
| `/admin/hermes` | 210 | ✅ 1 hit | — | **Real (legacy)** | Keep for now; retires when Hermes is removed in Phase 3 |
| `/admin/hermes/jobs` | 190 | ✅ 1 hit | — | **Real (legacy)** | Keep for now; Hermes retirement Phase 3 |
| `/admin/hermes/logs` | 138 | ❌ none | — | **Stubbed** | Phase-3 replace (goes away with Hermes) |
| `/admin/knowledge-base` | 222 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/leads` | 234 | ✅ 2 hits | — | **Real** | Keep |
| `/admin/lectures` | 184 | ✅ 3 hits | — | **Real** | Keep |
| `/admin/ml-analytics` | 509 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/queue` | 380 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/revenue-analytics` | 322 | ✅ 1 hit | — | **Real** | Keep |
| `/admin/source-intelligence` | 409 | ✅ 5 hits | — | **Real** | Keep |
| `/admin/subscriptions` | 56 | ❌ none | — | **Stubbed** | Phase-3 replace |
| `/admin/system` | 540 | ✅ 6 hits | — | **Real** | Keep |
| `/admin/users` | 151 | ✅ 1 hit | **`Math.random` x3** | **Stubbed** | **Phase-3 replace — actively fabricates user XP** |
| `/admin/users-analytics` | 327 | ✅ 1 hit | — | **Real** | Keep |

**Totals:** 22 real · 4 stubbed · 0 missing

## Stubbed pages detail

### `/admin/users` — HIGH PRIORITY
Line 36: `xp: Math.floor(Math.random() * 5000)` — procedurally generates fake XP values for a list of users. This is the exact "fake stats" anti-pattern the v8 spec §7.3 success criteria forbids. **Must be replaced or fixed before Phase 1 tag.**

### `/admin/feedback` (45 lines)
No data access. Renders static UI without a backing query.

### `/admin/subscriptions` (56 lines)
No data access. Likely a placeholder scaffold that was never wired up.

### `/admin/hermes/logs` (138 lines)
No data access. Hermes logs surface without a log source. Will be retired with Hermes in Phase 3.

## Phase-1 decision (D3 scope)

- **This audit documents** the state of the admin surface; it does NOT bulk-replace stubbed admin pages with `Phase2Placeholder`. Admin is internal-only and the volume (4 pages) is small enough to handle per-case.
- **Required before Phase-1 tag:** `/admin/users` fake-XP generator must be replaced — either wire to real `v8_user_mastery` aggregate or gate the column behind a "Phase 2B" marker. Tracked as follow-up below.
- **Deferred to Phase 3:** `/admin/feedback`, `/admin/subscriptions`, `/admin/hermes/logs` replacements. None are user-facing Phase-1 surfaces.

## Follow-up tasks

1. **Fix `/admin/users` Math.random XP** before Phase-1 tag. Replace the `Math.floor(Math.random() * 5000)` expression with a real aggregate from `v8_user_mastery` OR delete the XP column from that admin list view and mark "XP — Phase 2B" inline.
2. **Phase-3 admin triage ticket** covering the three other stubbed pages; include them in the Hermes retirement sweep.
