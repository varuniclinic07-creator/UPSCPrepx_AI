# UPSC AI App — Enterprise AI System Design
**Date:** 2026-04-13  
**Status:** Approved — Ready for Implementation Planning  
**Scope:** Subsystems A (Normalizer) + B (Research & Content Factory) + C (Living Pages) + Hermes Multi-Agent Architecture + Mastery Engine + Admin Console

---

## 0. Executive Summary

Transform the UPSC AI app from a feature collection into a self-operating intelligence system. A single Hermes orchestrator deploys 7 specialist subagents that run 24/7 — researching, generating, evaluating, and quality-checking content across the full UPSC syllabus. Every user interaction is normalized through a Knowledge Graph before reaching any AI. Every page generates its own content on demand if none exists. Every user gets a personalized daily plan based on their mastery state.

This is the system that competes with Unacademy, Drishti IAS, and IASBABA — not by having more content, but by having content that is always fresh, always linked, and always personalized.

---

## 1. Phased Roadmap

### Phase 0 — Foundation (Current)
- ✅ AI Input Normalizer (Subsystem A)
- ✅ 24/7 Research + Content Builder (Subsystem B)
- ✅ Living Pages (Subsystem C)

### Phase 1 — MVP (Stable + Intelligent)
- Full normalizer enforcement across all API entry points
- Living content on every feature page
- Basic CA pipeline running daily

### Phase 2 — V1 (Smart)
- UPSC Knowledge Graph fully seeded
- Topic Intelligence Pages
- Answer Evaluation Engine
- Per-user AI memory

### Phase 3 — V2 (Adaptive)
- Personalized Mastery Engine with daily auto-plan
- Spaced repetition revision engine
- Smart notifications
- Confidence + source layer on all content

### Phase 4 — V3 (Enterprise)
- AI Content Factory with human review queue
- Multi-agent role separation (Hermes)
- Admin Control Panel
- Source versioning and audit trail

---

## 2. Core Database Schema

### Knowledge Graph (Foundation of Everything)

```sql
-- Every entity in the system is a node
knowledge_nodes (
  id                uuid PRIMARY KEY,
  type              text CHECK (type IN (
                      'subject','topic','subtopic','pyq','current_affair',
                      'note','quiz','answer_framework','scheme',
                      'judgment','report','uploaded_material'
                    )),
  title             text NOT NULL,
  content           text,
  metadata          jsonb,
  subject           text,                    -- fast filter
  syllabus_code     text,                    -- e.g. "GS2-POL-003"
  confidence_score  float DEFAULT 0.5,
  source_count      int DEFAULT 0,
  freshness_score   float DEFAULT 1.0,       -- decays over time
  last_verified_at  timestamptz,
  human_approved    boolean DEFAULT false,
  version           int DEFAULT 1,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
)

-- Every relationship between nodes
knowledge_edges (
  id                uuid PRIMARY KEY,
  from_node_id      uuid REFERENCES knowledge_nodes,
  to_node_id        uuid REFERENCES knowledge_nodes,
  relationship_type text CHECK (relationship_type IN (
                      'is_subtopic_of','appears_in_pyq','linked_to_ca',
                      'prereq_of','supports','explains',
                      'is_example_of','tagged_in_note','contradicts'
                    )),
  weight            float DEFAULT 1.0,
  metadata          jsonb,
  created_at        timestamptz DEFAULT now()
)
```

### Supporting Tables

