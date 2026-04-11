# UPSC PrepX-AI — DEFINITIVE MASTER PROMPT v8.0 (FINAL)
## SINGLE-FILE BUILD SPECIFICATION FOR AI IDE BUILDERS
## Cursor / Windsurf / Claude Code / Cline

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⛔ ABSOLUTE COMPLIANCE CONTRACT FOR THE AI IDE BUILDER                     ║
║                                                                              ║
║  This document is your ONLY source of truth. It describes a COMPLETE         ║
║  study platform with TWO content modes:                                      ║
║                                                                              ║
║  📖 READ MODE — Text notes, PDF reader, rich text editor, mind maps,        ║
║     MCQ practice, mains writing, search, bookmarks. This is the             ║
║     CORE of the app. Every student uses this daily.                          ║
║                                                                              ║
║  🎬 WATCH MODE — 3-hour animated video lectures powered by Manim            ║
║     (animations/diagrams) + Remotion (video composition). This is the        ║
║     ADVANCED layer. Visual learners use this alongside reading.              ║
║                                                                              ║
║  BOTH modes are MANDATORY. Neither is optional. Build READ mode first,       ║
║  then WATCH mode on top. They share the same content_library, syllabus,      ║
║  knowledge base, and user progress tracking.                                 ║
║                                                                              ║
║  YOU MUST NOT:                                                               ║
║  • Deviate from ANY specification below                                      ║
║  • Skip, stub, or mock ANY feature or sub-feature                            ║
║  • Use placeholder/dummy data for ANY component                              ║
║  • Leave ANY TODO/FIXME/"implement later" comments                           ║
║  • Use localStorage for auth (Supabase Auth cookies ONLY)                    ║
║  • Expose API keys to browser (ALL external calls via Edge Functions)        ║
║  • Replace Manim/Remotion with any other video/animation tool                ║
║  • Replace the custom video player with YouTube embed                        ║
║  • Skip the PDF reader, text editor, or any reading feature                  ║
║  • Build WATCH mode without building READ mode first                         ║
║                                                                              ║
║  If you encounter ambiguity, choose the MOST COMPLETE implementation.        ║
║  If you cannot build a feature, DO NOT render its UI — skip entirely.        ║
║  EVERY feature must be END-TO-END wired:                                     ║
║     UI → API Route → Edge Function → AI / Manim / Remotion / DB → UI       ║
╚══════════════════════════════════════════════════════════════════════════════╝


================================================================================
SECTION 1: PROJECT IDENTITY & POSITIONING
================================================================================

App Name:        UPSC PrepX-AI
Domain:          app.aimasteryedu.in
Tagline:         "AI Teacher That Never Sleeps"

Description:     India's first 100% AI-powered UPSC CSE preparation platform.
                 Students can READ comprehensive notes, WATCH animated lectures,
                 PRACTICE with adaptive quizzes, WRITE mains answers with instant
                 AI evaluation, and get 24/7 AI mentoring — all at ₹499/month.

TWO CONTENT MODES:
  📖 READ MODE (Core — used daily by every student):
     • Comprehensive text notes at 3 depth levels
     • Built-in PDF reader for books and compilations
     • Rich text editor for answer writing and personal notes
     • Daily current affairs articles with analysis
     • Interactive mind maps for every topic
     • MCQ practice with explanations
     • Smart search across all content
     • Bookmarks with spaced repetition

  🎬 WATCH MODE (Advanced — animated visual learning):
     • 3-hour Manim+Remotion animated video lectures per chapter
     • Manim-rendered animated diagrams within notes
     • Interactive video player with mic, Q&A, in-video quizzes
     • Visual explanations for complex concepts on demand

  Both modes share: syllabus, knowledge base, progress tracking, gamification

Target:          UPSC CSE aspirants — working professionals, freshers,
                 Hindi-medium students, repeaters. Mobile-first. 360px min.

Competitors beaten:
  Unacademy   → ₹40K-80K/yr, 7-day evaluation, fixed schedules
  Vision IAS  → ₹85K-1.5L/yr, 20-25 day evaluation, no AI, no search
  PadhAI      → text-only chatbot, no video, no grounded notes


================================================================================
SECTION 2: MANDATORY BUILD RULES (NON-NEGOTIABLE)
================================================================================

RULE 1: ZERO PLACEHOLDERS
  Every feature end-to-end functional on deploy.
  No "TODO", "coming soon", placeholder, mock data, dummy responses.

RULE 2: ZERO HALLUCINATION
  All UPSC content grounded via RAG from knowledge_chunks.
  NEVER fabricate UPSC facts from LLM training data.

RULE 3: SIMPLIFIED LANGUAGE (10TH-CLASS LEVEL)
  ALL AI-generated user-facing content MUST use this prompt prefix:

  const SIMPLIFIED_LANGUAGE_PROMPT = `
  CRITICAL LANGUAGE RULES — FOLLOW STRICTLY:
  1. Write for a 10th-class student. One reading = full understanding.
  2. No jargon without explanation. Technical terms get parenthetical
     definitions. Ex: "Writ of Habeas Corpus (a court order that asks
     the government to bring a detained person before the judge)"
  3. Real-life Indian examples for every concept.
     Ex: "Article 21 = Right to Life. Government cannot demolish your
     house to build a highway without giving you proper notice."
  4. Analogies. Ex: "Constitution = rulebook of cricket."
  5. Max 15 words per sentence. Break long ideas into multiple sentences.
  6. Mnemonics. Ex: "6 Fundamental Rights = REFCEP"
  7. Exam tips. Ex: "EXAM TIP: Asked in UPSC 2023 Prelims."
  8. If Hindi: use simple Hindi (Hinglish acceptable for clarity).
  `;

  Prepend to EVERY AI call generating user-facing content. NO EXCEPTIONS.

RULE 4: PRODUCTION CODE — TypeScript strict, error boundaries, retry logic.
RULE 5: MOBILE-FIRST — Every page usable at 360px viewport.
RULE 6: HINDI + ENGLISH — Bilingual toggle on all content pages.
RULE 7: BUILD ORDER — READ mode features FIRST, then WATCH mode on top.
RULE 8: MANIM for all animations/diagrams. REMOTION for all video composition.
RULE 9: HERMES AGENT orchestrates all background content generation 24/7.
RULE 10: READING IS KING — Even if Manim/Remotion services are down,
         all text-based reading features must work independently.


================================================================================
SECTION 3: TECHNOLOGY STACK
================================================================================

