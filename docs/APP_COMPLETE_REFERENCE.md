# UPSC PrepX AI — Complete Application Reference

**Last Updated:** 2026-04-17 15:00 IST
**Version:** 1.1.0
**Build Status:** PASSING (exit code 0)
**Test Files:** 105 test suites
**Total Source Files:** 660+ (.ts/.tsx)
**Spec:** `docs/superpowers/specs/2026-04-13-enterprise-ai-system-design.md` (v8)
**Alignment Score:** ~97%

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [AI Provider Chain](#3-ai-provider-chain)
4. [Hermes Multi-Agent Architecture](#4-hermes-multi-agent-architecture)
5. [Database Schema (52 Migrations)](#5-database-schema)
6. [All Pages (108 pages)](#6-all-pages)
7. [All API Routes (168 routes)](#7-all-api-routes)
8. [Supabase Edge Functions (15)](#8-supabase-edge-functions)
9. [Cron Jobs (9)](#9-cron-jobs)
10. [Component Library](#10-component-library)
11. [Service Libraries](#11-service-libraries)
12. [Environment Configuration](#12-environment-configuration)
13. [Deployment](#13-deployment)
14. [Implementation Timeline](#14-implementation-timeline)
15. [Remaining Work](#15-remaining-work)

---

## 1. Project Overview

UPSC PrepX AI is a self-operating intelligence system for UPSC Civil Services Examination preparation. A Hermes orchestrator deploys 9 specialist subagents that run 24/7 — researching, generating, evaluating, and quality-checking content across the full UPSC syllabus.

**Key Differentiators:**
- Every user interaction normalized through a Knowledge Graph before reaching any AI
- Every page generates its own content on demand if none exists (Living Pages)
- Every user gets a personalized daily plan based on mastery state (SM-2 SRS)
- 6-provider AI fallback chain with 30+ free model options
- 15 Supabase Edge Functions for low-latency AI calls

**Repository:** `C:\Users\DR-VARUNI\Desktop\upsc_ai`
**Branch:** `main`
**Domain:** `https://upscbyvarunsh.aimasteryedu.in`
**VPS IP:** `89.117.60.144`

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14.x |
| Language | TypeScript | 5.x |
| UI | Tailwind CSS + shadcn/ui + Magic UI | Latest |
| Database | Supabase (PostgreSQL) | Project: emotqkukvfwjycvwfvyj |
| Auth | Supabase Auth (email + OTP) | Built-in |
| State | Zustand + TanStack React Query | Latest |
| Charts | Recharts | Latest |
| Video | HLS.js + custom player | Latest |
| Payments | Razorpay | Test mode |
| Search | Hybrid vector + FTS (Supabase) | Built-in |
| Queue | BullMQ (Redis-backed) | Latest |
| Notifications | Web Push API | Service worker |
| Edge Functions | Supabase Deno runtime | Latest |
| Testing | Jest 30 + Testing Library + Playwright | Latest |
| Monitoring | Sentry + Plausible + Grafana | Optional |

**Key npm packages:** `@google/generative-ai`, `fuse.js`, `openai` (v6), `hls.js`, `zustand`, `@tanstack/react-query`, `reactflow`, `recharts`, `bullmq`

---

## 3. AI Provider Chain

**Priority order:** Ollama (1) -> Groq (2) -> Kilo (5) -> OpenCode (6) -> NVIDIA NIM (3) -> Gemini (4)

All providers are OpenAI-compatible except Gemini (uses GeminiAdapter).

### Provider 1: Ollama Cloud (Primary)
| Field | Value |
|-------|-------|
| Base URL | `https://ollama.com/v1` (env: `OLLAMA_BASE_URL`) |
| Default Model | `qwen3.5:397b-cloud` |
| API Key | env: `OLLAMA_API_KEY` |
| Rate Limit | 20 RPM, 5 concurrent |
| Cost | Free |

### Provider 2: Groq (7-key rotation)
| Field | Value |
|-------|-------|
| Base URL | `https://api.groq.com/openai/v1` |
| Default Model | `llama-3.3-70b-versatile` |
| API Keys | env: `GROQ_API_KEY_1` through `GROQ_API_KEY_7` (round-robin) |
| Rate Limit | 30 RPM, 10 concurrent |
| Cost | Free tier |

### Provider 3: NVIDIA NIM
| Field | Value |
|-------|-------|
| Base URL | `https://integrate.api.nvidia.com/v1` |
| Default Model | `nvidia/llama-3.1-nemotron-70b-instruct` |
| API Key | env: `NVIDIA_API_KEY` |
| Rate Limit | 10 RPM, 3 concurrent |
| Cost | $0.0003/$0.0006 per 1K tokens |

### Provider 4: Google Gemini (4-key rotation)
| Field | Value |
|-------|-------|
| Adapter | `GeminiAdapter` (wraps `@google/generative-ai`) |
| Default Model | `gemini-1.5-flash` |
| API Keys | env: `GEMINI_API_KEY_1` through `GEMINI_API_KEY_4` |
| Rate Limit | 15 RPM, 5 concurrent |
| Cost | $0.000075/$0.0003 per 1K tokens |

### Provider 5: Kilo AI (4-key rotation + 5-model fallback)
| Field | Value |
|-------|-------|
| Base URL | `https://api.kilo.ai/api/gateway` (env: `KILO_API_BASE_URL`) |
| API Keys | env: `KILO_API_KEY_1` through `KILO_API_KEY_4` |
| Rate Limit | 30 RPM, 10 concurrent |
| Cost | Free |

**Kilo Model Fallback Order:**
1. `bytedance-seed/dola-seed-2.0-pro:free` (primary)
2. `nvidia/nemotron-3-super-120b-a12b:free`
3. `x-ai/grok-code-fast-1:optimized:free`
4. `kilo-auto/free`
5. `openrouter/free`

### Provider 6: OpenCode (Self-hosted, 16-model fallback)
| Field | Value |
|-------|-------|
| Base URL | `http://localhost:3100` (env: `OPENCODE_API_BASE_URL`) |
| API Key | env: `OPENCODE_API_KEY` |
| Rate Limit | 60 RPM, 10 concurrent |
| Cost | Free (self-hosted) |

**OpenCode Model Fallback Order (16 models):**
1. `opencode zen/Big Pickle`
2. `go/MiniMax M2.7`
3. `Nemotron 3 Super Free`
4. `MiniMax M2.5 Free`
5. `Nvidia/Kimi K2.5`
6. `Nvidia/Qwen3.5-397B-A17B`
7. `Nvidia/Llama 3.3 Nemotron Super 49b V1.5`
8. `Nvidia/Mistral Large 3 675B Instruct 2512`
9. `Nvidia/NeMo Retriever OCR v1`
10. `Nvidia/Llama 4 Maverick 17b 128e Instruct`
11. `Nvidia/MiniMax-M2.5`
12. `Nvidia/Devstral-2-123B-Instruct-2512`
13. `Nvidia/GLM-4.7`
14. `Nvidia/GLM5`
15. `Nvidia/DeepSeek V3.1 Terminus`
16. `Nvidia/GPT-OSS-120B`
17. `Nvidia/Step 3.5 Flash`

### Vision Models
| Model | Provider | Use |
|-------|----------|-----|
| `gemma4:31b-cloud` | Ollama | Primary vision model |
| `qwen3-vl:235b-instruct-cloud` | Ollama | Vision fallback |

**Functions:** `callAI()`, `callAIStream()`, `callAIVision()`
**File:** `src/lib/ai/ai-provider-client.ts`

### Per-Agent Provider Preferences
| Agent | Preferred Order |
|-------|----------------|
| NormalizerAgent | Ollama -> Groq -> Kilo |
| ResearchAgent | Ollama -> NVIDIA -> Kilo |
| NotesAgent | Ollama -> NVIDIA -> Kilo -> Gemini |
| QuizAgent | Groq -> Ollama -> Kilo |
| CAIngestionAgent | Groq -> Ollama -> Kilo |
| EvaluatorAgent | NVIDIA -> Gemini -> Kilo |
| QualityAgent | Groq -> Kilo |
| VideoAgent | Ollama -> Kilo |
| AnimationAgent | Ollama -> Kilo |

---

## 4. Hermes Multi-Agent Architecture

**Orchestrator:** `src/lib/agents/orchestrator.ts`
- Routes tasks to correct subagent based on task type
- Dead-letter queue: after 3 failures per node, flags `knowledge_nodes.metadata.dead_letter = true`
- Retry: 3x exponential backoff (1s, 2s, 4s) in BaseAgent

### Agent Files

| Agent | File | Purpose |
|-------|------|---------|
| BaseAgent | `src/lib/agents/base-agent.ts` | Abstract base class with retry, logging, run tracking, provider preferences |
| Orchestrator | `src/lib/agents/orchestrator.ts` | Hermes: routes tasks, retries, dead-letter queue |
| NormalizerAgent | `src/lib/agents/normalizer-agent.ts` | Input normalization: raw text -> (subject, topic, subtopic, nodeId) |
| ResearchAgent | `src/lib/agents/research-agent.ts` | 4-layer content gathering (web search, RAG, file search, CRAWL4AI) |
| NotesAgent | `src/lib/agents/notes-agent.ts` | Structured note generation with citations |
| QuizAgent | `src/lib/agents/quiz-agent.ts` | MCQ generation with explanations + difficulty scaling |
| CAIngestionAgent | `src/lib/agents/ca-ingestion-agent.ts` | Current affairs scraping + KG linking |
| EvaluatorAgent | `src/lib/agents/evaluator-agent.ts` | Answer scoring + doubt answering |
| QualityAgent | `src/lib/agents/quality-agent.ts` | Content quality scoring (0-1), auto-approve >=0.7, flag <0.5 |
| VideoAgent | `src/lib/agents/video-agent.ts` | Script generation -> FFmpeg video rendering |
| AnimationAgent | `src/lib/agents/animation-agent.ts` | Concept -> Manim animation prompt generation |

### Orchestrator Task Types
`generate_notes`, `generate_quiz`, `ca_ingestion`, `evaluate_answer`, `answer_doubt`, `score_content`, `generate_video`, `generate_animation`, `normalize_input`

---

## 5. Database Schema

**Total Migrations:** 52 (supabase/migrations/001 through 052)

| Migration | Purpose |
|-----------|---------|
| 001_initial_schema | Users, profiles, sessions |
| 002_ip_restrictions | IP allowlisting |
| 003_trial_system | Trial subscriptions |
| 004_subscription_plans | Subscription tiers + billing |
| 005_agentic_tables | Agentic AI pipeline tables |
| 006_lecture_tables | Lecture videos + chapters |
| 007_materials_tables | Study materials + PDFs |
| 008_rls_policies | Row-level security policies |
| 009_seed_data | Initial data seeding |
| 010_event_store | Event sourcing |
| 011_business_features | Business metrics |
| 012_fix_rls_all_tables | RLS fixes |
| 013_missing_features | Feature flags |
| 014_agentic_intelligence | Enhanced agentic tables |
| 014_audit_logging | Audit log table |
| 015_crawl4ai_integration | Web scraping integration |
| 016_schema_fixes | Schema corrections |
| 017_webhook_events | Payment webhooks |
| 018_edge_computing_admin_control | Edge function configs |
| 018_rag_search_engine | Vector + FTS search |
| 019_notes_library_and_generator | Notes system |
| 020_video_shorts | Short video content |
| 021_monetization_system | Payment + subscriptions |
| 022_mains_evaluator | Mains answer evaluation |
| 023_daily_current_affairs | CA pipeline |
| 024_user_content_studio | User content creation |
| 025_ai_doubt_solver | Doubt resolution threads |
| 026_mcq_practice | MCQ practice + mock tests |
| 027_study_planner | Study planning system |
| 028_analytics_views | Analytics materialized views |
| 029_mentor_chat | AI mentor conversations |
| 030_pdf_reader | PDF library + reader |
| 031_gamification | XP, badges, leaderboards |
| 032_bookmarks_srs | Bookmarks + spaced repetition |
| 033_video_generation | Video generation pipeline |
| 034_video_notes_progress | Video notes + watch progress |
| 035_video_notes_sync | Video-notes synchronization |
| 036_admin | Admin panel tables |
| 037_community_forum | Community features |
| 038_phase2_payments_fix | Payment system fixes |
| 039_audit_logs | Structured audit logging (append-only) |
| 040_knowledge_graph | `knowledge_nodes` + `knowledge_edges` (KG core) |
| 041_normalizer_cache | `upsc_input_normalizations` (O(1) lookup) |
| 042_user_mastery | `user_mastery` (SM-2 SRS) |
| 043_content_queue | `content_queue` (agent output staging) |
| 044_agent_runs | `agent_runs` (agent execution tracking) |
| 045_alter_existing_tables | Add `node_id`/`version`/`confidence` to existing tables |
| 046_mastery_sm2_columns | SM-2 ease_factor, interval_days, repetitions |
| 047_rls_plan7_tables | RLS for Plan 7 tables |
| 048_mastery_achievements | Achievement system |
| 049_lecture_enhancements | Bookmarks + watch history |
| 050_monthly_compilations | Video compilation pipeline |
| 051_raw_input_hash_generated | `raw_input_hash` as DB-generated column |
| 052_hermes_jobs_logs | `hermes_jobs` + `hermes_logs` (Hermes job tracking + structured logs) |

### Key Tables
- `knowledge_nodes` — Every entity in the KG (topics, subtopics, PYQs, CAs, notes, quizzes)
- `knowledge_edges` — Relationships between nodes (prerequisite, related, etc.)
- `upsc_input_normalizations` — Normalizer cache with DB-generated md5 hash
- `user_mastery` — Per-user per-node mastery state (SM-2 algorithm)
- `content_queue` — Agent output staging (pending -> approved/rejected)
- `agent_runs` — Agent execution logs
- `current_affairs` — Daily CA articles
- `notes`, `quizzes`, `lectures` — Core content tables
- `user_subscriptions` — Subscription management
- `audit_logs` — Append-only audit trail
- `hermes_jobs` — Background job execution tracking (status, attempts, duration)
- `hermes_logs` — Structured log entries per job (level, service, message, metadata)

---

## 6. All Pages (108 pages)

### Public Pages (4)
| Path | File |
|------|------|
| `/` | `src/app/page.tsx` |
| `/pricing` | `src/app/pricing/page.tsx` |
| `/signup` | `src/app/signup/page.tsx` |

### Auth Pages (3)
| Path | File |
|------|------|
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/register` | `src/app/(auth)/register/page.tsx` |
| `/onboarding` | `src/app/(auth)/onboarding/page.tsx` |

### Dashboard Pages (75)
| Path | Feature |
|------|---------|
| `/dashboard` | Main dashboard |
| `/dashboard/notes` | Smart notes (Living Content enabled) |
| `/dashboard/notes/[slug]` | Individual note |
| `/dashboard/notes/new` | Create note |
| `/dashboard/notes/10th-class` | Simplified notes |
| `/dashboard/my-notes` | Personal notes |
| `/dashboard/my-notes/[id]` | Edit personal note |
| `/dashboard/quiz` | Quiz practice (Living Content enabled) |
| `/dashboard/quiz/[id]` | Take quiz |
| `/dashboard/quiz/new` | Generate quiz |
| `/dashboard/quiz/current-affairs` | CA quiz |
| `/dashboard/practice/answer-writing` | Answer writing practice |
| `/dashboard/practice/essay` | Essay practice |
| `/dashboard/practice/mock/[id]` | Mock test |
| `/dashboard/practice/mock-interview` | Mock interview |
| `/dashboard/practice/pyq-analysis` | PYQ analysis |
| `/dashboard/practice/session/[id]` | Practice session |
| `/dashboard/mindmaps` | Mind maps (Living Content enabled) |
| `/dashboard/ask-doubt` | Doubt solver (Living Content enabled) |
| `/dashboard/ask-doubt/[id]` | Doubt thread |
| `/dashboard/current-affairs` | Current affairs |
| `/dashboard/current-affairs/[id]` | CA article |
| `/dashboard/daily-digest` | Daily digest |
| `/dashboard/daily-digest/[date]` | Digest by date |
| `/dashboard/digest` | Digest overview |
| `/dashboard/topic-intelligence` | Topic search + 5-type content aggregation |
| `/dashboard/animations` | Manim animation gallery |
| `/dashboard/ethics-case-study` | Ethics case study practice |
| `/dashboard/answer-practice` | Answer practice |
| `/dashboard/answer-practice/write` | Write answers |
| `/dashboard/mentor` | AI mentor chat |
| `/dashboard/search` | Search (Cmd+K) |
| `/dashboard/planner` | Study planner |
| `/dashboard/planner/new` | Create plan |
| `/dashboard/study-planner` | Calendar planner |
| `/dashboard/study-planner/calendar` | Calendar view |
| `/dashboard/revision` | Spaced repetition |
| `/dashboard/bookmarks` | Bookmarked content |
| `/dashboard/progress` | Progress dashboard |
| `/dashboard/analytics` | Analytics overview |
| `/dashboard/analytics/activity` | Activity stats |
| `/dashboard/analytics/mastery` | Mastery stats |
| `/dashboard/analytics/performance` | Performance stats |
| `/dashboard/gamification` | Gamification + leaderboard |
| `/dashboard/leaderboard` | Leaderboard |
| `/dashboard/lectures` | Lecture library |
| `/dashboard/lectures/[id]` | Lecture player |
| `/dashboard/video` | Video overview |
| `/dashboard/video/[id]` | Video player (HLS + notes + Q&A) |
| `/dashboard/videos` | Videos library |
| `/dashboard/videos/[id]` | Video detail |
| `/dashboard/videos/new` | Upload video |
| `/dashboard/video-shorts` | Short videos |
| `/dashboard/video-shorts/generate` | Generate shorts |
| `/dashboard/shorts/new` | New short |
| `/dashboard/library` | PDF library |
| `/dashboard/library/[id]` | PDF reader |
| `/dashboard/pdf-reader` | PDF reader |
| `/dashboard/materials` | Study materials |
| `/dashboard/materials/magazines` | Magazines |
| `/dashboard/materials/newspapers` | Newspapers |
| `/dashboard/materials/schemes` | Government schemes |
| `/dashboard/schemes` | Schemes shortcut |
| `/dashboard/math-solver` | Math solver (CSAT) |
| `/dashboard/legal` | Legal/constitutional articles |
| `/dashboard/geography` | Geography features |
| `/dashboard/syllabus` | Full UPSC syllabus |
| `/dashboard/toppers` | Topper strategies |
| `/dashboard/community` | Community forum |
| `/dashboard/groups` | Study groups |
| `/dashboard/memory-palace` | Memory techniques |
| `/dashboard/monthly-compilation` | Monthly compilation |
| `/dashboard/weekly-compilation` | Weekly compilation |
| `/dashboard/profile` | User profile |
| `/dashboard/settings` | Settings |
| `/dashboard/subscription` | Subscription management |
| `/dashboard/feedback` | Feedback form |

### Admin Pages (26)
| Path | Feature |
|------|---------|
| `/admin` | Admin dashboard |
| `/admin/console` | Unified 4-panel console (Content Health, Agent Monitor, Source Intelligence, System Health) |
| `/admin/source-intelligence` | Source scraping stats + health indicators |
| `/admin/users` | User management |
| `/admin/users-analytics` | User analytics |
| `/admin/content` | Content management |
| `/admin/knowledge-base` | Knowledge graph explorer |
| `/admin/queue` | Content queue |
| `/admin/lectures` | Lecture management |
| `/admin/hermes` | Hermes pipeline dashboard |
| `/admin/hermes/jobs` | Agent jobs |
| `/admin/hermes/logs` | Agent logs |
| `/admin/subscriptions` | Subscription admin |
| `/admin/billing` | Billing management |
| `/admin/revenue-analytics` | Revenue analytics |
| `/admin/leads` | Lead management |
| `/admin/conversion` | Conversion funnel |
| `/admin/features` | Feature flags |
| `/admin/ai-providers` | AI provider status |
| `/admin/ai-cost` | AI cost tracking |
| `/admin/ai-usage` | AI usage analytics |
| `/admin/ml-analytics` | ML analytics (churn, segmentation, engagement) |
| `/admin/analytics` | General analytics |
| `/admin/business` | Business metrics |
| `/admin/feedback` | Feedback review |
| `/admin/system` | System health |

---

## 7. All API Routes (168 routes)

### AI Routes (7)
| Method | Path | Feature |
|--------|------|---------|
| POST | `/api/ai/chat` | AI chat (rate limited, auth required) |
| POST | `/api/ai/chat/stream` | Streaming AI chat |
| POST | `/api/ai/generate` | AI generation |
| GET | `/api/ai/health` | Provider health check |
| POST | `/api/content/living` | Living Content API (NormalizerAgent -> freshness -> generate) |
| POST | `/api/search/query` | Hybrid search |
| POST | `/api/grade` | Answer grading |

### Current Affairs (7)
| Method | Path | Feature |
|--------|------|---------|
| GET | `/api/ca/daily` | Today's CA articles |
| GET | `/api/ca/archive` | CA archive |
| GET | `/api/ca/article/[id]` | Single article |
| GET | `/api/ca/mcq/[articleId]` | MCQ from article |
| GET | `/api/current-affairs` | CA listing |
| GET | `/api/current-affairs/[id]` | CA detail |
| POST | `/api/digest/generate` | Generate daily digest |

### Notes (8)
| Method | Path | Feature |
|--------|------|---------|
| GET/POST | `/api/notes` | List/create notes |
| GET/PUT/DELETE | `/api/notes/[id]` | CRUD note |
| GET | `/api/notes/[slug]/animate` | Animate note |
| POST | `/api/notes/generate` | Generate notes |
| GET | `/api/notes/library` | Notes library |
| POST | `/api/notes/sync-from-video` | Sync from video |

### Quiz & MCQ (10)
| Method | Path | Feature |
|--------|------|---------|
| GET/POST | `/api/quiz` | List/create quizzes |
| GET | `/api/quiz/[id]` | Get quiz |
| POST | `/api/quiz/[id]/submit` | Submit answers |
| POST | `/api/quiz/generate` | Generate quiz |
| POST | `/api/mcq/practice/start` | Start practice |
| POST | `/api/mcq/practice/submit` | Submit practice |
| POST | `/api/mcq/mock/start` | Start mock test |
| POST | `/api/mcq/mock/submit` | Submit mock |
| GET | `/api/mcq/analytics` | MCQ analytics |
| POST | `/api/mcq/bookmark` | Bookmark question |

### Doubt Solver (5)
| Method | Path | Feature |
|--------|------|---------|
| POST | `/api/doubt/ask` | Ask doubt |
| POST | `/api/doubt/followup` | Follow-up question |
| GET | `/api/doubt/history` | Doubt history |
| POST | `/api/doubt/rate` | Rate answer |
| GET | `/api/doubt/thread/[id]` | Doubt thread |

### Mains Evaluation (4)
| Method | Path | Feature |
|--------|------|---------|
| POST | `/api/eval/mains/submit` | Submit answer |
| GET | `/api/eval/mains/[id]` | Get evaluation |
| GET | `/api/eval/mains/history` | Evaluation history |
| GET | `/api/eval/mains/questions` | Practice questions |

### Mastery & Revision (5)
| Method | Path | Feature |
|--------|------|---------|
| GET | `/api/mastery/stats` | Mastery statistics |
| GET | `/api/mastery/due` | SRS due items |
| POST | `/api/mastery/update` | Update mastery |
| GET | `/api/revision` | Revision schedule |
| GET/POST | `/api/bookmarks` | Bookmarks CRUD |

### Planner (6)
| Method | Path | Feature |
|--------|------|---------|
| GET/POST | `/api/planner` | Plans CRUD |
| GET | `/api/planner/daily-tasks` | Today's tasks |
| POST | `/api/planner/schedule` | Generate schedule |
| POST | `/api/planner/adjust` | Adjust plan |
| POST | `/api/planner/complete` | Complete task |
| GET | `/api/planner/milestones` | Milestones |

### Video & Lectures (10)
| Method | Path | Feature |
|--------|------|---------|
| GET/POST | `/api/lectures` | Lectures CRUD |
| GET/PUT | `/api/lectures/[id]/status` | Lecture status |
| POST | `/api/lectures/[id]/cancel` | Cancel generation |
| GET | `/api/lectures/[id]/chapters` | Chapters |
| POST | `/api/lectures/[id]/progress` | Watch progress |
| POST | `/api/lectures/generate` | Generate lecture |
| POST | `/api/video/generate` | Generate video |
| GET | `/api/video/history` | Video history |
| GET | `/api/video/[id]/notes` | Video notes |
| POST | `/api/shorts/generate` | Generate shorts |

### Mentor (1)
| Method | Path | Feature |
|--------|------|---------|
| GET/POST | `/api/mentor/chat` | AI mentor chat |

### Analytics (12)
| Method | Path | Feature |
|--------|------|---------|
| GET | `/api/analytics/activity-stats` | Activity |
| GET | `/api/analytics/mastery-stats` | Mastery |
| GET | `/api/analytics/performance-stats` | Performance |
| GET | `/api/analytics/readiness-score` | Exam readiness |
| GET | `/api/analytics/study-trends` | Study trends |
| GET | `/api/analytics/subject-performance` | Subject breakdown |
| GET | `/api/analytics/time-distribution` | Time distribution |
| GET | `/api/analytics/weekly-comparison` | Weekly comparison |
| GET | `/api/analytics/ml/dashboard` | ML dashboard |
| GET | `/api/analytics/ml/churn-risk` | Churn prediction |
| GET | `/api/analytics/ml/weekly-insights` | Weekly narrative |
| GET | `/api/analytics/ml/content-engagement` | Content engagement |

### Admin Routes (24)
| Method | Path | Feature |
|--------|------|---------|
| GET | `/api/admin/analytics` | Admin analytics |
| GET/POST | `/api/admin/users` | User management |
| GET | `/api/admin/agent-runs` | Agent execution logs |
| GET | `/api/admin/ai-providers` | Provider configuration |
| GET | `/api/admin/ai-providers/status` | Provider health |
| GET | `/api/admin/content-queue` | Content queue management |
| GET | `/api/admin/knowledge-graph` | KG explorer |
| GET | `/api/admin/queue` | Queue management |
| GET | `/api/admin/features` | Feature flags |
| GET | `/api/admin/leads` | Lead management |
| GET/POST | `/api/admin/lectures` | Lecture admin |
| PUT/DELETE | `/api/admin/lectures/[id]` | Lecture CRUD |
| GET | `/api/admin/materials` | Materials admin |
| GET | `/api/admin/subscriptions` | Subscription admin |
| GET | `/api/admin/system` | System health |
| GET | `/api/admin/metrics/ai-cost` | AI cost metrics |
| GET | `/api/admin/metrics/ai-usage` | AI usage metrics |
| GET | `/api/admin/metrics/conversion` | Conversion metrics |
| GET | `/api/admin/metrics/my-usage` | Personal usage |
| GET | `/api/admin/metrics/realtime` | Realtime metrics |
| GET | `/api/admin/metrics/revenue` | Revenue metrics |
| GET | `/api/admin/metrics/users` | User metrics |
| GET | `/api/admin/billing/analytics` | Billing analytics |
| POST | `/api/admin/billing/surge/manage` | Surge pricing |
| GET/POST | `/api/admin/hermes/jobs` | Hermes job listing (paginated + stats) / manual enqueue |
| GET | `/api/admin/hermes/logs` | Hermes structured logs (paginated + filters) |

### Auth & User (8)
| Method | Path | Feature |
|--------|------|---------|
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/otp` | OTP verification |
| POST | `/api/auth/register` | Registration |
| GET | `/api/auth/callback` | OAuth callback |
| GET/PUT | `/api/user` | User profile |
| GET/PUT | `/api/user/settings` | User settings |
| GET | `/api/user/preferences` | User preferences |
| GET | `/api/usage` | Usage stats |

### Payments (5)
| Method | Path | Feature |
|--------|------|---------|
| POST | `/api/payments/initiate` | Start payment |
| POST | `/api/payments/verify` | Verify payment |
| POST | `/api/webhooks/razorpay` | Razorpay webhook |
| GET | `/api/billing/invoices` | Invoices |
| GET | `/api/billing/usage` | Billing usage |
| GET | `/api/subscription/status` | Subscription status |

### Cron Routes (9)
See [Section 9](#9-cron-jobs).

### Other (misc routes for agentic, mind-maps, legal, math, studio, etc.)

---

## 8. Supabase Edge Functions (15)

**Shared modules:** `supabase/functions/_shared/` (ai-provider.ts, cors.ts, entitlement.ts, simplified-lang.ts)

| Function | Feature | Endpoint |
|----------|---------|----------|
| `doubt-solver-pipe` | F5: Doubt solving with RAG | `.../functions/v1/doubt-solver-pipe` |
| `mains-evaluator-pipe` | F6: Answer evaluation | `.../functions/v1/mains-evaluator-pipe` |
| `mentor-chat-pipe` | F10: AI mentor | `.../functions/v1/mentor-chat-pipe` |
| `notes-generator-pipe` | F3/F4: Notes generation | `.../functions/v1/notes-generator-pipe` |
| `quiz-engine-pipe` | F7: MCQ generation | `.../functions/v1/quiz-engine-pipe` |
| `search-pipe` | F11: Hybrid search | `.../functions/v1/search-pipe` |
| `daily-digest-pipe` | F2: CA digest | `.../functions/v1/daily-digest-pipe` |
| `video-shorts-pipe` | F18: Short video scripts | `.../functions/v1/video-shorts-pipe` |
| `gamification-pipe` | F13: XP/badges | `.../functions/v1/gamification-pipe` |
| `onboarding-pipe` | F1: Diagnostic quiz | `.../functions/v1/onboarding-pipe` |
| `planner-pipe` | F8: Study plan | `.../functions/v1/planner-pipe` |
| `ethics-pipe` | F6-GS4: Ethics cases | `.../functions/v1/ethics-pipe` |
| `legal-pipe` | F12: Constitutional law | `.../functions/v1/legal-pipe` |
| `math-solver-pipe` | CSAT: Math solver | `.../functions/v1/math-solver-pipe` |
| `custom-notes-pipe` | F4: Custom notes | `.../functions/v1/custom-notes-pipe` |

**Base URL:** `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/`

**Deployment:** Requires `npx supabase login` then `./scripts/deploy-edge-functions.sh`

---

## 9. Cron Jobs (9)

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/ca-ingestion` | Daily 6:00 AM | Scrape CA sources, normalize, link to KG |
| `/api/cron/scrape-current-affairs` | Daily 5:30 AM | Raw CA scraping from whitelisted sources |
| `/api/cron/daily-plans` | Daily 5:00 AM | Generate personalized daily plans (weak + SRS + untouched + CA-linked) |
| `/api/cron/freshness-check` | Every 6 hours | Check content freshness, flag stale nodes |
| `/api/cron/quality-sweep` | Daily 2:00 AM | Score content quality, flag low-quality |
| `/api/cron/syllabus-coverage` | Weekly Sunday | Generate content for uncovered syllabus topics |
| `/api/cron/video-generation` | Daily 3:00 AM | Process video generation queue |
| `/api/cron/mastery-notifications` | Daily 8:00 AM | CA-topic alerts, inactivity alerts, regression alerts |
| `/api/cron/subscriptions` | Daily midnight | Expire trials, check payment status |

---

## 10. Component Library

### Living Content
| Component | File | Usage |
|-----------|------|-------|
| `QuickGenerate` | `src/components/living-content/quick-generate.tsx` | Embedded in notes, quiz, mindmaps, ask-doubt pages |
| `useLivingContent` | `src/hooks/use-living-content.ts` | Hook: NormalizerAgent -> freshness check -> skeleton -> stream |

### UI Components (src/components/)
| Directory | Count | Purpose |
|-----------|-------|---------|
| `ui/` | 20+ | shadcn/ui base components |
| `magic-ui/` | 10+ | Animated UI (bento grid, shimmer, stat cards) |
| `admin/` | 5+ | Admin panel components |
| `analytics/` | 5+ | Charts and analytics |
| `ca/` | 3+ | Current affairs |
| `doubt/` | 3+ | Doubt solver |
| `eval/` | 2+ | Mains evaluation |
| `gamification/` | 3+ | XP, badges, leaderboard |
| `layout/` | 3+ | Dashboard shell, sidebars |
| `lectures/` | 3+ | Lecture player |
| `mcq/` | 4+ | MCQ practice |
| `mentor/` | 2+ | AI mentor chat |
| `notes/` | 4+ | Notes viewer/editor |
| `onboarding/` | 3+ | Onboarding flow |
| `payments/` | 3+ | Payment components |
| `pdf/` | 2+ | PDF reader |
| `planner/` | 3+ | Study planner |
| `search/` | 2+ | Search interface |
| `studio/` | 3+ | Content studio |
| `video/` | 5+ | Video player (HLS.js) |

---

## 11. Service Libraries

| Directory | Key Files | Purpose |
|-----------|-----------|---------|
| `src/lib/ai/` | `ai-provider-client.ts`, `gemini-adapter.ts` | AI provider chain, callAI/callAIStream/callAIVision |
| `src/lib/ai-cost/` | `cost-tracker.ts` | Per-model cost tracking |
| `src/lib/agents/` | 11 files | Hermes agent architecture |
| `src/lib/hermes/` | `logger.ts` | Hermes job lifecycle (create/update/log) + `runHermesJob()` wrapper |
| `src/lib/auth/` | `auth-config.ts`, `check-access.ts` | Auth + entitlement checking |
| `src/lib/mastery/` | `mastery-service.ts` | SM-2 SRS engine, mastery levels |
| `src/lib/security/` | `rate-limiter.ts`, `csrf.ts`, `audit.ts`, `service-tokens.ts` | Zero-trust security |
| `src/lib/analytics/` | `user-segmentation.ts`, `usage-analytics.ts` | ML analytics |
| `src/lib/billing/` | `surge-pricing.ts` | Dynamic pricing |
| `src/lib/ca/` | CA service | Current affairs pipeline |
| `src/lib/doubt/` | Doubt service + RAG | Doubt resolution |
| `src/lib/gamification/` | Gamification service | XP, badges, streaks |
| `src/lib/notifications/` | Push service | Web push notifications |
| `src/lib/syllabus/` | `syllabus-map.ts` | 180-entry UPSC syllabus map (fuse.js fuzzy match) |
| `src/lib/theme/` | `theme-provider.tsx` | Light/dark theme (default: light) |
| `src/lib/validation/` | `schemas.ts` | Zod validation schemas |

---

## 12. Environment Configuration

**Files:**
- `.env.example` — Template with all variables documented
- `.env.vps` — VPS production configuration
- `.env.vps-stack` — Docker stack configuration
- `.env.coolify` — Coolify deployment config

**Critical Environment Variables:**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI Providers (6-provider chain)
OLLAMA_BASE_URL=https://ollama.com/v1
OLLAMA_API_KEY=...
OLLAMA_MODEL=qwen3.5:397b-cloud

GROQ_API_KEY_1 through _7=...
GROQ_MODEL=llama-3.3-70b-versatile

KILO_API_BASE_URL=https://api.kilo.ai/api/gateway
KILO_API_KEY_1 through _4=...

OPENCODE_API_BASE_URL=http://localhost:3100
OPENCODE_API_KEY=...

NVIDIA_API_KEY=...
GEMINI_API_KEY_1 through _4=...

# Payments
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Redis
REDIS_URL=redis://...

# Agentic Services
AGENTIC_WEB_SEARCH_URL=http://89.117.60.144:8030
AGENTIC_FILE_SEARCH_URL=http://89.117.60.144:8032
AGENTIC_DOC_CHAT_URL=http://89.117.60.144:8031
CRAWL4AI_URL=http://89.117.60.144:11235

# Hermes Gateway
HERMES_GATEWAY_TOKEN=631ff4b2-4c82-4e72-82b5-dde4a78eea80

# Video Services
MANIM_URL=http://89.117.60.144:8085
REMOTION_URL=http://89.117.60.144:3002
```

---

## 13. Deployment

### Prerequisites
1. `npm install --legacy-peer-deps`
2. `npx supabase login` (browser-based OAuth)
3. Set all env variables

### Build
```bash
npx next build  # Must exit code 0
```

### Deploy Edge Functions
```bash
# Windows
.\scripts\deploy-edge-functions.ps1

# Linux/Mac
./scripts/deploy-edge-functions.sh
```

### Apply DB Migrations
```bash
npx supabase db push
```

### Set Edge Function Secrets
Go to: `https://supabase.com/dashboard/project/emotqkukvfwjycvwfvyj/settings/edge-functions`
Add: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NINE_ROUTER_API_KEY`, `GROQ_API_KEY`, `OLLAMA_API_KEY`

See `DEPLOYMENT.md` and `DEPLOY_QUICKSTART.md` for full instructions.

---

## 14. Implementation Timeline

| Date | Commit | Summary |
|------|--------|---------|
| 2026-04-13 | `a4573ba` | Enterprise AI system design spec |
| 2026-04-13 | `0fd56c2` | Plan 1: Foundation DB + 4-provider chain |
| 2026-04-14 | `885c06e` | Plan 2: NormalizerAgent + 180-entry syllabus map |
| 2026-04-14 | `b9cf04f` | Plan 3: Hermes Orchestrator + 9 subagents |
| 2026-04-14 | `54c522f` | Plan 4: 6 cron pipelines for 24/7 automation |
| 2026-04-14 | `852459d` | Plan 5: Living Pages + file upload + video panels |
| 2026-04-14 | `f10e172` | Plan 6: Mastery Engine (SM-2 SRS) + notifications |
| 2026-04-14 | `8211385` | Plan 7: Admin Console (content queue, agent monitor, KG explorer) |
| 2026-04-14 | `86f8487` | Plan 8A: 10 test suites + RLS security + admin polish |
| 2026-04-14 | `7881ff8` | Plan 8B: Mastery badges + achievements |
| 2026-04-14 | `b70f88d` | Plan 8C: Web Push Notifications |
| 2026-04-14 | `5425720` | Plan 8D: Agentic analytics dashboards |
| 2026-04-14 | `afe8619` | Plan 9A: BullMQ worker for lectures |
| 2026-04-14 | `f95d62f` | Plan 9B: FFmpeg video renderer |
| 2026-04-14 | `30e2839` | Plan 9C: Lecture pages + classroom features |
| 2026-04-14 | `86e00d7` | Plan 9D-F: Manim notes, monthly compilation, admin lectures |
| 2026-04-14 | `970d43f` | Plan 9G: E2E + unit tests for lecture pipeline |
| 2026-04-14 | `c23a06e` | Full alignment audit + fix (86% -> 93%) |
| 2026-04-14 | *uncommitted* | Gap closure: Kilo/OpenCode providers, Living Pages, vision models, daily plan fix, Source Intelligence (93% -> 95%) |
| 2026-04-15 | `d71e01c` | Fix entitlement.ts + admin bypass |
| 2026-04-16 | `d2b74d8` | 6-provider AI chain with multi-key rotation + NVIDIA/9Router |
| 2026-04-17 | *uncommitted* | Hermes Jobs/Logs backend + Manim 13-scene server + Remotion 15-composition server + docker-compose integration (95% -> 97%) |

### Session Reports
- `IMPLEMENTATION_REPORT.md` — Sessions 1-6 (QA fixes, streaming, edge functions, ML analytics, zero-trust, multi-region)
- `docs/ALIGNMENT_AUDIT_REPORT.md` — Full spec vs codebase audit
- `docs/ALIGNMENT_FIX_IMPLEMENTATION_REPORT.md` — Fix implementation with phase-by-phase scores
- `docs/PLAN_9_IMPLEMENTATION_REPORT.md` — Lecture generation pipeline

---

## 15. Remaining Work

### Ready for Production
- [x] Build passes (exit code 0)
- [x] TypeScript: 0 errors (tsc --noEmit)
- [x] 105 test suites
- [x] 6-provider AI chain with 30+ model fallback
- [x] 15 Edge Functions ready for deployment
- [x] 51 DB migrations
- [x] Alignment audit issues: all C1-C5 critical + H2-H8 high verified fixed
- [x] Kilo API keys configured (4-key rotation + 5-model fallback)
- [x] OpenCode API key configured (17-model fallback)
- [x] CSP headers updated for Kilo AI + NVIDIA API domains
- [x] X-Powered-By header disabled
- [x] Living Pages (QuickGenerate) wired into 4 dashboard pages
- [x] All 3 "missing" pages exist: Topic Intelligence, Animations, Ethics Case Study
- [x] Admin Console exists at /admin/console

### Manual Steps Required
1. **Run `npm install --legacy-peer-deps`** — to install any new dependencies
2. **Supabase migration 052 already applied** — `hermes_jobs` + `hermes_logs` tables live in production
3. **Deploy Edge Functions** — `npx supabase login` then deployment script
4. **Add `HERMES_GATEWAY_TOKEN` to Coolify** — value: `631ff4b2-4c82-4e72-82b5-dde4a78eea80`
5. **Build + deploy Manim/Remotion Docker containers on VPS** — see deployment guide below
6. **Trigger Coolify redeploy** — after pushing to GitHub

### Docker Services Deployment (VPS: 89.117.60.144)

**Manim Animation Server** (`docker/manim/`)
- FastAPI server with 13 pre-built UPSC scene classes
- Scenes: Timeline, Flowchart, Map, Comparison, PieChart, BarGraph, Tree, Venn, Cycle, MathSolver, ArticleHighlight, SchemeInfoCard, MindMap
- Endpoints: `POST /render` (raw code), `POST /api/render` (template), `GET /status/:id`, `GET /download/:id`
- Port: 8085 (mapped from internal 8080)

**Remotion Video Server** (`docker/remotion/`)
- Express + node-canvas + FFmpeg template engine with 15 compositions
- Compositions: TitleCard, SubtitleCard, BulletPoints, FactBox, ExamTip, MnemonicCard, QuizBreak, TransitionCard, SummarySlide, CreditsSlide, SplitScreen, MapOverlay, CompareView, QuoteCard, CurrentAffairsBanner
- Endpoints: `POST /render`, `POST /api/render`, `GET /status/:id`, `GET /download/:id`
- Port: 3002 (mapped from internal 3001)

### Hermes Gateway Token
- Token: `631ff4b2-4c82-4e72-82b5-dde4a78eea80`
- Used for: Internal service-to-service auth between Next.js app, BullMQ worker, Manim server, and Remotion server
- Env var: `HERMES_GATEWAY_TOKEN`
- Added to: `.env.coolify`, `.env.docker`, `.env.vps`, `.env.production.deploy`, `docker-compose.production.yml`

### BullMQ Worker (16 real job handlers)
All handlers wrap `runHermesJob()` for automatic DB tracking in `hermes_jobs` + `hermes_logs`:
- **Email (4):** SEND_WELCOME_EMAIL, SEND_RENEWAL_REMINDER, SEND_PAYMENT_CONFIRMATION, SEND_PASSWORD_RESET
- **Subscription (3):** SUBSCRIPTION_EXPIRY_CHECK, SUBSCRIPTION_RENEWAL, TRIAL_EXPIRY_CHECK
- **AI Processing (4):** GENERATE_NOTES, GENERATE_MIND_MAP, EVALUATE_ANSWER, GENERATE_QUIZ
- **Video (2):** GENERATE_VIDEO_SHORT, PROCESS_VIDEO
- **Data (3):** GENERATE_INVOICE, EXPORT_USER_DATA, CLEANUP_TEMP_DATA
- **Analytics (2):** TRACK_EVENT, UPDATE_METRICS

### Future Enhancements (not blocking)
1. Unified `/admin/console` Source Intelligence panel could be richer
2. OpenCode provider needs local server running at `localhost:3100`
3. Vision models need Ollama configured with gemma4/qwen3-vl models
4. Multi-region Terraform (disabled by default) — activate for second region
5. E2E Playwright tests for full browser-based flows
6. Lighthouse performance audit + bundle size optimization
7. Content seeding: trigger CA ingestion + syllabus coverage crons

---

*Updated: 2026-04-17 15:00 IST*
*Build: tsc 0 errors + next build exit code 0*
*Session: Hermes Jobs/Logs DB + 13 Manim scenes + 15 Remotion compositions + docker-compose integration + admin dashboard rewired*

