# Phase 1 — v8 Production Hardening

**Window:** 2026-04-05 → 2026-04-19 (14 days)
**Spec:** `docs/superpowers/specs/2026-04-18-v8-production-hardening-design.md`
**Plan:** `docs/superpowers/plans/2026-04-18-phase-1-foundation.md`

## Goal

Replace the aging RAG-Anything + ad-hoc scoring path with three first-class
agents (Knowledge, Evaluation, Orchestrator) fronted by typed HTTP routes,
real observability (`agent_traces`), and a Contract Gate that runs against a
real Supabase project and real LLM calls — not mocks.

## What shipped

### Track A — Agent + Data Foundation

| ID | Deliverable | Commit |
|----|-------------|--------|
| A1 | `v8_user_interactions` + `v8_user_mastery` + derived views | `081341f`, `9d0dd81`, `0c32d38` |
| A2 | `agent_traces` table with trace-chain FKs + RLS + versioning columns | `6b0ddf7`, `62e67bc`, `e2a635c` |
| A3 | Knowledge Agent (real + in-memory) wrapping pgvector RPC | `4454705`, `0433f20` |
| A4 | Evaluation Agent with scoring v1 + idempotent `recomputeMastery` + golden fixture | `be7d42f`, `7576b5b`, `10590df`, `41d5168` |
| A5 | Orchestrator Agent (explain/strategy/revision/diagnostic) + `nextBestAction` + `studyPlan` | `51a5295`, `5d4c469` |

Contract Gate: **28/28 green** against real Supabase `emotqkukvfwjycvwfvyj` +
Ollama Cloud (chat) + 9Router (embed) on `main`.

### Track B — Foundation UI

| ID | Deliverable | Commit |
|----|-------------|--------|
| B1 | Animated splash screen with assembling logo + halo + tagline | (pre-existing `welcome-splash.tsx`) |
| B2 | Dark-theme-native SVG logo + animated shimmer variant | `d42144f`, `8868243` |
| B3 | Dashboard Topic Mastery card reading `v8_user_mastery` (top-3 weak + top-3 strong, live EMA bars) | `34acf81` |
| B4 | Brand animation primitives: DriftingOrbs, MotionReveal, PulseDot, ParticleField, GradientAura | `b0f8a08` |

### Track C — Hero Surfaces

Gated on A3 + A4 + A5 Contract Gate green.

| ID | Deliverable | Commit |
|----|-------------|--------|
| C1 | Notes page embeds `KnowledgeSearchPanel` → `/api/agents/knowledge` retrieve | `cbaf494` |
| C2 | Quiz submit dual-writes through `EvaluationAgent.updateMastery` — legacy response shape preserved | `cbaf494` |
| C3 | Mentor chat routes through `/api/agents/orchestrator` with 4-mode chip selector + per-mode reply rendering | `cbaf494` |

### Track D — Placeholders + Thin CA + Admin

| ID | Deliverable | Commit |
|----|-------------|--------|
| D1 | Honest Phase-2 placeholder pages (Ask-Doubt, Mains Eval, Planner, Daily Digest, Lectures, full Mindmaps) | `97c7c7f`, `f01ab0f` |
| D2 | 5-entry CA thin-slice seed via Knowledge Agent (Economy, Polity, IR, S&T, Governance), idempotent | `34acf81` |
| D3 | Admin route audit + classification (26 routes) | `e45fa3a` |

### Cross-cutting

- Fresh-user smoke at `scripts/smoke-fresh-user.mjs` (`0d0384e`)
- PR template with Contract Gate + Demo Gate + Reviewer sign-off checkboxes (`b89969c`)
- `compareAgentVersions()` lexical-safe util + lint rule banning direct version string compare (`cc01d81`, `afa54da`)
- `lock-thresholds.json` per-agent drift budgets (`10590df`)
- Provider-aware LLM client (Ollama Cloud chat + 9Router embed + OpenAI fallback) with raw-fetch override for 9router `dimensions` param (`60b8d20`)
- Parent→child trace chain with `userId` propagation through sub-agent constructors (`60b8d20`)

## Success Criteria (§7.3)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | All Contract Gate tests green on main | ✅ 28/28 |
| 2 | Fresh-user smoke passes on production deploy | ✅ (on Coolify auto-deploy) |
| 3 | Demo captures for A3, A4, A5, B1, B3, C1, C2, C3, D2, all 4 Mentor modes | ⏳ reviewer sign-off pending |
| 4 | Reviewer sign-off checked per PR | ✅ PR-template enforced |
| 5 | `agent_traces` shows real traffic from real user-path | ✅ verified — 4-mode parent/child chain present |
| 6 | Zero contract leakage in observability check | ✅ version columns populated, no string-compare leakage |
| 7 | `docs/changelog/phase-1.md` written | ✅ this document |

## What we deliberately deferred

- **Phase 2A** — animated mindmaps at full fidelity (placeholder card lives)
- **Phase 2B** — Ask-Doubt + Mains Eval streaming UX
- **Phase 3** — full Planner agent with calendar integrations
- **Phase 4** — Daily Digest generation pipeline
- **Phase 5** — Lectures / video-first learning surface
- **Phase 6** — full admin CMS overhaul

## Known follow-ups

- B4 animation sweep on the long tail of feature pages — deferred to Phase 2A alongside mindmap upgrades.
- Demo capture bundle (60s VPS grabs for each hero surface) — per-PR review queue.
- `snapshot-compare.util.ts` extracted from test matcher (`cbaf494`).

## Tag

`v8-phase-1` on `main` at `34acf81`.
