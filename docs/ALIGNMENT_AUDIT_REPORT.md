# Full Alignment Audit: Master Spec vs Codebase

**Date:** 2026-04-14  
**Spec:** `docs/superpowers/specs/2026-04-13-enterprise-ai-system-design.md`  
**Scope:** All 8 sections + admin console + file structure + environment

---

## Executive Summary

| Domain | Match | Mismatch | Missing | Partial |
|--------|-------|----------|---------|---------|
| DB Schema (Section 2) | 59 | 1 | 0 | 0 |
| AI Provider Chain (Section 3) | 6 | 1 | 2 | 0 |
| Agent Architecture (Section 4) | 14 | 18 | 10 | 2 |
| Normalizer (Section 5) | 10 | 0 | 5 | 0 |
| Content Factory Crons (Section 6) | 4 | 0 | 1 | 1 |
| Living Pages (Section 7) | 9 | 0 | 4 | 3 |
| Mastery Engine (Section 8) | 10 | 1 | 3 | 3 |
| Admin Console (Section 9) | 0 | 0 | 1 | 3 |
| **Totals** | **112** | **21** | **26** | **12** |

**Overall alignment: ~74% fully matching.** The DB schema is nearly perfect (98%). The agent layer has the most critical gaps (wrong method signatures, no retry in BaseAgent, no per-agent provider routing).

---

## CRITICAL Issues (Must Fix — Runtime Crashes / Spec Violations)

### C1. Agent `completeRun()` signature mismatch (7/9 agents)

BaseAgent defines `completeRun(status: string, stats?)` but 7 agents call `completeRun(runId)` or `completeRun(runId, 'failed')` — passing the runId as the status. **Run tracking silently records wrong data for every agent execution.**

**Files:** research-agent.ts, notes-agent.ts, quiz-agent.ts, ca-ingestion-agent.ts, evaluator-agent.ts, video-agent.ts, animation-agent.ts

### C2. Agent `log()` signature mismatch (7/9 agents)

BaseAgent defines `log(level, message, data?)` but 7 agents call `this.log(string)` with a single arg. **TypeScript compile error.**

**Files:** Same as C1.

### C3. Orchestrator crashes on 2 agent routes

- `evaluate_answer` calls `EvaluatorAgent.execute()` — **method does not exist** (has `evaluateAnswer()` and `answerDoubt()`)
- `score_content` calls `QualityAgent.execute()` — **method does not exist** (has `scoreContent()` and `sweepStale()`)

**Result:** Runtime TypeError when orchestrator dispatches these tasks.

### C4. No retry logic in BaseAgent (all 9 agents)

Spec requires "3 retries with exponential backoff (1s, 2s, 4s)" in BaseAgent. **Zero retry logic exists** in the base class. Only the orchestrator has `withRetry()`, which wraps the entire route() call, not individual agent operations.

### C5. NormalizerAgent unreachable via orchestrator

No task type in the orchestrator's switch statement maps to NormalizerAgent. It can only be used via direct import.

---

## HIGH Issues (Spec Gaps — Functional but Incomplete)

### H1. 5 API routes missing NormalizerAgent integration

| Route | Status |
|-------|--------|
| `/api/digest/generate` | No import or call |
| `/api/mcq/mock/start` | No import or call |
| `/api/studio/notes` | No import or call |
| `/api/studio/answers` | No import or call |
| `/api/math/solve` | No import or call |

### H2. No per-agent provider routing

All 9 agents use the global `callAI()` which always routes Ollama→Groq→NVIDIA→Gemini. The spec requires:
- QuizAgent: **Groq→Ollama** (reversed from global)
- CAIngestionAgent: **Groq→Ollama** (reversed)
- EvaluatorAgent: **NVIDIA NIM→Gemini** (skip Ollama/Groq)
- QualityAgent: **Groq only**

### H3. No dead-letter queue logic

Spec: "after 3 failures, node flagged in admin console." No failure counter per node, no admin flagging, no dead-letter table.

### H4. Living Pages hook unused

`src/hooks/use-living-content.ts` correctly implements the Universal Page Pattern (NormalizerAgent→check freshness→skeleton→stream), but **zero dashboard pages import it**. All pages have bespoke fetch logic.

### H5. Vision models entirely missing

No configuration for `gemma4:31b-cloud` or `qwen3-vl:235b-instruct-cloud`. No multi-modal/image input support exists anywhere.

### H6. 3 smart notification types missing

- CA-to-weak-topic linking alerts ("Article 21 linked to today's SC judgment")
- Per-subject inactivity alerts ("You haven't touched Environment in 8 days")
- Accuracy regression alerts ("Mock test accuracy dropped in Economy")

### H7. 3 dashboard pages missing

- **Topic Intelligence** — no page exists
- **Animations** — no dedicated Manim animations page
- **Ethics Case Study** — no dedicated page

### H8. Admin Console not unified