3.1 FRONTEND
────────────
Framework:       Next.js 14+ (App Router, Server Components)
Language:        TypeScript (strict mode)
Styling:         Tailwind CSS v3.4+ with custom theme
UI Library:      shadcn/ui
State:           Zustand (global) + React Query v5 (server state)
Forms:           React Hook Form + Zod validation
Charts:          Recharts (progress analytics)
Animations:      Framer Motion (UI transitions)
Rich Text:       TipTap editor (answer writing, note editing, video notes)
Markdown:        react-markdown + rehype plugins (notes rendering)
Mind Maps:       react-flow (interactive, zoomable, click-to-navigate)
PDF Viewer:      react-pdf (Mozilla PDF.js — annotations, highlight, search)
Video Player:    Custom HTML5 + hls.js (NOT YouTube embed)
Voice Input:     Web Audio API + SpeechRecognition API (in-video mic)
PWA:             next-pwa (offline access to saved notes)

3.2 BACKEND: SUPABASE (Self-Hosted)
────────────────────────────────────
Instance:        https://supabase.aimasteryedu.in
Database:        PostgreSQL 16 + pgvector + pg_cron
Auth:            Supabase Auth (Google OAuth, Email, Phone OTP)
Storage:         Supabase Storage (pdfs, audio, video, thumbnails, manim-cache)
Edge Functions:  Deno runtime — ALL external calls routed through these
Realtime:        Supabase Realtime (progress sync, notifications)
RLS:             ENABLED on every user table — no exceptions

3.3 AI PROVIDER: 9ROUTER + FALLBACK CHAIN
──────────────────────────────────────────
All AI calls: Frontend → Edge Function → callAI() → Provider

  Level 1 (Primary): 9Router
    URL: https://rq9whnn.9router.com/v1
    Key: ENV: NINEROUTER_API_KEY
    Model: kr/claude-sonnet-4.5
    Timeout: 30s | Rate: 60 RPM

  Level 2 (Fallback): Groq
    URL: https://api.groq.com/openai/v1
    Key: ENV: GROQ_API_KEY
    Model: llama-3.3-70b-versatile
    Timeout: 15s | Rate: 30 RPM

  Level 3 (Emergency): Ollama Cloud
    URL: ENV: OLLAMA_CLOUD_URL
    Key: ENV: OLLAMA_CLOUD_KEY
    Model: llama3.1:8b
    Timeout: 45s | Rate: 10 RPM

  // lib/ai-provider.ts — callAI() auto-falls through chain
  // EVERY Edge Function MUST use callAI(). Never call providers directly.

3.4 VPS SERVICES (89.117.60.144) — ALL DOCKERIZED
──────────────────────────────────────────────────

  Port 5555:  Manim + Remotion Renderer (individual scenes/compositions)
              Docker: Python 3.11 + Manim CE + LaTeX + Node.js + Remotion
              POST http://89.117.60.144:5555/render

  Port 8103:  Video Orchestrator (multi-scene assembly via Remotion)
              Docker: Node.js + Remotion + FFmpeg
              POST http://89.117.60.144:8103/render

  Port 8105:  TTS Service (Edge-TTS or Piper for lecture narration)
              POST http://89.117.60.144:8105/synthesize

  Port 8102:  Web Search Proxy (DuckDuckGo with domain filtering)
              POST http://89.117.60.144:8102/search
              POST http://89.117.60.144:8102/search/upsc

  Port 6379:  Redis (caching, rate limiting, BullMQ job queues)

  Port 8200:  Hermes Agent webhook endpoint
              POST http://89.117.60.144:8200/hermes/trigger

  MANIM SCENE CLASSES (13 types — build all in the Manim Docker container):
  ├── TimelineScene       — Historical timelines with animated progression
  ├── FlowchartScene      — Constitutional/governance process flows
  ├── MapScene            — India/world geography with highlights
  ├── ComparisonTable     — Animated side-by-side comparisons
  ├── PieChartScene       — Budget/economic data breakdowns
  ├── BarGraphScene       — Statistical comparisons
  ├── TreeDiagram         — Hierarchy (judiciary, govt structure)
  ├── VennDiagram         — Overlapping concept visualization
  ├── CycleScene          — Cyclical processes (water, economic cycles)
  ├── MathSolver          — Step-by-step CSAT math solutions
  ├── ArticleHighlight    — Constitutional articles with key phrases
  ├── SchemeInfoCard      — Government scheme visual cards
  └── MindMapAnimation    — Animated mind map expansion

  REMOTION COMPOSITIONS (15 types — build all in the Remotion container):
  ├── TitleCard           — Lecture/chapter title with animation
  ├── SubtitleCard        — Section headers within chapters
  ├── BulletPoints        — Animated bullet points with voiceover sync
  ├── FactBox             — Highlighted fact cards (dates, articles)
  ├── ExamTip             — "EXAM TIP" styled callout cards
  ├── MnemonicCard        — Memory trick display with animation
  ├── QuizBreak           — In-video quiz prompt card
  ├── TransitionCard      — Smooth section transitions
  ├── SummarySlide        — Chapter summary recap
  ├── CreditsSlide        — End card with "PrepX-AI" branding
  ├── SplitScreen         — Left: visual, Right: text/points
  ├── MapOverlay          — Map with animated markers
  ├── CompareView         — Two-column comparison layout
  ├── QuoteCard           — Important quotes
  └── CurrentAffairsBanner— Breaking news overlay

3.5 HERMES AGENT (24/7 Autonomous Orchestrator)
────────────────────────────────────────────────
  Install: curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
  Configure: hermes model → 9Router endpoint + key + model
  Service: hermes gateway install (systemd, survives reboot)
  Telegram: hermes gateway setup → connect admin Telegram for alerts
  Operates: Manim renderer, Remotion orchestrator, TTS, search proxy
  Communication: Direct DB (service_role) + Webhooks + hermes_status table

3.6 PAYMENT: Razorpay (UPI, Cards, Net Banking — India-first)

3.7 WHITELISTED UPSC SOURCES:
  visionias.in, drishtiias.com, thehindu.com, indianexpress.com,
  pib.gov.in, prs.org.in, forumias.com, iasgyan.in, insightsonindia.com,
  *.gov.in, ncert.nic.in, epathshala.nic.in, nios.ac.in, ignou.ac.in,
  egyankosh.ac.in, indiabudget.gov.in, niti.gov.in, upscpdf.com