```sql
-- Normalizer cache — prevents calling AI twice for same input
upsc_input_normalizations (
  id                uuid PRIMARY KEY,
  raw_input         text NOT NULL,           -- indexed
  raw_input_hash    text GENERATED,          -- MD5 for fast lookup
  resolved_subject  text,
  resolved_topic    text,
  resolved_subtopic text,
  node_id           uuid REFERENCES knowledge_nodes,
  method            text CHECK (method IN ('exact','fuzzy','ai')),
  confidence        float,
  created_at        timestamptz DEFAULT now()
)

-- Per-user mastery tracking at topic/subtopic level
user_mastery (
  id                uuid PRIMARY KEY,
  user_id           uuid REFERENCES auth.users,
  node_id           uuid REFERENCES knowledge_nodes,
  accuracy_score    float DEFAULT 0,
  attempts          int DEFAULT 0,
  correct           int DEFAULT 0,
  time_spent_seconds int DEFAULT 0,
  mastery_level     text CHECK (mastery_level IN (
                      'not_started','weak','developing','strong','mastered'
                    )) DEFAULT 'not_started',
  next_revision_at  timestamptz,
  last_attempted_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (user_id, node_id)
)

-- AI Content Factory review queue
content_queue (
  id                uuid PRIMARY KEY,
  node_id           uuid REFERENCES knowledge_nodes,
  content_type      text CHECK (content_type IN (
                      'note','quiz','mind_map','answer_framework',
                      'ca_brief','mcq_set','video_script','animation_prompt'
                    )),
  generated_content jsonb NOT NULL,
  ai_provider       text,
  agent_type        text,
  confidence_score  float,
  status            text CHECK (status IN (
                      'pending','approved','rejected','needs_revision'
                    )) DEFAULT 'pending',
  reviewed_by       uuid,
  reviewed_at       timestamptz,
  review_notes      text,
  created_at        timestamptz DEFAULT now()
)

-- Agent execution log
agent_runs (
  id                uuid PRIMARY KEY,
  agent_type        text CHECK (agent_type IN (
                      'research','notes','quiz','ca_ingestion',
                      'normalizer','evaluator','quality_check','video','animation'
                    )),
  status            text CHECK (status IN (
                      'running','completed','failed','partial'
                    )),
  nodes_processed   int DEFAULT 0,
  content_generated int DEFAULT 0,
  errors            jsonb,
  started_at        timestamptz DEFAULT now(),
  completed_at      timestamptz,
  metadata          jsonb
)
```

### Existing Tables — New Columns

```sql
ALTER TABLE current_affairs ADD COLUMN node_id uuid REFERENCES knowledge_nodes;
ALTER TABLE current_affairs ADD COLUMN version int DEFAULT 1;
ALTER TABLE current_affairs ADD COLUMN confidence_score float DEFAULT 0.7;

ALTER TABLE notes ADD COLUMN node_id uuid REFERENCES knowledge_nodes;
ALTER TABLE notes ADD COLUMN version int DEFAULT 1;
ALTER TABLE notes ADD COLUMN confidence_score float DEFAULT 0.7;

ALTER TABLE quizzes ADD COLUMN node_id uuid REFERENCES knowledge_nodes;
ALTER TABLE quizzes ADD COLUMN version int DEFAULT 1;
ALTER TABLE quizzes ADD COLUMN confidence_score float DEFAULT 0.7;
```

---

## 3. AI Provider Chain

```
Priority 1 → Ollama (primary)
  Text model:    qwen3.5:397b-cloud
  Vision model:  gemma4:31b-cloud (general images)
                 qwen3-vl:235b-instruct-cloud (multilingual/Hindi+English)
  Base URL:      OLLAMA_BASE_URL (default: http://localhost:11434/v1)

Priority 2 → Groq (fallback 1)
  Model:         llama-3.3-70b-versatile
  Keys:          GROQ_API_KEY_1 through GROQ_API_KEY_7 (7-key rotation)

Priority 3 → NVIDIA NIM (fallback 2)
  Model:         nvidia/llama-3.1-nemotron-70b-instruct
  Base URL:      https://integrate.api.nvidia.com/v1
  Key:           NVIDIA_API_KEY (rotate — previous key was compromised)

Priority 4 → Google Gemini (fallback 3)
  Model:         gemini-1.5-flash
  Keys:          GEMINI_API_KEY_1 through GEMINI_API_KEY_4 (4-key rotation)
                 (rotate — previous keys were compromised)
  Adapter:       src/lib/ai/gemini-adapter.ts (OpenAI-compatible wrapper)
```

### Per-Agent Provider Preferences

