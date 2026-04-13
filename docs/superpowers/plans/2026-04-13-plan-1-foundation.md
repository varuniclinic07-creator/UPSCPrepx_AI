# Foundation: Knowledge Graph DB + AI Provider Chain — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Knowledge Graph database schema and expand the AI provider chain to Ollama → Groq → NVIDIA NIM → Gemini (4-key rotation), which every subsequent plan (Normalizer, Hermes agents, Living Pages, Mastery Engine) depends on.

**Architecture:** Six Supabase migrations create the graph tables and alter existing tables. A Gemini adapter wraps Google's SDK to the same OpenAI-compatible interface the rest of the codebase uses. `ai-provider-client.ts` gains NVIDIA NIM (priority 3) and Gemini (priority 4) with per-key rotation identical to Groq's existing pattern.

**Tech Stack:** Supabase Postgres, `@google/generative-ai` SDK, `fuse.js` (for Plan 2), `openai` v6 (already installed — reused for NVIDIA NIM), Jest 30

**Plan sequence:** This is Plan 1 of 7. Plans 2–7 (Normalizer, Hermes Agents, Research Pipelines, Living Pages, Mastery Engine, Admin Console) depend on this plan being complete first.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `supabase/migrations/040_knowledge_graph.sql` | knowledge_nodes + knowledge_edges tables |
| Create | `supabase/migrations/041_normalizer_cache.sql` | upsc_input_normalizations table |
| Create | `supabase/migrations/042_user_mastery.sql` | user_mastery table |
| Create | `supabase/migrations/043_content_queue.sql` | content_queue table |
| Create | `supabase/migrations/044_agent_runs.sql` | agent_runs table |
| Create | `supabase/migrations/045_alter_existing_tables.sql` | Add node_id/version/confidence to current_affairs, notes, quizzes |
| Create | `src/lib/ai/gemini-adapter.ts` | Wraps @google/generative-ai to OpenAI-compatible interface |
| Modify | `src/lib/ai/ai-provider-client.ts` | Add NVIDIA NIM (priority 3) + Gemini 4-key rotation (priority 4) |
| Create | `src/__tests__/lib/ai/gemini-adapter.test.ts` | Unit tests for Gemini adapter |
| Create | `src/__tests__/lib/ai/provider-chain.test.ts` | Unit tests for NVIDIA + Gemini fallback logic |

---

## Task 1: Install Required Packages

**Files:** `package.json`

- [ ] **Step 1: Install packages**

```bash
cd "C:/Users/DR-VARUNI/Desktop/upsc_ai"
npm install @google/generative-ai fuse.js --legacy-peer-deps
```

Expected output: `added 2 packages` (or similar — no errors)

- [ ] **Step 2: Verify installations**

```bash
node -e "require('@google/generative-ai'); console.log('gemini ok')"
node -e "require('fuse.js'); console.log('fuse ok')"
```

Expected: `gemini ok` then `fuse ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @google/generative-ai and fuse.js"
```

---

## Task 2: Migration 040 — Knowledge Graph Core Tables

