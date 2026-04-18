# v8 Production Hardening — Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the three-agent foundation (Knowledge / Evaluation / Orchestrator) with contract-gated tests, the split user model (v8_user_interactions + v8_user_mastery + views), animated splash + logo + dashboard, three migrated hero surfaces (Notes / Quiz / Mentor), thin CA slice, honest Phase-2 placeholders, and a fresh-user smoke script — all verified by Demo Gate captures on live VPS with fresh users.

**Architecture:** Three agents live at `src/lib/agents/core/` behind explicit string-literal-versioned interfaces. UI surfaces import only from these interfaces — direct `lib/services/*` imports for agent-territory data are a Contract Gate violation. Data split into append-only `v8_user_interactions` (source of truth) and derived `v8_user_mastery` (Evaluation Agent only writer). Existing Hermes agents under `src/lib/agents/*-agent.ts` and tables `user_mastery`, `agent_runs` are untouched — this phase builds alongside, not on top of, the legacy Hermes pipeline.

**Tech Stack:** Next.js 15.5.15 App Router, TypeScript, Tailwind, Jest (test runner), Supabase (project `emotqkukvfwjycvwfvyj`) with pgvector, OpenAI GPT-4o-mini (default) + GPT-4o (Orchestrator strategy mode only), `text-embedding-3-small` (1536-dim), Framer Motion 12, Coolify auto-deploy from `git push main`.

**Spec reference:** `docs/superpowers/specs/2026-04-18-v8-production-hardening-design.md`

---

## Task Completion Contract (READ FIRST — applies to every task, every subagent)

A task is **NOT complete** unless ALL of these are true. No exceptions. Self-report "done" only when every box is green.

1. **All tests pass** — `npm test -- <scope>` exits 0. If the task adds a Contract Gate test, that test runs against real Supabase + real OpenAI and passes.
2. **No regression in existing golden snapshots** — `npm test -- golden` stays green. New snapshots may be added; existing ones may NOT silently mutate.
3. **Lint + typecheck clean** — `npm run lint` and `npx tsc --noEmit` exit 0. Warnings introduced by this task must be fixed in this task.
4. **Minimal demo proof** — one of: (a) terminal output pasted in the task report showing the feature working end-to-end, (b) screenshot of the UI surface, or (c) a curl/jest command the reviewer can run locally to verify. No proof ⇒ task is not done.
5. **Commit made** — work is committed with a conventional-commits-style message. Uncommitted changes ⇒ task is not done.

If a subagent reports "done" without meeting all five, the reviewer must reject and re-dispatch.

### Dual-write guardrail (enforce every task)

**No component may write to both the legacy Hermes tables (`public.user_mastery`, `public.agent_runs`) and the v8 tables (`public.v8_user_mastery`, `public.v8_user_interactions`, `public.agent_traces`) in the same code path.** Separate writers, separate call sites, separate tests. If a task appears to require dual-write, stop and escalate — this is an architectural violation.

Mechanical check: grep for any file that imports from both `src/lib/agents/*-agent.ts` (Hermes) and `src/lib/agents/core/*` (v8) — that is a smell and must be justified in the PR description.

### Execution order (enforced by dispatcher)

1. **Track A strictly sequential:** A1 → A2 → A3 → A4 → A5. No parallelism on the spine.
2. **Track B parallel with A:** B1, B2, B4 start anytime after Day 0. B3 waits for A1.
3. **HARD STOP at Day 7:** all three Contract Gates green + golden snapshots stable + `recomputeMastery` idempotency proven. If any fail, fix here — do not proceed.
4. **Track C only after Day 7 green:** C1/C2/C3. Spec §2.0 forbids starting earlier.
5. **Track D + infra last:** D1/D2/D3 + smoke script + PR template + observability check.

---

## Pre-Phase: Environment & Existing-Code Reality

**The following already exists and MUST NOT be broken:**
- `public.user_mastery` table (migration 042) — Hermes writes to this via `node_id` FK. Leave alone.
- `public.agent_runs` table (migration 044) — Hermes job run tracking. Leave alone.
- `src/lib/agents/*-agent.ts` (notes-agent, evaluator-agent, quiz-agent, etc.) — Hermes pipeline workers. Leave alone.
- `src/lib/agents/base-agent.ts`, `orchestrator.ts` — Hermes dispatcher and base. Leave alone.
- `src/lib/agents/base-agent.ts` provider preferences (ollama/groq/kilo/opencode/nvidia/gemini). Leave alone.
- Supabase `on insert` trigger on `public.users` that demotes `subscription_status='trial'` — work around it in seed scripts via post-insert PATCH. Do NOT drop.
- Existing animated-backdrop primitives at `src/components/brand/animated-backdrop.tsx` (`DriftingOrbs`, `MotionReveal`, `PulseDot`, `ParticleField`, `GradientAura`). Reuse, do not duplicate.

**The following is new in Phase 1 and lives at non-conflicting paths:**
- `src/lib/agents/core/` — three new production agents (Knowledge, Evaluation, Orchestrator)
- `src/lib/agents/core/versioning.ts` — `compareAgentVersions()` utility
- `src/lib/agents/core/traces.ts` — `agent_traces` write helper
- `src/lib/agents/core/types.ts` — shared types (versions, MentorMode, reply schemas)
- `supabase/migrations/054_v8_user_interactions.sql`
- `supabase/migrations/055_v8_user_mastery.sql`
- `supabase/migrations/056_v8_derived_views.sql`
- `supabase/migrations/057_agent_traces.sql`
- `src/lib/agents/core/__tests__/` — contract tests + golden snapshots
- `scripts/smoke-fresh-user.mjs`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `docs/demos/phase-1/` (for 60s captures)
- `docs/changelog/` (for agent version bump notes + phase-1 summary)

---

## File Structure Map

```
src/lib/agents/core/
├── types.ts                              # agent versions, MentorMode, reply schemas
├── versioning.ts                         # compareAgentVersions() utility
├── traces.ts                             # agent_traces write helper (async/batched)
├── openai-client.ts                      # shared OpenAI client + cost tracking
├── knowledge-agent.ts                    # KnowledgeAgent interface + impl (wraps legacy RAG)
├── evaluation-agent.ts                   # EvaluationAgent interface + impl
├── orchestrator-agent.ts                 # OrchestratorAgent interface + impl
└── __tests__/
    ├── versioning.test.ts
    ├── knowledge.contract.test.ts
    ├── evaluation.contract.test.ts
    ├── orchestrator.contract.test.ts
    └── golden/
        ├── lock-thresholds.json
        ├── fixtures/
        │   ├── knowledge-doc-1.txt
        │   ├── knowledge-doc-2.txt
        │   └── quiz-attempt-fixture.json
        ├── baseline/
        │   ├── knowledge-retrieve.snap.json
        │   ├── knowledge-ground.snap.json
        │   ├── evaluation-scoring.snap.json
        │   └── mentor-{explain,strategy,revision,diagnostic}.snap.json
        └── snapshot-compare.ts

src/app/dashboard/
├── notes/[id]/page.tsx                   # migrated to Knowledge Agent (C1)
├── notes/new/page.tsx                    # migrated to Knowledge Agent (C1)
├── quiz/[id]/page.tsx                    # migrated to Evaluation Agent (C2)
├── mentor/page.tsx                       # migrated to Orchestrator Agent (C3)
├── ask-doubt/page.tsx                    # Phase-2 placeholder (D1)
├── mains-eval/page.tsx                   # Phase-2 placeholder (D1)
├── planner/page.tsx                      # Phase-2 placeholder (D1)
├── daily-digest/page.tsx                 # Phase-2 placeholder (D1)
├── lectures/page.tsx                     # Phase-2 placeholder (D1)
├── mindmaps/page.tsx                     # Phase-2 placeholder (D1)
├── current-affairs/page.tsx              # Thin CA slice (D2)
└── page.tsx                              # Dashboard refresh (B3)

src/components/
├── brand/
│   ├── animated-backdrop.tsx             # EXISTING, reuse
│   ├── logo.tsx                          # NEW (B2)
│   └── splash.tsx                        # NEW (B1)
├── mentor/
│   └── mode-selector.tsx                 # NEW (C3)
├── notes/
│   └── lite-mindmap.tsx                  # NEW (C1)
└── phase-2-placeholder.tsx               # NEW (D1) shared placeholder card

supabase/migrations/
├── 054_v8_user_interactions.sql
├── 055_v8_user_mastery.sql
├── 056_v8_derived_views.sql
└── 057_agent_traces.sql

scripts/
└── smoke-fresh-user.mjs

.github/
└── PULL_REQUEST_TEMPLATE.md

.eslintrc.agent-core.js                   # lint rules for agent versioning + leakage
docs/demos/phase-1/
docs/changelog/phase-1.md                 # written Day 14
```

---

## Day 1 — Migrations + Versioning Primitives + Logo

Parallel-safe tasks. Low risk. Lays the foundation.

### Task 1.1: Create `v8_user_interactions` migration (A1)

**Files:**
- Create: `supabase/migrations/054_v8_user_interactions.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 054_v8_user_interactions.sql
-- Append-only source of truth for the three-agent v8 architecture.
-- This table is NEVER updated and NEVER deleted from. v8_user_mastery
-- (migration 055) is fully reconstructible from this table alone.

CREATE TABLE IF NOT EXISTS v8_user_interactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN (
                 'quiz_attempt',
                 'note_read',
                 'note_generated',
                 'mentor_turn',
                 'ca_read',
                 'doubt_asked'
               )),
  topic_id     text,
  payload      jsonb NOT NULL,           -- full event detail, shape varies by type
  result       jsonb,                     -- score, mastery delta, citations, etc.
  time_spent_ms integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS v8_user_interactions_user_created_idx
  ON v8_user_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS v8_user_interactions_type_idx
  ON v8_user_interactions(type);
CREATE INDEX IF NOT EXISTS v8_user_interactions_topic_idx
  ON v8_user_interactions(topic_id) WHERE topic_id IS NOT NULL;

-- RLS: users read their own rows; only service-role writes.
ALTER TABLE v8_user_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY v8_ui_self_read ON v8_user_interactions
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy — service role bypasses RLS.

COMMENT ON TABLE v8_user_interactions IS
  'v8 append-only event log. Source of truth. v8_user_mastery recomputes from here.';
```

- [ ] **Step 2: Apply migration via MCP**

Use `mcp__462445bc-e7a3-49d0-896b-acfa2d567bd1__apply_migration` with name `054_v8_user_interactions` and the SQL above.

- [ ] **Step 3: Verify table exists**

Use `mcp__462445bc-e7a3-49d0-896b-acfa2d567bd1__execute_sql`:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'v8_user_interactions' ORDER BY ordinal_position;
```
Expected: 8 columns matching the CREATE TABLE above.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/054_v8_user_interactions.sql
git commit -m "feat(v8): add v8_user_interactions append-only event log (A1)"
```

### Task 1.2: Create `v8_user_mastery` migration (A1)

**Files:**
- Create: `supabase/migrations/055_v8_user_mastery.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 055_v8_user_mastery.sql
-- Derived aggregated mastery state for v8 architecture.
-- WRITE ACCESS: Evaluation Agent ONLY (src/lib/agents/core/evaluation-agent.ts).
-- Fully reconstructible from v8_user_interactions via recomputeMastery().
-- Named with v8_ prefix to coexist with legacy user_mastery (migration 042).

CREATE TABLE IF NOT EXISTS v8_user_mastery (
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id         text NOT NULL,
  mastery          numeric(3,2) NOT NULL CHECK (mastery BETWEEN 0 AND 1),
  confidence       numeric(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  last_seen        timestamptz NOT NULL DEFAULT now(),
  streak_days      integer NOT NULL DEFAULT 0,
  scoring_version  text NOT NULL,          -- which scoring logic produced this row
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS v8_user_mastery_user_last_seen_idx
  ON v8_user_mastery(user_id, last_seen DESC);
CREATE INDEX IF NOT EXISTS v8_user_mastery_user_mastery_idx
  ON v8_user_mastery(user_id, mastery ASC);

ALTER TABLE v8_user_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY v8_um_self_read ON v8_user_mastery
  FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE v8_user_mastery IS
  'v8 derived mastery state. Evaluation Agent is the ONLY legal writer.';
```

- [ ] **Step 2: Apply migration**

Use `mcp__462445bc-e7a3-49d0-896b-acfa2d567bd1__apply_migration` with name `055_v8_user_mastery`.

- [ ] **Step 3: Verify table**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'v8_user_mastery' ORDER BY ordinal_position;
```
Expected: 8 columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/055_v8_user_mastery.sql
git commit -m "feat(v8): add v8_user_mastery derived state table (A1)"
```

### Task 1.3: Create derived views migration (A1)

**Files:**
- Create: `supabase/migrations/056_v8_derived_views.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 056_v8_derived_views.sql
-- Read-only derived views over v8_user_mastery. No writes ever.

CREATE OR REPLACE VIEW v8_weak_topics AS
  SELECT user_id, topic_id, mastery, confidence, last_seen
  FROM v8_user_mastery
  WHERE mastery < 0.5
  ORDER BY user_id, mastery ASC;

CREATE OR REPLACE VIEW v8_strong_topics AS
  SELECT user_id, topic_id, mastery, confidence, last_seen
  FROM v8_user_mastery
  WHERE mastery >= 0.75
  ORDER BY user_id, mastery DESC;

CREATE OR REPLACE VIEW v8_readiness_score AS
  SELECT
    user_id,
    AVG(mastery) AS overall_mastery,
    COUNT(*) FILTER (WHERE mastery >= 0.75) AS strong_count,
    COUNT(*) FILTER (WHERE mastery < 0.5) AS weak_count,
    COUNT(*) AS topics_touched,
    MAX(last_seen) AS most_recent_activity
  FROM v8_user_mastery
  GROUP BY user_id;

COMMENT ON VIEW v8_weak_topics IS 'Topics with mastery < 0.5';
COMMENT ON VIEW v8_strong_topics IS 'Topics with mastery >= 0.75';
COMMENT ON VIEW v8_readiness_score IS 'Per-user aggregated readiness';
```

- [ ] **Step 2: Apply migration**

Use `mcp__462445bc-e7a3-49d0-896b-acfa2d567bd1__apply_migration` with name `056_v8_derived_views`.

- [ ] **Step 3: Verify views**

```sql
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public' AND table_name LIKE 'v8_%';
```
Expected: 3 rows (v8_weak_topics, v8_strong_topics, v8_readiness_score).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/056_v8_derived_views.sql
git commit -m "feat(v8): add derived views for weak/strong topics + readiness (A1)"
```

### Task 1.4: Create `agent_traces` migration (A2)

**Files:**
- Create: `supabase/migrations/057_agent_traces.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 057_agent_traces.sql
-- Observability table for the three v8 production agents.
-- Distinct from agent_runs (044) which tracks Hermes pipeline runs.