================================================================================
SECTION 4: DATABASE SCHEMA (27 TABLES)
================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ═══════════════════════════════════════
-- USERS & AUTH
-- ═══════════════════════════════════════
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE, phone TEXT, full_name TEXT NOT NULL, avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en','hi','hinglish')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  target_year INT DEFAULT 2027, attempt_number INT DEFAULT 1,
  optional_subject TEXT,
  preparation_stage TEXT DEFAULT 'beginner' CHECK (preparation_stage IN ('beginner','intermediate','advanced','revision')),
  study_hours_per_day INT DEFAULT 6, is_working_professional BOOLEAN DEFAULT FALSE,
  strengths TEXT[] DEFAULT '{}', weaknesses TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE, daily_goal_questions INT DEFAULT 50,
  notification_preferences JSONB DEFAULT '{"daily_ca":true,"quiz_reminder":true,"weekly_report":true}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, price_inr INT NOT NULL,
  original_price_inr INT, duration_days INT NOT NULL,
  features JSONB DEFAULT '[]', is_popular BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO plans (name,slug,price_inr,original_price_inr,duration_days,is_popular) VALUES
  ('Monthly','monthly',499,999,30,FALSE),('Quarterly','quarterly',999,2997,90,TRUE),
  ('Half-Yearly','half-yearly',1799,5994,180,FALSE),('Annual','annual',2999,11988,365,FALSE);
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID REFERENCES plans(id),
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial','active','expired','cancelled','grace_period')),
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '3 days',
  subscription_started_at TIMESTAMPTZ, subscription_expires_at TIMESTAMPTZ,
  payment_provider TEXT DEFAULT 'razorpay',
  razorpay_subscription_id TEXT, razorpay_customer_id TEXT,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SYLLABUS & KNOWLEDGE BASE
CREATE TABLE public.syllabus_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, parent_id UUID REFERENCES syllabus_nodes(id),
  title TEXT NOT NULL, title_hi TEXT, description TEXT,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Prelims','Mains','Both')),
  subject TEXT NOT NULL, paper TEXT, level INT DEFAULT 1,
  weightage INT DEFAULT 50, keywords TEXT[] DEFAULT '{}', pyq_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL, content_vector vector(1536),
  source_type TEXT NOT NULL CHECK (source_type IN ('book','ncert','notes','pyq','current_affairs')),
  source_title TEXT NOT NULL, source_page INT, subject TEXT NOT NULL,
  syllabus_node_ids UUID[] DEFAULT '{}', key_terms TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('basic','medium','advanced')),
  language TEXT DEFAULT 'en', active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_kc_vector ON knowledge_chunks USING ivfflat (content_vector vector_cosine_ops) WITH (lists=100);
CREATE INDEX idx_kc_fts ON knowledge_chunks USING gin(to_tsvector('english',content));

-- CONTENT LIBRARY (master registry — links READ + WATCH content per chapter)
CREATE TABLE public.content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_node_id UUID REFERENCES syllabus_nodes(id) NOT NULL,
  paper TEXT NOT NULL, subject TEXT NOT NULL,
  unit_title TEXT NOT NULL, chapter_title TEXT NOT NULL, chapter_number INT NOT NULL,
  -- READ MODE status
  notes_status TEXT DEFAULT 'pending' CHECK (notes_status IN ('pending','generating','ready','failed')),
  mindmap_status TEXT DEFAULT 'pending',
  mcqs_status TEXT DEFAULT 'pending',
  -- WATCH MODE status
  lecture_status TEXT DEFAULT 'pending' CHECK (lecture_status IN ('pending','generating','ready','failed')),
  -- Content references
  note_id UUID, lecture_id UUID, mindmap_id UUID,
  linked_ca_ids UUID[] DEFAULT '{}', linked_scheme_ids UUID[] DEFAULT '{}',
  mcq_ids UUID[] DEFAULT '{}', pyq_ids UUID[] DEFAULT '{}',
  mains_question_ids UUID[] DEFAULT '{}',
  exam_trend JSONB DEFAULT '{}',
  generation_priority INT DEFAULT 50, language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(syllabus_node_id,language)
);

-- ═══════════════════════════════════════
-- 📖 READ MODE TABLES
-- ═══════════════════════════════════════
CREATE TABLE public.ai_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_node_id UUID REFERENCES syllabus_nodes(id),
  topic_slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, title_hi TEXT,
  -- Three depth levels for reading
  summary TEXT,          -- 150 words — quick revision flashcard
  detailed TEXT,         -- 500 words — standard reading notes
  comprehensive TEXT,    -- 1500+ words — deep dive reading material
  -- Supporting content
  source_chunk_ids UUID[] DEFAULT '{}',
  key_points JSONB DEFAULT '[]',     -- bullet summary for quick scan
  diagrams JSONB DEFAULT '[]',       -- [{type, spec, rendered_url}] static + Manim
  related_topics UUID[] DEFAULT '{}',
  pyq_references JSONB DEFAULT '[]',
  -- Metadata
  version INT DEFAULT 1, last_updated TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT DEFAULT 'hermes', published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_node_id UUID REFERENCES syllabus_nodes(id),
  title TEXT NOT NULL,
  -- Interactive mind map (react-flow) for READ mode
  nodes JSONB NOT NULL,     -- [{id,label,label_hi,position,type,style}]
  edges JSONB NOT NULL,     -- [{source,target,label}]
  mermaid_code TEXT,        -- fallback static render
  -- Animated mind map (Manim) for WATCH mode
  manim_animation_url TEXT,
  language TEXT DEFAULT 'en', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.government_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, name_hi TEXT, ministry TEXT, launched_year INT,
  objective TEXT, key_features JSONB DEFAULT '[]',
  beneficiaries TEXT, budget_allocation TEXT,
  syllabus_node_ids UUID[] DEFAULT '{}',
  manim_infocard_url TEXT, source_url TEXT, active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_current_affairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL, title_hi TEXT,
  -- READ MODE content (always available)
  summary TEXT NOT NULL, summary_hi TEXT, detailed_analysis TEXT,
  -- WATCH MODE content (generated when capacity allows)
  manim_visual_url TEXT,    -- Manim-rendered visual for this CA
  -- Metadata
  source_url TEXT NOT NULL, source_domain TEXT NOT NULL,
  syllabus_node_ids UUID[] DEFAULT '{}', tags TEXT[] DEFAULT '{}',
  mcqs JSONB DEFAULT '[]', mains_relevance TEXT, prelims_relevance TEXT,
  relevance_score DECIMAL(3,2) DEFAULT 0.5, approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(publish_date,source_url)
);

CREATE TABLE public.monthly_compilations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INT NOT NULL, year INT NOT NULL, title TEXT,
  pdf_url TEXT,              -- READ MODE: downloadable PDF
  remotion_video_url TEXT,   -- WATCH MODE: Remotion summary video
  total_articles INT DEFAULT 0, subjects_covered TEXT[] DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(month,year)
);

