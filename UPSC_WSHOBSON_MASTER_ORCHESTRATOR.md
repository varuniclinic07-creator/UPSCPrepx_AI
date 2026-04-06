# 🎯 UPSC CSE MASTER - ENTERPRISE BUILD SYSTEM
## Using wshobson/agents Multi-Agent Orchestration Methodology
## 99 Specialized Agents | 107 Skills | 15 Workflow Orchestrators

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  🔌 PLUGIN INSTALLATION - RUN FIRST IN CLAUDE CODE                           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## Step 1: Add the Marketplace
```bash
/plugin marketplace add wshobson/agents
```

## Step 2: Install Required Plugins for UPSC App
```bash
# Core Development
/plugin install javascript-typescript@wshobson/agents
/plugin install backend-development@wshobson/agents
/plugin install frontend-mobile-development@wshobson/agents

# Database & Infrastructure
/plugin install database-design@wshobson/agents
/plugin install cloud-infrastructure@wshobson/agents
/plugin install cicd-automation@wshobson/agents

# Quality & Security
/plugin install security-scanning@wshobson/agents
/plugin install code-review-ai@wshobson/agents
/plugin install unit-testing@wshobson/agents
/plugin install comprehensive-review@wshobson/agents

# Orchestration & Operations
/plugin install full-stack-orchestration@wshobson/agents
/plugin install observability-monitoring@wshobson/agents
/plugin install debugging-toolkit@wshobson/agents

# Documentation
/plugin install code-documentation@wshobson/agents
/plugin install api-documentation@wshobson/agents
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  🧠 THREE-TIER MODEL STRATEGY (Opus/Sonnet/Haiku)                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```yaml
TIER 1 - OPUS 4.5 (Critical Architecture & Security):
  agents:
    - backend-architect      # API design decisions
    - database-architect     # Schema design
    - security-auditor       # Security review
    - code-reviewer          # Architectural review
    - architect-review       # System design
  use_for: "Critical decisions, architecture, security audits"
  cost: "$5/$25 per million tokens"

TIER 2 - SONNET 4.5 (Complex Development):
  agents:
    - typescript-pro         # TypeScript development
    - react-specialist       # React components
    - nextjs-developer       # Next.js pages/API
    - fastapi-pro           # If using Python backend
    - frontend-developer    # UI implementation
    - test-automator        # Test generation
  use_for: "Feature development, complex logic"
  cost: "$3/$15 per million tokens"

TIER 3 - HAIKU 4.5 (Fast Operations):
  agents:
    - deployment-engineer    # CI/CD setup
    - devops-troubleshooter # Quick fixes
    - documentation-writer   # Doc generation
    - seo-content-writer    # Marketing content
  use_for: "Deployment, docs, repetitive tasks"
  cost: "$1/$5 per million tokens"
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  🔄 MULTI-AGENT ORCHESTRATION WORKFLOW                                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## UPSC App Build Orchestration Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FULL-STACK FEATURE ORCHESTRATION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PHASE 1: Architecture (Opus)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ backend-architect → database-architect → architect-review               │   │
│  │ "Design Supabase schema, API structure, authentication flow"            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                                  │
│  PHASE 2: Backend Development (Sonnet)                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ typescript-pro → nextjs-developer → backend-api-coder                   │   │
│  │ "Implement API routes, services, Supabase integration"                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                                  │
│  PHASE 3: Frontend Development (Sonnet)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ react-specialist → frontend-developer → ui-ux-designer                  │   │
│  │ "Build React components, pages, Apple-style UI"                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                                  │
│  PHASE 4: Testing & Security (Mixed)                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ test-automator(Sonnet) → security-auditor(Opus) → code-reviewer(Opus)  │   │
│  │ "Generate tests, security scan, code review"                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                                  │
│  PHASE 5: Deployment & Polish (Haiku)                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ deployment-engineer → observability-engineer → documentation-writer     │   │
│  │ "CI/CD, monitoring, documentation"                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  🔐 PRODUCTION CREDENTIALS - USE EXACTLY                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```env
# ============================================
# SUPABASE CLOUD (PRIMARY DATABASE)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# ============================================
# A4F AI API (CRITICAL: 10 RPM LIMIT!)
# ============================================
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1

# ============================================
# VPS SERVER (89.117.60.144)
# ============================================
SERVER_IP=89.117.60.144
COOLIFY_URL=http://89.117.60.144:8000
COOLIFY_USERNAME=dranilkumarsharma4@gmail.com
COOLIFY_PASSWORD=22547728.mIas

# ============================================
# MINIO STORAGE
# ============================================
MINIO_ENDPOINT=http://89.117.60.144:9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_BUCKET=uploads

# ============================================
# REDIS CACHE
# ============================================
REDIS_URL=redis://89.117.60.144:6379

# ============================================
# N8N AUTOMATION
# ============================================
N8N_URL=http://89.117.60.144:5678
N8N_USER=admin
N8N_PASSWORD=changeme123

# ============================================
# NEXTAUTH
# ============================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=upsc-cse-master-super-secret-key-2024-production
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📊 AGENT SKILLS ACTIVATION                                                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## Skills Auto-Activated for UPSC App Build

```yaml
JavaScript/TypeScript Skills (4):
  - advanced-typescript-patterns    # Strict types, generics, utility types
  - nodejs-patterns                 # Server-side Node.js best practices
  - testing-javascript              # Jest, testing-library patterns
  - modern-es6-plus                 # Modern JavaScript features

