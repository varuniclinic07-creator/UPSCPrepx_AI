# 📊 GAP ANALYSIS REPORT
## UPSC PrepX-AI vs. Master Prompt v8.0

**Date**: 2026-04-06  
**Analysis Type**: Comprehensive Implementation Audit  
**Compliance Target**: 100% Master Prompt v8.0 Alignment  

---

## 🎯 EXECUTIVE SUMMARY

| Metric | Current State | Master Prompt v8.0 | Gap |
|--------|---------------|-------------------|-----|
| **Database Tables** | 21 migrations (fragmented) | 27 tables (Section 4) | ⚠️ 6 tables missing |
| **READ Mode Features** | 3/14 complete (F18, F10, F6 partial) | 14 features (F1-F14) | ⚠️ 11 features pending |
| **WATCH Mode Features** | 0/4 complete | 4 features (F15-F18) | ⚠️ 4 features pending |
| **Admin Features** | 0/11 complete | 11 sections (F19) | ⚠️ 11 sections pending |
| **Hermes Agent** | Not configured | 10 cron jobs (Section 8) | ⚠️ Full setup needed |
| **AI Provider** | ✅ 9Router→Groq→Ollama | ✅ Section 3.3 | ✅ Aligned |
| **Edge Functions** | Next.js API routes | Deno Edge Functions | ⚠️ Migration needed |

**Overall Compliance**: 25% (Foundation phase)

---

## 📋 SECTION-BY-SECTION GAP ANALYSIS

### SECTION 1: PROJECT IDENTITY ✅

| Requirement | Status | Notes |
|-------------|--------|-------|
| App Name: UPSC PrepX-AI | ✅ | Correct |
| Domain: app.aimasteryedu.in | ✅ | Configured |
| Tagline: "AI Teacher That Never Sleeps" | ✅ | Used in marketing |
| READ Mode + WATCH Mode duality | 🟡 | Understood but not enforced in UI |
| Competitors analysis | ✅ | Documented in PRD |

**Action**: Add mode toggle (📖 READ / 🎬 WATCH) to dashboard navigation

---

### SECTION 2: MANDATORY BUILD RULES

| Rule | Current | Required | Gap |
|------|---------|----------|-----|
| Rule 1: ZERO Placeholders | 🟡 | Some mock data in older components | ⚠️ Remove all |
| Rule 2: ZERO Hallucination | 🟡 | RAG implemented but not enforced | ⚠️ Add validation |
| Rule 3: SIMPLIFIED_LANGUAGE_PROMPT | ❌ | Not consistently applied | ⚠️ Add to all AI calls |
| Rule 4: Production Code | ✅ | TypeScript strict, error boundaries | ✅ Good |
| Rule 5: Mobile-First (360px) | 🟡 | Responsive but not tested at 360px | ⚠️ Test all pages |
| Rule 6: Hindi + English | 🟡 | Database has hi fields, UI toggle missing | ⚠️ Add toggle |
| Rule 7: BUILD ORDER | ❌ | Mixed implementation | ⚠️ Re-prioritize |
| Rule 8: Manim + Remotion | 🟡 | Services exist, scenes not built | ⚠️ Build 13+15 types |
| Rule 9: Hermes Agent | ❌ | Not configured | ⚠️ Full setup |
| Rule 10: Reading Independence | ❌ | Not enforced | ⚠️ Architectural change |

**Critical**: Rule 3 (SIMPLIFIED_LANGUAGE_PROMPT) must be added to EVERY AI call

---

### SECTION 3: TECHNOLOGY STACK

#### 3.1 FRONTEND ✅