CREATE TABLE public.user_custom_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, topic_query TEXT NOT NULL,
  content TEXT NOT NULL, content_hi TEXT,
  key_points JSONB DEFAULT '[]', mind_map JSONB,
  linked_ca JSONB DEFAULT '[]', linked_schemes JSONB DEFAULT '[]',
  diagrams JSONB DEFAULT '[]', mcqs JSONB DEFAULT '[]',
  user_annotations TEXT, is_modified BOOLEAN DEFAULT FALSE,
  source_chunks_used UUID[] DEFAULT '{}', provider_used TEXT,
  language TEXT DEFAULT 'en', bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUESTIONS & PRACTICE (READ MODE — text-based)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq','mains_150','mains_250','essay','pyq_mcq','pyq_mains')),
  question_text TEXT NOT NULL, question_text_hi TEXT,
  options JSONB, correct_answer TEXT, model_answer TEXT,
  explanation TEXT, explanation_hi TEXT,
  manim_explanation_url TEXT,   -- WATCH MODE: animated explanation
  syllabus_node_id UUID REFERENCES syllabus_nodes(id),
  subject TEXT, difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  pyq_year INT, source TEXT,
  times_attempted INT DEFAULT 0, times_correct INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('daily_mcq','topic_mcq','pyq_practice','full_mock','custom')),
  syllabus_node_id UUID REFERENCES syllabus_nodes(id),
  questions JSONB NOT NULL, score DECIMAL(5,2),
  total_questions INT, correct_answers INT, time_taken_sec INT,
  ai_evaluation JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.mains_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  answer_text TEXT NOT NULL, word_count INT,
  ai_score DECIMAL(4,2), content_score DECIMAL(3,2),
  structure_score DECIMAL(3,2), language_score DECIMAL(3,2),
  diagram_present BOOLEAN DEFAULT FALSE,
  ai_feedback TEXT, ai_feedback_hi TEXT, model_answer TEXT,
  improvement_tips JSONB DEFAULT '[]', provider_used TEXT,
  evaluation_time_ms INT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- 🎬 WATCH MODE TABLES
-- ═══════════════════════════════════════
CREATE TABLE public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_node_id UUID REFERENCES syllabus_nodes(id),
  title TEXT NOT NULL, title_hi TEXT, subject TEXT NOT NULL, paper TEXT NOT NULL,
  language TEXT DEFAULT 'en', total_duration_minutes INT DEFAULT 180,
  total_chapters INT DEFAULT 18,
  outline JSONB NOT NULL,
  chapters JSONB DEFAULT '[]',
  full_video_url TEXT, notes_pdf_url TEXT, transcript TEXT,
  timestamps JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','outline','scripting','manim_rendering',
                      'remotion_composing','audio','assembling','ready','failed')),
  progress_percent INT DEFAULT 0, current_chapter INT DEFAULT 0,
  simplified_level TEXT DEFAULT '10th_class',
  generated_by TEXT DEFAULT 'hermes',
  generation_time_minutes INT, error_message TEXT, retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
);
CREATE TABLE public.lecture_watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES lectures(id),
  current_time_sec INT DEFAULT 0, chapters_completed INT[] DEFAULT '{}',
  total_watch_time_sec INT DEFAULT 0, completed BOOLEAN DEFAULT FALSE,
  bookmarks JSONB DEFAULT '[]', personal_notes TEXT,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id,lecture_id)
);
CREATE TABLE public.manim_scene_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_hash TEXT UNIQUE NOT NULL, scene_class TEXT NOT NULL,
  scene_args JSONB NOT NULL, video_url TEXT NOT NULL,
  thumbnail_url TEXT, duration_sec INT, file_size_mb DECIMAL(10,2),
  access_count INT DEFAULT 0, last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.video_render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('manim_scene','remotion_comp','full_assembly')),
  parent_lecture_id UUID REFERENCES lectures(id),
  chapter_number INT, render_config JSONB NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','rendering','completed','failed')),
  output_url TEXT, render_time_sec INT, error_message TEXT, retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════
-- SHARED TABLES (Both modes)
-- ═══════════════════════════════════════
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  syllabus_node_id UUID REFERENCES syllabus_nodes(id),
  completion_percent INT DEFAULT 0, confidence_score DECIMAL(3,2) DEFAULT 0,
  notes_read INT DEFAULT 0, lectures_watched INT DEFAULT 0,
  questions_attempted INT DEFAULT 0, questions_correct INT DEFAULT 0,
  time_spent_minutes INT DEFAULT 0, last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  next_revision_date DATE, revision_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id,syllabus_node_id)
);
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE DEFAULT CURRENT_DATE,
  session_type TEXT DEFAULT 'reading' CHECK (session_type IN ('reading','watching','practicing','writing')),
  start_time TIMESTAMPTZ, end_time TIMESTAMPTZ,
  duration_minutes INT, activities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('note','question','current_affair','topic','lecture_timestamp','pdf_page')),
  item_id UUID NOT NULL, item_title TEXT, tags TEXT[] DEFAULT '{}',
  personal_note TEXT, timestamp_sec INT, pdf_page INT,
  revision_due DATE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT DEFAULT 'doubt' CHECK (session_type IN ('doubt','mentor','interview_mock','essay_help','video_doubt')),
  title TEXT, syllabus_node_id UUID REFERENCES syllabus_nodes(id),
  messages JSONB DEFAULT '[]', message_count INT DEFAULT 0,
  provider_used TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  xp_total INT DEFAULT 0, level INT DEFAULT 1,
  current_streak INT DEFAULT 0, longest_streak INT DEFAULT 0,
  badges JSONB DEFAULT '[]', weekly_rank INT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN & SYSTEM
CREATE TABLE public.ai_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, base_url TEXT NOT NULL,
  env_key_name TEXT NOT NULL, model TEXT NOT NULL,
  priority INT DEFAULT 50, enabled BOOLEAN DEFAULT TRUE,
  rate_limit_rpm INT DEFAULT 60, timeout_ms INT DEFAULT 30000,
  total_tokens_used BIGINT DEFAULT 0, total_requests INT DEFAULT 0,
  error_count INT DEFAULT 0, last_error TEXT, last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO ai_provider_config (name,slug,base_url,env_key_name,model,priority) VALUES
  ('9Router','9router','https://rq9whnn.9router.com/v1','NINEROUTER_API_KEY','kr/claude-sonnet-4.5',10),
  ('Groq','groq','https://api.groq.com/openai/v1','GROQ_API_KEY','llama-3.3-70b-versatile',20),
  ('Ollama Cloud','ollama-cloud','','OLLAMA_CLOUD_URL','llama3.1:8b',30);

CREATE TABLE public.hermes_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, status TEXT NOT NULL, details JSONB DEFAULT '{}',
  items_pending INT DEFAULT 0, items_completed INT DEFAULT 0,
  last_run_at TIMESTAMPTZ, next_run_at TIMESTAMPTZ, error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  category TEXT CHECK (category IN ('bug','content_error','subscription','feature_request','other')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','auto_resolved','escalated','resolved')),
  resolution TEXT, resolved_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), action TEXT NOT NULL,
  resource_type TEXT, resource_id UUID, details JSONB DEFAULT '{}',
  ip_address INET, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, user_id UUID REFERENCES users(id),
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  result JSONB, error TEXT, attempts INT DEFAULT 0, max_attempts INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
);

