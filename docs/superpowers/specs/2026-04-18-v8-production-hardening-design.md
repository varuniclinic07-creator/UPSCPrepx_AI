# UPSC PrepX AI — v8 Production Hardening Design

**Date:** 2026-04-18
**Status:** Approved design, ready for implementation planning
**Owner:** Dr. Varuni (with Claude as implementation pair)

---

## 0. Executive Intent

UPSC PrepX AI has drifted into the pattern every early-stage AI product falls into: **"97% complete" claimed, ~60% real**. Feature pages exist; the engine under them is a mix of stubs, fake stats, and direct Supabase calls from UI that duplicate what should be agent logic.

This design fixes the root cause — not by shipping more features, but by **replacing the truth-definition problem with a mechanical verification gate**, and by rebuilding the product as a **learning intelligence system** with three core agents rather than a collection of features.

**The reframe (credit: product owner):**
> You're not building features → you're building agents + surfaces.
> Features = UI surfaces. Agents = real product.
> Everything else becomes "just another interface on top of this brain."

**Non-goals of this spec:**
- Not a feature spec. Features are downstream of agents.
- Not a visual design spec. Foundation UI is scoped but detailed design lives in frontend skills.
- Not a marketing plan. The spec's job is engineering truth, not positioning.

---

## 1. Architecture

### 1.1 Three agents, one user model

```
                    ┌───────────────────────────┐
                    │   Orchestrator Agent      │
                    │   (Mentor surface)        │
                    │   — decides what next     │
                    └──────────────┬────────────┘
                                   │ reads both
           ┌───────────────────────┼───────────────────────┐
           ▼                                               ▼
┌─────────────────────┐                       ┌──────────────────────┐
│  Knowledge Agent    │                       │  Evaluation Agent    │
│  (Notes surface)    │                       │  (Quiz surface)      │
│  — what is true     │                       │  — how you're doing  │
└──────────┬──────────┘                       └──────────┬───────────┘
           │                                             │
           └───────────────────┬─────────────────────────┘
                               ▼
           ┌───────────────────────────────────────────────┐
           │            Single User Model                  │
           │  user_mastery  +  user_interactions  + views  │
           └───────────────────────────────────────────────┘
```

### 1.2 Agent contracts

All agent contracts are **explicitly versioned** via string-literal unions. Every agent MUST remain backward-compatible with at least one prior version — a deprecated version can be marked but cannot be removed in the same release it's deprecated in.

```ts
// src/lib/agents/types.ts — versioning primitives

type KnowledgeAgentVersion = 'v1';
type EvaluationAgentVersion = 'v1';      // bumping this triggers R5 golden-fixture rebaseline
type OrchestratorAgentVersion = 'v1';
type ScoringVersion = 'v1';              // independent of EvaluationAgentVersion — scoring can evolve faster

type MentorMode = 'explain' | 'strategy' | 'revision' | 'diagnostic';

// src/lib/agents/knowledge-agent.ts
interface KnowledgeAgent {
  readonly version: KnowledgeAgentVersion;

  ingest(source: SourceInput): Promise<IngestResult>;

  retrieve(query: string, opts?: {
    topK?: number;          // default 6, hard cap 8 (R12)
    filter?: Filter;
    rerank?: boolean;       // different behaviours for Mentor vs Quiz vs Ask-Doubt
  }): Promise<RetrievedChunk[]>;

  ground(query: string, chunks: RetrievedChunk[], opts?: {
    style?: 'concise' | 'detailed';
    cite?: boolean;         // citation control is trust-critical
    maxTokens?: number;     // hard cap (R12)
  }): Promise<GroundedAnswer>;

  trace?(input: unknown, output: unknown): Promise<void>;
}

// src/lib/agents/evaluation-agent.ts
interface EvaluationAgent {
  readonly version: EvaluationAgentVersion;
  readonly scoringVersion: ScoringVersion;   // R5: bumping requires golden fixture re-baseline

  evaluateAttempt(attempt: QuizAttempt): Promise<ScoreResult>;

  explainWrong(
    q: Question,
    userAnswer: Answer,
    correct: Answer
  ): Promise<Explanation>;   // internally calls Knowledge Agent

  updateMastery(userId: string, attempt: QuizAttempt): Promise<MasteryDelta>;

  weakTopics(userId: string, opts?: { limit?: number }): Promise<WeakTopic[]>;

  analytics(userId: string): Promise<UserPerformanceSummary>;

  // Phase 5 prerequisite — mastery must be rebuildable from interactions alone.
  // Also the only legal write path for user_mastery outside of evaluateAttempt/updateMastery.
  recomputeMastery(userId: string): Promise<void>;
}

// src/lib/agents/orchestrator-agent.ts
interface OrchestratorAgent {
  readonly version: OrchestratorAgentVersion;

  answer(userId: string, message: string, context?: {
    mode?: MentorMode;      // Each mode has a distinct reply schema (R6)
  }): Promise<MentorReply>;

  nextBestAction(userId: string): Promise<Recommendation>;

  studyPlan(userId: string, horizonDays: number): Promise<StudyPlan>;
}
```