**Files:** `supabase/migrations/040_knowledge_graph.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/040_knowledge_graph.sql

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text NOT NULL CHECK (type IN (
                      'subject','topic','subtopic','pyq','current_affair',
                      'note','quiz','answer_framework','scheme',
                      'judgment','report','uploaded_material'
                    )),
  title             text NOT NULL,
  content           text,
  metadata          jsonb DEFAULT '{}',
  subject           text,
  syllabus_code     text,
  confidence_score  float DEFAULT 0.5,
  source_count      int DEFAULT 0,
  freshness_score   float DEFAULT 1.0,
  last_verified_at  timestamptz,
  human_approved    boolean DEFAULT false,
  version           int DEFAULT 1,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_nodes_type_idx      ON knowledge_nodes(type);
CREATE INDEX IF NOT EXISTS knowledge_nodes_subject_idx   ON knowledge_nodes(subject);
CREATE INDEX IF NOT EXISTS knowledge_nodes_code_idx      ON knowledge_nodes(syllabus_code);
CREATE INDEX IF NOT EXISTS knowledge_nodes_fresh_idx     ON knowledge_nodes(freshness_score);
CREATE INDEX IF NOT EXISTS knowledge_nodes_approved_idx  ON knowledge_nodes(human_approved);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id      uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_node_id        uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN (
                      'is_subtopic_of','appears_in_pyq','linked_to_ca',
                      'prereq_of','supports','explains',
                      'is_example_of','tagged_in_note','contradicts'
                    )),
  weight            float DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_edges_from_idx ON knowledge_edges(from_node_id);
CREATE INDEX IF NOT EXISTS knowledge_edges_to_idx   ON knowledge_edges(to_node_id);
CREATE INDEX IF NOT EXISTS knowledge_edges_type_idx ON knowledge_edges(relationship_type);
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: `Applying migration 040_knowledge_graph.sql... done`

- [ ] **Step 3: Verify tables exist**

```bash
npx supabase db diff --use-migra 2>/dev/null | grep "knowledge_" || echo "Tables applied cleanly"
```

Expected: no diff output (tables already applied)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/040_knowledge_graph.sql
git commit -m "feat(db): add knowledge_nodes and knowledge_edges tables"
```

---

## Task 3: Migration 041 — Normalizer Cache

**Files:** `supabase/migrations/041_normalizer_cache.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/041_normalizer_cache.sql

CREATE TABLE IF NOT EXISTS upsc_input_normalizations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_input         text NOT NULL,
  raw_input_hash    text NOT NULL,
  resolved_subject  text,
  resolved_topic    text,
  resolved_subtopic text,
  node_id           uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  method            text NOT NULL CHECK (method IN ('exact','fuzzy','ai')),
  confidence        float NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at        timestamptz DEFAULT now()
);

-- Hash is md5 of lowercased, trimmed input — computed by application layer
-- Using a unique index for O(1) cache lookups
CREATE UNIQUE INDEX IF NOT EXISTS normalizer_cache_hash_idx
  ON upsc_input_normalizations(raw_input_hash);

CREATE INDEX IF NOT EXISTS normalizer_cache_subject_idx
  ON upsc_input_normalizations(resolved_subject);
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: `Applying migration 041_normalizer_cache.sql... done`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/041_normalizer_cache.sql
git commit -m "feat(db): add upsc_input_normalizations cache table"
```

---

## Task 4: Migration 042 — User Mastery

**Files:** `supabase/migrations/042_user_mastery.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/042_user_mastery.sql

CREATE TABLE IF NOT EXISTS user_mastery (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id             uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  accuracy_score      float DEFAULT 0 CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  attempts            int DEFAULT 0,
  correct             int DEFAULT 0,
  time_spent_seconds  int DEFAULT 0,
  mastery_level       text NOT NULL DEFAULT 'not_started' CHECK (mastery_level IN (
                        'not_started','weak','developing','strong','mastered'
                      )),
  next_revision_at    timestamptz,
  last_attempted_at   timestamptz,
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, node_id)
);

CREATE INDEX IF NOT EXISTS user_mastery_user_idx     ON user_mastery(user_id);
CREATE INDEX IF NOT EXISTS user_mastery_node_idx     ON user_mastery(node_id);
CREATE INDEX IF NOT EXISTS user_mastery_level_idx    ON user_mastery(mastery_level);
CREATE INDEX IF NOT EXISTS user_mastery_revision_idx ON user_mastery(next_revision_at)
  WHERE next_revision_at IS NOT NULL;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: `Applying migration 042_user_mastery.sql... done`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/042_user_mastery.sql
git commit -m "feat(db): add user_mastery table with SRS fields"
```

---

## Task 5: Migration 043 — Content Queue