-- ROW LEVEL SECURITY — every user table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mains_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_watch_progress ENABLE ROW LEVEL SECURITY;
-- User policies: FOR ALL USING (auth.uid()=user_id)
-- Public read policies on: syllabus_nodes, ai_notes(published), questions,
--   daily_current_affairs(approved), lectures(ready), mind_maps, government_schemes(active), content_library


================================================================================
SECTION 5: ALL FEATURES — 📖 READ MODE (Build FIRST)
================================================================================

These are the CORE features. They work WITHOUT Manim/Remotion.
If video services are down, the entire READ mode still functions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
F1: SMART ONBOARDING (/onboarding)
  5-step wizard: Target year → Attempt → Working professional? →
  Optional subject → 10-question diagnostic quiz.
  AI analyzes quiz → sets strengths/weaknesses → creates study plan →
  seeds user_progress for all nodes → grants 3-day trial.
  Edge Function: onboarding_pipe (uses callAI + SIMPLIFIED_LANGUAGE_PROMPT)

F2: DAILY CURRENT AFFAIRS (/dashboard/daily-digest)
  Generated daily at 4:30 AM by Hermes. TEXT articles (always available).
  Date picker, cards with: headline, summary (EN+HI), tags, syllabus map,
  expandable detailed analysis, inline MCQ quiz, bookmark, language toggle.
  PDF downloadable. Weekly + monthly compilations also available as text.
  Free: last 3 days summary | Pro: full archive, analysis, MCQs

F3: AI NOTES LIBRARY (/dashboard/notes, /dashboard/notes/[slug])
  Left: Collapsible syllabus tree navigator.
  Right: Notes viewer with depth toggle:
    → Quick Revision (150 words — flashcard style)
    → Standard Notes (500 words — complete reading material)
    → Deep Dive (1500+ words — comprehensive study material)
  Each note includes: Key points bullets, interactive mind map (react-flow),
  related current affairs section, related government schemes section,
  MCQs (5 inline), mains questions (2-3 with model answers),
  PYQ references, "Download as PDF", language toggle, last updated date.
  Written in SIMPLIFIED_LANGUAGE_PROMPT. Grounded via RAG.
  Free: summary level, 5 topics | Pro: all levels, unlimited, PDF

F4: USER CONTENT STUDIO (/dashboard/my-notes, /dashboard/my-notes/[id])
  User types: "Make me notes on Panchayati Raj System"
  AI generates: complete notes (3 levels) + mind map + linked CA +
  linked schemes + MCQs + exam tips. All via RAG + SIMPLIFIED_LANGUAGE_PROMPT.
  TipTap rich text editor for user modifications:
    Bold, italic, underline, highlight, headings, lists, tables, images,
    "AI Enhance" (select text → AI improves), "Add Mind Map",
    "Link Current Affairs", auto-save every 30s, export PDF.
  User can request changes: "Make shorter", "Add examples",
    "Explain Article 243 more", "Add Hindi translation".
  Free: 2 custom notes | Pro: unlimited

F5: AI DOUBT SOLVER (/dashboard/ask-doubt)
  Input: Text field + image upload (OCR) + mic button (voice → transcription).
  Pipeline: Input → extract keywords → vector search knowledge_chunks (top 8)
    → optional web search → AI with RAG + SIMPLIFIED_LANGUAGE_PROMPT.
  Response: Streaming answer with source citations [Book, p.XX],
  related topic links, 2 follow-up MCQs, "Was this helpful?" feedback.
  Saved to chat_sessions. Updates user_progress.
  Free: 3/day | Pro: unlimited

F6: INSTANT MAINS EVALUATOR (/dashboard/answer-practice) — KILLER FEATURE
  Daily question auto-selected from weak topics.
  TipTap editor with word counter (150/250 word limit).
  "Submit for AI Evaluation" → results in <60 SECONDS:
    Overall Score X/10 (visual gauge)
    Content X/5 | Structure X/3 | Language X/2
    Detailed feedback paragraph (simplified language)
    AI-generated model answer
    3 specific improvement tips
  Saved to mains_answers. Awards XP. Updates confidence_score.
  Free: 1/day | Pro: unlimited

F7: ADAPTIVE MCQ PRACTICE (/dashboard/practice)
  Modes: Daily Challenge (10Q) | Topic-wise (20Q) | PYQ by year |
         Full Mock (100Q, 2hr timer) | Weak Area Focus (AI selects).
  Adaptive: accuracy > 80% → harder, < 40% → easier + explanations.
  Spaced repetition: schedule revision dates in user_progress.
  Post-quiz: score by topic, time analysis, comparison with average.
  Text explanations always available. (Manim animations = bonus in WATCH mode.)

F8: AI STUDY PLANNER (/dashboard/planner)
  Weekly calendar with time blocks. Each block: Topic + Activity type
  (read notes / practice MCQ / write answer / revision / current affairs).
  AI regenerates weekly based on: progress, weak topics, days to exam,
  available hours, missed sessions. Daily reminder notifications.

F9: PROGRESS DASHBOARD (/dashboard/progress)
  Visual syllabus tree: Green >80%, Yellow 40-80%, Red <40%, Gray not started.
  Subject-wise completion bars. Weekly study time chart (Recharts).
  Streak calendar (GitHub heatmap). "Exam Readiness Score" (AI-calculated).
  Weak topics with "Fix Now" → links to practice/notes.

F10: AI MENTOR CHAT (/dashboard/mentor)
  RAG-powered chat. Knows user's profile, progress, recent quiz scores.
  Modes: Guidance | Topic explanation | Strategy | Interview prep.
  Uses SIMPLIFIED_LANGUAGE_PROMPT. Saves to chat_sessions.

F11: SMART SEARCH (Cmd+K global search bar)
  Hybrid: vector search (pgvector) + full-text (tsvector).
  Searches: notes, questions, CA, syllabus, lectures, schemes.
  Results: ranked + AI-generated answer snippet at top.
  Filter: Subject, Paper, Source Type, Date Range.

F12: PDF READER (/dashboard/library, /dashboard/library/[id])
  react-pdf (PDF.js). Page navigation, zoom, text search.
  Highlight text → right-click → "Ask AI about this" → doubt solver.
  Annotation tools (highlight, underline, personal notes).
  Side-by-side: PDF left + notes editor right.
  Dark mode for PDFs (inverted colors for night study).
  Download option. Used for: NCERT books, CA compilations, PYQ papers.

F13: GAMIFICATION (/dashboard/leaderboard)
  XP: Read notes=10, MCQ quiz=25, Write answer=50, Perfect score=100 bonus,
      Streak=15×days, Complete topic=200, Watch lecture=150.
  Levels: Aspirant → Scholar → Expert → Topper → Mentor.
  Badges: First Step, Consistency King, Polity Pro, Answer Writer, etc.
  Weekly leaderboard. Subject-wise rankings. Mock test rankings.