**Versioning rules (enforced by Contract Gate):**
1. Every agent exposes `readonly version` as a string-literal type — never bare `string`.
2. Bumping any version requires: (a) golden-snapshot rebaseline, (b) migration note in `docs/changelog/`, (c) backward-compat shim retained for ≥1 prior version.
3. Bumping `ScoringVersion` additionally requires running `recomputeMastery()` for all users as part of the deploy (migration script, not a one-off).
4. **Version comparison MUST be lexical-safe** — use numeric-only ordering (`v1`, `v2`, `v10` treated as integers after the `v` prefix) OR full semver. Never rely on string `<`/`>` comparison. A utility `compareAgentVersions(a, b): -1 | 0 | 1` lives in `src/lib/agents/versioning.ts` and is the single legal way to compare versions anywhere in the codebase. Lint rule bans direct string comparison of `version` fields.

**Enforcement rule (non-negotiable):** no feature code imports from `lib/services/*` for anything the agents cover. Notes page uses Knowledge Agent. Quiz page uses Evaluation Agent. Mentor page uses Orchestrator Agent. If a surface reaches Supabase directly for agent-territory data, Contract Gate fails and the PR does not merge.

### 1.3 Data model

Three tables (two new + views, one existing extended).

**Write-path rules (invariants enforced in code review + Contract Gate):**

| Table / View | Write source | Written by | Notes |
|---|---|---|---|
| `user_interactions` | **append-only** | Knowledge / Evaluation / Orchestrator agents ONLY | Source of truth. Never updated, never deleted. |
| `user_mastery` | **derived / cached** | Evaluation Agent ONLY (`evaluateAttempt`, `updateMastery`, `recomputeMastery`) | Never user-written. Never written by UI. Never written by services outside the agent. Must be fully recomputable from `user_interactions`. |
| `weak_topics` / `strong_topics` / `readiness_score` | **read-only view** | — | No writes ever. Derived from `user_mastery`. |
| `agent_traces` | **append-only** | `traces.ts` helper ONLY, called by every agent method | Observability backbone. Async/batched writes, no silent drops. |

**Invariant 1 — Reconstructibility:** `user_mastery` MUST be fully reconstructible from `user_interactions` alone. This is tested in Contract Gate — the Evaluation Agent golden fixture runs `recomputeMastery()` on a wiped `user_mastery` and asserts identical result. If reconstruction diverges, gate fails.

**Invariant 2 — Idempotency:** `recomputeMastery()` MUST be idempotent and deterministic. Given the same `user_interactions` set, it MUST produce identical `user_mastery` output on every run, regardless of when run or how many times. Contract Gate test runs `recomputeMastery()` twice on the same fixture and byte-compares the result.

**Invariant 3 — Source of Truth Priority:** In case of any conflict, disagreement, or partial-failure state between `user_interactions` and `user_mastery`, **`user_interactions` is the only source of truth.** The derived `user_mastery` is discarded and recomputed. This rule governs migrations, bug recovery, disaster recovery, and any state reconciliation. There is no scenario in which `user_mastery` overrides `user_interactions`.

Direct Supabase access to `user_mastery` from any location outside `src/lib/agents/evaluation-agent.ts` is a blocker-level Contract Gate violation.

#### `user_mastery` (aggregated state — fast reads)

```sql
CREATE TABLE user_mastery (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id text NOT NULL,           -- syllabus-mapped topic key
  mastery numeric(3,2) NOT NULL CHECK (mastery BETWEEN 0 AND 1),
  confidence numeric(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  last_seen timestamptz NOT NULL DEFAULT now(),
  streak_days integer NOT NULL DEFAULT 0,
  scoring_version text NOT NULL,    -- R5: tracks which logic produced this row
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX idx_user_mastery_user_last_seen ON user_mastery(user_id, last_seen DESC);
```

#### `user_interactions` (event log — source of truth)

```sql
CREATE TABLE user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,               -- 'quiz_attempt' | 'note_read' | 'mentor_turn' | 'note_generated' | ...
  topic_id text,
  payload jsonb NOT NULL,           -- full event detail, agent-specific shape
  result jsonb,                     -- score, mastery delta, etc.
  time_spent_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_interactions_user_created ON user_interactions(user_id, created_at DESC);
CREATE INDEX idx_user_interactions_type ON user_interactions(type);
```