Backend Skills (3):
  - api-design-principles           # RESTful API patterns
  - backend-architecture-patterns   # Service layer, repositories
  - microservices-patterns         # If scaling needed

Database Skills (2):
  - database-design-patterns       # Schema normalization, indexes
  - migration-strategies           # Safe database migrations

Security Skills (2):
  - security-scanning-sast         # Static analysis patterns
  - api-security-patterns          # Auth, rate limiting, validation

CI/CD Skills (4):
  - pipeline-design-patterns       # Multi-stage pipelines
  - github-actions-patterns        # GitHub Actions workflows
  - secrets-management             # Secure credential handling
  - deployment-strategies          # Blue-green, canary deployments

Observability Skills (3):
  - metrics-collection             # Application metrics
  - logging-infrastructure         # Structured logging
  - distributed-tracing            # Request tracing
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  🚀 CONTEXT WINDOW BYPASS (200K LIMIT)                                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## Progressive Disclosure Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    200K CONTEXT MANAGEMENT                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PHASE 1 (~40K) ──checkpoint──► PHASE 2 (~40K) ──checkpoint──► PHASE 3 (~40K)  │
│       │                              │                              │            │
│  Architecture                   Backend APIs                   Frontend         │
│  (Opus agents)                  (Sonnet agents)               (Sonnet agents)  │
│       │                              │                              │            │
│       ▼                              ▼                              ▼            │
│  .build-state/                 .build-state/                .build-state/       │
│  phase1-arch.json              phase2-backend.json          phase3-frontend.json│
│                                                                                  │
│  PHASE 4 (~40K) ──checkpoint──► PHASE 5 (~40K) ──► BUILD_COMPLETE              │
│       │                              │                                           │
│  Admin Panel                    Polish & Deploy                                 │
│  (Mixed agents)                (Haiku agents)                                   │
│       │                              │                                           │
│       ▼                              ▼                                           │
│  .build-state/                 .build-state/                                    │
│  phase4-admin.json             BUILD_COMPLETE.json                              │
│                                                                                  │
│  Skills load progressively - only when activated                                │
│  Each phase uses specific agents - minimal token overhead                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## State Persistence

**Create: `.build-state/orchestration.json`**
```json
{
  "project": "upsc-cse-master",
  "methodology": "wshobson/agents",
  "currentPhase": 1,
  "activeAgents": [],
  "activeSkills": [],
  "completedPhases": [],
  "completedFiles": [],
  "modelTier": {
    "architecture": "opus",
    "development": "sonnet", 
    "operations": "haiku"
  },
  "checkpoints": []
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📋 SUPABASE SQL MIGRATIONS - RUN FIRST!                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## Go to: https://emotqkukvfwjycvwfvyj.supabase.co → SQL Editor

### Migration 1: Core Tables
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with RLS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'basic', 'premium')),
  subscription_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Migration 2: Notes & Quizzes
```sql
-- Notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  is_bookmarked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notes_user_idx ON public.notes(user_id);
CREATE INDEX notes_subject_idx ON public.notes(subject);
CREATE INDEX notes_created_idx ON public.notes(created_at DESC);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  total_questions INTEGER NOT NULL DEFAULT 0,
  score INTEGER,
  time_taken INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX quizzes_user_idx ON public.quizzes(user_id);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own quizzes" ON public.quizzes FOR ALL USING (auth.uid() = user_id);