| Agent | Primary | Reason |
|---|---|---|
| NormalizerAgent | Ollama → Groq | Low latency |
| ResearchAgent | Ollama → NVIDIA NIM | Long context + quality |
| NotesAgent | Ollama → NVIDIA NIM → Gemini | Deep reasoning |
| QuizAgent | Groq → Ollama | Speed |
| CAIngestionAgent | Groq → Ollama | Speed over quality |
| EvaluatorAgent | NVIDIA NIM → Gemini | Best reasoning for evaluation |
| QualityAgent | Groq | Fast scoring |
| VideoAgent | Ollama (script) → Remotion service | Script then render |
| AnimationAgent | Ollama (prompt) → Manim service | Prompt then render |

---

## 4. Hermes Multi-Agent Architecture

### Agent Directory

```
src/lib/agents/
  base-agent.ts           ← shared: retry (3x exponential), run tracking, logging
  orchestrator.ts         ← Hermes: routes tasks, handles failures, never blocks
  normalizer-agent.ts
  research-agent.ts
  notes-agent.ts
  quiz-agent.ts
  ca-ingestion-agent.ts
  evaluator-agent.ts
  quality-agent.ts
  video-agent.ts
  animation-agent.ts
```

### Agent Communication — DB-Mediated (Never Direct)

```
Agent produces output
  ↓
Writes to content_queue (status: 'pending')
  ↓
QualityAgent scores asynchronously
  ↓
confidence ≥ 0.7  → status: 'approved' → content goes live
confidence 0.5–0.7 → status: 'needs_revision' → admin review queue
confidence < 0.5  → status: 'rejected' → ResearchAgent retried with more context
  ↓
agent_runs row updated throughout (status, counts, errors)
```

### Failure Handling

Every agent extends `base-agent.ts`:
- 3 retries with exponential backoff (1s, 2s, 4s)
- Failure writes structured error to `agent_runs.errors`
- Orchestrator skips to next agent — one failure never blocks the chain
- Dead-letter: after 3 failures, node flagged in admin console

### Cron Triggers

```
/api/cron/ca-ingestion        → daily 2:00am  (CAIngestionAgent)
/api/cron/syllabus-coverage   → weekly Sun 1:00am (Research+Notes+QuizAgent)
/api/cron/video-generation    → weekly Sun 3:00am (VideoAgent+AnimationAgent)
/api/cron/freshness-check     → daily 4:00am  (freshness_score decay)
/api/cron/daily-plans         → daily 5:00am  (MasteryEngine → user plans)
/api/cron/quality-sweep       → daily 3:00am  (QualityAgent re-scores stale)
```

---

## 5. Subsystem A — AI Input Normalizer (NormalizerAgent)

### Flow

```
Raw user input (any field: subject, topic, query)
  ↓
Step 1: Hash lookup → upsc_input_normalizations (instant, 0ms)
  ↓ miss
Step 2: Fuzzy match → upsc-syllabus-map.ts via fuse.js (threshold: 0.4, ~1ms)
  ↓ miss or confidence < 0.6
Step 3: Ollama classify prompt → returns {subject, topic, subtopic}
  ↓
Step 4: Resolve/create knowledge_nodes row → get nodeId
  ↓
Step 5: Cache → upsc_input_normalizations
  ↓
Returns: { subject, topic, subtopic, nodeId, confidence, method }
```

### Lookup Table (`src/lib/ai/upsc-syllabus-map.ts`) — 180 entries