**Files:** `supabase/migrations/043_content_queue.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/043_content_queue.sql

CREATE TABLE IF NOT EXISTS content_queue (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id           uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  content_type      text NOT NULL CHECK (content_type IN (
                      'note','quiz','mind_map','answer_framework',
                      'ca_brief','mcq_set','video_script','animation_prompt'
                    )),
  generated_content jsonb NOT NULL DEFAULT '{}',
  ai_provider       text,
  agent_type        text,
  confidence_score  float CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending','approved','rejected','needs_revision'
                    )),
  reviewed_by       uuid,
  reviewed_at       timestamptz,
  review_notes      text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_queue_status_idx ON content_queue(status);
CREATE INDEX IF NOT EXISTS content_queue_node_idx   ON content_queue(node_id);
CREATE INDEX IF NOT EXISTS content_queue_type_idx   ON content_queue(content_type);
CREATE INDEX IF NOT EXISTS content_queue_pending_idx ON content_queue(created_at)
  WHERE status = 'pending';
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: `Applying migration 043_content_queue.sql... done`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/043_content_queue.sql
git commit -m "feat(db): add content_queue table for AI content factory"
```

---

## Task 6: Migrations 044 + 045 — Agent Runs + Alter Existing Tables

**Files:** `supabase/migrations/044_agent_runs.sql`, `supabase/migrations/045_alter_existing_tables.sql`

- [ ] **Step 1: Create agent_runs migration**

```sql
-- supabase/migrations/044_agent_runs.sql

CREATE TABLE IF NOT EXISTS agent_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type        text NOT NULL CHECK (agent_type IN (
                      'research','notes','quiz','ca_ingestion',
                      'normalizer','evaluator','quality_check','video','animation'
                    )),
  status            text NOT NULL DEFAULT 'running' CHECK (status IN (
                      'running','completed','failed','partial'
                    )),
  nodes_processed   int DEFAULT 0,
  content_generated int DEFAULT 0,
  errors            jsonb DEFAULT '[]',
  started_at        timestamptz DEFAULT now(),
  completed_at      timestamptz,
  metadata          jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS agent_runs_type_idx    ON agent_runs(agent_type);
CREATE INDEX IF NOT EXISTS agent_runs_status_idx  ON agent_runs(status);
CREATE INDEX IF NOT EXISTS agent_runs_started_idx ON agent_runs(started_at DESC);
```

- [ ] **Step 2: Create alter existing tables migration**

```sql
-- supabase/migrations/045_alter_existing_tables.sql

-- current_affairs
ALTER TABLE current_affairs
  ADD COLUMN IF NOT EXISTS node_id           uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version           int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS confidence_score  float DEFAULT 0.7;

-- notes
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS node_id           uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version           int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS confidence_score  float DEFAULT 0.7;

-- quizzes (only if table exists — name may differ)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quizzes'
  ) THEN
    ALTER TABLE quizzes
      ADD COLUMN IF NOT EXISTS node_id           uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS version           int DEFAULT 1,
      ADD COLUMN IF NOT EXISTS confidence_score  float DEFAULT 0.7;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS current_affairs_node_idx ON current_affairs(node_id)
  WHERE node_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notes_node_idx ON notes(node_id)
  WHERE node_id IS NOT NULL;
```

- [ ] **Step 3: Apply both migrations**

```bash
npx supabase db push
```

Expected: `Applying migration 044_agent_runs.sql... done` then `045_alter_existing_tables.sql... done`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/044_agent_runs.sql supabase/migrations/045_alter_existing_tables.sql
git commit -m "feat(db): add agent_runs table and extend existing tables with KG columns"
```

---

## Task 7: Gemini Adapter

**Files:**
- Create: `src/lib/ai/gemini-adapter.ts`
- Create: `src/__tests__/lib/ai/gemini-adapter.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/lib/ai/gemini-adapter.test.ts
import { GeminiAdapter } from '@/lib/ai/gemini-adapter';

// Mock the Google SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Fundamental Rights are rights guaranteed by Part III of the Constitution.',
          },
        }),
      }),
    }),
  })),
}));