F14: BOOKMARKS & REVISION (/dashboard/bookmarks)
  Save any item: note, question, CA article, lecture timestamp, PDF page.
  Tags, personal notes, revision due dates (spaced repetition).
  "Due Today" filter shows items needing revision.


================================================================================
SECTION 6: ALL FEATURES — 🎬 WATCH MODE (Build AFTER Read Mode)
================================================================================

These ADVANCED features use Manim + Remotion. They ENHANCE the reading
experience but do NOT replace it. If Manim/Remotion are down, READ mode
continues working. WATCH mode features show "Video generating..." status.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
F15: PRE-BUILT ANIMATED LECTURES (/dashboard/lectures, /dashboard/lectures/[id])

  LIBRARY VIEW: Browse Paper→Subject→Unit→Chapter.
  330 chapters, each with a 3-hour animated lecture.
  Status badges: 📖 Notes ✅ | 🎬 Lecture ✅ | ⏳ Generating...
  Filter by: Paper, Subject, Status.

  LECTURE PLAYER: Custom HTML5 + hls.js (NOT YouTube embed)
  Core: Play/pause, seek, volume, speed (0.5x-2x), fullscreen, PiP,
        quality selection (360p-1080p), auto-quality, resume from last position.
  Chapter Navigation: Sidebar with 18 chapters, timestamps, progress indicators.
  Classroom Features:
    a) VOICE QUESTION (mic button): Record → auto-pause video → transcribe
       via SpeechRecognition → send to doubt solver → show answer in overlay
       → save to chat_sessions (session_type='video_doubt')
    b) TEXT QUESTION: Input field below video → RAG-enhanced answer
    c) IN-VIDEO QUIZZES: At each chapter end, 3 MCQs → must answer to proceed
    d) SMART BOOKMARKS: Save timestamp + auto-summary of current topic
    e) NOTE-TAKING PANEL: Split-screen TipTap editor, auto-saves,
       insert clickable timestamps into personal notes
    f) WATCH ANALYTICS: Track time, chapters, replays → update user_progress

  LECTURE GENERATION PIPELINE (by Hermes Agent):
    Phase 1: OUTLINE — 1 AI call → 18 chapters with titles, subtopics,
             Manim visual suggestions, Remotion composition suggestions
    Phase 2: SCRIPTS — 18 AI calls (rate-limited 2/min = 9 min) →
             ~1300 words per chapter, SIMPLIFIED_LANGUAGE_PROMPT,
             [MANIM: SceneClass {args}] markers, [REMOTION: Comp {props}] markers
    Phase 3: MANIM RENDERING — 2-4 scenes/chapter → POST to port 5555
             Check manim_scene_cache first (reuse by scene_hash)
    Phase 4: REMOTION COMPOSITIONS — 3-5 compositions/chapter → POST to port 5555
             Title cards, bullet points, fact boxes, transitions
    Phase 5: TTS AUDIO — 18 calls to port 8105 → voiceover per chapter
    Phase 6: CHAPTER ASSEMBLY — POST to port 8103 per chapter →
             Remotion orchestrator assembles Manim clips + Remotion clips + audio
    Phase 7: FINAL MERGE — POST to port 8103 → merge 18 chapters →
             generate timestamps JSON → upload to Supabase Storage →
             generate PDF notes from scripts → update lectures.status='ready'
    Time: ~2-3 hours per lecture | ~8-10/day | Full library ≈ 33-40 days

F16: MANIM-ENHANCED NOTES (adds to F3)
  Within note pages (/dashboard/notes/[slug]), notes that have Manim content show:
    → Animated diagrams (play inline — Manim-rendered videos)
    → Static diagrams for quick loading (thumbnail from Manim output)
    → "Watch Animation" button → plays the Manim clip inline
  Manim diagrams generated alongside notes by Hermes.
  If Manim is unavailable, mermaid.js fallback diagrams still render.

F17: ANIMATED MCQ EXPLANATIONS (adds to F7)
  For complex MCQ questions, "Watch Explanation" button available.
  Plays a 30-60 second Manim-rendered animated explanation video.
  Generated by Hermes in background for PYQ and popular questions.
  If not available, text explanation (always present) is shown.

F18: MONTHLY RECAP VIDEO (adds to F2)
  Monthly current affairs also gets a Remotion-compiled summary video.
  Available on /dashboard/monthly-compilation alongside the PDF.


================================================================================
SECTION 7: ADMIN PANEL (/admin)
================================================================================

F19: ADMIN PANEL (role='admin' required)
  1.  Dashboard: Users, revenue, AI usage, content generation progress
  2.  Users: Search, profiles, subscriptions, activity logs
  3.  Knowledge Base: Upload PDFs → chunk → embed. Syllabus tree management.
  4.  Content — READ: Notes management, trigger regeneration
  5.  Content — WATCH: Lecture generation queue, Manim/Remotion job status,
      re-trigger failed renders, video asset management
  6.  Current Affairs: View, approve/reject, manual addition
  7.  AI Providers: Enable/disable, priority order, usage stats, test connectivity
  8.  Hermes Agent: Status dashboard, job queue, activity logs,
      content generation tracker (330 chapters — READ % + WATCH %)
  9.  Subscriptions: Revenue dashboard, coupon management, plan pricing
  10. Feedback: User issues (auto-resolved by Hermes + escalated)
  11. System: Jobs, error logs, cache management, feature flags


================================================================================
SECTION 8: HERMES AGENT — 24/7 AUTONOMOUS JOBS
================================================================================

Hermes runs as systemd service on VPS (89.117.60.144).
Uses 9Router for AI. Operates Manim, Remotion, TTS, search proxy.

JOB 1: READ CONTENT GENERATION (Continuous, priority CRITICAL)
  Pick pending content_library → generate notes (3 levels) → generate
  mind map (react-flow JSON) → generate MCQs → generate mains questions.
  All via callAI + SIMPLIFIED_LANGUAGE_PROMPT + RAG from knowledge_chunks.
  READ content generates FAST (~5 min per chapter).
  Priority: GS2=100, GS1=90, GS3=80, GS4=70, CSAT=60, Essay=50

JOB 2: WATCH CONTENT GENERATION (Continuous, after READ is done for a topic)
  For topics where READ content is ready → generate animated lecture:
  Outline → Scripts → Manim scenes → Remotion compositions → TTS → Assembly.
  Also generate Manim diagrams for the notes.
  WATCH content is slower (~2-3 hours per chapter).
  This runs 24/7 — full library takes 33-40 days.

JOB 3: DAILY CURRENT AFFAIRS (4:30 AM IST)
  Fetch whitelisted sources → AI summarize (EN+HI) → map to syllabus →
  MCQs → link to content_library → store text articles (READ mode).
  For top 3-5 articles: also render Manim visual (WATCH mode).
  Notify users.