```
Polity (35): "indian polity" | "constitution" | "preamble" |
  "fundamental rights" | "dpsp" | "directive principles" | "article 21" |
  "parliament" | "president" | "governor" | "judiciary" | "federalism" |
  "amendment" | "emergency" | "local bodies" | "election commission" ...

Economy (30): "indian economy" | "gdp" | "rbi" | "monetary policy" |
  "inflation" | "budget" | "fiscal policy" | "banking" | "fdi" |
  "poverty" | "agriculture" | "msme" | "disinvestment" | "gst" ...

History (25): "ancient india" | "medieval" | "mughal" | "freedom struggle" |
  "1857" | "gandhi" | "partition" | "harappa" | "maurya" | "chola" ...

Geography (25): "physical geography" | "monsoon" | "western ghats" |
  "rivers" | "soil types" | "climate" | "population" | "urbanisation" ...

Environment (15): "biodiversity" | "climate change" | "wetlands" |
  "ramsar" | "pollution" | "forest" | "wildlife" ...

Ethics (15): "ethics gs4" | "case study" | "integrity" | "attitude" |
  "arc report" | "emotional intelligence" | "probity" ...

Science & Technology (15): "space" | "isro" | "nuclear" | "biotech" |
  "ai" | "cyber" | "semiconductor" | "defence technology" ...

Art & Culture (10): "classical dance" | "painting" | "architecture" |
  "folk" | "intangible heritage" | "festivals" ...

International Relations (10): "foreign policy" | "bilateral" | "un" |
  "saarc" | "asean" | "quad" | "brics" | "g20" ...

Current Affairs (10): general CA aliases and abbreviations
```

### Integration Points (15 API routes — one call added each)

```
/api/notes/generate          /api/quiz/generate
/api/doubt/ask               /api/digest/generate
/api/mind-maps/generate      /api/lectures/generate
/api/video/shorts/generate   /api/mcq/practice/start
/api/mcq/mock/start          /api/current-affairs
/api/search/query            /api/eval/mains/submit
/api/studio/notes            /api/studio/answers
/api/math/solve
```

### New Files

```
src/lib/agents/normalizer-agent.ts
src/lib/ai/upsc-syllabus-map.ts
src/lib/ai/gemini-adapter.ts
```

---

## 6. Subsystem B — 24/7 AI Research & Content Factory

### Research Content Sources (4 Layers)

```
Layer 1 — Live Web (Agentic Web Search → DuckDuckGo)
  Service:   AGENTIC_WEB_SEARCH_URL (already in codebase)
  Queries:   "{topic} UPSC {year}" + "{topic} government policy 2024"
  Whitelist: PIB, The Hindu, Drishti, InsightsOnIndia,
             Yojana, Kurukshetra, PRS, ARC reports

Layer 2 — Document RAG (AutoDocThinker)
  Service:   AGENTIC_DOC_CHAT_URL (already in codebase)
  Indexes:   NCERT PDFs, standard books, ARC reports, Economic Survey,
             Budget docs, SC judgments in MinIO

Layer 3 — File Navigation (Agentic File Search)
  Service:   AGENTIC_FILE_SEARCH_URL (already in codebase)
  Use:       Find exact passages across large uploaded PDFs with page refs

Layer 4 — Deep Scrape (CRAWL4AI)
  Service:   CRAWL4AI_URL (already in codebase)
  Use:       Full page scrape of URLs found by Layer 1
```

### Pipeline 1 — Daily Current Affairs (2am)

```
CAIngestionAgent
  → Layers 1+4 scrape: The Hindu, PIB, Indian Express,
                        Drishti IAS, InsightsOnIndia, Yojana, Kurukshetra
  → AI extracts: title, summary, subject tags, topic tags
  → NormalizerAgent maps each article → nodeId
  → Creates knowledge_edge: article --linked_to_ca--> topic node
  → ARC reports, SC judgments → tagged to Ethics/Polity nodes
  → Govt schemes → tagged to relevant subject nodes
  → QualityAgent scores (confidence < 0.6 → admin review)
  → Approved → content_queue (approved) → live
```

### Pipeline 2 — Syllabus Coverage Builder (Sunday 1am)

```
ResearchAgent walks knowledge_nodes WHERE type='subtopic'
  AND (notes_count = 0 OR freshness_score < 0.4)

For each uncovered/stale subtopic:
  Layers 1+2+3+4 gather content
  NotesAgent   → structured notes (headings, bullets, PYQ links, examples)
  QuizAgent    → 10 MCQs (difficulty-scaled, explanation per answer)
  QualityAgent → scores both
    ≥ 0.7 → auto-approved → live
    0.5–0.7 → admin review queue
    < 0.5  → retry with more context
```

### Pipeline 3 — Video & Animation (Sunday 3am)