| Technology | Current | Required | Status |
|------------|---------|----------|--------|
| Next.js 14+ App Router | ✅ | ✅ | ✅ |
| TypeScript strict | ✅ | ✅ | ✅ |
| Tailwind CSS v3.4+ | ✅ | ✅ | ✅ |
| shadcn/ui | ✅ | ✅ | ✅ |
| Zustand + React Query | ✅ | ✅ | ✅ |
| React Hook Form + Zod | ✅ | ✅ | ✅ |
| Recharts | ✅ | ✅ | ✅ |
| Framer Motion | ✅ | ✅ | ✅ |
| **TipTap editor** | ❌ | ✅ (F4, F6) | ⚠️ Install |
| **react-markdown** | ❌ | ✅ (notes rendering) | ⚠️ Install |
| **react-flow** | ❌ | ✅ (F3 mind maps) | ⚠️ Install |
| **react-pdf** | ❌ | ✅ (F12 PDF reader) | ⚠️ Install |
| **Custom HTML5+hls.js** | ❌ | ✅ (F15 video player) | ⚠️ Build |
| Web Audio API + SpeechRecognition | ❌ | ✅ (F15 voice question) | ⚠️ Build |
| next-pwa | ❌ | ✅ (offline access) | ⚠️ Install |

**Action Items**:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-highlight
npm install react-markdown rehype-react rehype-sanitize
npm install reactflow
npm install react-pdf
npm install hls.js
npm install next-pwa
```

#### 3.2 BACKEND: SUPABASE 🟡

| Component | Current | Required | Gap |
|-----------|---------|----------|-----|
| Instance URL | ✅ supabase.aimasteryedu.in | ✅ | ✅ |
| PostgreSQL 16 | ✅ | ✅ | ✅ |
| **pgvector** | ✅ (extension exists) | ✅ | ✅ |
| **pg_cron** | ❌ | ✅ (scheduled jobs) | ⚠️ Enable |
| Supabase Auth | ✅ | ✅ | ✅ |
| Supabase Storage | ✅ | ✅ | ✅ |
| **Edge Functions (Deno)** | ❌ | ✅ (all external calls) | ⚠️ Migrate |
| Supabase Realtime | ❌ | ✅ (progress sync) | ⚠️ Enable |
| RLS Policies | 🟡 | ✅ (every user table) | ⚠️ Audit |

**Critical**: All external API calls must move to Edge Functions (not Next.js API routes)

#### 3.3 AI PROVIDER ✅

| Provider | Current | Required | Status |
|----------|---------|----------|--------|
| 9Router (Primary) | ✅ | ✅ kr/claude-sonnet-4.5 | ✅ Model needs update |
| Groq (Fallback) | ✅ | ✅ llama-3.3-70b-versatile | ✅ |
| Ollama Cloud (Emergency) | ✅ | ✅ llama3.1:8b | ✅ |
| callAI() function | ✅ | ✅ auto-fallback | ✅ |

**Action**: Update 9Router model from 'upsc' to 'kr/claude-sonnet-4.5'

#### 3.4 VPS SERVICES (89.117.60.144) 🟡

| Service | Port | Current | Required | Gap |
|---------|------|---------|----------|-----|
| Manim + Remotion Renderer | 5555 | ✅ Exists | ✅ 13 scene classes | ⚠️ Build all scenes |
| Video Orchestrator | 8103 | ✅ Exists | ✅ 15 compositions | ⚠️ Build all comps |
| TTS Service | 8105 | ❌ | ✅ Edge-TTS/Piper | ⚠️ Deploy |
| Web Search Proxy | 8102 | ✅ (8030) | ✅ DuckDuckGo + domain filtering | ✅ Port mismatch |
| Redis | 6379 | ✅ | ✅ BullMQ queues | ✅ |
| Hermes webhook | 8200 | ❌ | ✅ | ⚠️ Deploy |

**Manim Scene Classes (13 required)**:
- [ ] TimelineScene
- [ ] FlowchartScene
- [ ] MapScene
- [ ] ComparisonTable
- [ ] PieChartScene
- [ ] BarGraphScene
- [ ] TreeDiagram
- [ ] VennDiagram
- [ ] CycleScene
- [ ] MathSolver
- [ ] ArticleHighlight
- [ ] SchemeInfoCard
- [ ] MindMapAnimation

**Remotion Compositions (15 required)**:
- [ ] TitleCard
- [ ] SubtitleCard
- [ ] BulletPoints
- [ ] FactBox
- [ ] ExamTip
- [ ] MnemonicCard
- [ ] QuizBreak
- [ ] TransitionCard
- [ ] SummarySlide
- [ ] CreditsSlide
- [ ] SplitScreen
- [ ] MapOverlay
- [ ] CompareView
- [ ] QuoteCard
- [ ] CurrentAffairsBanner

#### 3.5 HERMES AGENT ❌

| Requirement | Current | Required | Action |
|-------------|---------|----------|--------|
| Installation | ❌ | ✅ systemd service | Install |
| 9Router config | ❌ | ✅ model + key | Configure |
| Telegram alerts | ❌ | ✅ admin bot | Setup |
| 10 cron jobs | ❌ | ✅ Section 8 | Configure |
| Direct DB access | ❌ | ✅ service_role | Enable |

**Jobs to Configure**:
1. READ content generation (CRITICAL priority)
2. WATCH content generation (after READ done)
3. Daily Current Affairs (4:30 AM IST)
4. Government Schemes Update (Sunday 2 AM)
5. Reference Fetch (Weekly)
6. PYQ Update (Annual)
7. User Issues (Continuous)
8. Health Check (Every 5 min)
9. Weekly Compilation (Monday 6 AM)
10. Monthly Magazine (1st of month)

#### 3.6 PAYMENT ✅

| Component | Current | Required | Status |
|-----------|---------|----------|--------|
| Razorpay | ✅ | ✅ | ✅ |
| UPI, Cards, Net Banking | ✅ | ✅ | ✅ |
| Webhook endpoint | 🟡 | ✅ /api/webhooks/razorpay | ⚠️ Verify |

#### 3.7 WHITELISTED UPSC SOURCES ✅

| Source | Current | Required | Status |
|--------|---------|----------|--------|
| visionias.in | ✅ | ✅ | ✅ |
| drishtiias.com | ✅ | ✅ | ✅ |
| thehindu.com | ✅ | ✅ | ✅ |
| pib.gov.in | ✅ | ✅ | ✅ |
| ncert.nic.in | ✅ | ✅ | ✅ |
| ... (15 total) | ✅ | ✅ | ✅ |

---

### SECTION 4: DATABASE SCHEMA 🟡

**Current**: 21 migrations (001-021, fragmented)  
**Required**: 27 tables (Section 4 exact schema)

#### Missing Tables:

| Table | Purpose | Priority |
|-------|---------|----------|
| `user_profiles` | Target year, attempt, optional subject, strengths/weaknesses | 🔥 CRITICAL (F1) |
| `plans` | Subscription tiers (4 plans) | ✅ Exists (migration 004) |
| `syllabus_nodes` | Complete UPSC syllabus tree (330 chapters) | 🔥 CRITICAL |
| `knowledge_chunks` | RAG content with pgvector embeddings | 🔥 CRITICAL |
| `content_library` | Master registry linking READ+WATCH per chapter | 🔥 CRITICAL |
| `ai_notes` | 3 depth levels (summary/detailed/comprehensive) | ✅ Partial (migration 019) |
| `mind_maps` | react-flow nodes/edges + Manim animation | ⚠️ Needs enhancement |
| `government_schemes` | Scheme database with Manim infocards | ⚠️ Exists (migration 007) |
| `daily_current_affairs` | Daily CA with Manim visual + text | ⚠️ Partial |
| `monthly_compilations` | PDF + Remotion video | ❌ Missing |
| `user_custom_notes` | User-generated notes with TipTap | ✅ Partial (migration 019) |
| `questions` | MCQs, mains, essays with Manim explanations | ⚠️ Partial |
| `quiz_attempts` | Quiz tracking with spaced repetition | ✅ Exists |
| `mains_answers` | Answer writing with AI evaluation | ⚠️ Needs enhancement |
| `lectures` | 3-hour animated lectures (18 chapters each) | ⚠️ Partial (migration 006) |
| `lecture_watch_progress` | User video progress tracking | ✅ Exists |
| `manim_scene_cache` | Scene reuse cache (avoid re-rendering) | ❌ Missing |
| `video_render_jobs` | Render job queue | ❌ Missing |
| `user_progress` | Syllabus completion tracking | ✅ Exists |
| `study_sessions` | Study activity logging | ✅ Exists |
| `bookmarks` | Bookmarks with revision due dates | ✅ Exists |
| `chat_sessions` | AI mentor chat history | ✅ Exists |
| `user_gamification` | XP, levels, badges, streaks | ❌ Missing |
| `ai_provider_config` | 3 providers with priority | ✅ Exists (migration 019) |
| `hermes_status` | Hermes job tracking | ❌ Missing |
| `user_feedback` | User issues + auto-resolution | ✅ Exists |
| `audit_logs` | Admin audit trail | ✅ Exists (migration 014) |
| `jobs` | Background job queue | ❌ Missing |

**Action**: Create consolidated migration 022 with all 27 tables

---

### SECTION 5: READ MODE FEATURES (F1-F14) 🟡

| Feature | Status | Files | Gap |
|---------|--------|-------|-----|
| **F1: Smart Onboarding** | ❌ | None | ⚠️ Build 5-step wizard + 10Q quiz |
| **F2: Daily Current Affairs** | ❌ | None | ⚠️ Build 4:30 AM generation |
| **F3: AI Notes Library** | ✅ | 9 files | ✅ 3 depth levels implemented |
| **F4: User Content Studio** | ❌ | None | ⚠️ TipTap editor needed |
| **F5: AI Doubt Solver** | ❌ | None | ⚠️ Text+image+voice needed |
| **F6: Instant Mains Evaluator** | ❌ | None | ⚠️ <60s evaluation, 4 scores |
| **F7: Adaptive MCQ Practice** | ❌ | None | ⚠️ 5 modes, adaptive difficulty |
| **F8: AI Study Planner** | ❌ | None | ⚠️ Weekly calendar with AI |
| **F9: Progress Dashboard** | ❌ | None | ⚠️ Syllabus tree, readiness score |
| **F10: AI Mentor Chat** | ❌ | None | ⚠️ RAG-powered with user context |
| **F11: Smart Search** | ✅ | 4 files | ✅ RAG search complete |
| **F12: PDF Reader** | ❌ | None | ⚠️ react-pdf + annotations |
| **F13: Gamification** | ❌ | None | ⚠️ XP, levels, badges, leaderboard |
| **F14: Bookmarks & Revision** | ✅ | Database only | ⚠️ UI + spaced repetition |

**Priority**: Build F1→F14 in exact order (per Master Prompt)

---

### SECTION 6: WATCH MODE FEATURES (F15-F18) ❌

| Feature | Status | Gap |
|---------|--------|-----|
| **F15: Pre-built Animated Lectures** | ❌ | Custom video player, 18 chapters, classroom features |
| **F16: Manim-Enhanced Notes** | ❌ | Inline animated diagrams |
| **F17: Animated MCQ Explanations** | ❌ | 30-60s Manim videos |
| **F18: Monthly Recap Video** | ❌ | Remotion compilation |

**Build after READ Mode complete**

---

### SECTION 7: ADMIN PANEL (F19) ❌

| Section | Status | Gap |
|---------|--------|-----|
| 1. Dashboard | ❌ | Users, revenue, AI usage, content progress |
| 2. Users | ❌ | Search, profiles, subscriptions, logs |
| 3. Knowledge Base | ❌ | PDF upload, chunk, embed, syllabus management |
| 4. Content — READ | ❌ | Notes management, regeneration |
| 5. Content — WATCH | ❌ | Lecture queue, Manim/Remotion status |
| 6. Current Affairs | ❌ | Approve/reject, manual addition |
| 7. AI Providers | ❌ | Enable/disable, priority, usage stats |
| 8. Hermes Agent | ❌ | Status, job queue, activity logs |
| 9. Subscriptions | 🟡 | Revenue dashboard (partial), coupons |
| 10. Feedback | ✅ | User issues (exists) |
| 11. System | ❌ | Jobs, errors, cache, feature flags |

**Build after READ + WATCH modes complete**

---

### SECTION 8: HERMES AGENT ❌

| Job | Status | Action |
|-----|--------|--------|
| Job 1: READ Content Generation | ❌ | Install Hermes, configure cron |
| Job 2: WATCH Content Generation | ❌ | After READ complete |
| Job 3: Daily Current Affairs | ❌ | 4:30 AM IST cron |
| Job 4: Government Schemes Update | ❌ | Sunday 2 AM |
| Job 5: Reference Fetch | ❌ | Weekly |
| Job 6: PYQ Update | ❌ | Annual |
| Job 7: User Issues | ❌ | Continuous |
| Job 8: Health Check | ❌ | Every 5 min |
| Job 9: Weekly Compilation | ❌ | Monday 6 AM |
| Job 10: Monthly Magazine | ❌ | 1st of month |

---

### SECTION 9: DESIGN SYSTEM ✅

| Requirement | Current | Status |
|-------------|---------|--------|
| Theme: "Saffron Scholar" | ✅ | Primary #FF6B00, Secondary #1A365D |
| Light mode default | ✅ | ✅ |
| Font: Inter + Noto Sans Devanagari | ✅ | ✅ |
| shadcn/ui | ✅ | ✅ |
| Skeleton loaders | 🟡 | Some pages, not all |

**Action**: Add skeleton loaders to all loading states

---

### SECTION 10: ROUTES 🟡

#### Missing READ Mode Routes:
- [ ] `/onboarding` (F1)
- [ ] `/dashboard/daily-digest` (F2)
- [ ] `/dashboard/my-notes/[id]` (F4)
- [ ] `/dashboard/ask-doubt` (F5)
- [ ] `/dashboard/answer-practice` (F6)
- [ ] `/dashboard/practice` (F7)
- [ ] `/dashboard/practice/mock` (F7)
- [ ] `/dashboard/planner` (F8)
- [ ] `/dashboard/progress` (F9)
- [ ] `/dashboard/mentor` (F10)
- [ ] `/dashboard/mindmaps/[id]` (F3)
- [ ] `/dashboard/schemes` (F3)
- [ ] `/dashboard/library/[id]` (F12)
- [ ] `/dashboard/leaderboard` (F13)

#### Missing WATCH Mode Routes:
- [ ] `/dashboard/lectures` (F15)
- [ ] `/dashboard/lectures/[id]` (F15)

#### Missing Admin Routes:
- [ ] `/admin` (F19)
- [ ] `/admin/users`
- [ ] `/admin/knowledge-base`
- [ ] `/admin/content`
- [ ] `/admin/lectures`
- [ ] `/admin/ai-providers`
- [ ] `/admin/hermes`
- [ ] `/admin/hermes/jobs`
- [ ] `/admin/hermes/logs`
- [ ] `/admin/subscriptions`
- [ ] `/admin/feedback`
- [ ] `/admin/system`

---

### SECTION 11: SUBSCRIPTION & PAYMENT ✅

| Component | Current | Required | Status |
|-----------|---------|----------|--------|
| Trial: 3 days | ✅ | ✅ | ✅ |
| Plans: 4 tiers | ✅ | ✅ | ✅ |
| Razorpay integration | ✅ | ✅ | ✅ |
| Webhook endpoint | 🟡 | ✅ /api/webhooks/razorpay | ⚠️ Verify |
| checkAccess() | ✅ | ✅ | ✅ |
| Free features | 🟡 | ✅ Specific limits | ⚠️ Document |

---

### SECTION 12: ENVIRONMENT VARIABLES ✅

| Variable | Current | Required | Status |
|----------|---------|----------|--------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | ✅ | ✅ |
| NINEROUTER_API_KEY | ✅ | ✅ | ✅ |
| GROQ_API_KEY | ✅ | ✅ | ✅ |
| RAZORPAY_KEY_ID | ✅ | ✅ | ✅ |
| MANIM_RENDERER_URL | 🟡 | ✅ port 5555 | ⚠️ Verify |
| VIDEO_ORCHESTRATOR_URL | 🟡 | ✅ port 8103 | ⚠️ Verify |
| HERMES_WEBHOOK_URL | ❌ | ✅ port 8200 | ⚠️ Add |
| ... (20 total) | ✅ | ✅ | ✅ |

---

### SECTION 13: EDGE FUNCTION ARCHITECTURE ❌

**Current**: Next.js API routes  
**Required**: Deno Edge Functions with shared modules

**Shared Modules to Create**:
- [ ] `ai-provider.ts` → callAI() with 3-provider fallback
- [ ] `entitlement.ts` → checkAccess()
- [ ] `simplified-lang.ts` → SIMPLIFIED_LANGUAGE_PROMPT
- [ ] `vector-search.ts` → hybrid vector+fts search
- [ ] `rate-limiter.ts` → Redis per-user rate limiting
- [ ] `manim-client.ts` → call Manim renderer with cache check
- [ ] `remotion-client.ts` → call Remotion + orchestrator
- [ ] `tts-client.ts` → call TTS service

**Edge Functions to Create**:
- [ ] onboarding_pipe
- [ ] daily_digest_pipe
- [ ] notes_generator_pipe
- [ ] custom_notes_pipe
- [ ] doubt_solver_pipe
- [ ] mains_evaluator_pipe
- [ ] quiz_engine_pipe
- [ ] planner_pipe
- [ ] mentor_chat_pipe
- [ ] search_pipe
- [ ] feedback_pipe
- [ ] lecture_trigger_pipe
- [ ] render_webhook_pipe
- [ ] admin_users_pipe
- [ ] admin_content_pipe
- [ ] admin_hermes_pipe

**Action**: Migrate from Next.js API routes to Supabase Edge Functions

---

### SECTION 14: DEPLOYMENT CHECKLIST 🟡

#### DATABASE:
- [ ] Run all SQL migrations (27 tables)
- [ ] Enable RLS + create all policies
- [ ] Create storage buckets (pdfs, audio, video, thumbnails, manim-cache, exports)
- [ ] Seed syllabus_nodes (330 chapters)
- [ ] Seed content_library (330 entries, status='pending')
- [ ] Seed plans (4 tiers) + ai_provider_config (3 providers)

#### EDGE FUNCTIONS:
- [ ] Deploy all shared modules
- [ ] Deploy all pipe functions
- [ ] Set environment variables in Supabase Secrets
- [ ] Test callAI() chain
- [ ] Test checkAccess() flows

#### VPS DOCKER SERVICES:
- [ ] Deploy Manim renderer (port 5555) with 13 scene classes
- [ ] Deploy Remotion orchestrator (port 8103) with 15 compositions
- [ ] Deploy TTS service (port 8105)
- [ ] Deploy DuckDuckGo proxy (port 8102)
- [ ] Start Redis (port 6379)
- [ ] Test all renders

#### HERMES AGENT:
- [ ] Install Hermes on VPS
- [ ] Configure 9Router credentials
- [ ] Configure Telegram bot
- [ ] Set up webhook endpoint (port 8200)
- [ ] Create systemd service
- [ ] Configure 10 cron jobs

#### CONTENT SEEDING:
- [ ] Upload NCERT PDFs → ingest → chunk → embed
- [ ] Start Hermes → READ content generation
- [ ] Verify first 10 notes (simplified language check)

#### FRONTEND:
- [ ] Build all READ mode pages (F1-F14)
- [ ] Build all WATCH mode pages (F15-F18)
- [ ] Build Admin panel (F19)
- [ ] Test PDF reader, TipTap editor, mind map, video player
- [ ] Test 360px mobile viewport
- [ ] Test Hindi toggle
- [ ] Test Razorpay checkout

---

### SECTION 15: ABSOLUTE RULES — COMPLIANCE AUDIT

| Rule | Current | Compliant | Action |
|------|---------|-----------|--------|
| 1. No localStorage for auth | ✅ | ✅ | ✅ |
| 2. No hardcoded API keys | ✅ | ✅ | ✅ |
| 3. All external calls via Edge Functions | ❌ | ❌ | ⚠️ Migrate |
| 4. Every premium feature checks entitlement | ✅ | ✅ | ✅ |
| 5. Every AI output uses SIMPLIFIED_LANGUAGE | ❌ | ❌ | ⚠️ Enforce |
| 6. Mobile-first (360px) | 🟡 | 🟡 | ⚠️ Test all |
| 7. Hindi + English toggle | ❌ | ❌ | ⚠️ Build |
| 8. Error boundaries | ✅ | ✅ | ✅ |
| 9. Retry logic | 🟡 | 🟡 | ⚠️ Audit all |
| 10. Skeleton loaders | 🟡 | 🟡 | ⚠️ Add to all |
| 11. No dummy data | 🟡 | 🟡 | ⚠️ Remove mocks |
| 12. Light theme default | ✅ | ✅ | ✅ |
| 13. callAI() with fallback | ✅ | ✅ | ✅ |
| 14. Zero hallucination (RAG) | 🟡 | 🟡 | ⚠️ Enforce |
| 15. Razorpay (not RevenueCat) | ✅ | ✅ | ✅ |
| 16. Manim for animations | 🟡 | 🟡 | ⚠️ Build scenes |
| 17. Remotion for video | 🟡 | 🟡 | ⚠️ Build comps |
| 18. Hermes orchestrates content | ❌ | ❌ | ⚠️ Setup |
| 19. Custom video player | ❌ | ❌ | ⚠️ Build |
| 20. PDF reader + TipTap + video player | ❌ | ❌ | ⚠️ Build |
| 21. Manim scene cache | ❌ | ❌ | ⚠️ Implement |
| 22. Production logging | 🟡 | 🟡 | ⚠️ Enhance |
| 23. Build order: READ→WATCH→Admin | ❌ | ❌ | ⚠️ Re-prioritize |
| 24. Reading independence | ❌ | ❌ | ⚠️ Architectural |
| 25. Content library shows both modes | ❌ | ❌ | ⚠️ Add UI |

**Compliance Score**: 12/25 (48%)

---

## 🎯 PRIORITY ACTION PLAN

### Week 1: Foundation + F1 Onboarding
- [ ] Create consolidated migration 022 (27 tables)
- [ ] Build F1 Smart Onboarding (5-step wizard + 10Q quiz)
- [ ] Add SIMPLIFIED_LANGUAGE_PROMPT to all AI calls
- [ ] Install missing packages (TipTap, react-pdf, react-flow, etc.)

### Week 2-3: READ Mode Core (F2-F7)
- [ ] F2: Daily Current Affairs
- [ ] F3: AI Notes Library (enhance with mind maps)
- [ ] F4: User Content Studio (TipTap editor)
- [ ] F5: AI Doubt Solver (text+image+voice)
- [ ] F6: Instant Mains Evaluator (KILLER FEATURE)
- [ ] F7: Adaptive MCQ Practice

### Week 4-5: READ Mode Complete (F8-F14)
- [ ] F8: AI Study Planner
- [ ] F9: Progress Dashboard
- [ ] F10: AI Mentor Chat
- [ ] F11: Smart Search (enhance)
- [ ] F12: PDF Reader
- [ ] F13: Gamification
- [ ] F14: Bookmarks + Revision

### Week 6-10: WATCH Mode (F15-F18)
- [ ] Build 13 Manim scene classes
- [ ] Build 15 Remotion compositions
- [ ] Deploy TTS service
- [ ] F15: Custom video player with classroom features
- [ ] F16: Manim-enhanced notes
- [ ] F17: Animated MCQ explanations
- [ ] F18: Monthly recap video

### Week 11-12: Admin + Hermes
- [ ] F19: Admin panel (11 sections)
- [ ] Hermes Agent setup + 10 cron jobs
- [ ] Migrate to Edge Functions
- [ ] Production deployment

---

## 📊 COMPLIANCE TRACKING

| Category | Current | Target | Progress |
|----------|---------|--------|----------|
| Database | 21 tables | 27 tables | 78% |
| READ Mode | 3/14 features | 14/14 | 21% |
| WATCH Mode | 0/4 features | 4/4 | 0% |
| Admin | 0/11 sections | 11/11 | 0% |
| Hermes | 0/10 jobs | 10/10 | 0% |
| Edge Functions | 0/16 pipes | 16/16 | 0% |
| Rules Compliance | 12/25 | 25/25 | 48% |

**Overall**: 25% complete

---

**Next Step**: Begin F1 Smart Onboarding implementation per Master Prompt v8.0 Section 5, F1 specification.