JOB 4: GOVERNMENT SCHEMES UPDATE (Sunday 2 AM IST)
  Fetch from pib.gov.in → update table → render Manim info cards → re-link.

JOB 5: REFERENCE FETCH (Weekly)
  Download free PDFs (ncert.nic.in, government sites) → ingest → chunk → embed.

JOB 6: PYQ UPDATE (Annual + manual trigger)
  Parse PYQ papers → categorize → text explanations (READ) →
  Manim animations for key questions (WATCH, when capacity allows).

JOB 7: USER ISSUES (Continuous)
  Monitor user_feedback → auto-categorize → auto-resolve → escalate if needed.

JOB 8: HEALTH CHECK (Every 5 min)
  Supabase, Redis, 9Router, Manim renderer, Remotion, TTS.
  Auto-restart if possible → alert admin Telegram.

JOB 9: WEEKLY COMPILATION (Monday 6 AM)
  PDF compilation of week's CA (READ) + Remotion recap video (WATCH).

JOB 10: MONTHLY MAGAZINE (1st of month)
  Full monthly CA PDF (READ) + Remotion summary video (WATCH).

HERMES BUILD PRIORITY ORDER:
  Step 1: Generate ALL READ content first (notes, mind maps, MCQs)
          → ~330 chapters × 5 min ≈ ~28 hours (1-2 days)
  Step 2: Then generate WATCH content (lectures with Manim+Remotion)
          → ~330 chapters × 2.5 hours ≈ 33-40 days
  This ensures students can START READING immediately on day 1.
  Lectures become available progressively over the next month.


================================================================================
SECTION 9: DESIGN SYSTEM
================================================================================

THEME: "Saffron Scholar" — Light mode default (students study 6-10 hrs/day)
  Primary: #FF6B00 (Saffron) | Secondary: #1A365D (Navy) | Accent: #38A169 (Green)
  Background: #FFFFFF | Surface: #F8FAFC | Text: #1A202C / #718096
  Font: Inter + Noto Sans Devanagari | 4px grid | shadcn/ui | Skeleton loaders


================================================================================
SECTION 10: ALL ROUTES
================================================================================

PUBLIC: /, /login, /signup, /pricing

📖 READ MODE ROUTES:
/onboarding, /dashboard, /dashboard/daily-digest,
/dashboard/notes, /dashboard/notes/[slug],
/dashboard/my-notes, /dashboard/my-notes/[id],
/dashboard/ask-doubt, /dashboard/answer-practice,
/dashboard/practice, /dashboard/practice/mock,
/dashboard/planner, /dashboard/progress, /dashboard/mentor,
/dashboard/search, /dashboard/mindmaps, /dashboard/mindmaps/[id],
/dashboard/schemes, /dashboard/library, /dashboard/library/[id],
/dashboard/leaderboard, /dashboard/bookmarks, /dashboard/settings,
/dashboard/subscription, /dashboard/feedback,
/dashboard/weekly-compilation, /dashboard/monthly-compilation

🎬 WATCH MODE ROUTES:
/dashboard/lectures, /dashboard/lectures/[id]

ADMIN: /admin, /admin/users, /admin/knowledge-base,
/admin/content, /admin/lectures, /admin/ai-providers,
/admin/hermes, /admin/hermes/jobs, /admin/hermes/logs,
/admin/subscriptions, /admin/feedback, /admin/system


================================================================================
SECTION 11: SUBSCRIPTION & PAYMENT
================================================================================

Trial: 3 days, full access, no payment needed, once per account.
Plans: Monthly ₹499 | Quarterly ₹999 | Half-Yearly ₹1799 | Annual ₹2999
Payment: Razorpay (UPI, Cards, Net Banking, Wallets)
Webhook: POST /api/webhooks/razorpay
checkAccess() on every premium request (trial → active → grace → expired)
Free features: daily digest preview (3 days), search, syllabus view,
  3 MCQs/day, 1 mains eval/day, 2 custom notes, 5 notes (summary only)


================================================================================
SECTION 12: ENVIRONMENT VARIABLES
================================================================================

NEXT_PUBLIC_SUPABASE_URL=https://supabase.aimasteryedu.in
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
NINEROUTER_API_KEY=<key>
GROQ_API_KEY=<key>
OLLAMA_CLOUD_URL=<url>
OLLAMA_CLOUD_KEY=<key>
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<key>
RAZORPAY_WEBHOOK_SECRET=<key>
REDIS_URL=redis://89.117.60.144:6379
MANIM_RENDERER_URL=http://89.117.60.144:5555/render
VIDEO_ORCHESTRATOR_URL=http://89.117.60.144:8103/render
TTS_SERVICE_URL=http://89.117.60.144:8105/synthesize
DDG_SEARCH_URL=http://89.117.60.144:8102/search
DDG_UPSC_SEARCH_URL=http://89.117.60.144:8102/search/upsc
HERMES_WEBHOOK_URL=http://89.117.60.144:8200/hermes/trigger
HERMES_WEBHOOK_SECRET=<key>
HERMES_TELEGRAM_BOT_TOKEN=<token>
HERMES_ADMIN_CHAT_ID=<chat-id>
NEXT_PUBLIC_APP_URL=https://app.aimasteryedu.in
NEXT_PUBLIC_APP_NAME="UPSC PrepX-AI"


================================================================================
SECTION 13: EDGE FUNCTION ARCHITECTURE
================================================================================

Pattern: USER → API Route → Edge Function (Pipe) → Filters → Actions → Response

Shared modules (supabase/functions/_shared/):
  ai-provider.ts     → callAI() with 3-provider fallback chain
  entitlement.ts     → checkAccess()
  simplified-lang.ts → SIMPLIFIED_LANGUAGE_PROMPT constant
  vector-search.ts   → search knowledge_chunks (hybrid vector+fts)
  rate-limiter.ts    → Redis per-user rate limiting
  manim-client.ts    → call Manim renderer (port 5555) with scene cache check
  remotion-client.ts → call Remotion renderer (port 5555) + orchestrator (8103)
  tts-client.ts      → call TTS service (port 8105)

Edge Functions (one per feature):
  READ: onboarding_pipe, daily_digest_pipe, notes_generator_pipe,
        custom_notes_pipe, doubt_solver_pipe, mains_evaluator_pipe,
        quiz_engine_pipe, planner_pipe, mentor_chat_pipe, search_pipe,
        feedback_pipe
  WATCH: lecture_trigger_pipe, render_webhook_pipe
  ADMIN: admin_users_pipe, admin_content_pipe, admin_hermes_pipe

Every pipe: 1.Auth 2.Entitlement 3.Zod validation 4.Logic 5.Response 6.Error handling


================================================================================
SECTION 14: DEPLOYMENT CHECKLIST
================================================================================