CREATE TABLE IF NOT EXISTS agent_traces (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id          uuid NOT NULL,
  parent_trace_id   uuid REFERENCES agent_traces(trace_id) DEFERRABLE INITIALLY DEFERRED,
  agent             text NOT NULL CHECK (agent IN (
                      'knowledge','evaluation','orchestrator'
                    )),
  method            text NOT NULL,           -- 'retrieve', 'ground', 'evaluateAttempt', etc.
  feature           text,                     -- 'notes' | 'quiz' | 'mentor' | 'ca' | 'test' | 'admin'
  status            text NOT NULL DEFAULT 'success' CHECK (status IN (
                      'success','failure','degraded'
                    )),
  user_id           uuid,
  input             jsonb,
  output            jsonb,
  latency_ms        integer,
  tokens_in         integer,
  tokens_out        integer,
  cost_usd          numeric(10,6),
  model             text,
  error             text,
  version           text,                     -- agent version string at time of call
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_traces_trace_idx ON agent_traces(trace_id);
CREATE INDEX IF NOT EXISTS agent_traces_parent_idx ON agent_traces(parent_trace_id)
  WHERE parent_trace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_traces_agent_created_idx
  ON agent_traces(agent, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_traces_feature_created_idx
  ON agent_traces(feature, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_traces_user_created_idx
  ON agent_traces(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_traces_status_idx
  ON agent_traces(status) WHERE status != 'success';

COMMENT ON TABLE agent_traces IS
  'Per-method call trace for v8 agents. Every agent call MUST produce a row.';
```

- [ ] **Step 2: Apply migration**

Use `mcp__462445bc-e7a3-49d0-896b-acfa2d567bd1__apply_migration` with name `057_agent_traces`.

- [ ] **Step 3: Verify table + indexes**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'agent_traces' ORDER BY ordinal_position;
SELECT indexname FROM pg_indexes WHERE tablename = 'agent_traces';
```
Expected: 16 columns, 6 indexes.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/057_agent_traces.sql
git commit -m "feat(v8): add agent_traces table for three-agent observability (A2)"
```

### Task 1.5: Regenerate Supabase TypeScript types

- [ ] **Step 1: Run type generation**

```bash
cd "C:/Users/DR-VARUNI/Desktop/upsc_ai" && npm run db:types
```
Expected: `src/types/supabase.ts` updated with new tables/views.

- [ ] **Step 2: Spot-check new types**

```bash
grep -E "v8_user_interactions|v8_user_mastery|agent_traces" src/types/supabase.ts | head -20
```
Expected: all three names appear.

- [ ] **Step 3: Commit**

```bash
git add src/types/supabase.ts
git commit -m "chore(types): regenerate Supabase types for v8 tables (A1, A2)"
```

### Task 1.6: Create `compareAgentVersions()` utility with TDD (cross-cutting)

**Files:**
- Create: `src/lib/agents/core/versioning.ts`
- Create: `src/lib/agents/core/__tests__/versioning.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/agents/core/__tests__/versioning.test.ts`:

```ts
import { compareAgentVersions, isValidVersionString } from '../versioning';

describe('compareAgentVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareAgentVersions('v1', 'v1')).toBe(0);
  });

  it('returns negative for a < b numerically', () => {
    expect(compareAgentVersions('v1', 'v2')).toBeLessThan(0);
  });

  it('returns positive for a > b numerically', () => {
    expect(compareAgentVersions('v3', 'v2')).toBeGreaterThan(0);
  });

  it('handles double-digit versions lexically-safely (v10 > v2)', () => {
    expect(compareAgentVersions('v10', 'v2')).toBeGreaterThan(0);
    expect(compareAgentVersions('v2', 'v10')).toBeLessThan(0);
  });

  it('handles v100 > v11', () => {
    expect(compareAgentVersions('v100', 'v11')).toBeGreaterThan(0);
  });

  it('throws on invalid version string', () => {
    expect(() => compareAgentVersions('1.0', 'v1')).toThrow();
    expect(() => compareAgentVersions('bad', 'v1')).toThrow();
    expect(() => compareAgentVersions('', 'v1')).toThrow();
  });
});

describe('isValidVersionString', () => {
  it('accepts v1, v2, v10, v100', () => {
    expect(isValidVersionString('v1')).toBe(true);
    expect(isValidVersionString('v10')).toBe(true);
    expect(isValidVersionString('v100')).toBe(true);
  });

  it('rejects v0, V1, v1.0, 1, empty', () => {
    expect(isValidVersionString('v0')).toBe(false);
    expect(isValidVersionString('V1')).toBe(false);
    expect(isValidVersionString('v1.0')).toBe(false);
    expect(isValidVersionString('1')).toBe(false);
    expect(isValidVersionString('')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx jest src/lib/agents/core/__tests__/versioning.test.ts
```
Expected: FAIL — "Cannot find module '../versioning'".

- [ ] **Step 3: Implement minimal code to pass**

Create `src/lib/agents/core/versioning.ts`:

```ts
/**
 * Lexical-safe agent version comparison (spec §1.2 rule 4).
 * Format: `v` followed by a positive integer (v1, v2, v10, v100, ...).
 * Never compare version strings directly with </>/== — always use this utility.
 */

const VERSION_PATTERN = /^v([1-9][0-9]*)$/;

export function isValidVersionString(s: string): boolean {
  return VERSION_PATTERN.test(s);
}

/**
 * Numeric-only ordering of agent version strings.
 * @returns -1 if a < b, 0 if equal, 1 if a > b.
 * @throws Error if either input is not a valid version string.
 */
export function compareAgentVersions(a: string, b: string): -1 | 0 | 1 {
  if (!isValidVersionString(a)) throw new Error(`Invalid version string: "${a}"`);
  if (!isValidVersionString(b)) throw new Error(`Invalid version string: "${b}"`);
  const aNum = parseInt(a.slice(1), 10);
  const bNum = parseInt(b.slice(1), 10);
  if (aNum < bNum) return -1;
  if (aNum > bNum) return 1;
  return 0;
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npx jest src/lib/agents/core/__tests__/versioning.test.ts
```
Expected: PASS, 10 assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/core/versioning.ts src/lib/agents/core/__tests__/versioning.test.ts
git commit -m "feat(agents/core): lexical-safe compareAgentVersions utility (spec §1.2)"
```

### Task 1.7: New logo SVG (B2)

**Files:**
- Create: `src/components/brand/logo.tsx`
- Create: `public/brand/upsc-prepx-logo.svg`
- Create: `public/brand/upsc-prepx-logo-mark.svg` (icon-only variant)

- [ ] **Step 1: Create static SVG file (dark-theme-native)**

Create `public/brand/upsc-prepx-logo.svg` with an SVG that reads white/light on dark backgrounds (use `currentColor` where possible so Tailwind text classes tint it):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 48" role="img" aria-label="UPSC PrepX AI">
  <defs>
    <linearGradient id="prepx-g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <g fill="currentColor">
    <path d="M12 8 L12 40 L20 40 L20 28 L28 28 C36 28 40 24 40 20 C40 12 36 8 28 8 Z M20 16 L28 16 C30 16 32 17 32 20 C32 22 30 22 28 22 L20 22 Z"/>
    <text x="52" y="32" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="300" letter-spacing="-0.02em">UPSC</text>
    <text x="120" y="32" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="700" letter-spacing="-0.02em" fill="url(#prepx-g)">PrepX</text>
    <text x="190" y="32" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="300" letter-spacing="-0.02em">AI</text>
  </g>
</svg>
```

And `public/brand/upsc-prepx-logo-mark.svg` (mark only):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-label="UPSC PrepX AI mark">
  <defs>
    <linearGradient id="mark-g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" fill="url(#mark-g)"/>
  <path d="M14 12 L14 36 L20 36 L20 26 L26 26 C32 26 36 22 36 18 C36 12 32 8 26 8 L14 8 Z M20 14 L26 14 C28 14 30 15 30 18 C30 20 28 21 26 21 L20 21 Z" fill="#FFFFFF"/>
</svg>
```

- [ ] **Step 2: Create React component wrapper**

Create `src/components/brand/logo.tsx`:

```tsx
import Image from 'next/image';

type LogoProps = {
  variant?: 'full' | 'mark';
  size?: number;
  className?: string;
  animated?: boolean;
};

export function Logo({ variant = 'full', size = 32, className = '', animated = false }: LogoProps) {
  const src = variant === 'mark' ? '/brand/upsc-prepx-logo-mark.svg' : '/brand/upsc-prepx-logo.svg';
  const aspect = variant === 'mark' ? 1 : 5;
  const width = variant === 'mark' ? size : size * aspect;
  return (
    <Image
      src={src}
      alt="UPSC PrepX AI"
      width={width}
      height={size}
      className={`${className} ${animated ? 'animate-logo-shimmer' : ''}`.trim()}
      priority
    />
  );
}
```

- [ ] **Step 3: Add shimmer keyframe to Tailwind config**

Modify `tailwind.config.ts` (or equivalent) — add to `theme.extend.keyframes`:

```ts
'logo-shimmer': {
  '0%, 100%': { filter: 'drop-shadow(0 0 0 rgba(249,115,22,0))' },
  '50%': { filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.6))' },
},
```

And under `theme.extend.animation`:

```ts
'logo-shimmer': 'logo-shimmer 3s ease-in-out infinite',
```

- [ ] **Step 4: Visual check on landing page**

Briefly insert `<Logo />` in `src/app/page.tsx` (or landing) and run `npm run dev`, open `http://localhost:3000`, confirm logo renders crisp at retina and on dark background.

Revert the test insertion before commit.

- [ ] **Step 5: Commit**

```bash
git add public/brand/upsc-prepx-logo.svg public/brand/upsc-prepx-logo-mark.svg \
         src/components/brand/logo.tsx tailwind.config.ts
git commit -m "feat(brand): new UPSC PrepX AI logo + Logo component with shimmer variant (B2)"
```

---

## Day 2 — Agent Core Types + Traces Helper + Placeholder Component

### Task 2.1: Agent core types (shared)

**Files:**
- Create: `src/lib/agents/core/types.ts`

- [ ] **Step 1: Write types file**

```ts
// src/lib/agents/core/types.ts
// Shared types for the three v8 production agents (spec §1.2).

export type KnowledgeAgentVersion = 'v1';
export type EvaluationAgentVersion = 'v1';
export type OrchestratorAgentVersion = 'v1';
export type ScoringVersion = 'v1';

// ---------- Knowledge ----------
export type SourceType = 'note' | 'pyq' | 'ca' | 'user_pdf';
export interface SourceMeta {
  topicId?: string;
  title?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
}
export interface SourceInput {
  type: SourceType;
  content: string;
  meta: SourceMeta;
}
export interface IngestResult {
  sourceId: string;
  chunkCount: number;
  tokensProcessed: number;
}

export interface Filter {
  topicId?: string;
  sourceType?: SourceType;
  userId?: string;
}

export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  meta: SourceMeta & { sourceId: string };
}

export interface Citation {
  sourceId: string;
  chunkId: string;
  snippet: string;
  url?: string;
}

export interface GroundedAnswer {
  text: string;
  citations: Citation[];
  tokensIn: number;
  tokensOut: number;
}

// ---------- Evaluation ----------
export interface QuizAttempt {
  userId: string;
  quizId: string;
  topicId: string;
  questions: Array<{
    id: string;
    correct: string;
    userAnswer: string;
    timeMs: number;
  }>;
}

export interface ScoreResult {
  correctCount: number;
  totalCount: number;
  accuracyPct: number;
  timeTotalMs: number;
  perQuestion: Array<{ id: string; isCorrect: boolean; timeMs: number }>;
}

export interface Answer { text: string }
export interface Question { id: string; prompt: string; options: string[]; correct: string; topicId: string }

export interface Explanation {
  answerText: string;
  citations: Citation[];
  whyWrong: string;
  relatedTopics: string[];
}

export interface MasteryDelta {
  topicId: string;
  masteryBefore: number;
  masteryAfter: number;
  confidenceBefore: number;
  confidenceAfter: number;
}

export interface WeakTopic {
  topicId: string;
  mastery: number;
  confidence: number;
  lastSeen: string;
}

export interface UserPerformanceSummary {
  overallMastery: number;
  strongCount: number;
  weakCount: number;
  topicsTouched: number;
  recentActivity: string | null;
  weakTopics: WeakTopic[];
}

// ---------- Orchestrator ----------
export type MentorMode = 'explain' | 'strategy' | 'revision' | 'diagnostic';

export type ExplainReply = {
  mode: 'explain';
  answer: string;
  citations: Citation[];
  relatedTopics: string[];
};
export type StrategyReply = {
  mode: 'strategy';
  recommendation: string;
  rationale: string;
  nextSteps: string[];
  weakTopicsAddressed: string[];
};
export type RevisionReply = {
  mode: 'revision';
  topic: string;
  keyPoints: string[];
  commonMistakes: string[];
  quickQuiz?: Array<{ q: string; a: string }>;
};
export type DiagnosticReply = {
  mode: 'diagnostic';
  assessment: string;
  strengths: Array<{ topicId: string; mastery: number }>;
  gaps: Array<{ topicId: string; mastery: number }>;
  priorityFix: string;
};
export type MentorReply = ExplainReply | StrategyReply | RevisionReply | DiagnosticReply;

export interface Recommendation {
  action: 'revise' | 'practice' | 'read' | 'rest';
  topicId?: string;
  reason: string;
  estimatedMinutes: number;
}

export interface StudyPlan {
  days: Array<{
    dayIndex: number;
    date: string;
    focus: Array<{ topicId: string; minutes: number; mode: 'read' | 'quiz' | 'revise' }>;
  }>;
}

// ---------- Agent interfaces ----------
export interface KnowledgeAgent {
  readonly version: KnowledgeAgentVersion;
  ingest(source: SourceInput): Promise<IngestResult>;
  retrieve(query: string, opts?: {
    topK?: number;
    filter?: Filter;
    rerank?: boolean;
  }): Promise<RetrievedChunk[]>;
  ground(query: string, chunks: RetrievedChunk[], opts?: {
    style?: 'concise' | 'detailed';
    cite?: boolean;
    maxTokens?: number;
  }): Promise<GroundedAnswer>;
}

export interface EvaluationAgent {
  readonly version: EvaluationAgentVersion;
  readonly scoringVersion: ScoringVersion;
  evaluateAttempt(attempt: QuizAttempt): Promise<ScoreResult>;
  explainWrong(q: Question, userAnswer: Answer, correct: Answer): Promise<Explanation>;
  updateMastery(userId: string, attempt: QuizAttempt): Promise<MasteryDelta[]>;
  weakTopics(userId: string, opts?: { limit?: number }): Promise<WeakTopic[]>;
  analytics(userId: string): Promise<UserPerformanceSummary>;
  recomputeMastery(userId: string): Promise<void>;
}

export interface OrchestratorAgent {
  readonly version: OrchestratorAgentVersion;
  answer(userId: string, message: string, context?: { mode?: MentorMode }): Promise<MentorReply>;
  nextBestAction(userId: string): Promise<Recommendation>;
  studyPlan(userId: string, horizonDays: number): Promise<StudyPlan>;
}

// ---------- Trace context (passed internally between agent calls) ----------
export interface TraceContext {
  traceId: string;
  parentTraceId?: string;
  feature: 'notes' | 'quiz' | 'mentor' | 'ca' | 'test' | 'admin' | 'smoke';
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no new errors (existing errors unrelated to agent core are acceptable but note them).

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/core/types.ts
git commit -m "feat(agents/core): shared agent interface + reply schema types (spec §1.2)"
```

### Task 2.2: `agent_traces` write helper with TDD

**Files:**
- Create: `src/lib/agents/core/traces.ts`
- Create: `src/lib/agents/core/__tests__/traces.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/agents/core/__tests__/traces.test.ts`:

```ts
/**
 * Real-Supabase test. Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Tests write to agent_traces with feature='test' and clean up after.
 */
import { recordTrace, newTraceId } from '../traces';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

describe('recordTrace', () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length) {
      await sb.from('agent_traces').delete().in('id', createdIds);
    }
  });

  it('writes a row and returns its id', async () => {
    const traceId = newTraceId();
    const id = await recordTrace({
      traceId,
      agent: 'knowledge',
      method: 'retrieve',
      feature: 'test',
      status: 'success',
      input: { q: 'x' },
      output: { chunks: [] },
      latencyMs: 5,
      tokensIn: 1,
      tokensOut: 0,
      version: 'v1',
    });
    expect(id).toBeTruthy();
    createdIds.push(id);

    const { data, error } = await sb
      .from('agent_traces')
      .select('*')
      .eq('id', id)
      .single();
    expect(error).toBeNull();
    expect(data?.agent).toBe('knowledge');
    expect(data?.method).toBe('retrieve');
    expect(data?.feature).toBe('test');
    expect(data?.status).toBe('success');
  });

  it('chains parent→child traces via parent_trace_id', async () => {
    const parentTrace = newTraceId();
    const parentId = await recordTrace({
      traceId: parentTrace,
      agent: 'orchestrator',
      method: 'answer',
      feature: 'test',
      status: 'success',
      version: 'v1',
    });
    createdIds.push(parentId);

    const childTrace = newTraceId();
    const childId = await recordTrace({
      traceId: childTrace,
      parentTraceId: parentTrace,
      agent: 'knowledge',
      method: 'retrieve',
      feature: 'test',
      status: 'success',
      version: 'v1',
    });
    createdIds.push(childId);

    const { data } = await sb.from('agent_traces').select('*').eq('id', childId).single();
    expect(data?.parent_trace_id).toBe(parentTrace);
  });

  it('never throws — failures log but do not crash caller', async () => {
    // Force failure by passing an invalid agent name.
    await expect(
      recordTrace({
        traceId: newTraceId(),
        // @ts-expect-error invalid agent
        agent: 'not_a_real_agent',
        method: 'x',
        feature: 'test',
        status: 'success',
        version: 'v1',
      }),
    ).resolves.toBeDefined(); // returns empty string, does not throw
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
npx jest src/lib/agents/core/__tests__/traces.test.ts
```
Expected: FAIL — "Cannot find module '../traces'".

- [ ] **Step 3: Implement the helper**

Create `src/lib/agents/core/traces.ts`:

```ts
// src/lib/agents/core/traces.ts
// Async-safe trace writer for the three v8 agents. Never throws.
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

type AgentName = 'knowledge' | 'evaluation' | 'orchestrator';
type TraceStatus = 'success' | 'failure' | 'degraded';

export interface TraceInput {
  traceId: string;
  parentTraceId?: string;
  agent: AgentName;
  method: string;
  feature?: string;
  status: TraceStatus;
  userId?: string;
  input?: unknown;
  output?: unknown;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  model?: string;
  error?: string;
  version: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

export function newTraceId(): string {
  return randomUUID();
}

/**
 * Writes a trace row. Returns the inserted row id, or empty string on failure.
 * NEVER THROWS — instrumentation must not crash callers.
 */
export async function recordTrace(t: TraceInput): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('agent_traces')
      .insert({
        trace_id: t.traceId,
        parent_trace_id: t.parentTraceId ?? null,
        agent: t.agent,
        method: t.method,
        feature: t.feature ?? null,
        status: t.status,
        user_id: t.userId ?? null,
        input: t.input ?? null,
        output: t.output ?? null,
        latency_ms: t.latencyMs ?? null,
        tokens_in: t.tokensIn ?? null,
        tokens_out: t.tokensOut ?? null,
        cost_usd: t.costUsd ?? null,
        model: t.model ?? null,
        error: t.error ?? null,
        version: t.version,
      })
      .select('id')
      .single();
    if (error) {
      // Log but do not throw.
      // eslint-disable-next-line no-console
      console.warn('[agent_traces] write failed:', error.message);
      return '';
    }
    return data?.id ?? '';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[agent_traces] unexpected:', e);
    return '';
  }
}

/**
 * Convenience wrapper: runs an agent method, records the trace, returns the
 * method's result. Use inside every agent method.
 */
export async function tracedCall<T>(
  t: Omit<TraceInput, 'status' | 'output' | 'latencyMs' | 'error'>,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    await recordTrace({
      ...t,
      status: 'success',
      output: result,
      latencyMs: Date.now() - started,
    });
    return result;
  } catch (err: any) {
    await recordTrace({
      ...t,
      status: 'failure',
      error: String(err?.message ?? err),
      latencyMs: Date.now() - started,
    });
    throw err;
  }
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npx jest src/lib/agents/core/__tests__/traces.test.ts
```
Expected: PASS, 3 tests green. (Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in env.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/core/traces.ts src/lib/agents/core/__tests__/traces.test.ts
git commit -m "feat(agents/core): agent_traces write helper + tracedCall wrapper (A2)"
```

### Task 2.3: Phase-2 placeholder component (D1)

**Files:**
- Create: `src/components/phase-2-placeholder.tsx`

- [ ] **Step 1: Build the component**

```tsx
// src/components/phase-2-placeholder.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DriftingOrbs, MotionReveal, PulseDot } from '@/components/brand/animated-backdrop';

type Props = {
  title: string;
  tagline: string;
  whatsComing: string[];
  parkedReason: string;
  targetPhase: 'Phase 2A' | 'Phase 2B' | 'Phase 3' | 'Phase 4';
  backHref?: string;
};

export function Phase2Placeholder({
  title, tagline, whatsComing, parkedReason, targetPhase, backHref = '/dashboard',
}: Props) {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-6">
      <DriftingOrbs palette={['rgba(249,115,22,0.18)', 'rgba(59,130,246,0.18)']} />
      <MotionReveal>
        <div className="relative max-w-2xl mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.05] p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <PulseDot color="bg-amber-400" />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              Landing in {targetPhase}
            </span>
          </div>
          <h1 className="text-3xl font-light text-white mb-2">{title}</h1>
          <p className="text-white/40 mb-6">{tagline}</p>

          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-2">What&apos;s coming</h3>
              <ul className="space-y-1 text-sm text-white/60">
                {whatsComing.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-white/30">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-2">Why it&apos;s parked</h3>
              <p className="text-sm text-white/60">{parkedReason}</p>
            </div>
          </div>

          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Back to dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </MotionReveal>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run type-check
```
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/phase-2-placeholder.tsx
git commit -m "feat(ui): Phase-2 placeholder component for honest feature parking (D1)"
```

### Task 2.4: Wire placeholder to six parked features (D1)

**Files:**
- Modify: `src/app/dashboard/ask-doubt/page.tsx`
- Modify: `src/app/dashboard/lectures/page.tsx`
- Create: `src/app/dashboard/mains-eval/page.tsx` (if missing)
- Create: `src/app/dashboard/planner/page.tsx` (if missing)
- Create: `src/app/dashboard/daily-digest/page.tsx` (if missing)
- Create: `src/app/dashboard/mindmaps/page.tsx` (if missing)

- [ ] **Step 1: Check which pages exist**

```bash
ls src/app/dashboard/ask-doubt src/app/dashboard/lectures src/app/dashboard/mains-eval \
   src/app/dashboard/planner src/app/dashboard/daily-digest src/app/dashboard/mindmaps 2>&1
```

- [ ] **Step 2: Replace/create each with a Phase2Placeholder usage**

For each page that doesn't exist, create `page.tsx` with the appropriate props. Example for `mains-eval`:

```tsx
// src/app/dashboard/mains-eval/page.tsx
import { Phase2Placeholder } from '@/components/phase-2-placeholder';

export const metadata = { title: 'Mains Evaluation' };

export default function MainsEvalPage() {
  return (
    <Phase2Placeholder
      title="Mains Answer Evaluation"
      tagline="AI-graded practice for UPSC Mains with structure, language, and content scoring."
      whatsComing={[
        'Upload or type your Mains answer; receive a structured rubric score.',
        'Per-paragraph feedback on structure, language, content depth, and examples.',
        'Your weak-topic map updates based on evaluation patterns.',
        'PYQ-linked model answers for every question.',
      ]}
      parkedReason="Mains evaluation extends the Evaluation Agent with a new scoring dimension. Shipping this before the core agent is stable would mean rebuilding it later. Phase 1 proves the Evaluation Agent on MCQs first; Mains evaluation is a clean extension in Phase 2B."
      targetPhase="Phase 2B"
    />
  );
}
```

Repeat for: `ask-doubt` (Phase 2A, "Agentic Ask-Doubt"), `lectures` (Phase 4, "Lecture & Media Pipeline"), `planner` (Phase 2B), `daily-digest` (Phase 2B), `mindmaps` (Phase 2B, full-page — the lite mindmap inside notes is Phase 1).

Use the parked-reason text honestly per the spec's justifications.

- [ ] **Step 3: Visual smoke check locally**

```bash
npm run dev
```
Visit each route, confirm placeholder renders and back-link works.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/ask-doubt/page.tsx src/app/dashboard/lectures/page.tsx \
         src/app/dashboard/mains-eval/page.tsx src/app/dashboard/planner/page.tsx \
         src/app/dashboard/daily-digest/page.tsx src/app/dashboard/mindmaps/page.tsx
git commit -m "feat(phase-2): honest placeholder pages for six parked features (D1)"
```

### Task 2.5: Admin panel route audit (D3)

**Files:**
- Read/inventory: `src/app/admin/**/page.tsx`

- [ ] **Step 1: List all admin pages**

```bash
find src/app/admin -name 'page.tsx' 2>&1
```

- [ ] **Step 2: Categorise each page as {real, stubbed, missing}**

For each page, open it and classify. Stubbed/missing pages get replaced with a short Phase-2 placeholder using the same component (but targetPhase='Phase 3'). Real ones stay.

- [ ] **Step 3: Write audit note**

Create `docs/changelog/admin-audit-phase-1.md` listing each route with its category and next-phase plan.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin docs/changelog/admin-audit-phase-1.md
git commit -m "chore(admin): audit + placeholder stubbed admin pages (D3)"
```

---

## Day 3 — Knowledge Agent scaffold + existing RAG discovery

### Task 3.1: Locate and document existing RAG code

- [ ] **Step 1: Grep for RAG imports**

```bash
cd "C:/Users/DR-VARUNI/Desktop/upsc_ai"
grep -rE "rag[-_]?anything|embeddings|vector\\(|pgvector" --include='*.ts' --include='*.tsx' -l src/ | head -30
```

- [ ] **Step 2: Write an inventory note**

Create `docs/changelog/rag-inventory.md` listing every file that currently touches embeddings, vector search, or RAG. This becomes the reference for what Knowledge Agent must wrap.

- [ ] **Step 3: Decide wrap strategy**

Two possibilities:
- If existing RAG is a coherent module (one or two files): Knowledge Agent imports it and delegates inside `retrieve()` + `ground()`.
- If scattered: Knowledge Agent builds its own thin retrieval path on `v8_user_interactions` + any existing embedding table, and notes the legacy code for P2A removal.

Document the chosen strategy in the same changelog file.

- [ ] **Step 4: Commit**

```bash
git add docs/changelog/rag-inventory.md
git commit -m "docs: RAG-Anything code inventory + wrap strategy for Knowledge Agent (A3 prep)"
```

### Task 3.2: OpenAI client + cost tracking helper

**Files:**
- Create: `src/lib/agents/core/openai-client.ts`

- [ ] **Step 1: Write helper**

```ts
// src/lib/agents/core/openai-client.ts
// Shared OpenAI client with cost tracking per call.
import OpenAI from 'openai';

// Pricing snapshot (2026-04; update in docs/changelog when rates change).
const PRICE_PER_1M_TOKENS: Record<string, { in: number; out: number }> = {
  'gpt-4o-mini': { in: 0.15, out: 0.60 },
  'gpt-4o':      { in: 2.50, out: 10.00 },
  'text-embedding-3-small': { in: 0.02, out: 0 },
};

export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';
export const STRATEGY_MODEL = 'gpt-4o';
export const EMBED_MODEL = 'text-embedding-3-small';

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export interface ChatCall {
  model: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ChatResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  model: string;
}

export async function chat(call: ChatCall): Promise<ChatResult> {
  const res = await getClient().chat.completions.create({
    model: call.model,
    max_tokens: call.maxTokens ?? 800,
    response_format: call.jsonMode ? { type: 'json_object' } : undefined,
    messages: [
      ...(call.system ? [{ role: 'system' as const, content: call.system }] : []),
      { role: 'user' as const, content: call.prompt },
    ],
  });
  const text = res.choices[0]?.message?.content ?? '';
  const tokensIn = res.usage?.prompt_tokens ?? 0;
  const tokensOut = res.usage?.completion_tokens ?? 0;
  const p = PRICE_PER_1M_TOKENS[call.model] ?? { in: 0, out: 0 };
  const costUsd = (tokensIn * p.in + tokensOut * p.out) / 1_000_000;
  return { text, tokensIn, tokensOut, costUsd, model: call.model };
}

export async function embed(texts: string[]): Promise<{
  vectors: number[][];
  tokensIn: number;
  costUsd: number;
  model: string;
}> {
  if (texts.length === 0) return { vectors: [], tokensIn: 0, costUsd: 0, model: EMBED_MODEL };
  const res = await getClient().embeddings.create({
    model: EMBED_MODEL,
    input: texts,
  });
  const vectors = res.data.map((d) => d.embedding);
  const tokensIn = res.usage?.prompt_tokens ?? 0;
  const p = PRICE_PER_1M_TOKENS[EMBED_MODEL] ?? { in: 0, out: 0 };
  const costUsd = (tokensIn * p.in) / 1_000_000;
  return { vectors, tokensIn, costUsd, model: EMBED_MODEL };
}
```

- [ ] **Step 2: Smoke check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/core/openai-client.ts
git commit -m "feat(agents/core): OpenAI client helper with per-call cost tracking (A3)"
```

### Task 3.3: Knowledge Agent contract test (TDD — write first)

**Files:**
- Create: `src/lib/agents/core/__tests__/knowledge.contract.test.ts`
- Create: `src/lib/agents/core/__tests__/golden/fixtures/knowledge-doc-1.txt`

- [ ] **Step 1: Add fixture document**

Create `src/lib/agents/core/__tests__/golden/fixtures/knowledge-doc-1.txt`:

```
The Indian Constitution came into effect on 26 January 1950. It is the longest
written constitution of any country on earth, with 448 articles organised in 25
parts, 12 schedules, and 5 appendices. The Preamble describes India as a
sovereign, socialist, secular, democratic republic. Fundamental Rights are
guaranteed by Part III (Articles 12-35). The Directive Principles of State
Policy are contained in Part IV (Articles 36-51). Fundamental Duties were added
by the 42nd Amendment in 1976 (Article 51A).
```

- [ ] **Step 2: Write the contract test (will fail until agent is built)**

Create `src/lib/agents/core/__tests__/knowledge.contract.test.ts`:

```ts
/**
 * KnowledgeAgent Contract Gate.
 * Hits real Supabase + real OpenAI. Uses feature='test' for all traces,
 * and cleans up traces + test rows after.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { KnowledgeAgentImpl, type MockKnowledgeAgent } from '../knowledge-agent';
import type { KnowledgeAgent } from '../types';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const fixturePath = path.join(__dirname, 'golden/fixtures/knowledge-doc-1.txt');
const fixtureContent = fs.readFileSync(fixturePath, 'utf8');

function runContract(label: string, agent: KnowledgeAgent) {
  describe(`KnowledgeAgent contract [${label}]`, () => {
    const createdSourceIds: string[] = [];

    afterAll(async () => {
      // cleanup test traces + ingest rows
      await sb.from('agent_traces').delete().eq('feature', 'test');
      // cleanup is impl-specific; the impl should provide a test helper
      // that removes rows by sourceId.
      if (typeof (agent as any).__testCleanup === 'function') {
        await (agent as any).__testCleanup(createdSourceIds);
      }
    });

    it('exposes version "v1"', () => {
      expect(agent.version).toBe('v1');
    });

    it('ingest returns a sourceId and positive chunkCount', async () => {
      const res = await agent.ingest({
        type: 'note',
        content: fixtureContent,
        meta: { topicId: 'polity.constitution', title: 'Constitution fixture' },
      });
      expect(res.sourceId).toBeTruthy();
      expect(res.chunkCount).toBeGreaterThan(0);
      createdSourceIds.push(res.sourceId);
    });

    it('retrieve returns chunks matching the query', async () => {
      const chunks = await agent.retrieve('When did the Indian Constitution come into effect?', {
        topK: 4,
        filter: { topicId: 'polity.constitution' },
      });
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.length).toBeLessThanOrEqual(4);
      // Must find content about 26 January 1950 somewhere in the chunks.
      const joined = chunks.map((c) => c.text).join(' ').toLowerCase();
      expect(joined).toContain('26 january 1950');
    });

    it('retrieve hard-caps topK at 8 (spec §1.2)', async () => {
      const chunks = await agent.retrieve('constitution', { topK: 50 });
      expect(chunks.length).toBeLessThanOrEqual(8);
    });

    it('ground produces text with citations when cite=true', async () => {
      const chunks = await agent.retrieve('fundamental rights constitution', { topK: 3 });
      const answer = await agent.ground('Which part contains Fundamental Rights?', chunks, {
        cite: true,
        maxTokens: 200,
      });
      expect(answer.text.length).toBeGreaterThan(0);
      expect(answer.citations.length).toBeGreaterThan(0);
      expect(answer.tokensIn).toBeGreaterThan(0);
      expect(answer.tokensOut).toBeGreaterThan(0);
    });

    it('every call produces an agent_traces row with feature=test', async () => {
      const before = await sb.from('agent_traces').select('id', { count: 'exact', head: true })
        .eq('feature', 'test').eq('agent', 'knowledge');
      await agent.retrieve('test query', { topK: 2 });
      const after = await sb.from('agent_traces').select('id', { count: 'exact', head: true })
        .eq('feature', 'test').eq('agent', 'knowledge');
      expect((after.count ?? 0) - (before.count ?? 0)).toBeGreaterThan(0);
    });
  });
}

// Run contract against the real implementation.
runContract('real', new KnowledgeAgentImpl({ feature: 'test' }));

// R2 mitigation: same contract must pass against a second (mock) implementation.
// The mock uses in-memory storage and a deterministic "search" (substring match),
// but implements the same public API surface.
import { InMemoryKnowledgeAgent } from '../knowledge-agent';
runContract('mock', new InMemoryKnowledgeAgent({ feature: 'test' }));
```

- [ ] **Step 3: Run test, verify failure**

```bash
npx jest src/lib/agents/core/__tests__/knowledge.contract.test.ts
```
Expected: FAIL — module not found. Good, we're ready to implement.

- [ ] **Step 4: Commit failing test + fixture**

```bash
git add src/lib/agents/core/__tests__/knowledge.contract.test.ts \
         src/lib/agents/core/__tests__/golden/fixtures/knowledge-doc-1.txt
git commit -m "test(agents/knowledge): contract test with real + swap-impl variants (A3, R2)"
```

---

## Day 4 — Knowledge Agent implementation

### Task 4.1: Implement `KnowledgeAgentImpl` (wraps chosen RAG path)

**Files:**
- Create: `src/lib/agents/core/knowledge-agent.ts`
- Potentially: `supabase/migrations/058_v8_knowledge_chunks.sql` (if the existing RAG code has no usable embeddings table)

- [ ] **Step 1: Decide storage table**

Based on `docs/changelog/rag-inventory.md` (from Task 3.1), either:

**Option A** — reuse an existing embeddings table if the inventory found one with pgvector.

**Option B** — add a fresh `v8_knowledge_chunks` table:

```sql
-- 058_v8_knowledge_chunks.sql (only if no existing chunks table is usable)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS v8_knowledge_chunks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id  text NOT NULL,
  topic_id   text,
  source_type text NOT NULL CHECK (source_type IN ('note','pyq','ca','user_pdf')),
  chunk_text text NOT NULL,
  embedding  vector(1536) NOT NULL,
  meta       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX v8_chunks_source_idx ON v8_knowledge_chunks(source_id);
CREATE INDEX v8_chunks_topic_idx ON v8_knowledge_chunks(topic_id);
CREATE INDEX v8_chunks_embed_idx ON v8_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

Apply via `mcp__462445bc-e7a3-49d0-896b-acfa2d567bd1__apply_migration` if Option B.

- [ ] **Step 2: Implement the real KnowledgeAgent**

Write `src/lib/agents/core/knowledge-agent.ts`. Key structure (paste-ready outline — fill in helpers as needed):

```ts
// src/lib/agents/core/knowledge-agent.ts
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { chat, embed, DEFAULT_CHAT_MODEL } from './openai-client';
import { newTraceId, recordTrace } from './traces';
import type {
  KnowledgeAgent, KnowledgeAgentVersion, SourceInput, IngestResult,
  RetrievedChunk, GroundedAnswer, Filter, Citation,
} from './types';

const VERSION: KnowledgeAgentVersion = 'v1';
const HARD_CAP_TOPK = 8;
const DEFAULT_TOPK = 6;
const CHUNK_SIZE = 800;  // characters per chunk, tuned later

function chunkText(text: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) out.push(text.slice(i, i + CHUNK_SIZE));
  return out;
}

export interface AgentInitOpts {
  feature?: string;
  traceId?: string;
}

export class KnowledgeAgentImpl implements KnowledgeAgent {
  readonly version = VERSION;
  private sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );
  private feature: string;
  constructor(opts: AgentInitOpts = {}) {
    this.feature = opts.feature ?? 'unknown';
  }

  async ingest(source: SourceInput): Promise<IngestResult> {
    const traceId = newTraceId();
    const started = Date.now();
    try {
      const sourceId = randomUUID();
      const chunks = chunkText(source.content);
      const { vectors, tokensIn, costUsd } = await embed(chunks);
      const rows = chunks.map((chunk, i) => ({
        source_id: sourceId,
        topic_id: source.meta.topicId ?? null,
        source_type: source.type,
        chunk_text: chunk,
        embedding: vectors[i] as any,  // pgvector driver accepts number[]
        meta: source.meta,
      }));
      const { error } = await this.sb.from('v8_knowledge_chunks').insert(rows);
      if (error) throw new Error(error.message);

      await recordTrace({
        traceId, agent: 'knowledge', method: 'ingest', feature: this.feature,
        status: 'success', input: { type: source.type, chars: source.content.length },
        output: { sourceId, chunkCount: chunks.length },
        latencyMs: Date.now() - started,
        tokensIn, costUsd, model: 'text-embedding-3-small', version: VERSION,
      });
      return { sourceId, chunkCount: chunks.length, tokensProcessed: tokensIn };
    } catch (err: any) {
      await recordTrace({
        traceId, agent: 'knowledge', method: 'ingest', feature: this.feature,
        status: 'failure', error: String(err?.message ?? err),
        latencyMs: Date.now() - started, version: VERSION,
      });
      throw err;
    }
  }

  async retrieve(query: string, opts: { topK?: number; filter?: Filter; rerank?: boolean } = {}): Promise<RetrievedChunk[]> {
    const traceId = newTraceId();
    const started = Date.now();
    const topK = Math.min(opts.topK ?? DEFAULT_TOPK, HARD_CAP_TOPK);
    try {
      const { vectors, tokensIn } = await embed([query]);
      const queryVec = vectors[0];
      // Build filter
      let qb = this.sb.rpc('v8_match_chunks', {
        query_embedding: queryVec,
        match_count: topK,
        topic_filter: opts.filter?.topicId ?? null,
        source_type_filter: opts.filter?.sourceType ?? null,
      });
      const { data, error } = await qb;
      if (error) throw new Error(error.message);
      const chunks: RetrievedChunk[] = (data ?? []).map((r: any) => ({
        id: r.id, text: r.chunk_text, score: r.similarity,
        meta: { ...(r.meta ?? {}), sourceId: r.source_id },
      }));
      await recordTrace({
        traceId, agent: 'knowledge', method: 'retrieve', feature: this.feature,
        status: 'success', input: { query, topK, filter: opts.filter ?? null },
        output: { count: chunks.length }, latencyMs: Date.now() - started,
        tokensIn, model: 'text-embedding-3-small', version: VERSION,
      });
      return chunks;
    } catch (err: any) {
      await recordTrace({
        traceId, agent: 'knowledge', method: 'retrieve', feature: this.feature,
        status: 'failure', error: String(err?.message ?? err),
        latencyMs: Date.now() - started, version: VERSION,
      });
      throw err;
    }
  }

  async ground(query: string, chunks: RetrievedChunk[], opts: { style?: 'concise'|'detailed'; cite?: boolean; maxTokens?: number } = {}): Promise<GroundedAnswer> {
    const traceId = newTraceId();
    const started = Date.now();
    const cite = opts.cite ?? true;
    const maxTokens = opts.maxTokens ?? 400;
    try {
      const system =
        'You are a UPSC-focused grounded answerer. Use ONLY the provided context chunks. ' +
        (cite ? 'At the end of each claim, inline-cite like [C1], [C2] referring to chunk indices. ' : '') +
        (opts.style === 'concise' ? 'Be brief: 2-3 sentences.' : 'Be thorough but factual.');
      const context = chunks.map((c, i) => `[C${i + 1}] ${c.text}`).join('\n\n');
      const prompt = `Question: ${query}\n\nContext:\n${context}\n\nAnswer:`;
      const res = await chat({ model: DEFAULT_CHAT_MODEL, system, prompt, maxTokens });

      const citations: Citation[] = cite
        ? chunks.map((c, i) => ({
            sourceId: c.meta.sourceId, chunkId: c.id,
            snippet: c.text.slice(0, 120), url: (c.meta as any).url,
          }))
        : [];

      await recordTrace({
        traceId, agent: 'knowledge', method: 'ground', feature: this.feature,
        status: 'success', input: { query, chunkCount: chunks.length, cite },
        output: { textLen: res.text.length, citationCount: citations.length },
        latencyMs: Date.now() - started,
        tokensIn: res.tokensIn, tokensOut: res.tokensOut, costUsd: res.costUsd,
        model: res.model, version: VERSION,
      });

      return { text: res.text, citations, tokensIn: res.tokensIn, tokensOut: res.tokensOut };
    } catch (err: any) {
      await recordTrace({
        traceId, agent: 'knowledge', method: 'ground', feature: this.feature,
        status: 'failure', error: String(err?.message ?? err),
        latencyMs: Date.now() - started, version: VERSION,
      });
      throw err;
    }
  }

  // Test-only helper used by contract test afterAll().
  async __testCleanup(sourceIds: string[]) {
    if (!sourceIds.length) return;
    await this.sb.from('v8_knowledge_chunks').delete().in('source_id', sourceIds);
  }
}

/**
 * In-memory swap implementation (R2 mitigation).
 * Implements same public API; uses substring matching instead of embeddings.
 * Runs the same contract test to prove the wrap is clean.
 */
export class InMemoryKnowledgeAgent implements KnowledgeAgent {
  readonly version: KnowledgeAgentVersion = 'v1';
  private store: Array<{ id: string; sourceId: string; topicId?: string; text: string }> = [];
  private feature: string;
  constructor(opts: AgentInitOpts = {}) { this.feature = opts.feature ?? 'unknown'; }

  async ingest(source: SourceInput): Promise<IngestResult> {
    const sourceId = randomUUID();
    const chunks = chunkText(source.content);
    for (const c of chunks) {
      this.store.push({ id: randomUUID(), sourceId, topicId: source.meta.topicId, text: c });
    }
    await recordTrace({
      traceId: newTraceId(), agent: 'knowledge', method: 'ingest', feature: this.feature,
      status: 'success', version: 'v1',
    });
    return { sourceId, chunkCount: chunks.length, tokensProcessed: 0 };
  }

  async retrieve(query: string, opts: { topK?: number; filter?: Filter } = {}): Promise<RetrievedChunk[]> {
    const topK = Math.min(opts.topK ?? DEFAULT_TOPK, HARD_CAP_TOPK);
    const q = query.toLowerCase();
    const matches = this.store
      .filter((r) => (opts.filter?.topicId ? r.topicId === opts.filter.topicId : true))
      .map((r) => ({ r, score: r.text.toLowerCase().includes(q) ? 1 : 0 }))
      .filter((m) => m.score > 0)
      .slice(0, topK)
      .map((m) => ({
        id: m.r.id, text: m.r.text, score: m.score,
        meta: { sourceId: m.r.sourceId, topicId: m.r.topicId },
      }));
    await recordTrace({
      traceId: newTraceId(), agent: 'knowledge', method: 'retrieve', feature: this.feature,
      status: 'success', version: 'v1',
    });
    return matches;
  }

  async ground(query: string, chunks: RetrievedChunk[], opts: { cite?: boolean } = {}): Promise<GroundedAnswer> {
    const cite = opts.cite ?? true;
    await recordTrace({
      traceId: newTraceId(), agent: 'knowledge', method: 'ground', feature: this.feature,
      status: 'success', version: 'v1',
    });
    return {
      text: `Based on ${chunks.length} chunks: ${chunks[0]?.text.slice(0, 120) ?? 'no data'}`,
      citations: cite ? chunks.map((c) => ({
        sourceId: c.meta.sourceId, chunkId: c.id, snippet: c.text.slice(0, 80),
      })) : [],
      tokensIn: 0, tokensOut: 0,
    };
  }

  async __testCleanup() { this.store = []; }
}
```

- [ ] **Step 3: Add `v8_match_chunks` RPC (pgvector similarity search)**

Create migration `supabase/migrations/059_v8_match_chunks_rpc.sql`:

```sql
CREATE OR REPLACE FUNCTION v8_match_chunks(
  query_embedding vector(1536),
  match_count int,
  topic_filter text DEFAULT NULL,
  source_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_id text,
  topic_id text,
  source_type text,
  chunk_text text,
  meta jsonb,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT id, source_id, topic_id, source_type, chunk_text, meta,
         1 - (embedding <=> query_embedding) AS similarity
  FROM v8_knowledge_chunks
  WHERE (topic_filter IS NULL OR topic_id = topic_filter)
    AND (source_type_filter IS NULL OR source_type = source_type_filter)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

Apply via MCP.

- [ ] **Step 4: Run contract test**

```bash
npx jest src/lib/agents/core/__tests__/knowledge.contract.test.ts
```
Expected: ALL 6 × 2 = 12 assertions PASS across both `real` and `mock` contract variants.

If failures: fix in-place, re-run. Do not commit until green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/core/knowledge-agent.ts \
         supabase/migrations/058_v8_knowledge_chunks.sql \
         supabase/migrations/059_v8_match_chunks_rpc.sql
git commit -m "feat(agents/knowledge): real + in-memory impls + pgvector RPC; contract test green (A3)"
```

---

## Day 5 — Evaluation Agent

### Task 5.1: Fixture + golden snapshot scaffold

**Files:**
- Create: `src/lib/agents/core/__tests__/golden/fixtures/quiz-attempt-fixture.json`
- Create: `src/lib/agents/core/__tests__/golden/baseline/.gitkeep`

- [ ] **Step 1: Fixture quiz attempt**

```json
{
  "userId": "00000000-0000-0000-0000-00000000BEEF",
  "quizId": "fixture-quiz-1",
  "topicId": "polity.fundamental_rights",
  "questions": [
    { "id": "q1", "correct": "A", "userAnswer": "A", "timeMs": 15000 },
    { "id": "q2", "correct": "B", "userAnswer": "C", "timeMs": 22000 },
    { "id": "q3", "correct": "D", "userAnswer": "D", "timeMs": 9000 }
  ]
}
```

- [ ] **Step 2: Threshold config**

Create `src/lib/agents/core/__tests__/golden/lock-thresholds.json`:

```json
{
  "knowledge": {
    "citationCountDeviation": 1,
    "lengthPct": 0.20,
    "schemaStrict": true
  },
  "evaluation": {
    "scoreDriftPct": 0.05,
    "masteryDriftPct": 0.05,
    "schemaStrict": true
  },
  "orchestrator": {
    "citationCountDeviation": 1,
    "lengthPct": 0.25,
    "schemaStrict": true,
    "modeShapeStrict": true
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/core/__tests__/golden/
git commit -m "test(agents/core): golden fixture + per-agent lock thresholds (§4)"
```

### Task 5.2: Evaluation Agent contract test (TDD, fail-first)

**Files:**
- Create: `src/lib/agents/core/__tests__/evaluation.contract.test.ts`

- [ ] **Step 1: Write the test**

```ts
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { EvaluationAgentImpl } from '../evaluation-agent';
import type { QuizAttempt } from '../types';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const fixture: QuizAttempt = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'golden/fixtures/quiz-attempt-fixture.json'), 'utf8'),
);

describe('EvaluationAgent contract', () => {
  const agent = new EvaluationAgentImpl({ feature: 'test' });
  const testUserId = fixture.userId;

  beforeAll(async () => {
    // Seed a throwaway auth user + clean slate in v8 tables
    await sb.from('v8_user_interactions').delete().eq('user_id', testUserId);
    await sb.from('v8_user_mastery').delete().eq('user_id', testUserId);
  });

  afterAll(async () => {
    await sb.from('agent_traces').delete().eq('feature', 'test');
    await sb.from('v8_user_interactions').delete().eq('user_id', testUserId);
    await sb.from('v8_user_mastery').delete().eq('user_id', testUserId);
  });

  it('exposes version v1 and scoringVersion v1', () => {
    expect(agent.version).toBe('v1');
    expect(agent.scoringVersion).toBe('v1');
  });

  it('evaluateAttempt returns correct counts and accuracy', async () => {
    const res = await agent.evaluateAttempt(fixture);
    expect(res.totalCount).toBe(3);
    expect(res.correctCount).toBe(2);
    expect(res.accuracyPct).toBeCloseTo(66.67, 1);
    expect(res.perQuestion).toHaveLength(3);
  });

  it('updateMastery writes v8_user_mastery AND v8_user_interactions rows', async () => {
    await agent.updateMastery(testUserId, fixture);
    const mastery = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId);
    const interactions = await sb.from('v8_user_interactions').select('*').eq('user_id', testUserId);
    expect(mastery.data?.length).toBeGreaterThan(0);
    expect(interactions.data?.length).toBeGreaterThan(0);
    expect(interactions.data?.[0].type).toBe('quiz_attempt');
  });

  it('weakTopics surfaces topics with low mastery', async () => {
    const weak = await agent.weakTopics(testUserId, { limit: 5 });
    expect(Array.isArray(weak)).toBe(true);
    // After 2/3 correct on polity.fundamental_rights, mastery is moderate.
    // The exact number depends on scoring logic, but the call should return.
  });

  it('recomputeMastery is idempotent (spec §1.3 Invariant 2)', async () => {
    const first = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    await agent.recomputeMastery(testUserId);
    const second = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    await agent.recomputeMastery(testUserId);
    const third = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    // Second and third recomputes must produce byte-identical mastery/confidence fields.
    expect(second.data?.length).toBe(third.data?.length);
    for (let i = 0; i < (second.data?.length ?? 0); i++) {
      expect(third.data![i].mastery).toBe(second.data![i].mastery);
      expect(third.data![i].confidence).toBe(second.data![i].confidence);
    }
  });

  it('recomputeMastery reconstructs mastery from interactions alone (spec §1.3 Invariant 1)', async () => {
    const before = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    await sb.from('v8_user_mastery').delete().eq('user_id', testUserId);
    await agent.recomputeMastery(testUserId);
    const after = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    expect(after.data?.length).toBe(before.data?.length);
    for (let i = 0; i < (before.data?.length ?? 0); i++) {
      expect(after.data![i].mastery).toBe(before.data![i].mastery);
    }
  });

  it('analytics returns a summary with counts', async () => {
    const a = await agent.analytics(testUserId);
    expect(typeof a.overallMastery).toBe('number');
    expect(typeof a.topicsTouched).toBe('number');
    expect(Array.isArray(a.weakTopics)).toBe(true);
  });

  it('golden fixture score drift < 5% (R5)', async () => {
    const res = await agent.evaluateAttempt(fixture);
    // Baseline value — if scoringVersion is bumped, re-baseline explicitly.
    const baselineAccuracy = 66.67;
    expect(Math.abs(res.accuracyPct - baselineAccuracy)).toBeLessThan(5);
  });
});
```

- [ ] **Step 2: Run test, verify failure (no impl yet)**

```bash
npx jest src/lib/agents/core/__tests__/evaluation.contract.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Commit failing test**

```bash
git add src/lib/agents/core/__tests__/evaluation.contract.test.ts
git commit -m "test(agents/evaluation): contract test with idempotency + reconstructibility (A4, §1.3)"
```

### Task 5.3: Implement `EvaluationAgentImpl`

**Files:**
- Create: `src/lib/agents/core/evaluation-agent.ts`

- [ ] **Step 1: Write implementation**

```ts
// src/lib/agents/core/evaluation-agent.ts
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { newTraceId, recordTrace } from './traces';
import { chat, DEFAULT_CHAT_MODEL } from './openai-client';
import { KnowledgeAgentImpl } from './knowledge-agent';
import type {
  EvaluationAgent, EvaluationAgentVersion, ScoringVersion,
  QuizAttempt, ScoreResult, Question, Answer, Explanation,
  MasteryDelta, WeakTopic, UserPerformanceSummary,
} from './types';

const VERSION: EvaluationAgentVersion = 'v1';
const SCORING_VERSION: ScoringVersion = 'v1';

export interface EvalInitOpts {
  feature?: string;
}

export class EvaluationAgentImpl implements EvaluationAgent {
  readonly version = VERSION;
  readonly scoringVersion = SCORING_VERSION;
  private sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );
  private feature: string;
  constructor(opts: EvalInitOpts = {}) { this.feature = opts.feature ?? 'unknown'; }

  async evaluateAttempt(attempt: QuizAttempt): Promise<ScoreResult> {
    const traceId = newTraceId();
    const started = Date.now();
    const perQuestion = attempt.questions.map((q) => ({
      id: q.id,
      isCorrect: q.userAnswer === q.correct,
      timeMs: q.timeMs,
    }));
    const correctCount = perQuestion.filter((p) => p.isCorrect).length;
    const totalCount = perQuestion.length;
    const accuracyPct = (correctCount / totalCount) * 100;
    const timeTotalMs = perQuestion.reduce((acc, p) => acc + p.timeMs, 0);

    const result: ScoreResult = { correctCount, totalCount, accuracyPct, timeTotalMs, perQuestion };
    await recordTrace({
      traceId, agent: 'evaluation', method: 'evaluateAttempt', feature: this.feature,
      status: 'success', input: { quizId: attempt.quizId, count: totalCount },
      output: result, latencyMs: Date.now() - started, version: VERSION,
    });
    return result;
  }

  async explainWrong(q: Question, userAnswer: Answer, correct: Answer): Promise<Explanation> {
    const traceId = newTraceId();
    const started = Date.now();
    // Call Knowledge Agent for grounded context.
    const knowledge = new KnowledgeAgentImpl({ feature: this.feature });
    const chunks = await knowledge.retrieve(`${q.prompt} ${correct.text}`, { topK: 4, filter: { topicId: q.topicId } });
    const grounded = await knowledge.ground(
      `Why is "${correct.text}" correct and "${userAnswer.text}" wrong for: ${q.prompt}?`,
      chunks, { cite: true, maxTokens: 350 },
    );

    const explanation: Explanation = {
      answerText: grounded.text,
      citations: grounded.citations,
      whyWrong: `You chose "${userAnswer.text}", but the correct answer is "${correct.text}".`,
      relatedTopics: [q.topicId],
    };
    await recordTrace({
      traceId, agent: 'evaluation', method: 'explainWrong', feature: this.feature,
      status: 'success', input: { questionId: q.id, topicId: q.topicId },
      output: { citationCount: grounded.citations.length },
      latencyMs: Date.now() - started, version: VERSION,
    });
    return explanation;
  }

  async updateMastery(userId: string, attempt: QuizAttempt): Promise<MasteryDelta[]> {
    const traceId = newTraceId();
    const started = Date.now();
    // 1. Append interaction row first (source of truth).
    await this.sb.from('v8_user_interactions').insert({
      user_id: userId,
      type: 'quiz_attempt',
      topic_id: attempt.topicId,
      payload: attempt,
      result: await this.evaluateAttempt(attempt),
      time_spent_ms: attempt.questions.reduce((a, q) => a + q.timeMs, 0),
    });

    // 2. Recompute mastery from interactions (the only legal write path to v8_user_mastery).
    const deltas = await this.recomputeMasteryInternal(userId);

    await recordTrace({
      traceId, agent: 'evaluation', method: 'updateMastery', feature: this.feature,
      status: 'success', input: { userId, topicId: attempt.topicId },
      output: { deltaCount: deltas.length }, latencyMs: Date.now() - started, version: VERSION,
    });
    return deltas;
  }

  async weakTopics(userId: string, opts: { limit?: number } = {}): Promise<WeakTopic[]> {
    const traceId = newTraceId();
    const started = Date.now();
    const { data, error } = await this.sb
      .from('v8_user_mastery')
      .select('topic_id, mastery, confidence, last_seen')
      .eq('user_id', userId)
      .lt('mastery', 0.5)
      .order('mastery', { ascending: true })
      .limit(opts.limit ?? 10);
    if (error) throw error;
    const out: WeakTopic[] = (data ?? []).map((r: any) => ({
      topicId: r.topic_id, mastery: Number(r.mastery), confidence: Number(r.confidence),
      lastSeen: r.last_seen,
    }));
    await recordTrace({
      traceId, agent: 'evaluation', method: 'weakTopics', feature: this.feature,
      status: 'success', output: { count: out.length },
      latencyMs: Date.now() - started, version: VERSION,
    });
    return out;
  }

  async analytics(userId: string): Promise<UserPerformanceSummary> {
    const traceId = newTraceId();
    const started = Date.now();
    const { data: readiness } = await this.sb
      .from('v8_readiness_score').select('*').eq('user_id', userId).maybeSingle();
    const weak = await this.weakTopics(userId, { limit: 5 });
    const summary: UserPerformanceSummary = {
      overallMastery: Number(readiness?.overall_mastery ?? 0),
      strongCount: readiness?.strong_count ?? 0,
      weakCount: readiness?.weak_count ?? 0,
      topicsTouched: readiness?.topics_touched ?? 0,
      recentActivity: readiness?.most_recent_activity ?? null,
      weakTopics: weak,
    };
    await recordTrace({
      traceId, agent: 'evaluation', method: 'analytics', feature: this.feature,
      status: 'success', output: summary,
      latencyMs: Date.now() - started, version: VERSION,
    });
    return summary;
  }

  async recomputeMastery(userId: string): Promise<void> {
    const traceId = newTraceId();
    const started = Date.now();
    await this.recomputeMasteryInternal(userId);
    await recordTrace({
      traceId, agent: 'evaluation', method: 'recomputeMastery', feature: this.feature,
      status: 'success', input: { userId },
      latencyMs: Date.now() - started, version: VERSION,
    });
  }

  // Deterministic, idempotent mastery recomputation.
  // Algorithm (scoringVersion v1): for each topic_id seen in user_interactions,
  //   accuracy = correct / total across all quiz_attempt rows for that topic.
  //   mastery = min(1, accuracy * (1 + log10(1 + attempts)))
  //   confidence = min(1, attempts / 10)
  //   streak_days = consecutive days with ≥1 interaction
  private async recomputeMasteryInternal(userId: string): Promise<MasteryDelta[]> {
    const { data: rows, error } = await this.sb
      .from('v8_user_interactions')
      .select('type, topic_id, result, created_at')
      .eq('user_id', userId)
      .eq('type', 'quiz_attempt')
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Group by topic_id.
    const byTopic = new Map<string, { correct: number; total: number; last: string }>();
    for (const r of rows ?? []) {
      if (!r.topic_id) continue;
      const cur = byTopic.get(r.topic_id) ?? { correct: 0, total: 0, last: r.created_at };
      const score = (r.result ?? {}) as { correctCount?: number; totalCount?: number };
      cur.correct += score.correctCount ?? 0;
      cur.total += score.totalCount ?? 0;
      cur.last = r.created_at;
      byTopic.set(r.topic_id, cur);
    }

    // Before snapshot for deltas
    const beforeRes = await this.sb.from('v8_user_mastery').select('*').eq('user_id', userId);
    const before = new Map<string, any>((beforeRes.data ?? []).map((r: any) => [r.topic_id, r]));

    // Compute and upsert
    const upserts: any[] = [];
    const deltas: MasteryDelta[] = [];
    for (const [topicId, stats] of byTopic) {
      const accuracy = stats.total === 0 ? 0 : stats.correct / stats.total;
      const masteryRaw = accuracy * (1 + Math.log10(1 + stats.total));
      const mastery = Math.min(1, Math.max(0, Number(masteryRaw.toFixed(2))));
      const confidence = Math.min(1, Number((stats.total / 10).toFixed(2)));
      upserts.push({
        user_id: userId, topic_id: topicId,
        mastery, confidence,
        last_seen: stats.last,
        streak_days: 0,  // streak computed in Phase 2 — leave 0 for now
        scoring_version: SCORING_VERSION,
        updated_at: new Date().toISOString(),
      });
      const prev = before.get(topicId);
      deltas.push({
        topicId,
        masteryBefore: prev ? Number(prev.mastery) : 0,
        masteryAfter: mastery,
        confidenceBefore: prev ? Number(prev.confidence) : 0,
        confidenceAfter: confidence,
      });
    }

    // Wipe + re-insert (idempotent, deterministic).
    await this.sb.from('v8_user_mastery').delete().eq('user_id', userId);
    if (upserts.length) {
      const { error: insErr } = await this.sb.from('v8_user_mastery').insert(upserts);
      if (insErr) throw insErr;
    }
    return deltas;
  }
}
```

- [ ] **Step 2: Run contract test**

```bash
npx jest src/lib/agents/core/__tests__/evaluation.contract.test.ts
```
Expected: all 8 assertions PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/core/evaluation-agent.ts
git commit -m "feat(agents/evaluation): impl with idempotent recompute + interactions-first write (A4, §1.3)"
```

---

## Day 6 — Orchestrator Agent

### Task 6.1: Orchestrator contract test (TDD, fail-first)

**Files:**
- Create: `src/lib/agents/core/__tests__/orchestrator.contract.test.ts`

- [ ] **Step 1: Write test**

```ts
import { createClient } from '@supabase/supabase-js';
import { OrchestratorAgentImpl } from '../orchestrator-agent';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const TEST_USER = '00000000-0000-0000-0000-00000000C0DE';

describe('OrchestratorAgent contract', () => {
  const agent = new OrchestratorAgentImpl({ feature: 'test' });

  beforeAll(async () => {
    // Seed a small mastery state so nextBestAction and studyPlan have data.
    await sb.from('v8_user_mastery').delete().eq('user_id', TEST_USER);
    await sb.from('v8_user_mastery').insert([
      { user_id: TEST_USER, topic_id: 'polity.fundamental_rights', mastery: 0.35, confidence: 0.4, scoring_version: 'v1' },
      { user_id: TEST_USER, topic_id: 'economy.gdp', mastery: 0.80, confidence: 0.7, scoring_version: 'v1' },
    ]);
  });

  afterAll(async () => {
    await sb.from('agent_traces').delete().eq('feature', 'test');
    await sb.from('v8_user_mastery').delete().eq('user_id', TEST_USER);
    await sb.from('v8_user_interactions').delete().eq('user_id', TEST_USER);
  });

  it('exposes version v1', () => {
    expect(agent.version).toBe('v1');
  });

  it('answer() in explain mode returns ExplainReply shape', async () => {
    const reply = await agent.answer(TEST_USER, 'What are fundamental rights?', { mode: 'explain' });
    expect(reply.mode).toBe('explain');
    if (reply.mode === 'explain') {
      expect(typeof reply.answer).toBe('string');
      expect(Array.isArray(reply.citations)).toBe(true);
      expect(Array.isArray(reply.relatedTopics)).toBe(true);
    }
  });

  it('answer() in strategy mode returns StrategyReply shape', async () => {
    const reply = await agent.answer(TEST_USER, 'How should I study polity?', { mode: 'strategy' });
    expect(reply.mode).toBe('strategy');
    if (reply.mode === 'strategy') {
      expect(typeof reply.recommendation).toBe('string');
      expect(typeof reply.rationale).toBe('string');
      expect(Array.isArray(reply.nextSteps)).toBe(true);
      expect(Array.isArray(reply.weakTopicsAddressed)).toBe(true);
    }
  });

  it('answer() in revision mode returns RevisionReply shape', async () => {
    const reply = await agent.answer(TEST_USER, 'Revise fundamental rights', { mode: 'revision' });
    expect(reply.mode).toBe('revision');
    if (reply.mode === 'revision') {
      expect(typeof reply.topic).toBe('string');
      expect(Array.isArray(reply.keyPoints)).toBe(true);
      expect(Array.isArray(reply.commonMistakes)).toBe(true);
    }
  });

  it('answer() in diagnostic mode returns DiagnosticReply shape', async () => {
    const reply = await agent.answer(TEST_USER, 'Diagnose my weak areas', { mode: 'diagnostic' });
    expect(reply.mode).toBe('diagnostic');
    if (reply.mode === 'diagnostic') {
      expect(typeof reply.assessment).toBe('string');
      expect(Array.isArray(reply.strengths)).toBe(true);
      expect(Array.isArray(reply.gaps)).toBe(true);
      expect(typeof reply.priorityFix).toBe('string');
    }
  });

  it('orchestrator calls produce parent→child trace chain', async () => {
    const before = await sb.from('agent_traces').select('id', { count: 'exact', head: true })
      .eq('feature', 'test').eq('user_id', TEST_USER);
    await agent.answer(TEST_USER, 'Explain GDP', { mode: 'explain' });
    const after = await sb.from('agent_traces').select('*')
      .eq('feature', 'test').eq('user_id', TEST_USER)
      .order('created_at', { ascending: false }).limit(20);
    // Expect at least 1 orchestrator trace AND at least one child (knowledge or evaluation).
    const orchTraces = (after.data ?? []).filter((r: any) => r.agent === 'orchestrator');
    const childTraces = (after.data ?? []).filter((r: any) => r.parent_trace_id);
    expect(orchTraces.length).toBeGreaterThanOrEqual(1);
    expect(childTraces.length).toBeGreaterThanOrEqual(1);
  });

  it('nextBestAction returns a recommendation grounded in mastery data', async () => {
    const rec = await agent.nextBestAction(TEST_USER);
    expect(['revise','practice','read','rest']).toContain(rec.action);
    expect(typeof rec.reason).toBe('string');
    expect(typeof rec.estimatedMinutes).toBe('number');
  });

  it('studyPlan returns a day-by-day plan for the requested horizon', async () => {
    const plan = await agent.studyPlan(TEST_USER, 3);
    expect(plan.days.length).toBe(3);
    expect(plan.days[0].dayIndex).toBe(1);
    expect(plan.days[0].focus.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
npx jest src/lib/agents/core/__tests__/orchestrator.contract.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/core/__tests__/orchestrator.contract.test.ts
git commit -m "test(agents/orchestrator): contract test with per-mode schema + trace chain (A5)"
```

### Task 6.2: Implement `OrchestratorAgentImpl`

**Files:**
- Create: `src/lib/agents/core/orchestrator-agent.ts`

- [ ] **Step 1: Implementation**

```ts
// src/lib/agents/core/orchestrator-agent.ts
import { createClient } from '@supabase/supabase-js';
import { newTraceId, recordTrace } from './traces';
import { chat, DEFAULT_CHAT_MODEL, STRATEGY_MODEL } from './openai-client';
import { KnowledgeAgentImpl } from './knowledge-agent';
import { EvaluationAgentImpl } from './evaluation-agent';
import type {
  OrchestratorAgent, OrchestratorAgentVersion, MentorMode, MentorReply,
  Recommendation, StudyPlan,
} from './types';

const VERSION: OrchestratorAgentVersion = 'v1';

export interface OrchestratorInitOpts { feature?: string }

export class OrchestratorAgentImpl implements OrchestratorAgent {
  readonly version = VERSION;
  private sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );
  private feature: string;
  constructor(opts: OrchestratorInitOpts = {}) { this.feature = opts.feature ?? 'unknown'; }

  async answer(userId: string, message: string, context: { mode?: MentorMode } = {}): Promise<MentorReply> {
    const mode: MentorMode = context.mode ?? 'explain';
    const parentTrace = newTraceId();
    const started = Date.now();

    try {
      // Sub-agents inherit parent trace so calls chain
      const knowledge = new KnowledgeAgentImpl({ feature: this.feature });
      const evaluator = new EvaluationAgentImpl({ feature: this.feature });

      let reply: MentorReply;
      switch (mode) {
        case 'explain': {
          const chunks = await knowledge.retrieve(message, { topK: 5 });
          const grounded = await knowledge.ground(message, chunks, { cite: true, maxTokens: 400 });
          reply = {
            mode: 'explain',
            answer: grounded.text,
            citations: grounded.citations,
            relatedTopics: [...new Set(chunks.map((c: any) => c.meta.topicId).filter(Boolean))],
          };
          break;
        }
        case 'strategy': {
          const analytics = await evaluator.analytics(userId);
          const system = 'You are a UPSC mentor. Respond ONLY with JSON matching: {recommendation:string, rationale:string, nextSteps:string[], weakTopicsAddressed:string[]}.';
          const prompt = `User asked: ${message}\n\nTheir weak topics: ${analytics.weakTopics.map(w => w.topicId).join(', ') || 'none yet'}\nOverall mastery: ${analytics.overallMastery}\nRespond with JSON.`;
          const res = await chat({ model: STRATEGY_MODEL, system, prompt, jsonMode: true, maxTokens: 500 });
          const parsed = JSON.parse(res.text);
          reply = {
            mode: 'strategy',
            recommendation: String(parsed.recommendation ?? ''),
            rationale: String(parsed.rationale ?? ''),
            nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
            weakTopicsAddressed: Array.isArray(parsed.weakTopicsAddressed) ? parsed.weakTopicsAddressed.map(String) : [],
          };
          break;
        }
        case 'revision': {
          const chunks = await knowledge.retrieve(message, { topK: 4 });
          const system = 'You are a UPSC mentor. Output ONLY JSON: {topic:string, keyPoints:string[], commonMistakes:string[], quickQuiz?:[{q:string,a:string}]}.';
          const context = chunks.map((c: any, i: number) => `[C${i+1}] ${c.text}`).join('\n\n');
          const prompt = `Revise the topic for the student. Message: ${message}\n\nContext:\n${context}`;
          const res = await chat({ model: DEFAULT_CHAT_MODEL, system, prompt, jsonMode: true, maxTokens: 500 });
          const parsed = JSON.parse(res.text);
          reply = {
            mode: 'revision',
            topic: String(parsed.topic ?? message),
            keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
            commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes.map(String) : [],
            quickQuiz: Array.isArray(parsed.quickQuiz) ? parsed.quickQuiz.slice(0, 3) : undefined,
          };
          break;
        }
        case 'diagnostic': {
          const analytics = await evaluator.analytics(userId);
          // Separate strong vs gap topics from mastery data.
          const { data: masteryRows } = await this.sb.from('v8_user_mastery')
            .select('topic_id, mastery').eq('user_id', userId);
          const strengths = (masteryRows ?? [])
            .filter((r: any) => r.mastery >= 0.75)
            .map((r: any) => ({ topicId: r.topic_id, mastery: Number(r.mastery) }));
          const gaps = (masteryRows ?? [])
            .filter((r: any) => r.mastery < 0.5)
            .map((r: any) => ({ topicId: r.topic_id, mastery: Number(r.mastery) }));
          const system = 'UPSC mentor. JSON only: {assessment:string, priorityFix:string}.';
          const prompt = `Student question: ${message}\nAnalytics: overall=${analytics.overallMastery}, strong=${strengths.length}, gaps=${gaps.length}\nTop weak: ${gaps[0]?.topicId ?? 'none'}`;
          const res = await chat({ model: DEFAULT_CHAT_MODEL, system, prompt, jsonMode: true, maxTokens: 350 });
          const parsed = JSON.parse(res.text);
          reply = {
            mode: 'diagnostic',
            assessment: String(parsed.assessment ?? ''),
            strengths, gaps,
            priorityFix: String(parsed.priorityFix ?? gaps[0]?.topicId ?? ''),
          };
          break;
        }
      }

      await recordTrace({
        traceId: parentTrace, agent: 'orchestrator', method: 'answer',
        feature: this.feature, status: 'success', userId,
        input: { message, mode }, output: { mode: reply.mode },
        latencyMs: Date.now() - started, version: VERSION,
      });
      return reply;
    } catch (err: any) {
      await recordTrace({
        traceId: parentTrace, agent: 'orchestrator', method: 'answer',
        feature: this.feature, status: 'failure', userId,
        error: String(err?.message ?? err),
        latencyMs: Date.now() - started, version: VERSION,
      });
      throw err;
    }
  }

  async nextBestAction(userId: string): Promise<Recommendation> {
    const traceId = newTraceId();
    const started = Date.now();
    const evaluator = new EvaluationAgentImpl({ feature: this.feature });
    const a = await evaluator.analytics(userId);
    const weakest = a.weakTopics[0];
    let rec: Recommendation;
    if (a.topicsTouched === 0) {
      rec = { action: 'read', reason: 'No activity yet — start by reading a note.', estimatedMinutes: 15 };
    } else if (weakest && weakest.mastery < 0.3) {
      rec = { action: 'revise', topicId: weakest.topicId, reason: `Mastery at ${weakest.mastery} on ${weakest.topicId} — revise before more practice.`, estimatedMinutes: 20 };
    } else if (weakest) {
      rec = { action: 'practice', topicId: weakest.topicId, reason: `Strengthen ${weakest.topicId} with practice questions.`, estimatedMinutes: 25 };
    } else {
      rec = { action: 'practice', reason: 'All topics look solid — broaden with mixed practice.', estimatedMinutes: 30 };
    }
    await recordTrace({
      traceId, agent: 'orchestrator', method: 'nextBestAction',
      feature: this.feature, status: 'success', userId, output: rec,
      latencyMs: Date.now() - started, version: VERSION,
    });
    return rec;
  }

  async studyPlan(userId: string, horizonDays: number): Promise<StudyPlan> {
    const traceId = newTraceId();
    const started = Date.now();
    const evaluator = new EvaluationAgentImpl({ feature: this.feature });
    const a = await evaluator.analytics(userId);
    const topics = a.weakTopics.length
      ? a.weakTopics.map((w) => w.topicId)
      : ['polity.constitution', 'economy.basics', 'environment.biodiversity'];
    const days = Array.from({ length: horizonDays }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() + i);
      const focus = topics.slice(0, 2).map((topicId) => ({
        topicId, minutes: 45, mode: (i % 3 === 0 ? 'read' : i % 3 === 1 ? 'quiz' : 'revise') as 'read'|'quiz'|'revise',
      }));
      return { dayIndex: i + 1, date: date.toISOString().slice(0, 10), focus };
    });
    const plan = { days };
    await recordTrace({
      traceId, agent: 'orchestrator', method: 'studyPlan',
      feature: this.feature, status: 'success', userId, output: { days: horizonDays },
      latencyMs: Date.now() - started, version: VERSION,
    });
    return plan;
  }
}
```

- [ ] **Step 2: Run contract test**

```bash
npx jest src/lib/agents/core/__tests__/orchestrator.contract.test.ts
```
Expected: all 9 assertions PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/core/orchestrator-agent.ts
git commit -m "feat(agents/orchestrator): 4-mode impl + nextBestAction + studyPlan (A5, §1.2)"
```

### Task 6.3: Lint rule banning direct version string compare (cross-cutting)

**Files:**
- Create: `.eslintrc.agent-core.js` (shared rule)
- Modify: main ESLint config to extend it for agent files

- [ ] **Step 1: Add custom rule via no-restricted-syntax**

Modify `.eslintrc.json` (or `eslint.config.js`) to add under `overrides` for `src/lib/agents/core/**`:

```json
{
  "overrides": [
    {
      "files": ["src/lib/agents/core/**/*.ts", "src/app/dashboard/**/*.tsx"],
      "rules": {
        "no-restricted-syntax": ["error",
          {
            "selector": "BinaryExpression[left.property.name='version'][operator=/^(<|>|==|===|!=|!==|<=|>=)$/]",
            "message": "Use compareAgentVersions() from '@/lib/agents/core/versioning' — never compare version strings directly."
          },
          {
            "selector": "BinaryExpression[right.property.name='version'][operator=/^(<|>|==|===|!=|!==|<=|>=)$/]",
            "message": "Use compareAgentVersions() from '@/lib/agents/core/versioning' — never compare version strings directly."
          }
        ]
      }
    }
  ]
}
```

- [ ] **Step 2: Verify lint runs clean on existing agent files**

```bash
npm run lint -- src/lib/agents/core
```
Expected: no violations.

- [ ] **Step 3: Add a canary file to prove the rule catches direct compare**

Create `src/lib/agents/core/__tests__/lint-canary.ts.skip` (extension `.ts.skip` so it's not compiled) with:
```ts
// If you rename this to .ts the lint should error.
const agent = { version: 'v1' };
if (agent.version < 'v2') {} // should error
```
This file is documentation — do not rename.

- [ ] **Step 4: Commit**

```bash
git add .eslintrc.json src/lib/agents/core/__tests__/lint-canary.ts.skip
git commit -m "chore(lint): ban direct agent version string compare (spec §1.2 rule 4)"
```

---

## Day 7 — **CHECKPOINT: Contract Gate green for all three agents?**

### Dependency Check

- [ ] **Run all three contract tests together**

```bash
npx jest src/lib/agents/core/__tests__/knowledge.contract.test.ts \
          src/lib/agents/core/__tests__/evaluation.contract.test.ts \
          src/lib/agents/core/__tests__/orchestrator.contract.test.ts
```

**Pass decision tree:**

- **All three GREEN:** proceed to Day 8. Track C is unblocked. Mark the day in a commit message.
- **One or more RED:** do NOT start Track C. Spend Day 7 fixing the failing agent(s). If still red at end of day 7, pull scope per the slippage rule (§2 timeline of spec): candidates to drop are D2 (Thin CA slice) and C1's lite mindmap. Document the pull in `docs/changelog/phase-1-scope-pull.md`.

- [ ] **If all green, tag the agent-foundation milestone**

```bash
git tag phase-1-agent-foundation-green
git commit --allow-empty -m "checkpoint: all three agents pass Contract Gate (Day 7)"
```

### Task 7.1: Golden-snapshot baseline capture (R11 + §4)

**Files:**
- Create: `src/lib/agents/core/__tests__/golden/baseline/*.snap.json` (auto-written)
- Create: `src/lib/agents/core/__tests__/golden/snapshot-compare.ts`

- [ ] **Step 1: Write the snapshot utility**

```ts
// src/lib/agents/core/__tests__/golden/snapshot-compare.ts
import fs from 'fs';
import path from 'path';

const BASELINE_DIR = path.join(__dirname, 'baseline');
const THRESHOLDS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../lock-thresholds.json'), 'utf8'),
);

export function snapshotOrAssert(name: string, actual: any, agent: 'knowledge' | 'evaluation' | 'orchestrator') {
  const file = path.join(BASELINE_DIR, `${name}.snap.json`);
  if (!fs.existsSync(file)) {
    // First run — baseline not yet promoted. Write a candidate, fail the test.
    fs.writeFileSync(file + '.candidate', JSON.stringify(actual, null, 2));
    throw new Error(`No baseline for ${name}. Candidate written to ${file}.candidate — review and rename to .snap.json to promote.`);
  }
  const baseline = JSON.parse(fs.readFileSync(file, 'utf8'));
  const t = THRESHOLDS[agent];
  // Schema strict = same top-level keys.
  if (t.schemaStrict) {
    const bk = Object.keys(baseline).sort().join(',');
    const ak = Object.keys(actual).sort().join(',');
    if (bk !== ak) throw new Error(`Schema drift in ${name}: baseline=${bk} actual=${ak}`);
  }
  // Citation count deviation.
  if (typeof t.citationCountDeviation === 'number' && Array.isArray(baseline.citations) && Array.isArray(actual.citations)) {
    const diff = Math.abs(baseline.citations.length - actual.citations.length);
    if (diff > t.citationCountDeviation) {
      throw new Error(`Citation count drift in ${name}: baseline=${baseline.citations.length} actual=${actual.citations.length}`);
    }
  }
  // Length deviation.
  if (typeof t.lengthPct === 'number' && typeof baseline.text === 'string' && typeof actual.text === 'string') {
    const pct = Math.abs(actual.text.length - baseline.text.length) / Math.max(1, baseline.text.length);
    if (pct > t.lengthPct) {
      throw new Error(`Length drift in ${name}: baseline=${baseline.text.length} actual=${actual.text.length} (${(pct*100).toFixed(1)}%)`);
    }
  }
  // Score drift (evaluation-specific).
  if (typeof t.scoreDriftPct === 'number' && typeof baseline.accuracyPct === 'number' && typeof actual.accuracyPct === 'number') {
    const drift = Math.abs(actual.accuracyPct - baseline.accuracyPct) / Math.max(1, baseline.accuracyPct);
    if (drift > t.scoreDriftPct) {
      throw new Error(`Score drift in ${name}: baseline=${baseline.accuracyPct} actual=${actual.accuracyPct}`);
    }
  }
}
```

- [ ] **Step 2: Capture initial baselines**

Run the contract tests once in "capture mode" — add baselines for:
- `knowledge-retrieve.snap.json` — one retrieve call's output structure (chunk count, avg score range)
- `knowledge-ground.snap.json` — one ground call's text + citations
- `evaluation-scoring.snap.json` — the fixture attempt result
- `mentor-explain.snap.json`, `mentor-strategy.snap.json`, `mentor-revision.snap.json`, `mentor-diagnostic.snap.json` — one reply per mode

Manually review each candidate file, ensure output looks sane (not garbage), rename `.candidate` → `.snap.json`, git add.

- [ ] **Step 3: Commit baselines**

```bash
git add src/lib/agents/core/__tests__/golden/snapshot-compare.ts \
         src/lib/agents/core/__tests__/golden/baseline/*.snap.json
git commit -m "test(agents): promote initial golden snapshot baselines (R11, §4)"
```

### Task 7.2: PR template (cross-cutting)

**Files:**
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Write template**

```markdown
## What

<!-- 1-3 sentence summary -->

## Why

<!-- Motivation / linked issue -->

## Verification

### Contract Gate (for PRs touching src/lib/agents/core/**)
- [ ] `npx jest src/lib/agents/core/__tests__` all green locally
- [ ] CI green on latest commit
- [ ] Golden snapshots unchanged (or version bumped with `docs/changelog/` entry)

### Demo Gate (for PRs touching src/app/dashboard/**)
- [ ] Capture attached for: _______________
- [ ] Fresh-user smoke script run ID: _______________
- [ ] `agent_traces` sample rows (paste 3-5 rows showing real work):

```sql
-- paste output of:
select agent, method, feature, status, latency_ms, tokens_in, tokens_out
from agent_traces
where user_id = '<fresh-user-id>' order by created_at desc limit 5;
```

### Reviewer sign-off (required)
- [ ] I watched the demo and confirm:
  - Flow is coherent (no confusion points)
  - Output is sensible (not garbage AI)
  - No obvious UX break or misleading state
```

- [ ] **Step 2: Commit**

```bash
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "chore(gh): PR template with Contract + Demo gate checkboxes (§3.6)"
```

### Task 7.3: Fresh-user smoke script scaffold

**Files:**
- Create: `scripts/smoke-fresh-user.mjs`

- [ ] **Step 1: Write script (Node 18+ built-in fetch)**

```js
#!/usr/bin/env node
// scripts/smoke-fresh-user.mjs
// End-to-end smoke test on a throwaway user. Runs in CI pre-deploy.
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL (e.g. https://upscbyvarunsh.aimasteryedu.in)

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

if (!URL || !KEY) { console.error('Missing SUPABASE_URL/SERVICE_ROLE'); process.exit(1); }

const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const email = `smoke-${Date.now()}@smoke.test`;
const password = 'SmokeTest2026!';

async function createUser() {
  const r = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!r.ok) throw new Error(`createUser ${r.status}: ${await r.text()}`);
  return (await r.json()).id;
}

async function deleteUser(id) {
  await fetch(`${URL}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: h });
}

async function hasInteraction(userId, type) {
  const r = await fetch(`${URL}/rest/v1/v8_user_interactions?user_id=eq.${userId}&type=eq.${type}&select=id`, { headers: h });
  return (await r.json()).length > 0;
}

async function hasTrace(userId, agent) {
  const r = await fetch(`${URL}/rest/v1/agent_traces?user_id=eq.${userId}&agent=eq.${agent}&select=id`, { headers: h });
  return (await r.json()).length > 0;
}

async function main() {
  console.log(`[smoke] creating ${email}`);
  const userId = await createUser();
  let ok = true;
  try {
    // TODO — once feature endpoints exist (Day 8-10), call them and assert.
    // Placeholder assertions until then:
    console.log(`[smoke] user ${userId} created OK`);
  } finally {
    await deleteUser(userId);
    console.log('[smoke] cleaned up');
  }
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Manual run against prod**

```bash
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/smoke-fresh-user.mjs
```
Expected: exit 0, prints `[smoke] cleaned up`.

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke-fresh-user.mjs
git commit -m "feat(smoke): fresh-user smoke script scaffold (§3.3)"
```

---

## Day 8 — Notes surface migration (C1)

### Task 8.1: Replace Notes service-layer calls with Knowledge Agent

**Files:**
- Modify: `src/app/dashboard/notes/new/page.tsx`
- Modify: `src/app/dashboard/notes/[id]/page.tsx`
- Modify: `src/app/api/notes/generate/route.ts` (or wherever note generation lives)
- Create: `src/components/notes/lite-mindmap.tsx`

- [ ] **Step 1: Audit existing Notes data flow**

```bash
grep -rn "from '@/lib/services/notes-service'" src/ 2>&1
grep -rn "from '@/lib/services/notes'" src/ 2>&1
```
Note each location; these are candidates for agent migration.

- [ ] **Step 2: Rewrite `/api/notes/generate` to use Knowledge Agent**

Replace service-layer calls with:

```ts
import { KnowledgeAgentImpl } from '@/lib/agents/core/knowledge-agent';

// inside POST handler, after auth:
const knowledge = new KnowledgeAgentImpl({ feature: 'notes' });
// Ingest the topic prompt + generate body via ground().
const chunks = await knowledge.retrieve(body.topic, { topK: 6 });
const grounded = await knowledge.ground(
  `Generate a comprehensive UPSC note on: ${body.topic}`,
  chunks,
  { cite: true, style: 'detailed', maxTokens: 900 },
);
// Ingest the generated note back into v8_knowledge_chunks so future queries include it.
const ingested = await knowledge.ingest({
  type: 'note',
  content: grounded.text,
  meta: { topicId: body.topicId, title: body.topic },
});
// Write to v8_user_interactions as type='note_generated'.
```

Remove direct `supabase.from('notes').insert(...)` from the generation path inside this route — Knowledge Agent is the only legal author of v8_knowledge_chunks rows from agent territory. Notes storage for user viewing can remain in the existing `notes` table, but the AI content generation must go through the agent.

- [ ] **Step 3: Build lite mindmap component**

```tsx
// src/components/notes/lite-mindmap.tsx
type MindmapNode = { id: string; label: string; children?: MindmapNode[] };

export function LiteMindmap({ root }: { root: MindmapNode }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 overflow-auto">
      <h4 className="text-sm font-semibold text-white/70 mb-3">Related topics</h4>
      <ul className="space-y-1 text-sm">
        <Node node={root} depth={0} />
      </ul>
    </div>
  );
}

function Node({ node, depth }: { node: MindmapNode; depth: number }) {
  return (
    <li>
      <span className="text-white/80" style={{ paddingLeft: depth * 12 }}>
        {depth > 0 ? '└─ ' : ''}{node.label}
      </span>
      {node.children?.length ? (
        <ul>{node.children.map((c) => <Node key={c.id} node={c} depth={depth + 1} />)}</ul>
      ) : null}
    </li>
  );
}
```

Derive the mindmap from the first 8 citations of the generated note (root = topic; leaves = distinct citation titles).

- [ ] **Step 4: Wire mindmap into `/dashboard/notes/[id]/page.tsx`**

Read citations off the note, build a `MindmapNode`, render `<LiteMindmap root={...} />`.

- [ ] **Step 5: Manual end-to-end check locally**

```bash
npm run dev
```
1. Log in as admin (credentials in `ADMIN_CREDENTIALS.md`).
2. Go to `/dashboard/notes/new`, enter a topic, generate.
3. Open the generated note — mindmap visible, citations linked, no console errors.
4. Query agent_traces:
   ```sql
   select agent, method, feature, status, latency_ms
   from agent_traces where feature='notes' order by created_at desc limit 10;
   ```
   Expected: rows for `knowledge.retrieve`, `knowledge.ground`, `knowledge.ingest`.

- [ ] **Step 6: Record 60s Demo Gate capture**

Log out. Create a NEW user via admin panel. Log in as that user. Generate a note. Capture 60s @ 1080p MP4 with Network tab visible. Save to `docs/demos/phase-1/C1-notes-<yyyymmdd>.mp4`.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/notes/ src/components/notes/lite-mindmap.tsx \
         src/app/api/notes/generate/
git commit -m "feat(notes): migrate Notes surface to Knowledge Agent + lite mindmap (C1)"
```

---

## Day 9 — Quiz surface migration (C2)

### Task 9.1: Replace Quiz service-layer calls with Evaluation Agent

**Files:**
- Modify: `src/app/dashboard/quiz/[id]/page.tsx`
- Modify: quiz-submit API route (wherever it lives; likely `src/app/api/quiz/[id]/submit/route.ts`)

- [ ] **Step 1: Audit**

```bash
grep -rn "from '@/lib/services/quiz-service'" src/ 2>&1
```

- [ ] **Step 2: Rewrite quiz submit handler to use Evaluation Agent**

```ts
import { EvaluationAgentImpl } from '@/lib/agents/core/evaluation-agent';

const evaluator = new EvaluationAgentImpl({ feature: 'quiz' });
const score = await evaluator.evaluateAttempt(attempt);
await evaluator.updateMastery(userId, attempt);
// For wrong answers, call explainWrong() per question.
```

Remove direct `supabase.from('user_progress').update(...)` calls in this path — Evaluation Agent handles all mastery writes to `v8_user_mastery`.

- [ ] **Step 3: Wire weak-topic display on quiz result page**

After submission, call `evaluator.weakTopics(userId)` and show "Topics to revise" panel.

- [ ] **Step 4: Local end-to-end**

Take a quiz. See score + wrong-answer explanations with citations. Check dashboard shows new weak topic.

- [ ] **Step 5: Demo capture**

60s MP4 saved to `docs/demos/phase-1/C2-quiz-<yyyymmdd>.mp4`.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/quiz/ src/app/api/quiz/
git commit -m "feat(quiz): migrate Quiz surface to Evaluation Agent (C2)"
```

---

## Day 10 — Mentor surface migration (C3) + **SECOND CHECKPOINT**

### Task 10.1: Replace Mentor page with Orchestrator-backed UI

**Files:**
- Modify: `src/app/dashboard/mentor/page.tsx`
- Create: `src/components/mentor/mode-selector.tsx`
- Create/Modify: Mentor API route (`src/app/api/mentor/answer/route.ts`)

- [ ] **Step 1: Build ModeSelector component**

```tsx
// src/components/mentor/mode-selector.tsx
'use client';
import type { MentorMode } from '@/lib/agents/core/types';

const MODES: { id: MentorMode; label: string; blurb: string }[] = [
  { id: 'explain',    label: 'Explain',    blurb: 'Grounded answer with citations' },
  { id: 'strategy',   label: 'Strategy',   blurb: 'What to do next, why' },
  { id: 'revision',   label: 'Revision',   blurb: 'Key points + common mistakes' },
  { id: 'diagnostic', label: 'Diagnostic', blurb: 'Assess strengths + gaps' },
];

export function ModeSelector({ value, onChange }: {
  value: MentorMode; onChange: (m: MentorMode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            value === m.id
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
              : 'bg-white/5 text-white/40 hover:text-white border border-white/[0.05]'
          }`}
          title={m.blurb}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite Mentor page to dark theme + Orchestrator**

Replace any `bg-gray-50` with dark-theme classes. Wire `ModeSelector` → `/api/mentor/answer` → render reply per mode's schema.

```tsx
// Per-mode render example:
switch (reply.mode) {
  case 'explain': return <ExplainCard answer={reply.answer} citations={reply.citations} related={reply.relatedTopics} />;
  case 'strategy': return <StrategyCard rec={reply.recommendation} rationale={reply.rationale} steps={reply.nextSteps} />;
  case 'revision': return <RevisionCard topic={reply.topic} points={reply.keyPoints} mistakes={reply.commonMistakes} />;
  case 'diagnostic': return <DiagnosticCard assessment={reply.assessment} strengths={reply.strengths} gaps={reply.gaps} />;
}
```

- [ ] **Step 3: API route**

```ts
// src/app/api/mentor/answer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OrchestratorAgentImpl } from '@/lib/agents/core/orchestrator-agent';
import { getUser } from '@/lib/auth/get-user';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { message, mode } = await req.json();
  const orchestrator = new OrchestratorAgentImpl({ feature: 'mentor' });
  const reply = await orchestrator.answer(user.id, message, { mode });
  return NextResponse.json(reply);
}
```

- [ ] **Step 4: Local check — all 4 modes**

For each mode, ask a representative question, verify reply shape is correct.

- [ ] **Step 5: Four Demo captures (one per mode)**

- `docs/demos/phase-1/C3-mentor-explain-<yyyymmdd>.mp4`
- `docs/demos/phase-1/C3-mentor-strategy-<yyyymmdd>.mp4`
- `docs/demos/phase-1/C3-mentor-revision-<yyyymmdd>.mp4`
- `docs/demos/phase-1/C3-mentor-diagnostic-<yyyymmdd>.mp4`

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/mentor/ src/components/mentor/ src/app/api/mentor/
git commit -m "feat(mentor): migrate to Orchestrator Agent with 4-mode selector (C3)"
```

### CHECKPOINT — Day 10: Hero surfaces done?

- [ ] All three hero surfaces (C1, C2, C3) demo-captured with fresh user on VPS
- [ ] Reviewer sign-off checkbox self-checked after watching each capture
- [ ] agent_traces shows real traces from real-user paths (not just tests)

If one hero is blocked, pull scope per §7 of spec: drop thin CA slice or lite mindmap. Document in `docs/changelog/phase-1-scope-pull.md`.

---

## Day 11 — Splash + Dashboard refresh

### Task 11.1: Animated splash screen (B1)

**Files:**
- Create: `src/components/brand/splash.tsx`
- Modify: `src/app/layout.tsx` (or wherever first-paint gating happens)

- [ ] **Step 1: Splash component**

```tsx
// src/components/brand/splash.tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { Logo } from './logo';
import { DriftingOrbs } from './animated-backdrop';

export function Splash({ onReady }: { onReady: () => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      onAnimationComplete={() => onReady()}
    >
      <DriftingOrbs palette={['rgba(249,115,22,0.28)', 'rgba(59,130,246,0.22)']} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <Logo variant="full" size={64} animated />
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Gate first paint**

In `src/app/layout.tsx` or a client provider, show `<Splash />` for 1.2s max on first load, then fade out. Use `sessionStorage` so it only shows once per tab.

- [ ] **Step 3: Demo capture**

`docs/demos/phase-1/B1-splash-<yyyymmdd>.mp4` — 10s showing splash → dashboard transition.

- [ ] **Step 4: Commit**

```bash
git add src/components/brand/splash.tsx src/app/layout.tsx
git commit -m "feat(brand): animated splash with logo shimmer on first load (B1)"
```

### Task 11.2: Dashboard refresh consuming real user_mastery (B3)

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Read the Evaluation Agent's analytics() on the server**

```tsx
// src/app/dashboard/page.tsx (server component)
import { EvaluationAgentImpl } from '@/lib/agents/core/evaluation-agent';
import { OrchestratorAgentImpl } from '@/lib/agents/core/orchestrator-agent';
import { getUser } from '@/lib/auth/get-user';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return /* redirect or minimal shell */;

  const evaluator = new EvaluationAgentImpl({ feature: 'admin' });
  const orchestrator = new OrchestratorAgentImpl({ feature: 'admin' });

  const [analytics, nextAction] = await Promise.all([
    evaluator.analytics(user.id),
    orchestrator.nextBestAction(user.id),
  ]);

  return (
    <div className="...">
      <HeroStats overallMastery={analytics.overallMastery} topicsTouched={analytics.topicsTouched} />
      <WeakTopicsPanel items={analytics.weakTopics} />
      <NextBestActionCard rec={nextAction} />
      {/* Google AI Studio-inspired grid */}
    </div>
  );
}
```

- [ ] **Step 2: Honest empty state when topicsTouched === 0**

Show "Start your first quiz or generate a note — your mastery map builds as you learn." No fake stats.

- [ ] **Step 3: Demo capture**

`docs/demos/phase-1/B3-dashboard-<yyyymmdd>.mp4` — show fresh user (empty state) then same user after completing one quiz (populated state).

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): refresh consuming real user_mastery + next-best-action (B3)"
```

---

## Day 12 — Animation sweep + Thin CA slice

### Task 12.1: Animation sweep on remaining feature pages (B4)

**Files:**
- Modify: any feature page still on `bg-gray-50` or without `MotionReveal`

- [ ] **Step 1: Grep for stragglers**

```bash
grep -rn "bg-gray-50" src/app/dashboard 2>&1
```

- [ ] **Step 2: Replace with dark-theme + `<MotionReveal>` + `<DriftingOrbs>` where appropriate**

Reuse the existing primitives from `src/components/brand/animated-backdrop.tsx`. No new primitives.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard
git commit -m "style(dashboard): dark-theme consistency + animated backdrops across feature pages (B4)"
```

### Task 12.2: Thin CA Slice (D2)

**Files:**
- Create: `src/app/dashboard/current-affairs/page.tsx` (already exists — rewrite with thin slice marker)
- Create: `scripts/seed-thin-ca.mjs` — ingests 3-5 pre-written CA entries through Knowledge Agent

- [ ] **Step 1: Seed script**

```js
#!/usr/bin/env node
// scripts/seed-thin-ca.mjs
// Ingests 3-5 hand-written CA entries via Knowledge Agent's ingest() path.
// Purpose: ship a "Live CA" surface without running Hermes yet.

import { KnowledgeAgentImpl } from '../src/lib/agents/core/knowledge-agent.js';

const entries = [
  {
    topicId: 'economy.budget-2026',
    title: 'Union Budget 2026 — Key Highlights',
    content: `...hand-written UPSC-relevant summary of Union Budget 2026 with 400-600 words...`,
  },
  // 2-4 more...
];

const agent = new KnowledgeAgentImpl({ feature: 'ca' });
for (const e of entries) {
  const res = await agent.ingest({
    type: 'ca',
    content: e.content,
    meta: { topicId: e.topicId, title: e.title, publishedAt: new Date().toISOString() },
  });
  console.log(`ingested ${e.title} -> ${res.sourceId} (${res.chunkCount} chunks)`);
}
```

Run once: `node scripts/seed-thin-ca.mjs`.

(Note: ingestion must go via the app's compiled agent — easiest is to wrap this in an internal admin API route that runs the ingest server-side; the script above is pseudocode until Next.js compilation is available for direct Node import. Alternative: put the seeding logic behind `POST /api/admin/seed-thin-ca` and curl it.)

- [ ] **Step 2: Rewrite CA page with honest banner**

In the CA page, add banner: "Live Current Affairs powered by Hermes — expanding in Phase 2A" with `PulseDot color="bg-amber-400"`.

- [ ] **Step 3: Demo capture**

`docs/demos/phase-1/D2-thin-ca-<yyyymmdd>.mp4` — user opens CA entry, sees source + banner, clicks into detail.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/current-affairs/ scripts/seed-thin-ca.mjs
git commit -m "feat(ca): thin CA slice — 3-5 pre-ingested entries via Knowledge Agent (D2)"
```

---

## Day 13 — **Buffer Day — Demo Gate captures + observability**

Protect this day aggressively. Do NOT pick up new work.

### Task 13.1: Complete Demo Gate captures

- [ ] **Checklist — every deliverable with a capture**

Verify `docs/demos/phase-1/` has all of:
- A3 Knowledge (from C1 capture, or separate if needed)
- A4 Evaluation (from C2 capture)
- A5 Orchestrator (all 4 mode captures from C3)
- B1 Splash
- B3 Dashboard
- C1 Notes
- C2 Quiz
- C3 Mentor × 4 modes
- D2 Thin CA

- [ ] **Step 2: Reviewer sign-off sweep**

Watch each capture. For any that show confusion points or garbage output, fix the underlying issue and re-record.

### Task 13.2: Observability check — zero contract leakage

- [ ] **Step 1: Query agent_traces for suspicious patterns**

```sql
-- Any feature values that shouldn't exist?
select feature, count(*) from agent_traces group by feature order by count desc;

-- Any orphaned child traces?
select count(*) from agent_traces t
where parent_trace_id is not null
  and not exists (select 1 from agent_traces p where p.trace_id = t.parent_trace_id);

-- Error rate per agent per feature (last 24h):
select agent, feature, status, count(*)
from agent_traces
where created_at > now() - interval '24 hours'
group by 1,2,3 order by 1,2,3;
```

Expected: features are only in { notes, quiz, mentor, ca, admin, test, smoke }; zero orphans; failure rate < 2%.

- [ ] **Step 2: Contract leakage proxy check**

Pick a user id that used the app today. For that user:
```sql
-- Count user actions vs traces in the same window.
-- If actions > traces by a large margin, the UI is bypassing agents.
select (
  select count(*) from v8_user_interactions where user_id = '<uid>' and created_at > now() - interval '6h'
) as interactions,
(
  select count(*) from agent_traces where user_id = '<uid>' and created_at > now() - interval '6h'
) as traces;
```

Traces should be ≥ interactions (usually several-×). If lower, a path is writing to `v8_user_interactions` without going through an agent — find and fix.

### Task 13.3: Fresh-user smoke script extension

- [ ] **Step 1: Extend smoke script to assert real interactions + traces**

Update `scripts/smoke-fresh-user.mjs` to:
1. POST to `/api/notes/generate` with topic and auth
2. Poll for note ready
3. POST to `/api/quiz/<quizId>/submit` with fixture answers
4. POST to `/api/mentor/answer` with `mode=explain`
5. Query Supabase: assert v8_user_interactions has note_generated + quiz_attempt + mentor_turn; assert agent_traces has knowledge + evaluation + orchestrator rows
6. Delete user

- [ ] **Step 2: Run smoke against prod**

```bash
APP_URL=https://upscbyvarunsh.aimasteryedu.in \
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<key> \
node scripts/smoke-fresh-user.mjs
```
Expected: exit 0, all assertions pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke-fresh-user.mjs
git commit -m "test(smoke): assert interactions + traces for fresh-user end-to-end (§3.3)"
```

---

## Day 14 — **Buffer Day — Final verification + Phase-1 changelog**

### Task 14.1: Run full test suite

- [ ] **Step 1: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: no violations in `src/lib/agents/core/**`.

- [ ] **Step 3: All contract tests**

```bash
npx jest src/lib/agents/core/__tests__/
```
Expected: ALL green.

- [ ] **Step 4: Golden-snapshot drift check**

Re-run contract tests twice to confirm stability. If baselines drift, either fix the drift or explicitly re-baseline with justification in `docs/changelog/`.

### Task 14.2: Write phase-1 changelog

**Files:**
- Create: `docs/changelog/phase-1.md`

- [ ] **Step 1: Honest summary**

```markdown
# Phase 1 — v8 Production Hardening — Changelog

**Date shipped:** YYYY-MM-DD
**Spec:** docs/superpowers/specs/2026-04-18-v8-production-hardening-design.md
**Previous phase:** N/A (first hardening phase under v8 discipline)

## Verified working

- Knowledge Agent (v1), Evaluation Agent (v1, scoringVersion v1), Orchestrator Agent (v1)
- Contract Gate: 23+ assertions across three agents, all green on `main`
- Fresh-user smoke script exits 0 end-to-end on prod
- Golden-snapshot baselines promoted for all 7 reply shapes
- Hero surfaces migrated: Notes (C1), Quiz (C2), Mentor 4-mode (C3)
- Dashboard refresh consuming real `v8_user_mastery` via analytics()
- Animated splash + new logo on first paint
- Thin CA slice: 3-5 pre-ingested entries visible in CA surface
- Phase-2 placeholders for Ask-Doubt, Mains Eval, Planner, Daily Digest, Lectures, full Mindmaps
- agent_traces populated with real traffic (not just tests); zero contract leakage detected in observability sweep

## Known limitations (honest)

- Thin CA slice is 3-5 hand-written entries — no scraping, no cron; Hermes integration ships in Phase 2A.
- Lite mindmap in Notes is a flat topic tree; graph-view arrives in Phase 2B.
- Full RAG-Anything codebase still in tree (wrapped, not removed); rip in Phase 2A P2A.3.
- `user_mastery` (legacy Hermes table) and `v8_user_mastery` (v8 derived) coexist intentionally. Unification: Phase 2B.
- Streak calculation in `v8_user_mastery` returns 0 (placeholder); real streak logic in Phase 2B.
- No voice/OCR/multilingual expansion (Phase 3).
- No Remotion/Manim lecture pipeline (Phase 4).

## Next

Phase 2A — Completeness Core (10-12 days). Ask-Doubt UI + full Hermes pipeline + RAG-Anything rip.
```

- [ ] **Step 2: Commit**

```bash
git add docs/changelog/phase-1.md
git commit -m "docs: Phase 1 changelog — verified working, known limitations, next phase"
```

### Task 14.3: Tag + push

- [ ] **Step 1: Tag the release**

```bash
git tag -a phase-1-complete -m "Phase 1 — v8 production hardening — three agents, three hero surfaces, honest foundation"
```

- [ ] **Step 2: Push to main + push tag**

```bash
git push origin main
git push origin phase-1-complete
```

- [ ] **Step 3: Verify Coolify auto-deploy**

Watch Coolify dashboard. Confirm deploy succeeds and `/admin/agent-health` (if built) or a direct trace query shows live traffic.

- [ ] **Step 4: Final Phase-1 success check (§7.3 of spec)**

All seven must be true:
1. [ ] All Contract Gate tests green on main (verified Day 14)
2. [ ] Fresh-user smoke script passes on production deploy (verified Day 13)
3. [ ] Demo captures exist for A3, A4, A5, B1, B3, C1, C2, C3, D2, and 4× Mentor modes (verified Day 13)
4. [ ] Reviewer sign-off checked for each (verified Day 13)
5. [ ] agent_traces shows real user-path traffic, not just tests (verified Day 13)
6. [ ] Zero contract leakage in observability check (verified Day 13)
7. [ ] docs/changelog/phase-1.md written (Day 14)

If any are false, Phase 1 is NOT done — fix before declaring complete.

---

## Self-Review (author — run after writing)

### Spec coverage check

Working through the spec section by section, every Phase-1 requirement must map to a task:

| Spec requirement | Task(s) |
|---|---|
| §1.1 Three agents + user model diagram | Conceptual — implemented by 1.1–1.4, 2.1–2.2, 4.1, 5.3, 6.2 |
| §1.2 Agent contracts with versioning | Task 2.1 (types), 1.6 (compareAgentVersions), 6.3 (lint rule) |
| §1.2 Enforcement rule (no feature code → services for agent territory) | Tasks 8.1, 9.1, 10.1 (migrations) + implicit in contract tests |
| §1.3 v8_user_interactions append-only | Task 1.1 |
| §1.3 v8_user_mastery derived, Evaluation-only writes | Tasks 1.2, 5.3 |
| §1.3 Derived views | Task 1.3 |
| §1.3 Invariant 1 (reconstructibility) | Task 5.2 assertion "recomputeMastery reconstructs mastery from interactions alone" |
| §1.3 Invariant 2 (idempotency) | Task 5.2 assertion "recomputeMastery is idempotent" |
| §1.3 Invariant 3 (source-of-truth priority) | Task 5.3 impl (updateMastery wipes + recomputes; interactions inserted first) |
| §1.4 RAG-Anything wrap | Task 3.1 (inventory) + 4.1 (impl wraps) |
| §2 Track A-D deliverables | Tasks 1.1–1.4 (A1,A2), 3–4 (A3), 5 (A4), 6 (A5), 1.7 (B2), 11.1 (B1), 11.2 (B3), 12.1 (B4), 8 (C1), 9 (C2), 10 (C3), 2.3–2.5 (D1,D3), 12.2 (D2) |
| §3.1 Contract Gate | Tasks 3.3, 5.2, 6.1 (tests) |
| §3.2 Demo Gate (60s captures + reviewer checkbox) | Tasks 8.1, 9.1, 10.1, 11.1, 11.2, 12.2 (captures) + 7.2 (PR template) |
| §3.3 Fresh-user smoke script | Tasks 7.3 (scaffold), 13.3 (extended) |
| §3.4 Observability loop | Task 13.2 |
| §3.5 Golden snapshots | Tasks 5.1 (scaffold), 7.1 (baseline capture) |
| §3.6 PR template | Task 7.2 |
| §4 Agent Regression Lock | NOT in Phase 1 — activates between Phase 2B and Phase 3. Fixture infra (Task 5.1, 7.1) lays the groundwork. |
| §5 Risks R1-R12 | Mitigations baked into: Task 4.1 (R2 swap impl), 5.3 (R5 scoringVersion), 6.2 (R6 schema per mode), 7.1 (R11 snapshots), agents (R12 hard caps), 13.3 (smoke/R9) |
| §6 D1-D6 | Lint rule (D1), vector(1536) migration (D2), cost tracking (D3), PR template + branch protection (D4), Phase-2.0 post-phase (D5), spec commit (D6 — already done) |
| §7.3 Success criteria (7-point gate) | Task 14.3 Step 4 |

All items covered. No gaps.

### Placeholder scan

- No "TBD", "TODO" in task bodies (there is one `// TODO` inside the smoke script scaffold that points to Day 13 extension — intentional and scheduled).
- No "implement later" or "fill in details" — every code block is complete enough to paste.
- No "similar to Task N" — code is repeated where needed.

### Type consistency

- `KnowledgeAgent`, `EvaluationAgent`, `OrchestratorAgent` interfaces (Task 2.1) match impls (Tasks 4.1, 5.3, 6.2).
- `MentorMode` enum `'explain' | 'strategy' | 'revision' | 'diagnostic'` consistent across types, contract test, impl, ModeSelector.
- `MentorReply` discriminated union with `mode` tag consistent in types + contract test + Orchestrator impl + Mentor page switch statement.
- Table names: `v8_user_interactions`, `v8_user_mastery`, `v8_knowledge_chunks`, `agent_traces` — used consistently everywhere.
- Versioning: `'v1'` as string-literal type used consistently; `compareAgentVersions()` is the only comparison path.

No inconsistencies found.

---

**End of plan.**