This log is the **single source of truth**. `user_mastery` can always be recomputed from `user_interactions` — that is what `EvaluationAgent.recomputeMastery()` does.

#### Derived views

```sql
CREATE VIEW weak_topics AS
  SELECT user_id, topic_id, mastery, last_seen
  FROM user_mastery
  WHERE mastery < 0.5
  ORDER BY user_id, mastery ASC;

CREATE VIEW strong_topics AS ...;
CREATE VIEW readiness_score AS ...;  -- aggregate mastery across syllabus
```

#### `agent_traces` (observability — already exists, needs extension)

```sql
-- Existing table gets migration to add:
ALTER TABLE agent_traces ADD COLUMN trace_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE agent_traces ADD COLUMN parent_trace_id uuid REFERENCES agent_traces(trace_id);
ALTER TABLE agent_traces ADD COLUMN feature text;  -- 'notes' | 'quiz' | 'mentor' | 'admin' | 'test'
ALTER TABLE agent_traces ADD COLUMN status text NOT NULL DEFAULT 'success';  -- 'success' | 'failure' | 'degraded'
-- Existing: agent, input, output, latency_ms, tokens_in, tokens_out, user_id, created_at

CREATE INDEX idx_agent_traces_trace ON agent_traces(trace_id);
CREATE INDEX idx_agent_traces_parent ON agent_traces(parent_trace_id);
CREATE INDEX idx_agent_traces_feature_created ON agent_traces(feature, created_at DESC);
```

**Partitioning strategy:** partition on `created_at` monthly. 30-day hot / 90-day warm / archive cold tier via nightly job.

### 1.4 RAG-Anything treatment

**Phase 1:** Knowledge Agent wraps RAG-Anything internally. UI only talks to the agent. RAG-Anything never imported from outside `src/lib/agents/knowledge-agent.ts`.

**Phase 2A:** Internals swapped for native pgvector + OpenAI embeddings. UI untouched. Golden-fixture regression test proves behavioural equivalence before rip.

---

## 2. Phase 1 Scope — Foundation (10-14 days)

**Four tracks with explicit dependency ordering. Parallelism only where dependencies permit.**

### 2.0 Intra-phase dependency graph

```
Track A (Agent + Data Foundation) — critical path
├── A1 user_mastery + user_interactions migrations     [Day 1-2]
├── A2 agent_traces extension migration                [Day 1-2]
├── A3 Knowledge Agent implementation + contract test  [Day 3-5]   ─┐
├── A4 Evaluation Agent implementation + contract test [Day 4-6]    ├── must ALL pass Contract Gate
└── A5 Orchestrator Agent implementation + 4 modes     [Day 5-7]   ─┘    before Track C starts

Track B (Foundation UI) — fully parallel, no agent dep
├── B1 Animated splash                                 [any day]
├── B2 New logo                                        [Day 1-2]
├── B3 Dashboard refresh (reads real user_mastery)     [Day 11-12, soft-dep on A1]
└── B4 Animation sweep on remaining pages              [Day 11-12]

Track C (Hero Surfaces) — HARD-BLOCKED on A3+A4+A5 all green
├── C1 Notes → Knowledge Agent                         [Day 8]
├── C2 Quiz → Evaluation Agent                         [Day 9]
└── C3 Mentor → Orchestrator (4 modes)                 [Day 10]

Track D (Placeholders + Thin CA) — mostly independent
├── D1 Phase-2 placeholder cards                       [Day 2-3]
├── D2 Thin CA slice (needs A3 for ingest)             [Day 6-7, soft-dep on A3]
└── D3 Admin panel audit                               [Day 2-3]
```

**Dependency rules:**

1. **A1 + A2 are strict prerequisites for A3, A4, A5.** No agent code writes against tables that don't exist yet. Migrations ship Day 1-2.
2. **A3, A4, A5 are prerequisites for C1, C2, C3 respectively — AND collectively.** Per the execution rule: no hero surface starts migration until *all three* agents pass Contract Gate. This is non-negotiable; partial readiness leaks shortcuts.
3. **A3 is a soft prerequisite for D2** (Thin CA). CA entries are ingested through Knowledge Agent; no direct Supabase ingest.
4. **A1 is a soft prerequisite for B3** (Dashboard refresh reads `user_mastery`). B3 can be visually scaffolded earlier against an empty table, but "done" requires real data.
5. **Track B1, B2, D1, D3 have zero dependencies** — they can run on any calendar day. Use them to fill parallel gaps.
6. **Contract Gate is merge-blocking on Track A.** No agent merges without passing. No hero migrates against an unmerged agent.

