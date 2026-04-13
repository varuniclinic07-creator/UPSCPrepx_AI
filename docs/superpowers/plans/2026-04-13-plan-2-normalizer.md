# AI Normalizer Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the NormalizerAgent that resolves any user input (topic, query, subject) to a Knowledge Graph node via 3-tier lookup: exact cache → fuzzy syllabus map → AI classification. Then integrate it into all 15 API routes that accept user topic/query input.

**Architecture:** `normalizer-agent.ts` orchestrates the 3-tier resolution. `upsc-syllabus-map.ts` provides a 180-entry fuzzy lookup table powered by fuse.js. The normalizer writes results to `upsc_input_normalizations` cache table (created in Plan 1) and links to `knowledge_nodes`. Every API route calls `normalizeUPSCInput(rawInput)` as the first step after validation.

**Depends on:** Plan 1 (knowledge_nodes, upsc_input_normalizations tables, fuse.js installed)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/agents/base-agent.ts` | Base class for all agents (logging, agent_runs tracking) |
| Create | `src/lib/agents/normalizer-agent.ts` | 3-tier normalization: exact → fuzzy → AI |
| Create | `src/lib/ai/upsc-syllabus-map.ts` | 180-entry UPSC syllabus lookup with fuse.js |
| Create | `src/__tests__/lib/agents/normalizer-agent.test.ts` | Unit tests for normalizer |
| Create | `src/__tests__/lib/ai/upsc-syllabus-map.test.ts` | Unit tests for syllabus map |
| Modify | `src/app/api/notes/generate/route.ts` | Add normalizer call |
| Modify | `src/app/api/quiz/generate/route.ts` | Add normalizer call |
| Modify | `src/app/api/doubt/ask/route.ts` | Add normalizer call |
| Modify | `src/app/api/doubt/followup/route.ts` | Add normalizer call |
| Modify | `src/app/api/current-affairs/route.ts` | Add normalizer call |
| Modify | `src/app/api/notes/route.ts` | Add normalizer call |
| Modify | `src/app/api/notes/library/route.ts` | Add normalizer call |
| Modify | `src/app/api/search/query/route.ts` | Add normalizer call |
| Modify | `src/app/api/mentor/chat/route.ts` | Add normalizer call |
| Modify | `src/app/api/video/shorts/generate/route.ts` | Add normalizer call |
| Modify | `src/app/api/agentic/query/route.ts` | Add normalizer call |
| Modify | `src/app/api/mcq/practice/start/route.ts` | Add normalizer call |
| Modify | `src/app/api/mind-maps/generate/route.ts` | Add normalizer call |
| Modify | `src/app/api/lectures/generate/route.ts` | Add normalizer call |
| Modify | `src/app/api/eval/mains/submit/route.ts` | Add normalizer call |

---

## Task 1: Base Agent Class

**Files:** `src/lib/agents/base-agent.ts`

- [ ] **Step 1: Create the base agent**

```typescript
// src/lib/agents/base-agent.ts
// Provides: agent_runs logging, Supabase client, provider selection
// All 9 specialist agents extend this class

import { createClient } from '@supabase/supabase-js';

export type AgentType =
  | 'research' | 'notes' | 'quiz' | 'ca_ingestion'
  | 'normalizer' | 'evaluator' | 'quality_check' | 'video' | 'animation';