describe('GeminiAdapter', () => {
  const adapter = new GeminiAdapter({ apiKey: 'test-key', model: 'gemini-1.5-flash' });

  it('converts OpenAI-format messages and returns OpenAI-format response', async () => {
    const result = await adapter.chat([
      { role: 'system', content: 'You are a UPSC tutor.' },
      { role: 'user', content: 'What are Fundamental Rights?' },
    ]);

    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].message.role).toBe('assistant');
    expect(result.choices[0].message.content).toContain('Fundamental Rights');
    expect(result.choices[0].finish_reason).toBe('stop');
  });

  it('handles conversation history correctly', async () => {
    const result = await adapter.chat([
      { role: 'user', content: 'What is Polity?' },
      { role: 'assistant', content: 'Polity covers the Indian Constitution.' },
      { role: 'user', content: 'Tell me about Article 21.' },
    ]);

    expect(result.choices[0].message.content).toBeDefined();
  });

  it('works without system message', async () => {
    const result = await adapter.chat([
      { role: 'user', content: 'What is federalism?' },
    ]);

    expect(result.choices[0].message.content).toBeDefined();
  });

  it('returns model name in response', async () => {
    const result = await adapter.chat([{ role: 'user', content: 'Test' }]);
    expect(result.model).toBe('gemini-1.5-flash');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/lib/ai/gemini-adapter.test.ts --no-coverage
```

Expected: `FAIL` — `Cannot find module '@/lib/ai/gemini-adapter'`

- [ ] **Step 3: Create the adapter**

```typescript
// src/lib/ai/gemini-adapter.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiAdapterConfig {
  apiKey: string;
  model: string;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

export class GeminiAdapter {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(config: GeminiAdapterConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model;
  }

  async chat(
    messages: OpenAIMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<OpenAIResponse> {
    const genModel = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    });

    // Split system message from conversation
    const systemMessage = messages.find(m => m.role === 'system')?.content ?? '';
    const conversation = messages.filter(m => m.role !== 'system');

    // All but the last message become history
    const history = conversation.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const lastMessage = conversation[conversation.length - 1];
    const prompt = systemMessage
      ? `${systemMessage}\n\n${lastMessage.content}`
      : lastMessage.content;

    const chat = genModel.startChat({ history });
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    return {
      choices: [{ message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      model: this.modelName,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/lib/ai/gemini-adapter.test.ts --no-coverage
```

Expected: `PASS` — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/gemini-adapter.ts src/__tests__/lib/ai/gemini-adapter.test.ts
git commit -m "feat(ai): add GeminiAdapter wrapping @google/generative-ai to OpenAI interface"
```

---

## Task 8: Expand Provider Chain — NVIDIA NIM + Gemini

**Files:**
- Modify: `src/lib/ai/ai-provider-client.ts`
- Create: `src/__tests__/lib/ai/provider-chain.test.ts`

- [ ] **Step 1: Read the current provider array in ai-provider-client.ts**

Open `src/lib/ai/ai-provider-client.ts` and locate the `providers` array (around line 52). It currently has:
```
[0] ollama  priority: 1
[1] groq    priority: 2
```

You will add two more entries after groq.

- [ ] **Step 2: Write the failing test**

```typescript
// src/__tests__/lib/ai/provider-chain.test.ts
import { AIProviderClient } from '@/lib/ai/ai-provider-client';

describe('AIProviderClient provider chain', () => {
  it('includes nvidia as priority 3', () => {
    const client = new AIProviderClient();
    // Access providers via the public getter we will add
    const providers = client.getProviderNames();
    expect(providers).toContain('nvidia');
    const nvidiaIndex = providers.indexOf('nvidia');
    const groqIndex = providers.indexOf('groq');
    expect(nvidiaIndex).toBeGreaterThan(groqIndex);
  });

  it('includes gemini as priority 4 (last)', () => {
    const client = new AIProviderClient();
    const providers = client.getProviderNames();
    expect(providers).toContain('gemini');
    expect(providers[providers.length - 1]).toBe('gemini');
  });

  it('gemini uses key rotation across 4 keys', () => {
    process.env.GEMINI_API_KEY_1 = 'key1';
    process.env.GEMINI_API_KEY_2 = 'key2';
    process.env.GEMINI_API_KEY_3 = 'key3';
    process.env.GEMINI_API_KEY_4 = 'key4';
    const client = new AIProviderClient();
    const geminiKey = client.getProviderKey('gemini');
    expect(['key1', 'key2', 'key3', 'key4']).toContain(geminiKey);
  });

  it('nvidia uses NVIDIA_API_KEY env var', () => {
    process.env.NVIDIA_API_KEY = 'nvapi-test';
    const client = new AIProviderClient();
    const nvidiaKey = client.getProviderKey('nvidia');
    expect(nvidiaKey).toBe('nvapi-test');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest src/__tests__/lib/ai/provider-chain.test.ts --no-coverage
```

Expected: `FAIL` — `getProviderNames is not a function`

- [ ] **Step 4: Add NVIDIA and Gemini to the providers array**

In `src/lib/ai/ai-provider-client.ts`, find the providers array (currently ends after the groq entry). Add the following two providers immediately after groq, and add the two helper methods to the class:

```typescript
// Add inside the providers array, after the groq entry:
{
  name: 'nvidia',
  priority: 3,
  baseUrl: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || '',
  model: process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct',
  maxTokens: 4096,
  temperature: 0.7,
  enabled: Boolean(process.env.NVIDIA_API_KEY),
},
{
  name: 'gemini',
  priority: 4,
  // Gemini uses adapter — baseUrl/apiKey resolved at call time via rotation
  baseUrl: 'gemini-adapter',
  apiKey: (() => {
    const keys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
    ].filter(Boolean) as string[];
    if (!keys.length) return '';
    return keys[Math.floor(Math.random() * keys.length)];
  })(),
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  maxTokens: 2048,
  temperature: 0.7,
  enabled: Boolean(
    process.env.GEMINI_API_KEY_1 ||
    process.env.GEMINI_API_KEY_2 ||
    process.env.GEMINI_API_KEY_3 ||
    process.env.GEMINI_API_KEY_4
  ),
},
```

Add these two methods to the `AIProviderClient` class (public, for testing and orchestration):

```typescript
/** Returns provider names in priority order */
getProviderNames(): string[] {
  return [...this.providers]
    .sort((a, b) => a.priority - b.priority)
    .map(p => p.name);
}

/** Returns the resolved API key for a named provider */
getProviderKey(name: string): string {
  return this.providers.find(p => p.name === name)?.apiKey ?? '';
}
```

- [ ] **Step 5: Update the callAI method to handle gemini provider**

In `ai-provider-client.ts`, find the `callAI` function's provider loop. Add the Gemini branch before the generic OpenAI fetch:

```typescript
// Inside the provider loop in callAI(), before the generic fetch:
if (provider.name === 'gemini') {
  const { GeminiAdapter } = await import('./gemini-adapter');
  const geminiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter(Boolean) as string[];
  const key = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
  const adapter = new GeminiAdapter({ apiKey: key, model: provider.model });
  const response = await adapter.chat(messages, {
    temperature: provider.temperature,
    maxTokens: provider.maxTokens,
  });
  return response.choices[0].message.content;
}
```

Do the same inside `callAIStream()` for the gemini provider:

```typescript
if (provider.name === 'gemini') {
  // Gemini doesn't support true streaming — call adapter and yield full response
  const { GeminiAdapter } = await import('./gemini-adapter');
  const geminiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter(Boolean) as string[];
  const key = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
  const adapter = new GeminiAdapter({ apiKey: key, model: provider.model });
  const response = await adapter.chat(messages);
  yield response.choices[0].message.content;
  return;
}
```

- [ ] **Step 6: Update AIProvider type**

In `src/lib/ai/providers/provider-types.ts`, update the union type:

```typescript
// Change:
export type AIProvider = 'ollama' | 'groq';
// To:
export type AIProvider = 'ollama' | 'groq' | 'nvidia' | 'gemini';
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx jest src/__tests__/lib/ai/provider-chain.test.ts --no-coverage
```

Expected: `PASS` — all 4 tests green

- [ ] **Step 8: Run full test suite to catch regressions**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: existing tests still pass; new tests pass

- [ ] **Step 9: Commit**

```bash
git add src/lib/ai/ai-provider-client.ts \
        src/lib/ai/providers/provider-types.ts \
        src/__tests__/lib/ai/provider-chain.test.ts
git commit -m "feat(ai): add NVIDIA NIM (priority 3) and Gemini 4-key rotation (priority 4) to provider chain"
```

---

## Task 9: Add Environment Variables to .env.example

**Files:** `.env.example` (or `.env.local` if no example file exists)

- [ ] **Step 1: Find the env example file**

```bash
ls .env* 2>/dev/null
```

- [ ] **Step 2: Add new provider variables**

Append to whichever env file exists (`.env.example`, `.env.local`, or `.env`):

```bash
# NVIDIA NIM (Priority 3 AI Provider)
NVIDIA_API_KEY=           # Get new key at build.nvidia.com — previous key was compromised
NVIDIA_MODEL=nvidia/llama-3.1-nemotron-70b-instruct

# Google Gemini (Priority 4 AI Provider — 4-key rotation)
GEMINI_API_KEY_1=         # Rotate at aistudio.google.com — previous keys were compromised
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=
GEMINI_API_KEY_4=
GEMINI_MODEL=gemini-1.5-flash

# Agentic Services (must be running on VPS)
AGENTIC_WEB_SEARCH_URL=http://your-vps:8030
AGENTIC_FILE_SEARCH_URL=http://your-vps:8032
AGENTIC_DOC_CHAT_URL=http://your-vps:8031

# Video & Animation Services
REMOTION_URL=http://your-vps:3001
MANIM_URL=http://your-vps:5000
```

- [ ] **Step 3: Commit**

```bash
git add .env.example  # or whichever file you edited
git commit -m "chore: add NVIDIA, Gemini, and service env var templates"
```

---

## Task 10: Build Verification

- [ ] **Step 1: Run full build**

```bash
npx next build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully` — no TypeScript errors

- [ ] **Step 2: If TypeScript errors appear, fix them**

Common issue: `GeminiAdapter` import in `ai-provider-client.ts` path wrong.
Fix: ensure import path is `'./gemini-adapter'` (same directory).

- [ ] **Step 3: Final commit if build fixes were needed**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors from provider chain expansion"
```

- [ ] **Step 4: Push**

```bash
git push origin main
```

---

## Self-Review Checklist

- [x] All 6 migrations covered (040–045)
- [x] Gemini adapter fully tested with mocked SDK
- [x] NVIDIA NIM added as OpenAI-compatible (reuses existing openai v6 client)
- [x] Gemini 4-key rotation uses `Math.random()` — same pattern as Groq 7-key
- [x] `getProviderNames()` + `getProviderKey()` added for testability
- [x] `AIProvider` type updated to include `'nvidia' | 'gemini'`
- [x] Environment variables documented
- [x] Build verification as final gate
- [x] No placeholders — all code is complete
- [x] Type names consistent throughout (OpenAIMessage, OpenAIResponse, GeminiAdapter)

---

## What Comes Next

| Plan | Depends on | Builds |
|---|---|---|
| **Plan 2** — AI Normalizer | This plan (DB tables) | `normalizer-agent.ts`, `upsc-syllabus-map.ts`, 15 API route updates |
| **Plan 3** — Hermes Agents | Plan 2 (normalizer) | `base-agent.ts`, `orchestrator.ts`, all 9 specialist agents |
| **Plan 4** — Research Pipelines | Plan 3 (agents) | 6 cron routes, full research pipeline |
| **Plan 5** — Living Pages | Plan 3 (agents) | Universal page pattern, file upload |
| **Plan 6** — Mastery Engine | Plan 2 (DB) | `user_mastery` tracking, daily plans |
| **Plan 7** — Admin Console | Plans 3+4 (agents running) | `/admin/console` UI |
