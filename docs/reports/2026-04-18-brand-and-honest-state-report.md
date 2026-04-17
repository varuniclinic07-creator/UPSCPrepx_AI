# Implementation Report — 2026-04-18

## Scope of this session

Close the highest-impact gap between the UPSC PrepX AI codebase and the v8
spec by (a) giving the product a coherent brand, (b) removing the
"fake-stats" fresh-user experience on the dashboard, (c) tightening the
landing page, (d) stopping the worker Docker image from hiding TS
compile errors, and (e) shipping the admin + test-premium credentials
the user needs for internal QA.

## What landed

### 1. Brand system
- `src/components/brand/logo.tsx` — `LogoMark` (hexagonal SVG badge with
  crossed blue knowledge × orange action curves converging at a luminous
  central node) and `Logo` lockup (mark + wordmark + "Chanakya AI"
  kicker), with sizes xs / sm / md / lg / xl.
- `public/logo.svg` — static equivalent for OG images, transactional
  emails, external embeds.
- `public/favicon.svg` — rounded-rect 64×64 favicon variant.
- `src/components/brand/welcome-splash.tsx` — Framer Motion splash with
  spring-assembled logo, rotating conic halo, wordmark, progress bar.
  Session-gated via `sessionStorage` (`upsc-splash-seen-v1`), so users
  see it once per tab, never twice in the same session.

### 2. Dashboard — honest zero-state
File: `src/app/dashboard/page.tsx`

Killed every piece of fixture data that was making fresh users see a
fake history of activity:

| Before (fixture)                      | After (real DB or honest empty) |
| ------------------------------------- | ------------------------------- |
| `+12%`, `+5 pts`, `+2%`, `up 40`      | Removed. No deltas until week-over-week data exists. |
| `#1,240` rank                         | `Unranked` until `rank_estimate` is computed (shows "unlocks after 3 mocks"). |
| `12` day streak                       | `data.studyStreak` from `user_progress.study_streak`. |
| Week checkmarks `i < 5`               | Derived from `last_active_dates` vs. Monday–Sunday of current week. |
| Hardcoded "Polity Mastery 78%" etc.   | `InsightCard` rendered only when `mockCount > 0`. Text uses real % / avg. |
| Hardcoded earned badges               | `earnedBadges` set from real thresholds (7d streak, 100 quizzes, top-100 rank, 90% syllabus). |
| Fake "Recent Activity" (3 entries)    | Pulls `user_activity`, falls back to `notes`, shows empty-state CTA otherwise. |
| Hardcoded mentor Economy/Polity tip   | Derived from real syllabus %, mock avg, or streak; silent when there's no signal. |

Fresh users now see a dedicated welcome banner ("A blank slate. A 2-year
plan. One AI mentor.") with two CTAs — generate your first notes or read
today's current affairs. No phantom streaks, no borrowed ranks.

`WelcomeSplash` is rendered once per session from the dashboard layout
with the user's first name as the greeting.

### 3. Landing page cleanup
File: `src/app/page.tsx`

- Nav and footer "P" placeholder squares replaced with the real `Logo`
  component.
- Vanity stats (`50K+ Questions`, `2000+ Study Notes`, `99% Uptime`,
  `4.8 Rating`) replaced with a **Capabilities** section that states
  verifiable facts: 40+ whitelisted sources, 3 agentic systems, 2-year
  structured coverage, E2E encryption.
- "Interactive preview" placeholder blocks in the three storytelling
  sections replaced with actual visual mockups:
  `NotesPreview` (Article 21 Polity sample), `EvaluationPreview`
  (GS-4 rubric scorecard), `ProgressPreview` (subject progress bars).
- Hero bento cards are explicitly labelled "Sample" so nothing on the
  page makes a false personal-data claim.
- Final CTA block now uses `LogoMark` instead of a generic shield icon.

### 4. Worker build no longer hides compile errors
- `Dockerfile.worker`: removed `|| true` from `npx tsc …`. TS errors
  will now fail the worker image build.
- `tsconfig.worker.json`: new worker-scoped tsconfig (rootDir `src`,
  outDir `dist`, CJS target, scoped `include` limited to
  `src/workers/**`, `src/lib/lecture-generator/**`,
  `src/lib/rate-limiter/**`, `src/lib/services/**`,
  `src/lib/queues/**`). App-level type errors elsewhere in the repo no
  longer block the worker image, but errors inside the worker surface
  area now will.

### 5. Admin & test-premium seed
- `scripts/seed-admin-and-test-users.ts` — idempotent TypeScript seed
  using the Supabase Admin SDK. Creates or updates two accounts:
  - `admin@upscprepx.ai` / `AdminChanakya2026!` → `role='admin'`, tier
    `premium_plus`.
  - `test-premium@upscprepx.ai` / `TestPremium2026!` → `role='user'`,
    tier `premium_plus`.
  On each run it resets the password (so the values in docs stay
  authoritative), upserts the `public.users` row with role + tier, and
  upserts an active row in `public.user_subscriptions`.
- `ADMIN_CREDENTIALS.md` — internal credentials doc listing URLs,
  accounts, provisioning command, and rotation instructions.

## Commits pushed to `origin/main`

```
7f5c0de feat(landing+ops): real logo on landing page, honest capability stats, worker compile enforcement, admin + test-premium seed
fec039e feat(brand+dashboard): add Chanakya AI logo system, welcome splash, and honest fresh-user dashboard
8910812 fix(agentic+cron+worker): enforce grounding, real services, hardened ops
```

Target branch: `main` — pushed `cd09685..7f5c0de`.

## What is still outstanding vs. the v8 spec

This session was scoped to the highest-leverage, immediately-shippable
items. These remain on the backlog:

1. **Global design-system pass** (motion primitives, typography rhythm,
   surface tokens) — partial via brand work, but a repo-wide sweep is
   still open.
2. **Signature feature pages** — notes, quiz, CA, doubt, mentor — each
   deserves the same treatment the dashboard got (honest zero-state +
   real data wiring). Notes is the next logical target because the user
   called it out specifically.
3. **Agentic services** — three Python services (`docker/agentic-services/`)
   are scaffolded but their Dockerfiles / runtime wiring need a full
   audit and end-to-end verification against the spec's agentic-web,
   AutoDocThinker, and agentic-file-search requirements.
4. **Hermes 24/7 scraping** — whitelisted-source configuration exists,
   but the 9-agent orchestration loop still needs real-world soak
   testing and a monitoring dashboard.
5. **PDF export watermark** — `UPSCBYVARUNSH.AIMasteryEdu.IN` must be
   enforced for free tier and suppressed for paid; current export code
   does not differentiate.
6. **Technical → friendly name mapping** — "RAG System" / "Vector
   Store" terminology still leaks into UI copy in several pages.
7. **Type-check & lint sweep** on the full repo — targeted checks on
   the files touched in this session pass; the whole-project check was
   not run to completion due to build time.

## How to verify

Local:

```bash
pnpm dev
# open http://localhost:3000 — landing page renders with real logo + sample previews
# register a new account, land on /dashboard — welcome banner + zero-state,
# no fake streak/rank, splash plays once per tab
```

Seed the admin + test accounts on the live project:

```bash
export SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
npx tsx scripts/seed-admin-and-test-users.ts
```

Then log in at `https://upscbyvarunsh.aimasteryedu.in/login` with the
credentials in `ADMIN_CREDENTIALS.md`.