```

### Migration 3: Current Affairs & Features
```sql
-- Current Affairs
CREATE TABLE IF NOT EXISTS public.current_affairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  details TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  upsc_relevance TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ca_date_idx ON public.current_affairs(date DESC);
ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read CA" ON public.current_affairs FOR SELECT USING (true);
CREATE POLICY "Admin write CA" ON public.current_affairs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Feature Config
CREATE TABLE IF NOT EXISTS public.feature_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  display_name_hi TEXT,
  description TEXT,
  icon TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  min_tier TEXT DEFAULT 'trial',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feature_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read features" ON public.feature_config FOR SELECT USING (true);
CREATE POLICY "Admin manage features" ON public.feature_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Seed features
INSERT INTO public.feature_config (feature_id, display_name, display_name_hi, icon, min_tier, sort_order) VALUES
  ('notes', 'Smart Study Notes', 'स्मार्ट अध्ययन नोट्स', '📚', 'trial', 1),
  ('quiz', 'Practice Quiz', 'अभ्यास प्रश्नोत्तरी', '🧠', 'trial', 2),
  ('current-affairs', 'Daily Current Affairs', 'दैनिक करेंट अफेयर्स', '📰', 'trial', 3),
  ('video', 'Video Lessons', 'वीडियो पाठ', '🎬', 'basic', 4),
  ('interview', 'Mock Interview', 'मॉक इंटरव्यू', '🎤', 'premium', 5),
  ('essay', 'Essay Evaluation', 'निबंध मूल्यांकन', '✍️', 'basic', 6),
  ('schedule', 'Study Planner', 'अध्ययन योजनाकार', '📅', 'trial', 7)
ON CONFLICT (feature_id) DO NOTHING;
```

### Migration 4: AI Providers & Leads
```sql
-- AI Providers (Admin managed)
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  api_base_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  models JSONB DEFAULT '[]',
  rate_limit_rpm INTEGER DEFAULT 60,
  health_status TEXT DEFAULT 'unknown',
  last_health_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage providers" ON public.ai_providers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Seed A4F provider
INSERT INTO public.ai_providers (name, slug, api_base_url, is_active, is_default, models, rate_limit_rpm)
VALUES (
  'A4F API',
  'a4f',
  'https://api.a4f.co/v1',
  true,
  true,
  '[
    {"id": "provider-3/grok-4.1-fast", "name": "Grok Fast", "type": "chat"},
    {"id": "provider-2/kimi-k2-thinking-tee", "name": "Kimi Thinking", "type": "chat"},
    {"id": "provider-3/sonar-reasoning-pro", "name": "Sonar Research", "type": "chat"},
    {"id": "provider-3/FLUX.1-schnell", "name": "FLUX Image", "type": "image"}
  ]',
  10
) ON CONFLICT (slug) DO NOTHING;

-- Marketing Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX leads_email_idx ON public.leads(email);
CREATE INDEX leads_status_idx ON public.leads(status);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage leads" ON public.leads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  🚀 MASTER BUILD PROMPT - COPY TO CLINE                                      ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```
# UPSC CSE MASTER - ENTERPRISE BUILD
## Using wshobson/agents Multi-Agent Orchestration

You are building an enterprise-grade UPSC preparation platform using the wshobson/agents 
multi-agent orchestration methodology.

## INSTALLED PLUGINS
- javascript-typescript (typescript-pro, javascript-pro)
- backend-development (backend-architect, graphql-architect, tdd-orchestrator)
- frontend-mobile-development (react-specialist, frontend-developer)
- database-design (database-architect)
- security-scanning (security-auditor)
- code-review-ai (code-reviewer, architect-review)
- full-stack-orchestration (coordinates all agents)
- observability-monitoring (observability-engineer)
- unit-testing (test-automator)

## THREE-TIER MODEL STRATEGY
- OPUS: Architecture decisions, security audits, code review
- SONNET: Feature development, API implementation, UI components
- HAIKU: Deployment, documentation, quick fixes

## ORCHESTRATION PATTERN
Execute in this order, using appropriate agents:

PHASE 1 (Opus): backend-architect + database-architect
→ Design Supabase schema, API structure, auth flow
→ Output: Architecture decisions, schema design

PHASE 2 (Sonnet): typescript-pro + nextjs-developer
→ Implement API routes, Supabase integration, services
→ Output: Backend code, API endpoints

PHASE 3 (Sonnet): react-specialist + frontend-developer
→ Build React components, pages, Apple-style UI
→ Output: Frontend code, components