DATABASE:
□ Run all SQL migrations (27 tables from Section 4)
□ Enable RLS + create all policies
□ Create storage buckets (pdfs, audio, video, thumbnails, manim-cache, exports)
□ Seed syllabus_nodes (complete UPSC syllabus — 330 chapters)
□ Seed content_library (330 entries, all status='pending')
□ Seed plans (4 tiers) + ai_provider_config (3 providers)

EDGE FUNCTIONS:
□ Deploy all shared modules + all pipe functions
□ Set all environment variables in Supabase Secrets
□ Test callAI() chain (9Router → Groq → Ollama)
□ Test checkAccess() (trial, active, expired flows)

VPS DOCKER SERVICES:
□ Deploy Manim renderer container (port 5555)
□ Deploy Remotion orchestrator container (port 8103)
□ Deploy TTS service container (port 8105)
□ Deploy DuckDuckGo proxy container (port 8102)
□ Start Redis (port 6379)
□ Test: Manim TimelineScene render → verify video output
□ Test: Remotion TitleCard render → verify video output
□ Test: TTS → verify audio output

HERMES AGENT:
□ Install Hermes on VPS
□ Configure with 9Router credentials + model
□ Configure Telegram bot for admin alerts
□ Set up webhook endpoint (port 8200)
□ Create systemd service (survives reboot)
□ Configure all 10 cron jobs (Section 8)
□ Test: Hermes → Supabase direct connection
□ Test: Hermes → Manim render trigger
□ Test: Hermes → Remotion render trigger

CONTENT SEEDING:
□ Upload NCERT PDFs (free from ncert.nic.in) → ingest → chunk → embed
□ Upload any other legally obtained reference PDFs
□ Start Hermes → READ content generation begins (notes first!)
□ Verify first 10 notes generated correctly (check simplified language)
□ Monitor Telegram for Hermes progress alerts

FRONTEND:
□ Build all READ mode pages first (F1-F14)
□ Then build WATCH mode pages (F15-F18)
□ Then build Admin panel (F19)
□ Test PDF reader with NCERT PDF (annotations, highlight, search)
□ Test TipTap editor in answer practice + custom notes
□ Test mind map rendering with react-flow
□ Test video player with mic input, quiz, bookmarks, chapter nav
□ Test on 360px mobile viewport
□ Test Hindi toggle on all content pages
□ Test Razorpay checkout (test mode)
□ Verify SSL on app.aimasteryedu.in

POST-DEPLOY MONITORING:
□ Monitor Hermes Telegram: READ content progress (should finish in 1-2 days)
□ Monitor Hermes Telegram: WATCH content progress (ongoing 33-40 days)
□ Verify daily CA digest arrives at 5 AM IST
□ Load test with 100 concurrent users on READ mode
□ Verify first complete lecture renders correctly


================================================================================
SECTION 15: ABSOLUTE RULES — DO NOT VIOLATE (EVER)
================================================================================

1.  NO localStorage for auth → Supabase Auth cookies only
2.  NO hardcoded API keys → .env only, never in client code
3.  ALL external calls via Edge Functions → never from browser
4.  EVERY premium feature checks entitlement via checkAccess()
5.  EVERY user-facing AI output uses SIMPLIFIED_LANGUAGE_PROMPT
6.  MOBILE-FIRST → tested at 360px viewport
7.  HINDI + ENGLISH toggle on every content page
8.  ERROR BOUNDARIES on every page
9.  RETRY LOGIC with exponential backoff on every external call
10. SKELETON LOADERS, not spinners
11. NO DUMMY DATA anywhere — zero placeholders, zero stubs
12. LIGHT THEME default (dark mode as optional toggle)
13. ALWAYS use callAI() with 3-provider fallback chain
14. ZERO HALLUCINATION → RAG-ground all UPSC answers via knowledge_chunks
15. RAZORPAY for payments (NOT RevenueCat — that's App Store only)
16. MANIM for ALL animations/diagrams — no substitutions
17. REMOTION for ALL video composition — no plain FFmpeg slideshows
18. HERMES AGENT orchestrates ALL background content generation
19. VIDEO PLAYER = custom HTML5+hls.js (NOT YouTube embed)
20. PDF READER (react-pdf), TEXT EDITOR (TipTap), VIDEO PLAYER all built-in
21. MANIM SCENE CACHE → check manim_scene_cache before re-rendering same scene
22. PRODUCTION LOGGING → log every AI call, Manim render, Remotion job
23. BUILD ORDER: READ mode first → WATCH mode second → Admin panel third
24. READ MODE INDEPENDENCE: If Manim/Remotion are down, all reading features
    still work perfectly. WATCH mode degrades gracefully with "Generating..." text.
25. CONTENT LIBRARY shows both: 📖 Read status + 🎬 Watch status per chapter

================================================================================
END OF DEFINITIVE MASTER PROMPT v8.0
================================================================================

BUILD COMMAND FOR AI IDE BUILDER:

  "Build the complete UPSC PrepX-AI application following this v8.0
   specification EXACTLY. Follow this BUILD ORDER strictly:

   PHASE 1 — FOUNDATION:
     1. Database migrations (27 tables, RLS, indexes, seeds)
     2. Shared Edge Function modules (ai-provider, entitlement,
        simplified-lang, vector-search, rate-limiter)

   PHASE 2 — 📖 READ MODE (Features F1-F14):
     3. Onboarding wizard (F1)
     4. Notes library + generator with mind maps + schemes + CA linking (F3)
     5. Daily current affairs digest (F2)
     6. User content studio with TipTap editor (F4)
     7. AI doubt solver with text + image + voice (F5)
     8. Instant mains evaluator — KILLER FEATURE (F6)
     9. Adaptive MCQ practice engine (F7)
     10. AI study planner (F8)
     11. Progress dashboard (F9)
     12. AI mentor chat (F10)
     13. Smart search (F11)
     14. PDF reader with annotations (F12)
     15. Gamification + leaderboard (F13)
     16. Bookmarks + revision system (F14)

   PHASE 3 — 🎬 WATCH MODE (Features F15-F18):
     17. Docker: Manim renderer (13 scene classes)
     18. Docker: Remotion orchestrator (15 compositions)
     19. Docker: TTS service
     20. Lecture library + custom video player with classroom features (F15)
     21. Manim-enhanced notes — animated diagrams inline (F16)
     22. Animated MCQ explanations (F17)
     23. Monthly recap video (F18)

   PHASE 4 — ADMIN + HERMES:
     24. Admin panel — all 11 sections (F19)
     25. Hermes Agent setup + all 10 cron jobs
     26. Hermes → READ content generation pipeline
     27. Hermes → WATCH content generation pipeline

   Test each feature end-to-end before proceeding to the next.
   Zero placeholders. Zero deviations. Zero substitutions."
```