export interface AgentRunRecord {
  id: string;
  agent_type: AgentType;
  status: 'running' | 'completed' | 'failed' | 'partial';
  nodes_processed: number;
  content_generated: number;
  errors: any[];
  started_at: string;
  completed_at?: string;
  metadata: Record<string, any>;
}

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected supabase;
  private runId: string | null = null;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /** Start an agent run — call at beginning of execute() */
  protected async startRun(metadata: Record<string, any> = {}): Promise<string> {
    const { data, error } = await this.supabase
      .from('agent_runs')
      .insert({
        agent_type: this.agentType,
        status: 'running',
        metadata,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[${this.agentType}] Failed to start run:`, error);
      return 'unknown';
    }

    this.runId = data.id;
    return data.id;
  }

  /** Complete an agent run — call at end of execute() */
  protected async completeRun(
    status: 'completed' | 'failed' | 'partial',
    stats: { nodes_processed?: number; content_generated?: number; errors?: any[] } = {}
  ): Promise<void> {
    if (!this.runId) return;

    await this.supabase
      .from('agent_runs')
      .update({
        status,
        nodes_processed: stats.nodes_processed ?? 0,
        content_generated: stats.content_generated ?? 0,
        errors: stats.errors ?? [],
        completed_at: new Date().toISOString(),
      })
      .eq('id', this.runId);
  }

  /** Log a warning/info during a run */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const prefix = `[${this.agentType}]`;
    if (level === 'error') console.error(prefix, message, data);
    else if (level === 'warn') console.warn(prefix, message, data);
    else console.log(prefix, message, data ?? '');
  }
}
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/lib/agents/base-agent.ts 2>&1 | head -5
```

(May show module resolution warnings — that's fine since Next.js resolves these at build time)

---

## Task 2: UPSC Syllabus Map (180 entries + fuse.js)

**Files:** `src/lib/ai/upsc-syllabus-map.ts`, `src/__tests__/lib/ai/upsc-syllabus-map.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/lib/ai/upsc-syllabus-map.test.ts
import { findSyllabusMatch, SyllabusMatch } from '@/lib/ai/upsc-syllabus-map';

describe('UPSC Syllabus Map', () => {
  it('exact match returns high confidence', () => {
    const result = findSyllabusMatch('fundamental rights');
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS2');
    expect(result!.topic).toBe('Indian Polity');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('fuzzy match finds close terms', () => {
    const result = findSyllabusMatch('fundmental rigts'); // typo
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS2');
    expect(result!.method).toBe('fuzzy');
  });

  it('maps economy keywords correctly', () => {
    const result = findSyllabusMatch('monetary policy rbi');
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS3');
    expect(result!.topic).toBe('Indian Economy');
  });

  it('maps geography keywords', () => {
    const result = findSyllabusMatch('western ghats biodiversity');
    expect(result).not.toBeNull();
    expect(result!.subject).toMatch(/GS1|GS3/);
  });

  it('maps ethics keywords', () => {
    const result = findSyllabusMatch('ethical dilemma case study');
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS4');
  });

  it('returns null for irrelevant input', () => {
    const result = findSyllabusMatch('random gibberish xyz123');
    // Either null or very low confidence
    expect(result === null || result.confidence < 0.4).toBe(true);
  });

  it('handles empty string', () => {
    const result = findSyllabusMatch('');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Create the syllabus map** — 180 entries covering all UPSC CSE subjects

The file exports:
- `SyllabusEntry` type (term, subject, topic, subtopic)
- `SyllabusMatch` type (subject, topic, subtopic, confidence, method)
- `findSyllabusMatch(input: string): SyllabusMatch | null` — uses fuse.js with threshold 0.4

Subjects covered (entry counts):
- GS1: History (20), Geography (15), Society (5) = 40 entries
- GS2: Polity (25), Governance (10), IR (5) = 40 entries
- GS3: Economy (25), Environment (10), S&T (10), Security (5) = 50 entries
- GS4: Ethics (15), Aptitude (5), Case Studies (5) = 25 entries
- CSAT (5), Essay (5), Current Affairs (15) = 25 entries

Each entry: `{ term: 'fundamental rights', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Part III of Constitution' }`

- [ ] **Step 3: Run tests**

```bash
npx jest src/__tests__/lib/ai/upsc-syllabus-map.test.ts --no-coverage
```

Expected: All 7 tests pass

---

## Task 3: Normalizer Agent

**Files:** `src/lib/agents/normalizer-agent.ts`, `src/__tests__/lib/agents/normalizer-agent.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/lib/agents/normalizer-agent.test.ts
// Mock Supabase and AI provider
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
        })),
      })),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
}));

import { NormalizerAgent, NormalizationResult } from '@/lib/agents/normalizer-agent';

describe('NormalizerAgent', () => {
  const agent = new NormalizerAgent();

  it('resolves well-known topics via fuzzy match (no AI needed)', async () => {
    const result = await agent.normalize('fundamental rights');
    expect(result.subject).toBe('GS2');
    expect(result.topic).toBe('Indian Polity');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.method).toMatch(/exact|fuzzy/);
  });

  it('resolves economy topics', async () => {
    const result = await agent.normalize('inflation and monetary policy');
    expect(result.subject).toBe('GS3');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('handles empty input gracefully', async () => {
    const result = await agent.normalize('');
    expect(result.subject).toBe('General');
    expect(result.confidence).toBe(0);
  });

  it('returns a nodeId (or null if DB unavailable)', async () => {
    const result = await agent.normalize('preamble of constitution');
    // nodeId may be null in test (no real DB) but the field should exist
    expect(result).toHaveProperty('nodeId');
  });

  it('uses MD5 hash for cache key', async () => {
    const result = await agent.normalize('Article 21 Right to Life');
    expect(result).toHaveProperty('cacheKey');
    expect(result.cacheKey).toMatch(/^[a-f0-9]{32}$/);
  });
});
```

- [ ] **Step 2: Create the normalizer agent**

The NormalizerAgent class:
1. Extends BaseAgent with agentType 'normalizer'
2. `normalize(rawInput: string)` method:
   - Step 1: Compute MD5 hash of `rawInput.toLowerCase().trim()`
   - Step 2: Check `upsc_input_normalizations` cache by hash
   - Step 3: If cache miss → call `findSyllabusMatch()` from upsc-syllabus-map.ts
   - Step 4: If fuzzy match confidence < 0.4 → call AI (callAI with skipSimplifiedLanguage:true) to classify
   - Step 5: Find or create `knowledge_nodes` entry for the resolved topic
   - Step 6: Write to `upsc_input_normalizations` cache
   - Step 7: Return `NormalizationResult { subject, topic, subtopic, nodeId, confidence, method, cacheKey }`

Export a singleton: `export const normalizer = new NormalizerAgent();`
Export convenience function: `export async function normalizeUPSCInput(rawInput: string): Promise<NormalizationResult>`

- [ ] **Step 3: Run tests**

```bash
npx jest src/__tests__/lib/agents/normalizer-agent.test.ts --no-coverage
```

Expected: All 5 tests pass

---

## Task 4: Integrate Normalizer into API Routes (Batch 1 — 5 routes)

**Files:** 5 route files (notes/generate, quiz/generate, doubt/ask, current-affairs, agentic/query)

For each route, the pattern is identical — add ONE import and ONE call right after input validation, before AI processing:

```typescript
// Add import at top:
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

// Add after validation, before AI call:
const normalized = await normalizeUPSCInput(body.topic || body.query || '');
// Pass normalized.subject, normalized.topic, normalized.nodeId to downstream functions
```

- [ ] **Step 1: Update `src/app/api/notes/generate/route.ts`**

After line ~57 validation block, before the agentic generator call:
```typescript
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';
// ... after validation ...
const normalized = await normalizeUPSCInput(body.topic);
// Use normalized.subject as fallback if body.subject not provided
const subject = body.subject || normalized.subject;
```

- [ ] **Step 2: Update `src/app/api/quiz/generate/route.ts`**

After topic validation (line ~44), add normalizer call.

- [ ] **Step 3: Update `src/app/api/doubt/ask/route.ts`**

After Zod parse, normalize the question + topic.

- [ ] **Step 4: Update `src/app/api/current-affairs/route.ts`**

In GET handler, normalize the `search` param if provided.

- [ ] **Step 5: Update `src/app/api/agentic/query/route.ts`**

Normalize `body.query` before passing to orchestrator.

---

## Task 5: Integrate Normalizer into API Routes (Batch 2 — 5 routes)

**Files:** notes/route, notes/library, search/query, mentor/chat, video/shorts/generate

Same pattern as Task 4:

- [ ] **Step 1: Update `src/app/api/notes/route.ts`** — normalize `search` param
- [ ] **Step 2: Update `src/app/api/notes/library/route.ts`** — normalize `topic` and `search` params
- [ ] **Step 3: Update `src/app/api/search/query/route.ts`** — normalize `query`
- [ ] **Step 4: Update `src/app/api/mentor/chat/route.ts`** — normalize `topic` or `message`
- [ ] **Step 5: Update `src/app/api/video/shorts/generate/route.ts`** — normalize `body.topic`

---

## Task 6: Integrate Normalizer into API Routes (Batch 3 — 5 routes)

**Files:** mcq/practice/start, mind-maps/generate, lectures/generate, eval/mains/submit, doubt/followup

- [ ] **Step 1: Update `src/app/api/mcq/practice/start/route.ts`** — normalize `body.topic`
- [ ] **Step 2: Update `src/app/api/mind-maps/generate/route.ts`** — normalize `body.topic`
- [ ] **Step 3: Update `src/app/api/lectures/generate/route.ts`** — normalize `body.topic`
- [ ] **Step 4: Update `src/app/api/eval/mains/submit/route.ts`** — normalize answer context
- [ ] **Step 5: Update `src/app/api/doubt/followup/route.ts`** — normalize follow-up question

---

## Task 7: Build Verification

- [ ] **Step 1: Run normalizer + syllabus map tests**

```bash
npx jest src/__tests__/lib/agents/ src/__tests__/lib/ai/upsc-syllabus-map.test.ts --no-coverage
```

Expected: All tests pass

- [ ] **Step 2: Run full test suite**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: No new failures (existing failures stay same count)

- [ ] **Step 3: Build**

```bash
npx next build 2>&1 | tail -15
```

Expected: `Compiled successfully`

- [ ] **Step 4: Commit**

---

## Self-Review Checklist

- [ ] BaseAgent class with agent_runs logging
- [ ] 180-entry syllabus map with fuse.js fuzzy matching
- [ ] NormalizerAgent with 3-tier resolution (cache → fuzzy → AI)
- [ ] MD5 hash-based caching in upsc_input_normalizations
- [ ] knowledge_nodes creation/lookup for resolved topics
- [ ] All 15 API routes updated with normalizer call
- [ ] No breaking changes to existing API contracts
- [ ] All new tests passing
- [ ] Build clean

---

## What Comes Next

| Plan | Depends on | Builds |
|---|---|---|
| **Plan 3** — Hermes Agents | This plan (normalizer + base-agent) | `orchestrator.ts`, all 9 specialist agents |
| **Plan 4** — Research Pipelines | Plan 3 (agents) | 6 cron routes, full research pipeline |