Spec requires `/admin/console` with 4 panels (Content Health, Agent Monitor, Source Intelligence, System Health). Instead, data is fragmented across 20+ separate admin pages. **Source Intelligence panel is entirely missing** (no scrape timestamps, no untagged articles view).

### H9. Router provider set is wrong

`ai-provider-router.ts` lists Anthropic/OpenAI as providers 4-5 instead of NVIDIA NIM/Gemini. The router is also not integrated with the actual `callAI()` path.

---

## MEDIUM Issues (Minor Deviations)

### M1. `raw_input_hash` not a generated column

Spec: `GENERATED ALWAYS AS (md5(lower(trim(raw_input)))) STORED`. Actual: plain `text NOT NULL` computed by application layer. Hash consistency not enforced at DB level.

### M2. SRS uses SM-2 instead of fixed intervals

Spec: 1d→3d→7d→15d→30d. Actual: SM-2 algorithm (1d→6d→15d→38d→95d with default ease). SM-2 is arguably better, but it's a spec deviation.

### M3. Weak node threshold differs

Spec: accuracy < 0.5. Implementation: mastery_level='weak' which maps to accuracy < 0.3.

### M4. Daily plan missing untouched nodes + CA-to-weak linking

The cron includes weak nodes and SRS-due nodes, but omits `not_started` topics and doesn't cross-reference today's CA with user's weak topics.

### M5. Video player features partially wired

- Notes panel + Query panel components exist but aren't imported into `/dashboard/video/[id]` page
- Chapter markers only on lectures player, not general video player
- No related content (KG edges) below either player

### M6. Missing test for video-generation cron

All other 5 cron routes have integration tests. `/api/cron/video-generation` has none.

### M7. `callAI()` signature inconsistency

Some agents call `callAI(userPrompt, { system })`, others call `callAI({ systemPrompt, userPrompt })`. No consistent interface.

---

## EXTRA Items (Not in Spec — Additive)

| Item | Location | Notes |
|------|----------|-------|
| SM-2 columns (ease_factor, interval_days, repetitions) | 046_mastery_sm2_columns.sql | Enhances mastery tracking |
| Achievement system | 048_mastery_achievements.sql | Gamification extension |
| Lecture enhancements | 049_lecture_enhancements.sql | Bookmarks + watch history |
| Monthly compilations | 050_monthly_compilations.sql | Video compilation pipeline |
| 20+ extra admin pages | src/app/(admin)/admin/ | ML analytics, billing, leads, etc. |
| Mastery notifications cron | /api/cron/mastery-notifications | Streak + weekly digest |

---

## Prioritized Fix Plan

### Phase A — Critical Fixes (runtime safety)

1. **Fix `completeRun()` calls** in all 7 agents — change `completeRun(runId)` to `completeRun('completed')` / `completeRun('failed', { errors })`
2. **Fix `log()` calls** in all 7 agents — change `this.log(msg)` to `this.log('info', msg)`
3. **Add `execute()` methods** to EvaluatorAgent and QualityAgent (or update orchestrator dispatch)
4. **Add retry logic** to BaseAgent (3x exponential: 1s, 2s, 4s)
5. **Add NormalizerAgent route** to orchestrator switch

### Phase B — High Priority (spec compliance)

6. Add NormalizerAgent to 5 missing API routes
7. Implement per-agent provider preferences in BaseAgent
8. Add dead-letter queue logic to orchestrator
9. Wire `useLivingContent` hook into dashboard pages (or migrate pages to use `/api/content/living`)
10. Add Source Intelligence to admin (scrape timestamps, untagged articles)

### Phase C — Medium Priority (polish)

11. Create Topic Intelligence, Animations, Ethics Case Study pages
12. Build unified `/admin/console` with 4-panel layout
13. Add 3 missing smart notification types
14. Wire video player features (notes, query, chapters, related content) into `/dashboard/video/[id]`
15. Fix router provider set (NVIDIA/Gemini instead of Anthropic/OpenAI)
16. Add vision model configuration

---

## Scorecard by Spec Section

| Section | Score | Notes |
|---------|-------|-------|
| §2 Core DB Schema | **98%** | 59/60 columns match. 1 minor: hash not generated. |
| §3 AI Provider Chain | **67%** | 4-provider chain works. Vision missing. Router misaligned. |
| §4 Hermes Agents | **45%** | Files exist. Signatures broken. No retry. No dead-letter. |
| §5 Normalizer | **67%** | Agent works. 10/15 routes integrated. 5 missing. |
| §6 Content Factory | **83%** | All 6 crons exist. 1 missing test. Pipeline logic correct. |
| §7 Living Pages | **50%** | Hook + API exist but unused. 3 pages missing. Video features partial. |
| §8 Mastery Engine | **70%** | SM-2 implemented. Daily plan partial. 3 notification types missing. |
| §9 Admin Console | **35%** | Data exists across pages. No unified console. Source Intelligence missing. |
| **Weighted Average** | **~65%** | |
