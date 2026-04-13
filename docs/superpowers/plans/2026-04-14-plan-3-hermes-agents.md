# Hermes Orchestrator + 7 Specialist Agents — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Create the Hermes orchestrator (`orchestrator.ts`) and 7 specialist subagents that extend BaseAgent. Each agent has a single responsibility, writes output to `content_queue`, and communicates only via DB (never direct calls between agents). The orchestrator dispatches tasks and handles failures.

**Depends on:** Plan 1 (DB tables, provider chain), Plan 2 (BaseAgent, NormalizerAgent, syllabus map)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/agents/orchestrator.ts` | Hermes: routes tasks, retries, failure handling |
| Create | `src/lib/agents/research-agent.ts` | 4-layer content gathering |
| Create | `src/lib/agents/notes-agent.ts` | Structured note generation with citations |
| Create | `src/lib/agents/quiz-agent.ts` | MCQ generation with explanations |
| Create | `src/lib/agents/ca-ingestion-agent.ts` | Daily CA scraping + KG linking |
| Create | `src/lib/agents/evaluator-agent.ts` | Answer scoring + doubt answering |
| Create | `src/lib/agents/quality-agent.ts` | Content quality scoring |
| Create | `src/lib/agents/video-agent.ts` | Script → Remotion rendering |
| Create | `src/lib/agents/animation-agent.ts` | Concept → Manim rendering |
| Create | `src/__tests__/lib/agents/orchestrator.test.ts` | Orchestrator unit tests |
| Create | `src/__tests__/lib/agents/quality-agent.test.ts` | Quality agent unit tests |

---

## Task 1: Hermes Orchestrator

The central router. Never calls AI directly — dispatches to subagents.

Key methods:
- `dispatchTask(task)` — routes to correct agent based on task type
- `runPipeline(pipeline)` — runs a sequence of agent tasks (CA ingestion, syllabus coverage, etc.)
- `handleFailure(agentType, error, task)` — retries with backoff, then dead-letters

---

## Task 2: Research Agent

4-layer content gathering:
1. Agentic Web Search (AGENTIC_WEB_SEARCH_URL)
2. AutoDocThinker RAG (AGENTIC_DOC_CHAT_URL)
3. Agentic File Search (AGENTIC_FILE_SEARCH_URL)
4. CRAWL4AI deep scrape

Returns aggregated sources with citations.

---

## Task 3: Notes Agent

Takes research output + KG nodeId → generates structured notes:
- Key concepts, detailed explanation, examples, memory tips, PYQ links
- Writes to content_queue with type 'note'

---

## Task 4: Quiz Agent

Takes KG nodeId + subject → generates MCQs:
- 10 questions per set, 4 options each, explanation per answer
- Difficulty scaling based on user_mastery if available
- Writes to content_queue with type 'mcq_set'

---

## Task 5: CA Ingestion Agent + Evaluator Agent

CA: Scrapes whitelisted sources, extracts articles, normalizes, links to KG.
Evaluator: Scores answers, generates model answers, provides improvement plans.

---

## Task 6: Quality Agent + Video Agent + Animation Agent

Quality: Scores content 0-1, auto-approves ≥0.7, flags <0.5.
Video: Generates script → calls Remotion service.
Animation: Generates Manim prompt → calls Manim service.

---

## Task 7: Build Verification

Run all tests, verify build.