**Four tracks run in parallel where dependencies permit. They converge at the Demo Gate.**

### Track A — Agent + Data Foundation
| # | Deliverable | Gate |
|---|---|---|
| A1 | `user_mastery` + `user_interactions` + derived views migration, applied to prod | Contract |
| A2 | `agent_traces` extension migration | Contract |
| A3 | Knowledge Agent implementation (wraps existing RAG internally) | Contract + Demo |
| A4 | Evaluation Agent implementation (with `scoringVersion` + `recomputeMastery`) | Contract + Demo |
| A5 | Orchestrator Agent implementation with 4 modes | Contract + Demo |

### Track B — Foundation UI (parallel, no agent dependency)
| # | Deliverable | Gate |
|---|---|---|
| B1 | Animated splash screen (first-paint → ready transition) | Demo |
| B2 | New logo (SVG, dark-theme-native, animated variant for splash) | Demo |
| B3 | Dashboard refresh — Google AI Studio-grade, consuming real `user_mastery` | Demo |
| B4 | Animated-graphics sweep across remaining pages (mentor, lectures, ask-doubt) | Demo |

### Track C — Hero Surfaces (blocked until **all three** agents pass Contract Gate)
| # | Deliverable | Gate |
|---|---|---|
| C1 | Notes page migrated to Knowledge Agent. Generate → ground → cite → trace. Lite mindmap rendered. Zero direct Supabase calls from UI. | Demo |
| C2 | Quiz page migrated to Evaluation Agent. Attempt → score → explain → updateMastery → weakTopics surfaced. | Demo |
| C3 | Mentor page migrated to Orchestrator Agent. Mode selector in UI. Each mode produces distinctly-shaped reply. | Demo |

### Track D — Honest Phase-2 Placeholders + Thin CA Slice
| # | Deliverable | Gate |
|---|---|---|
| D1 | Ask-Doubt, Mains Eval, Planner, Daily Digest, Lectures, Mindmaps (full page) → each gets a "Phase 2 — landing [target]" card describing what's coming and why it's parked | Demo |
| D2 | **Thin CA slice:** 3-5 pre-generated CA entries ingested via Knowledge Agent, visible on dashboard + linkable from notes. Labelled "Live CA powered by Hermes — expanding in Phase 2". No cron, no scraping. | Demo |
| D3 | Admin panel audit — every admin route works or shows the same honest placeholder | Demo |

### Out of Phase 1 (explicit)

- Ask-Doubt surface (agent ships; UI does not)
- Full Hermes scraping loop (Thin CA slice only)
- Mains Evaluation, Planner, Daily Digest, Lectures, full Mindmaps
- Remotion + Manim pipeline
- Full RAG-Anything removal
- Voice, OCR, multilingual beyond current
- Native mobile

### Timeline — 10-14 calendar days

| Days | Work |
|------|------|
| 1-3 | A1, A2 migrations. B2 logo. D1, D2, D3 placeholders + thin CA. Low-risk parallel. |
| 4-7 | A3, A4, A5 agent implementations + contract tests. **Critical path.** |
| 8-10 | C1, C2, C3 hero migrations. Each day = one hero. (Blocked until day 7 Contract Gate green.) |
| 11-12 | B1 splash, B3 dashboard refresh, B4 animation sweep. |
| 13-14 | **Protected buffer.** Demo Gate captures, reviewer sign-off, fresh-user smoke, bug fixes, commit + push. |

**Slippage rule:** if behind at end of day 7 or day 10, pull scope (drop thin CA or lite mindmap first). Do not stretch timeline.

---

## 3. Verification Gate

### 3.1 Contract Gate — agents only

**Location:** `src/lib/agents/__tests__/{knowledge,evaluation,orchestrator}.contract.test.ts`

**Rules:**
- Real Supabase (test project or `phase1_test_*` prefixed tables)
- Real LLM (OpenAI), cheap model for tests (GPT-4o-mini)
- Short prompts, small fixtures, low token outputs (cost discipline)
- Each test asserts the full interface
- Tests tear down their own data
- Behaviour assertions, not exact strings (handles non-determinism)
- Retry once on transient network errors; logged, not silent

**What each contract test proves:**

| Agent | Must prove |
|---|---|
| Knowledge | Ingest fixture doc → retrieve → ground with citations → trace logged with real `latency_ms` + `tokens`. **Swap test:** second mock implementation of interface passes same contract (proves wrap is clean — R2 mitigation). |
| Evaluation | Score fixture attempt → `user_mastery` row moves in right direction → `user_interactions` event written → `weakTopics()` surfaces real weak topic → `explainWrong()` produces child trace under Knowledge Agent. **Golden fixture:** fixed sequence of attempts → expected mastery values → drift > 5% fails gate. |
| Orchestrator | Call `answer()` once per mode → each reply matches its mode's schema → traces chain (orchestrator → knowledge + orchestrator → evaluation). `nextBestAction()` grounded in real `user_mastery`. |