```
For each subtopic WHERE video_count = 0:
  NotesAgent generates: script + scene breakdown + visual descriptions
  VideoAgent  → Remotion service (REMOTION_URL) → renders lecture video
               → stored in MinIO, node linked in KG

For Ethics subtopics + any subtopic WITH manimPrompt:
  AnimationAgent → Manim service (MANIM_URL) → renders concept animation
                 → case study animations with on-screen instructions
                 → stored in MinIO, edge created in KG
```

### Content Notes Structure

Every AI-generated note includes:
```
{
  content: "...",
  sources: [
    { type: "web",  title: "The Hindu, 12 Jan 2025", url: "..." },
    { type: "doc",  title: "NCERT Polity Ch.2 p.34", passage: "..." },
    { type: "file", title: "ARC Report 2024 p.112",  passage: "..." },
    { type: "scrape", title: "PIB 15 Feb 2025",      url: "..." }
  ],
  confidence_score: 0.87,
  freshness_score: 1.0,
  last_verified_at: "2026-04-13T02:00:00Z",
  word_count: 850
}
```

---

## 7. Subsystem C — Living Pages

### Universal Page Pattern

```
User hits any dashboard page
  ↓
NormalizerAgent: URL params → nodeId
  ↓
knowledge_nodes check: content exists AND freshness_score > 0.5?
  ↓ YES                      ↓ NO / STALE
Return instantly         Show skeleton UI (loading state)
                              ↓
                         Stream AI generation (Ollama priority)
                              ↓
                         Store → knowledge_nodes + content_queue
                              ↓
                         QualityAgent scores async
                              ↓
                         Content replaces skeleton live
```

### Per-Feature On-Demand Generation

| Page | Generated if empty |
|---|---|
| Notes | NotesAgent → structured notes, headings, bullets, PYQ links |
| Quiz | QuizAgent → 10 MCQs, explanations, difficulty-scaled |
| Current Affairs | CAIngestionAgent output + KG topic links |
| Mind Maps | NotesAgent → mind map JSON → rendered client-side |
| Mock Test | QuizAgent → 100 MCQs from user's weak-area nodes |
| Topic Intelligence | All above aggregated from KG edges |
| Doubt Answer | EvaluatorAgent → answer + sources + related nodes |
| Answer Evaluation | EvaluatorAgent → score + model answer + improvement plan |
| Daily Digest | Personalized from user_mastery + today's CA |
| Video Shorts | Script → Remotion → video (async, progress shown) |
| Animations | Concept → Manim → animation (async, progress shown) |
| Ethics Case Study | Manim animation + gamified scenario + answer framework |

### File Upload (Up to 100MB, Any Format)

```
User uploads file
  ↓
MinIO storage
  ↓
Text extraction:
  PDF    → pdfparse
  Image  → gemma4:31b-cloud (general) OR qwen3-vl:235b-instruct-cloud (Hindi)
  DOCX   → mammoth
  PPT    → officeparser
  ↓
NormalizerAgent maps content → KG nodes
  ↓
NotesAgent generates structured summary
  ↓
knowledge_node created (type: 'uploaded_material')
  ↓
Edges: uploaded_material --supports--> matched topic nodes
  ↓
Appears in user library + linked to topic pages
```

### In-Built Video Player Features

```
Video player
  ├── Notes panel (right) — timestamp-synced note-taking
  ├── Query panel — EvaluatorAgent answers in video topic context
  ├── Chapter markers — auto-generated from scene breakdown
  └── Related content — KG edges → notes, MCQs, PYQs shown below
```

---

## 8. Personalized Mastery Engine

### What Gets Tracked (Per User, Per KG Node)

```
user_mastery updated after every interaction:
  accuracy_score  ← rolling average (quiz, test, answer eval)
  time_spent      ← seconds on notes, video, practice
  mastery_level   ← not_started → weak → developing → strong → mastered
  next_revision_at← SRS: 1d → 3d → 7d → 15d → 30d
```

### Daily Auto-Plan (5am Cron)