PHASE 4 (Mixed): test-automator + security-auditor + code-reviewer
→ Generate tests, security scan, code review
→ Output: Tests, security report, review

PHASE 5 (Haiku): deployment-engineer + documentation-writer
→ CI/CD setup, documentation
→ Output: Deployment config, docs

## CREDENTIALS (USE EXACTLY)
- Supabase: https://emotqkukvfwjycvwfvyj.supabase.co
- Supabase Anon: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
- A4F API: ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
- Server: 89.117.60.144

## ABSOLUTE RULES
1. NEVER skip files - create EVERY file completely
2. NEVER use placeholder code
3. NEVER change credentials
4. ALWAYS use Supabase Cloud (NOT local PostgreSQL)
5. ALWAYS implement proper error handling
6. ALWAYS follow Apple design patterns for UI
7. ALWAYS update .build-state/orchestration.json after each phase
8. ALWAYS create checkpoint files

## CONTEXT MANAGEMENT
Stay under 40K tokens per phase. Save checkpoint after each phase.
If context fills, save state and use resume prompt.

## START
First, create .build-state/orchestration.json
Then activate backend-architect agent for Phase 1.
Create files in exact order specified.

/full-stack-orchestration:full-stack-feature "UPSC preparation platform"
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  🔄 PHASE RESUME PROMPTS                                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## Resume Phase 2 (Backend)
```
Resume UPSC CSE Master build - Phase 2 Backend Development.

Read .build-state/orchestration.json for state.
Phase 1 (Architecture) is complete.

Activate agents: typescript-pro, nextjs-developer
Activate skills: advanced-typescript-patterns, api-design-principles

Continue from last completed file.
Use SONNET tier for development work.

Credentials:
- Supabase: https://emotqkukvfwjycvwfvyj.supabase.co
- A4F API: ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621

/backend-development:feature-development "UPSC notes, quiz, current affairs APIs"
```

## Resume Phase 3 (Frontend)
```
Resume UPSC CSE Master build - Phase 3 Frontend Development.

Read .build-state/orchestration.json for state.
Phases 1-2 complete.

Activate agents: react-specialist, frontend-developer
Activate skills: testing-javascript, modern-es6-plus

Use SONNET tier. Create Apple-style UI with:
- Glass morphism effects
- Smooth animations (framer-motion)
- Dark/Light theme
- English/Hindi support
- Mobile responsive

/frontend-mobile-development:component-scaffold "UPSC dashboard, notes, quiz pages"
```

## Resume Phase 4 (Testing & Security)
```
Resume UPSC CSE Master build - Phase 4 Testing & Security.

Read .build-state/orchestration.json for state.
Phases 1-3 complete.

Activate agents: test-automator (Sonnet), security-auditor (Opus), code-reviewer (Opus)
Activate skills: security-scanning-sast, testing-javascript

Run security scan and generate tests:
/security-scanning:security-hardening
/unit-testing:test-generate
/code-review-ai:ai-review
```