**When it runs:**
- Pre-commit hook on agent files
- CI on every push to any branch
- Merge-blocking on `main`

**Failure mode:** PR cannot merge. No override. No "we'll fix in follow-up."

### 3.2 Demo Gate — all UI surfaces

**One 60-second screen capture per deliverable.** Real VPS, fresh user, fresh browser session.

**PR-template checklist:**

```
[ ] Fresh user created via admin API in session
[ ] Browser devtools open; Network tab visible
[ ] Captured at 1080p, MP4, ≤60s
[ ] agent_traces query result shown at end proving real work
[ ] Stored at docs/demos/phase-1/<deliverable-id>-<yyyymmdd>.mp4
[ ] Linked in PR description

### Reviewer sign-off (required)
[ ] I watched the demo and confirm:
    - Flow is coherent (no confusion points)
    - Output is sensible (not garbage AI)
    - No obvious UX break or misleading state
```

**Anti-mock fingerprint:** if the capture shows a spinner-then-result but `agent_traces` is empty for that user + time window, the capture is invalid.

### 3.3 Fresh-user smoke script

New file: `scripts/smoke-fresh-user.mjs`

Assertions:
1. Creates throwaway user via Supabase admin API
2. Logs in, hits `/dashboard` — no console errors, no "undefined" rendered
3. Generates one note → Knowledge trace exists
4. Takes one 3-question quiz → Evaluation trace + `user_mastery` write + **`user_interactions` row exists**
5. Asks mentor in 'explain' mode → Orchestrator trace with ≥1 child trace + **`user_interactions` row exists**
6. Deletes the user
7. Exits 0 on pass, 1 on any failure

**Runs:** CI pre-deploy. Blocks deploy on failure.

### 3.4 Observability loop

Nightly check (manual for Phase 1, automated in Phase 5) queries `agent_traces` for:

1. **Contract leakage** — any UI-originated action without corresponding trace. Budget: **0**. Strict, no sampling.
2. **Trace completeness** — minimum trace count per action (Mentor ≥2, Quiz ≥1 eval + optional knowledge). Budget: **0 violations**.
3. **Error rate per agent** — `status='failure'` / total. Budget: **< 2%**.
4. **p95 latency per agent per feature** — baselined after week 1.
5. **Token cost per agent per feature** — drives optimisation. Alert if p95 > threshold (R12).

First dashboard: `/admin/agent-health`. Functional, not pretty.

### 3.5 Golden prompt-output snapshots (R11)

**Location:** `src/lib/agents/__tests__/golden/`

- 3-5 fixed Mentor queries × 4 modes = up to 20 snapshot tests
- 3-5 fixed Knowledge retrieval queries = 5 snapshot tests

**Assertions (not exact text):**
- Reply structure matches mode schema
- Citation count within expected range
- Length within bounds (min/max tokens)
- No forbidden patterns (e.g., Mentor output containing "I am an AI language model")

Runs in Contract Gate. Updates require explicit version bump.

### 3.6 PR template addition

```markdown
## Verification

### Contract Gate
- [ ] `pnpm test:agents:contract` passes locally
- [ ] CI green on latest commit
- [ ] Golden snapshots unchanged (or version bumped with justification)

### Demo Gate
- [ ] Capture attached for: _________________
- [ ] Fresh-user smoke script run ID: _________________
- [ ] agent_traces sample (paste 3-5 rows showing real work)

### Reviewer
- [ ] Flow coherent / output sensible / no UX break
```

---

## 4. Phased Roadmap

### Phase 1 — Foundation (10-14 days)
Specified above in §2.

### Phase 2A — Completeness Core (10-12 days)
**Infrastructure-sensitive deliverables that touch Knowledge Agent deeply.**

| # | Deliverable | Agent |
|---|---|---|
| P2A.1 | Ask-Doubt UI | Knowledge + light Orchestrator |
| P2A.2 | Full Current Affairs + Hermes pipeline | New **Content Agent** feeding Knowledge |
| P2A.3 | RAG-Anything removal (internal to Knowledge Agent) | — |

**P2A.3 regression gate:** behavioural equivalence proven before rip. The fixture set is the Phase 1 golden-snapshot corpus from §3.5 (5 Knowledge retrieval queries + 20 Mentor mode × query combinations). `retrieve()` + `ground()` outputs from the new pgvector-backed implementation must match the wrapped-RAG-Anything baseline on all structural assertions (citation count, chunk count, length bounds). Zero user-visible regression permitted.