```
MasteryEngine reads user_mastery
  → weak nodes (accuracy < 0.5)
  → due for revision (next_revision_at ≤ today)
  → untouched nodes in target subjects
  → today's CA nodes linked to weak topics

Daily plan output:
  09:00 Revise   Polity: Fundamental Rights (weak, due)
  10:00 Read     Today's CA: Privacy judgment (linked to FR)
  11:00 Practice 20 MCQs: Economy weak areas
  14:00 New      Geography: River Systems (not started)
  16:00 Test     Mock: 50 MCQs mixed weak areas
  19:00 Revise   Ethics: Case Study #3 (SRS due)
```

### Smart Notifications

```
"Article 21 linked to today's SC judgment — revise now (weak topic)"
"You haven't touched Environment in 8 days — 3 new CAs linked"
"Mock test accuracy dropped in Economy — 15-min revision suggested"
"New Yojana issue — 4 schemes linked to your weak Economy topics"
```

---

## 9. Admin Console (`/admin/console`)

### Panels

**Content Health**
- Nodes with no notes (count by subject)
- Stale nodes (freshness_score < 0.4)
- Pending review queue (content_queue WHERE status='pending')
- Rejected content count (signal for agent retraining)

**Agent Monitor**
- agent_runs live table (last 50 runs: status, duration, counts, errors)
- Failed agents with full error detail + retry button
- Content generated today / this week (by agent type)
- Provider usage breakdown (which AI answered what %)

**Source Intelligence**
- Last scrape timestamp per source (The Hindu, PIB, Drishti...)
- New CA articles ingested today by source
- Untagged articles (NormalizerAgent could not classify)

**System Health**
- Ollama / Groq / NVIDIA / Gemini provider status + latency
- MinIO storage usage
- Queue depth (pending items in content_queue)
- Remotion + Manim service status

---

## 10. New File Structure

```
src/lib/agents/
  base-agent.ts
  orchestrator.ts            ← Hermes (replaces agentic-orchestrator.ts)
  normalizer-agent.ts
  research-agent.ts
  notes-agent.ts
  quiz-agent.ts
  ca-ingestion-agent.ts
  evaluator-agent.ts
  quality-agent.ts
  video-agent.ts
  animation-agent.ts

src/lib/ai/
  upsc-syllabus-map.ts       ← 180-entry lookup table
  gemini-adapter.ts          ← Gemini → OpenAI interface wrapper
  ai-provider-client.ts      ← updated: Ollama→Groq→NVIDIA→Gemini

src/app/api/cron/
  ca-ingestion/route.ts
  syllabus-coverage/route.ts
  video-generation/route.ts
  freshness-check/route.ts
  daily-plans/route.ts
  quality-sweep/route.ts

src/app/admin/console/
  page.tsx                   ← Admin Console UI
  components/
    content-health.tsx
    agent-monitor.tsx
    source-intelligence.tsx
    system-health.tsx

supabase/migrations/
  20260413_knowledge_graph.sql
  20260413_user_mastery.sql
  20260413_content_queue.sql
  20260413_agent_runs.sql
  20260413_normalizer_cache.sql
  20260413_alter_existing_tables.sql
```

---

## 11. Environment Variables Required

```bash
# AI Providers
OLLAMA_BASE_URL=http://your-vps:11434/v1
GROQ_API_KEY_1=...  # through GROQ_API_KEY_7
NVIDIA_API_KEY=...  # rotate — previous key compromised
GEMINI_API_KEY_1=...  # through GEMINI_API_KEY_4 — rotate all 4

# Agentic Services (already in codebase, need services running)
AGENTIC_WEB_SEARCH_URL=http://your-vps:8030
AGENTIC_FILE_SEARCH_URL=http://your-vps:8032
AGENTIC_DOC_CHAT_URL=http://your-vps:8031

# Video & Animation Services
REMOTION_URL=http://your-vps:3001
MANIM_URL=http://your-vps:5000

# Scraping
CRAWL4AI_URL=http://89.117.60.144:11235
CRAWL4AI_API_TOKEN=...

# Cron Security
CRON_SECRET=...  # min 32 chars
```

---

*Design approved across all 8 sections. Ready for implementation planning.*