## Resume Phase 5 (Deploy & Polish)
```
Resume UPSC CSE Master build - Phase 5 Deployment & Polish.

Read .build-state/orchestration.json for state.
Phases 1-4 complete.

Activate agents: deployment-engineer (Haiku), documentation-writer (Haiku)
Activate skills: github-actions-patterns, deployment-strategies

Finalize:
/cicd-automation:workflow-automate
/observability-monitoring:monitor-setup
/code-documentation:doc-generate

Create .build-state/BUILD_COMPLETE.json when done.
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 COMPLETE FILE LIST BY PHASE                                              ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## PHASE 1: Architecture (Opus) - 8 files
```
Agent: backend-architect, database-architect
01. .build-state/orchestration.json
02. docs/architecture/ARCHITECTURE.md
03. docs/architecture/DATABASE_SCHEMA.md
04. docs/architecture/API_DESIGN.md
05. docs/architecture/AUTH_FLOW.md
06. docs/architecture/COMPONENT_STRUCTURE.md
07. package.json
08. .build-state/phase1-arch.json (checkpoint)
```

## PHASE 2: Backend (Sonnet) - 25 files
```
Agent: typescript-pro, nextjs-developer
09. .env.local
10. next.config.js
11. tailwind.config.ts
12. tsconfig.json
13. src/lib/supabase/client.ts
14. src/lib/supabase/server.ts
15. src/lib/supabase/middleware.ts
16. src/middleware.ts
17. src/lib/ai/a4f-client.ts
18. src/lib/ai/rate-limiter.ts
19. src/lib/ai/generate.ts
20. src/types/supabase.ts
21. src/types/index.ts
22. src/lib/utils.ts
23. src/lib/auth/auth-config.ts
24. src/lib/services/notes-service.ts
25. src/lib/services/quiz-service.ts
26. src/lib/services/current-affairs-service.ts
27. src/app/api/notes/generate/route.ts
28. src/app/api/notes/route.ts
29. src/app/api/quiz/generate/route.ts
30. src/app/api/quiz/route.ts
31. src/app/api/current-affairs/route.ts
32. src/app/api/health/route.ts
33. .build-state/phase2-backend.json (checkpoint)
```

## PHASE 3: Frontend (Sonnet) - 30 files
```
Agent: react-specialist, frontend-developer
34. src/app/globals.css
35. src/app/layout.tsx
36. src/app/page.tsx
37. src/app/(auth)/login/page.tsx
38. src/app/(auth)/register/page.tsx
39. src/app/(auth)/layout.tsx
40. src/app/auth/callback/route.ts
41. src/app/(app)/layout.tsx
42. src/app/(app)/dashboard/page.tsx
43. src/app/(app)/notes/page.tsx
44. src/app/(app)/notes/[id]/page.tsx
45. src/app/(app)/quiz/page.tsx
46. src/app/(app)/quiz/[id]/page.tsx
47. src/app/(app)/current-affairs/page.tsx
48. src/components/ui/button.tsx
49. src/components/ui/card.tsx
50. src/components/ui/input.tsx
51. src/components/ui/loading.tsx
52. src/components/layout/header.tsx
53. src/components/layout/sidebar.tsx
54. src/components/layout/mobile-nav.tsx
55. src/components/dashboard/feature-card.tsx
56. src/components/notes/notes-generator.tsx
57. src/components/notes/notes-viewer.tsx
58. src/components/quiz/quiz-generator.tsx
59. src/components/quiz/quiz-interface.tsx
60. src/lib/theme/theme-provider.tsx
61. src/lib/i18n/i18n-provider.tsx
62. src/hooks/use-user.ts
63. .build-state/phase3-frontend.json (checkpoint)
```

## PHASE 4: Admin Panel (Mixed) - 15 files
```
Agent: typescript-pro, security-auditor
64. src/app/(admin)/layout.tsx
65. src/app/(admin)/admin/page.tsx
66. src/app/(admin)/admin/users/page.tsx
67. src/app/(admin)/admin/ai-providers/page.tsx
68. src/app/(admin)/admin/features/page.tsx
69. src/app/(admin)/admin/leads/page.tsx
70. src/components/admin/sidebar.tsx
71. src/components/admin/header.tsx
72. src/components/admin/stat-card.tsx
73. src/app/api/admin/users/route.ts
74. src/app/api/admin/ai-providers/route.ts
75. src/app/api/admin/features/route.ts
76. src/app/api/admin/leads/route.ts
77. src/lib/admin/admin-service.ts
78. .build-state/phase4-admin.json (checkpoint)
```

## PHASE 5: Polish & Deploy (Haiku) - 10 files
```
Agent: deployment-engineer, documentation-writer
79. src/lib/i18n/translations.ts
80. src/components/ui/theme-toggle.tsx
81. src/components/ui/language-toggle.tsx
82. src/app/loading.tsx
83. src/app/error.tsx
84. src/app/not-found.tsx
85. .github/workflows/ci.yml
86. .github/workflows/deploy.yml
87. README.md
88. .build-state/BUILD_COMPLETE.json
```

**TOTAL: 88 files → Production-Ready App**

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  ✅ VERIFICATION CHECKLIST                                                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## After Each Phase
```bash
npm install
npm run type-check
npm run build
```

## After Complete Build
```bash
npm run dev
# Test all routes
```

## Final Verification
- [ ] Landing page with Apple-style design
- [ ] Supabase Auth working (login/register)
- [ ] Dashboard shows feature cards
- [ ] Notes generation with A4F API
- [ ] Quiz generation and submission
- [ ] Admin panel accessible
- [ ] Dark/Light theme toggle
- [ ] English/Hindi language toggle
- [ ] Mobile responsive
- [ ] No console errors

---

# BUILD COMPLETE WHEN .build-state/BUILD_COMPLETE.json EXISTS!