### Phase 2.0 Release Moment — **between 2A and 2B**
- Publish to 3-5 real UPSC aspirants (not internal only)
- 7-day observation window
- Monitor: `agent_traces` error rates, p95 latency, user behaviour patterns, confusion points
- **Gate to Phase 2B:** no critical regressions observed; at least 3 users have non-trivial interaction (>10 actions each)

### Phase 2B — Surface Expansion (8-10 days)
**Built on stable agents; lower infra risk.**

| # | Deliverable | Agent |
|---|---|---|
| P2B.1 | Mains Evaluation | Evaluation extended with `evaluateMainsAnswer()` |
| P2B.2 | Planner | Orchestrator's `studyPlan()` gets a UI |
| P2B.3 | Mindmaps full page | Derived from Knowledge Agent (upgrades Phase 1 lite mindmap) |
| P2B.4 | Daily Digest | Content → Knowledge |

### Agent Regression Lock — **between 2B and Phase 3**

**What is locked:**
- Knowledge / Evaluation / Orchestrator agent behaviour baselines
- Golden-fixture structural outputs (citation counts, length bounds, reply schema shape)
- Scoring logic (`scoringVersion` pinned)

**Mechanical enforcement (not symbolic):**

1. **CI gate `agents:regression-lock`** — runs on every PR that touches `src/lib/agents/**`. Loads the locked baseline from `src/lib/agents/__tests__/golden/baseline/`. Runs current agent code against the same fixture set. **Fails if:**
   - Any reply schema shape changes (TypeScript discriminated-union mismatch)
   - Citation count deviates by > 1 from baseline on any fixture
   - Length (tokens) deviates by > 20% from baseline on any fixture
   - Evaluation scoring drift > 5% on golden quiz fixture
   - Any `version` string changes without a matching `docs/changelog/agent-vN-to-vN+1.md` file

2. **Merge-blocker flag on `main`.** No override. Breaking the lock requires:
   - Bumping agent `version` string-literal type
   - Writing migration note in `docs/changelog/`
   - Retaining backward-compat shim for ≥1 prior version (per §1.2 versioning rules)
   - New baseline committed alongside the version bump

3. **Threshold config lives at** `src/lib/agents/__tests__/golden/lock-thresholds.json` — single source of truth for deviation limits, version-controlled, requires review to change. **Thresholds are per-agent** (Knowledge / Evaluation / Orchestrator each get their own limits; same limits for all three won't hold long-term as agents evolve at different rates).

4. **Golden snapshots are immutable once promoted.** No silent overwrite. Re-baselining requires an explicit commit with message prefix `baseline: ` and a `docs/changelog/baseline-YYYY-MM-DD-<agent>.md` justification. CI rejects any PR that modifies a baseline file without the matching changelog entry. Prevents "accidental passing" regressions where a drifted output silently overwrites the baseline.

This lock is what makes Phase 3 (voice, OCR, multilingual) safe. New input modes can change prompts and wrappers, but cannot silently degrade agent output quality.

### Phase 3 — Experience Layer (10-14 days)
| # | Deliverable |
|---|---|
| P3.1 | Voice input (Mentor + Ask-Doubt surfaces) |
| P3.2 | OCR input (photograph → Knowledge ingest) |
| P3.3 | Multilingual depth beyond current EN+HI |
| P3.4 | Admin panel polish (agent-health dashboard, cost analytics, content queue, Hermes history) |
| P3.5 | Mobile-responsive pass on real devices |

### Phase 4 — Lecture & Media Pipeline (14-21 days) — **separated from Phase 3**
Lectures are a pipeline, not a feature. Heavy, async, infra-dependent.

| # | Deliverable |
|---|---|
| P4.1 | Remotion orchestration |
| P4.2 | Manim rendering |
| P4.3 | Script generation via Content Agent |
| P4.4 | Video assembly + storage + cache |
| P4.5 | Lecture player UX |

### Phase 5 — Intelligence Layer (ongoing)
| # | Deliverable | Why possible |
|---|---|---|
| P5.1 | Adaptive difficulty | Evaluation reads `user_mastery` + `user_interactions` |
| P5.2 | Spaced repetition | Orchestrator `nextBestAction()` + mastery decay |
| P5.3 | ML-driven weak-topic prediction | Train on `user_interactions` log |
| P5.4 | Personalized study paths | Planner output becomes unique per user |
| P5.5 | A/B testing framework | Route subsets through different Orchestrator prompts |

**Prerequisite:** ≥30-45 days of real `user_interactions` data.

### Phase 6 (conditional) — Mobile Layer (6-8 weeks)
React Native or Capacitor wrap. Agents untouched. Triggered only after Phase 3 stable + real user demand signal.

### Dependency graph

```
Phase 1 (Foundation)
  │
  ▼
Phase 2A (Ask-Doubt + Hermes + RAG rip)
  │
  ▼
[Phase 2.0 Release Moment — 7-day observation]
  │
  ▼
Phase 2B (Mains + Planner + Mindmaps + Digest)
  │
  ▼
[Agent Regression Lock]
  │
  ▼
Phase 3 (Voice + OCR + Multilingual + Admin + Responsive)
  │
  ▼
Phase 4 (Lectures pipeline)
  │
  ▼
Phase 5 (Intelligence — needs ≥30d interaction data)
  │
  ▼
Phase 6 (Mobile — conditional)
```

### Cross-phase discipline (invariants)

1. **No new agent without contract test + agent_traces hook.** Content Agent in P2A held to same bar.
2. **No surface bypasses an agent.** Leakage-checked every PR.
3. **Every phase ships a phased-release announcement** — changelog with what's verified working / known stubbed / next.

---

## 5. Risks

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|------|------------|--------|------------|-------|
| R1 | LLM provider outage / cost spike | Medium | High | Provider abstracted inside agents; cost circuit-breaker at 80% of monthly budget (D3) triggers automatic downgrade to cheaper model + alert in `/admin/agent-health` | Agents |
| R2 | RAG-Anything wrapper leaks in P2A rip | Medium | High | Phase 1 contract test includes "swap implementation" — second mock of interface passes same contract | Knowledge Agent |
| R3 | Content Agent legal/TOS violation | Medium | Very High | Source audit before P2A, robots.txt + rate-limit adherence, attribution in UI, monthly review | Content Agent |
| R4 | agent_traces table growth | High | Medium | Monthly partitioning; 30d hot / 90d warm / archive cold | Infra |
| R5 | Evaluation mastery drift | Medium | High | Golden fixture test in Contract Gate; `scoringVersion` bumps on intentional changes; `recomputeMastery()` rebuilds from `user_interactions` | Evaluation Agent |
| R6 | Mentor mode collapse | High | Medium | Each mode has distinct reply schema; Contract Gate asserts structural match | Orchestrator Agent |
| R7 | Phase 1 timeline slippage | High | Medium | Days 13-14 protected buffer; check at day 7 + day 10; pull scope not time | All |
| R8 | Contract test non-determinism | Medium | Low | Behaviour assertions, not exact strings; one retry on transient errors, logged | CI |
| R9 | Smoke script LLM cost | Low | Low | Production-bound deploys only; inside $5/day cap | CI |
| R10 | Agent regression lock bypass | Medium | Medium | Break = major version bump + full contract re-baseline, no quick override | Phase 3 gate |
| **R11** | **Prompt drift / silent quality degradation** | **High** | **High** | **Golden prompt-output snapshots in Contract Gate (§3.5).** **Failure defined as:** reply schema shape mismatch, OR citation count deviating > 1 from baseline, OR reply length deviating > 20% from baseline, OR forbidden-pattern match (e.g., "I am an AI language model"). Any failure blocks merge. | **You (→ automated in P5)** |
| **R12** | **Context explosion / token creep** | **High** | **Medium-High** | **Hard caps in agents (`topK` hard-cap 8, `maxTokens` per agent method). All agent calls log `tokens_in`/`tokens_out` to `agent_traces`.** **Failure defined as:** p95 tokens_in > 2× week-1 baseline for a given (agent, feature) tuple, OR any single call exceeding hard cap. Detection runs in nightly observability check (§3.4). Failure triggers alert in `/admin/agent-health` + auto-disables the offending feature until reviewed. | **Knowledge + Orchestrator** |

**Risks considered and not included:**
- Supabase vendor lock-in — not a real risk yet; speed > abstraction
- pgvector scaling — Phase 3/4 concern, not now
- Auth edge cases — covered implicitly by smoke test + fresh-user flow

---

## 6. Decisions (locked) — with measurable acceptance criteria

Each decision has an explicit testable check. If a decision isn't measurable, it isn't enforceable.

| # | Decision | Choice | Measurable acceptance criteria |
|---|----------|--------|-------------------------------|
| D1 | LLM provider for Phase 1 | **OpenAI** — GPT-4o-mini default, GPT-4o for Orchestrator strategy mode. Provider-swappable inside agents. No multi-provider in Phase 1. | **Test:** `process.env.LLM_PROVIDER === 'openai'` asserted in Contract Gate setup. Agent code contains zero imports from non-OpenAI SDKs in Phase 1. Lint rule blocks `@anthropic-ai/*`, `@google/generative-ai` imports. |
| D2 | Embedding model | **`text-embedding-3-small` + pgvector.** Native Supabase support. | **Test:** `user_interactions` and `knowledge_chunks` embedding columns are `vector(1536)`. Contract Gate asserts model name `text-embedding-3-small` in trace metadata. Dim mismatch = test fail. |
| D3 | Monthly LLM budget | **$150/month** Phase 1. Soft alert 60% ($90). Hard circuit at 80% ($120) triggers auto-downgrade to cheaper model. | **Test:** Nightly cron sums `agent_traces.cost_usd` for current calendar month. Alerts fire via `/admin/agent-health` at thresholds. Circuit-breaker state persisted; when tripped, agents use `forceModel: 'gpt-4o-mini'` regardless of caller preference. Reset on month boundary. |
| D4 | Demo capture reviewer | **Self-review** with checkbox. No skipping. | **Test:** PR template contains required reviewer checkboxes (§3.2). GitHub branch protection rule rejects merge if any of those checkboxes unchecked. Enforced mechanically, not trust-based. |
| D5 | Phase 2.0 Release Moment audience | **3-5 real UPSC aspirants** (external). 7-day observation. Internal-only rejected. | **Test:** Phase 2B cannot start until `docs/changelog/phase-2.0-release.md` exists and lists ≥3 external user IDs with ≥10 `user_interactions` rows each during the 7-day window. Verified by query against `user_interactions` joined with user tier metadata. |
| D6 | Spec doc location | **`docs/superpowers/specs/2026-04-18-v8-production-hardening-design.md`** | **Test:** File exists at that exact path and is committed to `main`. CI job `verify-spec` checks presence on every push. |

---

## 7. Appendix

### 7.1 File-level scaffolding (Phase 1)

```
src/lib/agents/
├── knowledge-agent.ts              # interface + implementation
├── evaluation-agent.ts
├── orchestrator-agent.ts
├── types.ts                        # shared types (MentorReply, etc.)
├── traces.ts                       # agent_traces write helper (async/batched)
└── __tests__/
    ├── knowledge.contract.test.ts
    ├── evaluation.contract.test.ts
    ├── orchestrator.contract.test.ts
    └── golden/
        ├── mentor-explain.snap.ts
        ├── mentor-strategy.snap.ts
        ├── mentor-revision.snap.ts
        ├── mentor-diagnostic.snap.ts
        └── knowledge-retrieval.snap.ts

supabase/migrations/
├── 20260418_01_user_mastery.sql
├── 20260418_02_user_interactions.sql
├── 20260418_03_derived_views.sql
└── 20260418_04_agent_traces_extend.sql

scripts/
└── smoke-fresh-user.mjs

docs/demos/phase-1/
└── (60s captures land here)
```

### 7.2 Reply schemas per Mentor mode (R6 structural enforcement)

```ts
type ExplainReply = {
  mode: 'explain';
  answer: string;
  citations: Citation[];
  relatedTopics: string[];
};

type StrategyReply = {
  mode: 'strategy';
  recommendation: string;
  rationale: string;
  nextSteps: string[];   // ordered action items
  weakTopicsAddressed: string[];
};

type RevisionReply = {
  mode: 'revision';
  topic: string;
  keyPoints: string[];   // bullet summary
  commonMistakes: string[];
  quickQuiz?: MicroQuestion[];
};

type DiagnosticReply = {
  mode: 'diagnostic';
  assessment: string;
  strengths: TopicAssessment[];
  gaps: TopicAssessment[];
  priorityFix: string;
};

type MentorReply = ExplainReply | StrategyReply | RevisionReply | DiagnosticReply;
```

Contract Gate validates the discriminated union — if mode is `explain` but reply has `recommendation`, test fails.

### 7.3 Success criteria for Phase 1 completion

Phase 1 is **done** when all of the following are true:

1. All Contract Gate tests green on `main`
2. Fresh-user smoke script passes on production deploy
3. Demo captures exist for A3, A4, A5, B1, B3, C1, C2, C3, D2, and all 4 Mentor modes
4. Reviewer sign-off checked for each
5. `agent_traces` shows real traffic from real user-path (not just tests)
6. Zero contract leakage in observability check
7. `docs/changelog/phase-1.md` written with: verified working / known limitations / Phase 2A starting signal

No self-reported percentages. Either all seven are true or Phase 1 is not done.

---

## 8. What this spec is NOT

- Not an implementation plan. That's the next artifact (via `writing-plans` skill).
- Not immutable. R5/R6 specifically anticipate versioned changes. But changes must go through the scoring-version / agent-version bump process, not silent edits.
- Not a solo-builder disclaimer. If a teammate joins, same gates apply to them. Discipline doesn't relax with team size.

---

**End of design.**
