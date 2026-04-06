# 🧠 UPSC CSE MASTER - AGENTIC INTELLIGENCE & ADMIN ENHANCEMENT
## Complete BMAD Master Prompt for AI IDE Builders

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🚨 CRITICAL INSTRUCTIONS FOR AI AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## MANDATORY RULES

1. **Follow BMAD Agent Sequence** - Execute agents in EXACT order
2. **No Skipping** - Complete each agent before proceeding
3. **Preserve Existing Features** - DO NOT remove or break existing functionality
4. **Production Code Only** - No TODOs, no placeholders, no mock data
5. **Remove RAG-Anything** - Replace with new Agentic systems
6. **User-Friendly Language** - No technical jargon in user-facing UI

## AGENT SEQUENCE (IMMUTABLE)

```
AGENT 1: ANALYST     → Requirements Analysis
AGENT 2: PM          → User Stories & Specs
AGENT 3: ARCHITECT   → System Design & Schema
AGENT 4: DESIGN      → UI/UX Components
AGENT 5: SCRUM       → Task Breakdown
AGENT 6: DEV         → Complete Code
AGENT 7: PO          → Product Owner Review
AGENT 8: QA          → Quality Assurance
AGENT 9: UX          → Final UI Polish
AGENT 10: DEVOPS     → Production Deployment
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 📋 PROJECT CONTEXT
# ═══════════════════════════════════════════════════════════════════════════════

## Existing App: UPSC CSE Master
- **Framework**: Next.js 14 + TypeScript + Tailwind
- **Database**: PostgreSQL 16 + pgvector
- **Cache**: Redis 7
- **Storage**: MinIO
- **AI**: A4F API (10 RPM limit)

## What We're Adding

### 1. Agentic Intelligence System
| Service | Source | Purpose |
|---------|--------|---------|
| **Agentic Web Search** | github.com/bahathabet/agentic-search | Live web search (DuckDuckGo) |
| **AutoDocThinker** | github.com/Md-Emon-Hasan/AutoDocThinker | Document RAG with multi-agent |
| **Agentic File Search** | github.com/PromtEngineer/agentic-file-search | Dynamic document navigation |

### 2. Admin Panel Enhancements
- Complete app control (all features + marketing)
- AI Model Provider management (ALL providers)
- Static materials database management
- Content accuracy controls

### 3. User Experience Improvements
- Technical terms → User-friendly names
- Feature previews with live content
- 10th standard simplified language
- PDF export for all notes

### 4. What We're Removing
- RAG-Anything (replaced by Agentic systems)

## VPS Configuration
```yaml
IP: 89.117.60.144
COOLIFY: http://89.117.60.144:8000
SSH_USER: root
SSH_PASSWORD: 772877mAmcIaS
```

## A4F API Configuration
```yaml
API_KEY: ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
BASE_URL: https://api.a4f.co/v1
RATE_LIMIT: 10 RPM
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🔴 AGENT 1: ANALYST AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Analyze requirements for Agentic Intelligence integration and Admin enhancements.

## Deliverables

### 1.1 Product Requirements Document (PRD)

```markdown
# Agentic Intelligence & Admin Enhancement - PRD

## 1. Executive Summary
This update transforms UPSC CSE Master into an intelligent, content-accurate platform 
using three agentic AI systems for web search, document analysis, and file navigation. 
The admin panel becomes a comprehensive control center for the entire application.

## 2. Problem Statement
- Current content generation may produce irrelevant content
- No way to ensure UPSC syllabus alignment
- Technical jargon confuses non-technical users
- Admin lacks complete app control
- No centralized AI provider management
- Static materials not properly utilized

## 3. Solution Overview

### 3.1 Agentic Web Search (DuckDuckGo)
- Real-time web search for current affairs
- UPSC-focused source prioritization
- Automatic relevance filtering
- Citation and source linking

### 3.2 AutoDocThinker (Document RAG)
- Multi-agent document processing
- PDF, DOCX, TXT support
- Intelligent summarization
- Cross-reference detection

### 3.3 Agentic File Search
- Dynamic document navigation
- Human-like file exploration
- No pre-computed embeddings needed
- Real-time reasoning

### 3.4 Admin Control Center
- Complete feature management
- AI provider configuration
- Static materials database
- Content accuracy rules
- Marketing tools integration

## 4. Core Features

### 4.1 Agentic Content Engine
| Feature | Description |
|---------|-------------|
| Smart Notes Generation | Uses all 3 agentic systems for accuracy |
| Source Verification | Cross-references with official sources |
| Syllabus Alignment | Filters content against UPSC syllabus |
| Language Simplification | 10th standard comprehension level |
| PDF Export | Professional downloadable notes |

### 4.2 Admin Intelligence Hub
| Feature | Description |
|---------|-------------|
| Materials Library | Upload/manage static study materials |
| AI Provider Manager | Configure 50+ AI providers |
| Content Rules Engine | Set accuracy and relevance rules |
| Feature Controls | Enable/disable any app feature |
| Analytics Dashboard | Complete app analytics |

### 4.3 User Experience Layer
| Feature | Description |
|---------|-------------|
| Feature Previews | Live content on feature cards |
| Friendly Names | No technical jargon |
| Guided Interface | Step-by-step interactions |
| Visual Content | Images/previews everywhere |

## 5. Technical Architecture

### 5.1 Agentic Services Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  AGENTIC ORCHESTRATOR                        │
│  Routes queries to appropriate agentic system               │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   AGENTIC   │  │  AUTODOC    │  │   AGENTIC   │
│ WEB SEARCH  │  │  THINKER    │  │ FILE SEARCH │
│ (DuckDuckGo)│  │ (Doc RAG)   │  │ (Navigate)  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTENT REFINER                             │
│  - UPSC Syllabus Filter                                     │
│  - Language Simplifier (10th std)                           │
│  - Accuracy Verifier                                        │
│  - Source Citation                                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  FINAL OUTPUT                                │
│  - Comprehensive Notes                                      │
│  - Value Additions                                          │
│  - Quiz Questions                                           │
│  - PDF Export                                               │
└─────────────────────────────────────────────────────────────┘
```

## 6. User-Facing Feature Names (Technical → Friendly)

| Technical Name | User-Friendly Name |
|----------------|-------------------|
| RAG System | Smart Study Assistant |
| Vector Search | Find Related Topics |
| Embedding Generation | Content Analysis |
| LLM Processing | AI Explanation |
| Query Refinement | Understanding Your Question |
| Chunk Retrieval | Finding Relevant Information |
| pgvector Search | Related Content Discovery |
| API Call | Getting Information |
| Token Limit | Content Length |
| Model Selection | AI Quality Level |
| Batch Processing | Processing Multiple Items |
| Caching | Quick Loading |
| WebSocket | Live Updates |
| SSE Streaming | Real-time Response |

## 7. UPSC Syllabus Alignment Rules

### Allowed Content Sources
- NCERTs (Class 6-12)
- Standard textbooks (Laxmikanth, Spectrum, etc.)
- Government websites (PIB, PRS, etc.)
- Official reports (Economic Survey, ARC)
- Reputable coaching sources (Vision IAS, Drishti IAS)
- Current affairs (The Hindu, Indian Express, Yojana)

### Content Filtering Rules
1. Must relate to UPSC CSE syllabus topics
2. No promotional content
3. No outdated information (>2 years for static, >1 week for CA)
4. Must be factually verifiable
5. Must cite sources
6. Must use formal, educational tone

## 8. Success Metrics
- 95% content relevance to UPSC syllabus
- 100% source citation
- <1% factual errors
- 10th grade readability score
- 90% user comprehension rate
```

### 1.2 Feature Inventory

| ID | Feature | Description | Priority | Complexity |
|----|---------|-------------|----------|------------|
| AGT-01 | Agentic Web Search | DuckDuckGo-based intelligent search | P0 | High |
| AGT-02 | AutoDocThinker | Multi-agent document RAG | P0 | High |
| AGT-03 | Agentic File Search | Dynamic file navigation | P0 | High |
| AGT-04 | Agentic Orchestrator | Routes to appropriate system | P0 | High |
| AGT-05 | Content Refiner | Accuracy & simplification | P0 | High |
| ADM-01 | Materials Library | Static materials management | P0 | Medium |
| ADM-02 | AI Provider Manager | All AI providers config | P0 | High |
| ADM-03 | Content Rules Engine | Accuracy rule management | P0 | Medium |
| ADM-04 | Feature Controls | Enable/disable features | P0 | Medium |
| ADM-05 | Complete Admin Hub | Full app control center | P0 | High |
| UX-01 | Feature Previews | Live content on cards | P0 | Medium |
| UX-02 | Friendly Names | No technical jargon | P0 | Low |
| UX-03 | PDF Export | Downloadable notes | P0 | Medium |
| UX-04 | Guided Interface | Step-by-step flows | P1 | Medium |
| CLN-01 | Remove RAG-Anything | Clean up old system | P0 | Low |

## ✅ AGENT 1 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 1: ANALYST COMPLETE

Deliverables:
☑️ PRD with Agentic Architecture
☑️ Feature Inventory (15 features)
☑️ Technical-to-Friendly Name Mapping
☑️ UPSC Syllabus Alignment Rules

Ready for: AGENT 2 (PM AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🟠 AGENT 2: PM AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Create detailed user stories and specifications.

## Deliverables

### 2.1 User Stories

```markdown
## Epic 1: Agentic Intelligence System

### Story 1.1: Agentic Web Search
AS A user generating notes
I WANT the system to search the web for current information
SO THAT my notes include the latest relevant content

Acceptance Criteria:
- [ ] Uses DuckDuckGo API (not Google)
- [ ] Prioritizes UPSC-relevant sources
- [ ] Returns top 10 relevant results
- [ ] Provides source URLs and citations
- [ ] Filters out non-educational content
- [ ] Caches results for 24 hours
- [ ] Shows "Searching web..." indicator

### Story 1.2: AutoDocThinker Integration
AS A user asking questions about uploaded documents
I WANT the system to intelligently analyze my documents
SO THAT I get accurate, contextual answers

Acceptance Criteria:
- [ ] Supports PDF, DOCX, TXT uploads
- [ ] Multi-agent processing (retriever, summarizer, router)
- [ ] Handles documents up to 100 pages
- [ ] Provides page/section references
- [ ] Cross-references multiple documents
- [ ] Shows processing progress
- [ ] Maintains document chat history

### Story 1.3: Agentic File Search
AS A user searching for specific information
I WANT the system to navigate files like a human would
SO THAT I find exactly what I need

Acceptance Criteria:
- [ ] Dynamic navigation (no pre-computed embeddings)
- [ ] Follows cross-references automatically
- [ ] Explains reasoning path
- [ ] Shows which sections were explored
- [ ] Works on admin-uploaded static materials
- [ ] Real-time search progress

### Story 1.4: Agentic Orchestrator
AS THE system processing a user query
I WANT to automatically route to the best agentic system
SO THAT users get optimal results

Acceptance Criteria:
- [ ] Analyzes query intent
- [ ] Routes to web search for current affairs
- [ ] Routes to doc thinker for uploaded docs
- [ ] Routes to file search for static materials
- [ ] Can combine multiple systems
- [ ] Handles fallbacks gracefully

### Story 1.5: Content Refiner
AS A user receiving generated content
I WANT content to be accurate and easy to understand
SO THAT I can study effectively

Acceptance Criteria:
- [ ] Verifies against UPSC syllabus
- [ ] Simplifies to 10th standard language
- [ ] Adds source citations
- [ ] Removes irrelevant content
- [ ] Checks factual accuracy
- [ ] Formats for readability

---

## Epic 2: Admin Control Center

### Story 2.1: Materials Library
AS AN admin
I WANT to upload and manage static study materials
SO THAT the agentic system can use them

Acceptance Criteria:
- [ ] Upload PDF, DOCX, TXT, EPUB
- [ ] Categorize by subject (History, Polity, etc.)
- [ ] Tag by topic
- [ ] Set as "Standard" or "Reference"
- [ ] Version control
- [ ] Bulk upload support
- [ ] Preview uploaded files
- [ ] Delete/archive materials

### Story 2.2: AI Provider Manager
AS AN admin
I WANT to configure AI model providers
SO THAT I can use different AI services

Acceptance Criteria:
- [ ] Add/edit/delete providers
- [ ] Support for 50+ providers:
  - OpenAI, Anthropic, Google, Mistral
  - Groq, Together, Fireworks, Replicate
  - Cohere, AI21, DeepSeek, Moonshot
  - Qwen, GLM, Baichuan, Yi
  - OpenRouter, A4F, LiteLLM
  - Local: Ollama, LMStudio, vLLM
- [ ] Configure API keys securely
- [ ] Set rate limits per provider
- [ ] Test connection button
- [ ] Set default provider per feature
- [ ] Fallback provider configuration
- [ ] Usage tracking per provider

### Story 2.3: Content Rules Engine
AS AN admin
I WANT to define content accuracy rules
SO THAT generated content meets quality standards

Acceptance Criteria:
- [ ] Define allowed sources
- [ ] Define blocked sources
- [ ] Set keyword filters
- [ ] Set syllabus topic mapping
- [ ] Configure language complexity level
- [ ] Set fact-checking rules
- [ ] Enable/disable per feature

### Story 2.4: Feature Controls
AS AN admin
I WANT to enable/disable any app feature
SO THAT I can control user experience

Acceptance Criteria:
- [ ] Toggle any feature on/off
- [ ] Set feature visibility
- [ ] Configure feature limits (per plan)
- [ ] Set maintenance mode per feature
- [ ] Custom feature descriptions
- [ ] Feature usage analytics

### Story 2.5: Complete Admin Hub
AS AN admin
I WANT a unified dashboard to control everything
SO THAT I can manage the entire platform

Acceptance Criteria:
- [ ] Overview of all systems
- [ ] Quick access to all admin features
- [ ] Real-time system health
- [ ] User management
- [ ] Subscription management
- [ ] Marketing tools integration
- [ ] All existing admin features intact

---

## Epic 3: User Experience Enhancement

### Story 3.1: Feature Previews with Live Content
AS A user viewing the dashboard
I WANT to see preview content on feature cards
SO THAT I understand what each feature offers

Acceptance Criteria:
- [ ] Each feature card shows sample content
- [ ] Current affairs shows today's top topic
- [ ] Notes shows a sample note preview
- [ ] Quiz shows sample question
- [ ] Video shows thumbnail
- [ ] Content refreshes periodically
- [ ] Clicking expands to full feature

### Story 3.2: User-Friendly Feature Names
AS A user
I WANT features named in simple language
SO THAT I understand what they do

Acceptance Criteria:
- [ ] All technical terms replaced
- [ ] Feature names are action-oriented
- [ ] Descriptions are clear and simple
- [ ] No acronyms without explanation
- [ ] Consistent naming convention
- [ ] Localization-ready

### Story 3.3: PDF Export
AS A user viewing notes
I WANT to download as PDF
SO THAT I can study offline

Acceptance Criteria:
- [ ] Export any generated note
- [ ] Professional formatting
- [ ] Includes all sections
- [ ] Includes sources/citations
- [ ] Includes quiz questions
- [ ] Watermark with user info
- [ ] Download progress indicator

### Story 3.4: Guided Interface
AS A new user
I WANT step-by-step guidance
SO THAT I can use features effectively

Acceptance Criteria:
- [ ] Onboarding tour
- [ ] Feature tooltips
- [ ] "How to use" for each feature
- [ ] Video tutorials link
- [ ] Contextual help
- [ ] Skip option for experienced users

---

## Epic 4: Cleanup & Migration

### Story 4.1: Remove RAG-Anything
AS THE system
I WANT to remove RAG-Anything integration
SO THAT we use the new Agentic systems

Acceptance Criteria:
- [ ] Remove all RAG-Anything imports
- [ ] Remove RAG-Anything API calls
- [ ] Replace with Agentic services
- [ ] Migrate any saved data
- [ ] Update environment variables
- [ ] Update documentation
- [ ] VPS cleanup instructions
```

### 2.2 Feature Name Mapping

```typescript
// src/config/feature-names.ts
// Maps internal/technical names to user-friendly names

export const FEATURE_NAMES = {
  // Main Features
  'notes-generation': {
    internal: 'RAG-powered Notes Generation',
    display: '📚 Smart Study Notes',
    description: 'Get comprehensive notes on any UPSC topic',
  },
  'current-affairs': {
    internal: 'Daily CA with Web Search',
    display: '📰 Daily Current Affairs',
    description: "Today's important news for UPSC",
  },
  'doubt-video': {
    internal: 'Manim/Remotion Video Generation',
    display: '🎬 Video Explanations',
    description: 'Visual explanations for your doubts',
  },
  'quiz': {
    internal: 'LLM-generated MCQs',
    display: '🧠 Practice Quiz',
    description: 'Test your knowledge with practice questions',
  },
  'mock-interview': {
    internal: 'AI Roleplay Interview',
    display: '🎤 Mock Interview',
    description: 'Practice with AI interviewer',
  },
  'essay-evaluation': {
    internal: 'LLM Essay Scoring',
    display: '✍️ Essay Review',
    description: 'Get feedback on your essays',
  },
  'answer-writing': {
    internal: 'Mains Answer Generation',
    display: '📝 Answer Writing Practice',
    description: 'Learn to write perfect answers',
  },
  'pyq-analysis': {
    internal: 'Previous Year Analysis',
    display: '📊 Previous Questions',
    description: 'Analyze past exam patterns',
  },
  'daily-schedule': {
    internal: 'AI Schedule Generator',
    display: '📅 Study Planner',
    description: 'Personalized daily study schedule',
  },
  'revision-tracker': {
    internal: 'Spaced Repetition System',
    display: '🔄 Revision Helper',
    description: 'Never forget what you learned',
  },
  'mind-maps': {
    internal: 'Knowledge Graph Visualization',
    display: '🗺️ Topic Maps',
    description: 'Visual connections between topics',
  },
  
  // Technical Terms → User-Friendly
  'loading': 'Getting ready...',
  'processing': 'Working on it...',
  'embedding': 'Analyzing content...',
  'vector-search': 'Finding related topics...',
  'llm-call': 'AI is thinking...',
  'rate-limited': 'Taking a short break...',
  'error': 'Something went wrong',
  'retry': 'Try again',
  'cache-hit': 'Quick loading',
  'api-error': 'Unable to connect',
  'timeout': 'Taking too long, please try again',
} as const;

// Status messages
export const STATUS_MESSAGES = {
  'generating-notes': 'Creating your study notes...',
  'searching-web': 'Finding latest information...',
  'analyzing-docs': 'Reading through materials...',
  'refining-content': 'Making it easy to understand...',
  'checking-accuracy': 'Verifying facts...',
  'adding-sources': 'Adding references...',
  'creating-quiz': 'Preparing practice questions...',
  'generating-pdf': 'Creating your download...',
} as const;
```

## ✅ AGENT 2 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 2: PM AGENT COMPLETE

Deliverables:
☑️ User Stories (4 Epics, 15+ Stories)
☑️ Acceptance Criteria for each story
☑️ Feature Name Mapping (Technical → Friendly)
☑️ Status Messages Mapping

Ready for: AGENT 3 (ARCHITECT AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🟡 AGENT 3: ARCHITECT AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Design system architecture, database schema, and API structure.

## Deliverables

### 3.1 Agentic System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENTIC INTELLIGENCE LAYER                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      AGENTIC ORCHESTRATOR                            │   │
│  │  - Query Analysis                                                    │   │
│  │  - Intent Detection                                                  │   │
│  │  - System Routing                                                    │   │
│  │  - Result Aggregation                                                │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│         ┌───────────────────────┼───────────────────────┐                  │
│         │                       │                       │                  │
│         ▼                       ▼                       ▼                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ AGENTIC WEB     │  │   AUTODOC       │  │ AGENTIC FILE    │            │
│  │ SEARCH          │  │   THINKER       │  │ SEARCH          │            │
│  │                 │  │                 │  │                 │            │
│  │ - DuckDuckGo    │  │ - Document      │  │ - Dynamic       │            │
│  │ - Source Filter │  │   Retriever     │  │   Navigation    │            │
│  │ - Result Rank   │  │ - Summarizer    │  │ - Cross-ref     │            │
│  │ - Citation      │  │ - Web Searcher  │  │   Following     │            │
│  │                 │  │ - Tool Router   │  │ - Reasoning     │            │
│  │ Port: 8030      │  │ Port: 8031      │  │ Port: 8032      │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
│           │                    │                    │                      │
│           └────────────────────┼────────────────────┘                      │
│                                │                                           │
│  ┌─────────────────────────────▼───────────────────────────────────────┐   │
│  │                      CONTENT REFINER                                 │   │
│  │  - UPSC Syllabus Validator                                          │   │
│  │  - Language Simplifier (10th std)                                   │   │
│  │  - Fact Checker                                                     │   │
│  │  - Source Citation Generator                                        │   │
│  │  - PDF Generator                                                    │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                           │
│  ┌─────────────────────────────▼───────────────────────────────────────┐   │
│  │                    STATIC MATERIALS DATABASE                         │   │
│  │  - NCERTs                  - Laxmikanth                             │   │
│  │  - Spectrum                - Bipin Chandra                          │   │
│  │  - Shankar IAS             - Vision IAS Notes                       │   │
│  │  - Drishti IAS             - Government Reports                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Database Schema Additions

```sql
-- ═══════════════════════════════════════════════════════════════
-- AGENTIC INTELLIGENCE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════

-- AI Providers Table (Support for ALL providers)
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Provider Info
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- openai, anthropic, google, local, etc.
    
    -- API Configuration
    api_base_url TEXT NOT NULL,
    api_key_encrypted TEXT, -- Encrypted with app secret
    api_version VARCHAR(20),
    
    -- Models
    available_models JSONB DEFAULT '[]', -- [{id, name, context_length, pricing}]
    default_model VARCHAR(100),
    
    -- Rate Limits
    rate_limit_rpm INTEGER DEFAULT 60,
    rate_limit_tpm INTEGER DEFAULT 100000,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, degraded, down
    
    -- Usage
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0,
    
    -- Config
    extra_headers JSONB DEFAULT '{}',
    extra_params JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with all major providers
INSERT INTO ai_providers (name, slug, provider_type, api_base_url, available_models) VALUES
-- OpenAI Compatible
('OpenAI', 'openai', 'openai', 'https://api.openai.com/v1', '[{"id":"gpt-4o","name":"GPT-4o"},{"id":"gpt-4-turbo","name":"GPT-4 Turbo"},{"id":"gpt-3.5-turbo","name":"GPT-3.5 Turbo"}]'),
('Azure OpenAI', 'azure-openai', 'azure', 'https://{resource}.openai.azure.com', '[]'),

-- Anthropic
('Anthropic', 'anthropic', 'anthropic', 'https://api.anthropic.com/v1', '[{"id":"claude-3-opus","name":"Claude 3 Opus"},{"id":"claude-3-sonnet","name":"Claude 3 Sonnet"},{"id":"claude-3-haiku","name":"Claude 3 Haiku"}]'),

-- Google
('Google AI', 'google', 'google', 'https://generativelanguage.googleapis.com/v1', '[{"id":"gemini-pro","name":"Gemini Pro"},{"id":"gemini-1.5-pro","name":"Gemini 1.5 Pro"}]'),
('Google Vertex AI', 'vertex', 'vertex', 'https://{region}-aiplatform.googleapis.com/v1', '[]'),

-- Open Source Providers
('Groq', 'groq', 'openai', 'https://api.groq.com/openai/v1', '[{"id":"llama3-70b","name":"Llama 3 70B"},{"id":"mixtral-8x7b","name":"Mixtral 8x7B"}]'),
('Together AI', 'together', 'openai', 'https://api.together.xyz/v1', '[{"id":"meta-llama/Llama-3-70b-chat-hf","name":"Llama 3 70B"}]'),
('Fireworks AI', 'fireworks', 'openai', 'https://api.fireworks.ai/inference/v1', '[]'),
('Replicate', 'replicate', 'replicate', 'https://api.replicate.com/v1', '[]'),
('DeepInfra', 'deepinfra', 'openai', 'https://api.deepinfra.com/v1/openai', '[]'),

-- Enterprise Providers
('Cohere', 'cohere', 'cohere', 'https://api.cohere.ai/v1', '[{"id":"command-r-plus","name":"Command R+"}]'),
('AI21', 'ai21', 'ai21', 'https://api.ai21.com/studio/v1', '[]'),
('Mistral AI', 'mistral', 'openai', 'https://api.mistral.ai/v1', '[{"id":"mistral-large","name":"Mistral Large"}]'),

-- Chinese Providers
('DeepSeek', 'deepseek', 'openai', 'https://api.deepseek.com/v1', '[{"id":"deepseek-chat","name":"DeepSeek Chat"},{"id":"deepseek-coder","name":"DeepSeek Coder"}]'),
('Moonshot (Kimi)', 'moonshot', 'openai', 'https://api.moonshot.cn/v1', '[{"id":"moonshot-v1-8k","name":"Moonshot v1"}]'),
('Qwen (Alibaba)', 'qwen', 'openai', 'https://dashscope.aliyuncs.com/compatible-mode/v1', '[{"id":"qwen-max","name":"Qwen Max"}]'),
('GLM (Zhipu)', 'glm', 'openai', 'https://open.bigmodel.cn/api/paas/v4', '[{"id":"glm-4","name":"GLM-4"}]'),
('Baichuan', 'baichuan', 'openai', 'https://api.baichuan-ai.com/v1', '[]'),
('Yi (01.ai)', 'yi', 'openai', 'https://api.01.ai/v1', '[]'),

-- Aggregators
('OpenRouter', 'openrouter', 'openai', 'https://openrouter.ai/api/v1', '[]'),
('A4F', 'a4f', 'openai', 'https://api.a4f.co/v1', '[{"id":"provider-3/grok-4.1-fast","name":"Grok Fast"},{"id":"provider-2/kimi-k2-thinking-tee","name":"Kimi Thinking"}]'),
('LiteLLM', 'litellm', 'openai', 'http://localhost:4000/v1', '[]'),

-- Local/Self-hosted
('Ollama', 'ollama', 'openai', 'http://localhost:11434/v1', '[]'),
('LM Studio', 'lmstudio', 'openai', 'http://localhost:1234/v1', '[]'),
('vLLM', 'vllm', 'openai', 'http://localhost:8000/v1', '[]'),
('LocalAI', 'localai', 'openai', 'http://localhost:8080/v1', '[]'),
('Text Gen WebUI', 'textgen', 'openai', 'http://localhost:5000/v1', '[]'),

-- Specialized
('Perplexity', 'perplexity', 'openai', 'https://api.perplexity.ai', '[{"id":"llama-3.1-sonar-large-128k-online","name":"Sonar Large Online"}]'),
('Anyscale', 'anyscale', 'openai', 'https://api.endpoints.anyscale.com/v1', '[]'),
('Lepton AI', 'lepton', 'openai', 'https://api.lepton.ai/v1', '[]'),
('Modal', 'modal', 'openai', 'https://api.modal.com/v1', '[]'),

-- Image Providers
('Stability AI', 'stability', 'stability', 'https://api.stability.ai/v1', '[]'),
('Midjourney', 'midjourney', 'midjourney', 'https://api.midjourney.com', '[]'),
('DALL-E', 'dalle', 'openai', 'https://api.openai.com/v1', '[]'),
('Leonardo AI', 'leonardo', 'leonardo', 'https://cloud.leonardo.ai/api/rest/v1', '[]'),

-- Audio Providers
('ElevenLabs', 'elevenlabs', 'elevenlabs', 'https://api.elevenlabs.io/v1', '[]'),
('PlayHT', 'playht', 'playht', 'https://api.play.ht/api/v2', '[]'),
('Murf AI', 'murf', 'murf', 'https://api.murf.ai/v1', '[]'),

-- Embedding Providers
('Voyage AI', 'voyage', 'voyage', 'https://api.voyageai.com/v1', '[]'),
('Jina AI', 'jina', 'jina', 'https://api.jina.ai/v1', '[]')

ON CONFLICT (slug) DO NOTHING;

-- Static Materials Library
CREATE TABLE IF NOT EXISTS static_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- File Info
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- pdf, docx, txt, epub
    file_size INTEGER,
    file_url TEXT NOT NULL, -- MinIO URL
    
    -- Categorization
    subject VARCHAR(100) NOT NULL, -- History, Geography, Polity, etc.
    category VARCHAR(100), -- NCERT, Standard Book, Reference, etc.
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    author VARCHAR(255),
    publisher VARCHAR(255),
    edition VARCHAR(50),
    year INTEGER,
    
    -- Processing Status
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    processed_at TIMESTAMPTZ,
    chunk_count INTEGER DEFAULT 0,
    
    -- Quality
    is_standard BOOLEAN DEFAULT FALSE, -- Standard textbook or reference
    priority INTEGER DEFAULT 0, -- Higher = more authoritative
    
    -- Usage
    search_count INTEGER DEFAULT 0,
    last_searched_at TIMESTAMPTZ,
    
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Chunks (for Agentic File Search)
CREATE TABLE IF NOT EXISTS material_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES static_materials(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    
    -- Location
    page_number INTEGER,
    section_title VARCHAR(255),
    chapter VARCHAR(255),
    
    -- Embedding (optional, for hybrid search)
    embedding vector(1024),
    
    -- Metadata
    word_count INTEGER,
    has_table BOOLEAN DEFAULT FALSE,
    has_image BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Rules Engine
CREATE TABLE IF NOT EXISTS content_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Rule Info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- source_filter, keyword_filter, syllabus_check, etc.
    
    -- Rule Definition
    rule_config JSONB NOT NULL,
    -- Example configs:
    -- source_filter: { "allowed": ["ncert.nic.in", "pib.gov.in"], "blocked": ["wikipedia.org"] }
    -- keyword_filter: { "block": ["promotional", "ad"], "require": ["upsc", "ias"] }
    -- syllabus_check: { "papers": ["GS1", "GS2"], "topics": ["Polity", "History"] }
    
    -- Scope
    applies_to TEXT[] DEFAULT '{}', -- Feature IDs this rule applies to, empty = all
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher = checked first
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Configuration
CREATE TABLE IF NOT EXISTS feature_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Feature Info
    feature_id VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    
    -- Status
    is_enabled BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT,
    
    -- Access Control
    min_subscription_tier VARCHAR(20) DEFAULT 'trial', -- trial, basic, premium
    usage_limit_trial INTEGER,
    usage_limit_basic INTEGER,
    usage_limit_premium INTEGER,
    
    -- AI Config
    default_ai_provider VARCHAR(50),
    default_ai_model VARCHAR(100),
    fallback_ai_provider VARCHAR(50),
    
    -- Preview Content (for feature cards)
    preview_type VARCHAR(50), -- text, image, video
    preview_content JSONB,
    preview_updated_at TIMESTAMPTZ,
    
    -- Analytics
    total_usage INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature configurations
INSERT INTO feature_config (feature_id, display_name, description, icon, min_subscription_tier) VALUES
('notes-generation', 'Smart Study Notes', 'Get comprehensive notes on any UPSC topic', '📚', 'trial'),
('current-affairs', 'Daily Current Affairs', 'Today''s important news for UPSC', '📰', 'trial'),
('doubt-video', 'Video Explanations', 'Visual explanations for your doubts', '🎬', 'basic'),
('quiz', 'Practice Quiz', 'Test your knowledge with practice questions', '🧠', 'trial'),
('mock-interview', 'Mock Interview', 'Practice with AI interviewer', '🎤', 'premium'),
('essay-evaluation', 'Essay Review', 'Get feedback on your essays', '✍️', 'basic'),
('answer-writing', 'Answer Writing Practice', 'Learn to write perfect answers', '📝', 'basic'),
('pyq-analysis', 'Previous Questions', 'Analyze past exam patterns', '📊', 'trial'),
('daily-schedule', 'Study Planner', 'Personalized daily study schedule', '📅', 'trial'),
('revision-tracker', 'Revision Helper', 'Never forget what you learned', '🔄', 'trial'),
('mind-maps', 'Topic Maps', 'Visual connections between topics', '🗺️', 'basic'),
('ai-chat', 'Study Assistant', 'Ask any UPSC-related question', '💬', 'trial'),
('newspaper-analysis', 'News Analysis', 'Daily newspaper editorial analysis', '📑', 'basic'),
('test-series', 'Mock Tests', 'Full-length practice tests', '📋', 'premium'),
('current-affairs-video', 'Daily CA Videos', 'Video summaries of current affairs', '📺', 'basic')
ON CONFLICT (feature_id) DO NOTHING;

-- Agentic Search Cache
CREATE TABLE IF NOT EXISTS agentic_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Query
    query_hash VARCHAR(64) NOT NULL, -- SHA256 of query
    query_text TEXT NOT NULL,
    
    -- Source
    source_type VARCHAR(50) NOT NULL, -- web_search, doc_thinker, file_search
    
    -- Result
    result_data JSONB NOT NULL,
    source_urls TEXT[],
    
    -- Validity
    expires_at TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agentic_cache_hash ON agentic_cache(query_hash);
CREATE INDEX idx_agentic_cache_expires ON agentic_cache(expires_at);

-- UPSC Syllabus Reference
CREATE TABLE IF NOT EXISTS upsc_syllabus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    paper VARCHAR(20) NOT NULL, -- Prelims_GS, Prelims_CSAT, GS1, GS2, GS3, GS4, Essay
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    subtopics TEXT[],
    
    keywords TEXT[], -- For content matching
    
    priority INTEGER DEFAULT 0, -- Exam importance
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate syllabus (abbreviated)
INSERT INTO upsc_syllabus (paper, subject, topic, keywords) VALUES
('GS1', 'History', 'Ancient India', ARRAY['indus valley', 'vedic', 'maurya', 'gupta', 'sangam']),
('GS1', 'History', 'Medieval India', ARRAY['delhi sultanate', 'mughal', 'vijayanagar', 'bhakti', 'sufi']),
('GS1', 'History', 'Modern India', ARRAY['british', 'freedom struggle', 'gandhi', 'nehru', '1857']),
('GS1', 'Geography', 'Physical Geography', ARRAY['geomorphology', 'climatology', 'oceanography']),
('GS1', 'Geography', 'Indian Geography', ARRAY['physiography', 'drainage', 'climate', 'soils']),
('GS2', 'Polity', 'Constitution', ARRAY['fundamental rights', 'dpsp', 'fundamental duties', 'amendment']),
('GS2', 'Polity', 'Governance', ARRAY['parliament', 'executive', 'judiciary', 'federalism']),
('GS2', 'International Relations', 'India and World', ARRAY['foreign policy', 'neighbours', 'diaspora']),
('GS3', 'Economy', 'Indian Economy', ARRAY['planning', 'poverty', 'employment', 'infrastructure']),
('GS3', 'Environment', 'Ecology', ARRAY['biodiversity', 'climate change', 'pollution', 'conservation']),
('GS3', 'Science', 'Science & Tech', ARRAY['space', 'nuclear', 'it', 'biotechnology']),
('GS4', 'Ethics', 'Ethics Concepts', ARRAY['integrity', 'aptitude', 'emotional intelligence']),
('GS4', 'Ethics', 'Case Studies', ARRAY['ethical dilemma', 'governance ethics', 'probity'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX idx_ai_providers_active ON ai_providers(is_active);
CREATE INDEX idx_static_materials_subject ON static_materials(subject);
CREATE INDEX idx_static_materials_processed ON static_materials(is_processed);
CREATE INDEX idx_material_chunks_material ON material_chunks(material_id);
CREATE INDEX idx_material_chunks_embedding ON material_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_content_rules_active ON content_rules(is_active);
CREATE INDEX idx_feature_config_enabled ON feature_config(is_enabled);
CREATE INDEX idx_upsc_syllabus_paper ON upsc_syllabus(paper);
```

### 3.3 API Design

```typescript
// ═══════════════════════════════════════════════════════════════
// AGENTIC SYSTEM API ROUTES
// ═══════════════════════════════════════════════════════════════

// Agentic Orchestrator
POST   /api/agentic/query                  // Main entry point
POST   /api/agentic/web-search             // DuckDuckGo search
POST   /api/agentic/doc-analyze            // AutoDocThinker
POST   /api/agentic/file-search            // Agentic File Search
POST   /api/agentic/refine                 // Content refinement

// Materials Library
GET    /api/admin/materials                // List materials
POST   /api/admin/materials                // Upload material
GET    /api/admin/materials/:id            // Get material
DELETE /api/admin/materials/:id            // Delete material
POST   /api/admin/materials/:id/process    // Process for search
GET    /api/admin/materials/:id/chunks     // View chunks

// AI Providers
GET    /api/admin/ai-providers             // List all providers
GET    /api/admin/ai-providers/:id         // Get provider
POST   /api/admin/ai-providers             // Add provider
PATCH  /api/admin/ai-providers/:id         // Update provider
DELETE /api/admin/ai-providers/:id         // Delete provider
POST   /api/admin/ai-providers/:id/test    // Test connection
POST   /api/admin/ai-providers/:id/default // Set as default

// Content Rules
GET    /api/admin/content-rules            // List rules
POST   /api/admin/content-rules            // Create rule
PATCH  /api/admin/content-rules/:id        // Update rule
DELETE /api/admin/content-rules/:id        // Delete rule

// Feature Config
GET    /api/admin/features                 // List features
PATCH  /api/admin/features/:id             // Update feature
POST   /api/admin/features/:id/preview     // Update preview content

// PDF Export
POST   /api/export/pdf                     // Generate PDF
GET    /api/export/pdf/:id                 // Download PDF
```

### 3.4 Agentic Services Configuration

```typescript
// src/config/agentic-services.ts

export const AGENTIC_SERVICES = {
  webSearch: {
    name: 'Agentic Web Search',
    internalUrl: 'http://localhost:8030',
    healthEndpoint: '/health',
    searchEndpoint: '/search',
    engine: 'duckduckgo', // Changed from Google
  },
  
  docThinker: {
    name: 'AutoDocThinker',
    internalUrl: 'http://localhost:8031',
    healthEndpoint: '/health',
    analyzeEndpoint: '/analyze',
    agents: ['retriever', 'summarizer', 'web_searcher', 'tool_router'],
  },
  
  fileSearch: {
    name: 'Agentic File Search',
    internalUrl: 'http://localhost:8032',
    healthEndpoint: '/health',
    searchEndpoint: '/search',
    mode: 'dynamic', // No pre-computed embeddings
  },
} as const;

// Cache TTLs
export const CACHE_TTL = {
  webSearch: 24 * 60 * 60, // 24 hours
  docAnalysis: 7 * 24 * 60 * 60, // 7 days
  fileSearch: 24 * 60 * 60, // 24 hours
  staticContent: 30 * 24 * 60 * 60, // 30 days
} as const;
```

## ✅ AGENT 3 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 3: ARCHITECT AGENT COMPLETE

Deliverables:
☑️ Agentic System Architecture
☑️ Database Schema (8 new tables)
☑️ 50+ AI Provider Configurations
☑️ API Design (30+ endpoints)
☑️ Service Configuration

Ready for: AGENT 4 (DESIGN AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🟢 AGENT 4: DESIGN AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Design UI components with user-friendly language and live previews.

## Deliverables

### 4.1 Feature Card with Live Preview

```tsx
// Component: Feature card showing live content preview

interface FeatureCardProps {
  featureId: string;
  displayName: string;        // User-friendly name
  description: string;
  icon: string;
  previewType: 'text' | 'image' | 'video' | 'quiz';
  previewContent: any;
  onClick: () => void;
}

/*
┌─────────────────────────────────────────────────────────────┐
│  📚 Smart Study Notes                                       │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Preview Content Area                               │   │
│  │                                                     │   │
│  │  "The Mauryan Empire (322-185 BCE) was one of     │   │
│  │   the largest empires in ancient India..."         │   │
│  │                                                     │   │
│  │  📖 3 min read • Updated today                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Get comprehensive notes on any UPSC topic                  │
│                                                             │
│  [✨ Generate Notes]                                        │
└─────────────────────────────────────────────────────────────┘
*/
```

### 4.2 Dashboard with Live Feature Previews

```
═══════════════════════════════════════════════════════════════
USER DASHBOARD (New Design with Live Previews)
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  Good Morning, Rahul! 👋                      [Profile ▾]   │
│  Continue your UPSC preparation journey                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📰 Today's Highlights                               │   │
│  │  ───────────────────────────────────────────────────  │   │
│  │  🔴 RBI Monetary Policy Update                       │   │
│  │  🔵 India-Japan Defense Agreement                    │   │
│  │  🟢 New Wildlife Sanctuary Announced                 │   │
│  │                                                      │   │
│  │  [View All Current Affairs →]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Your Study Tools                                           │
│  ───────────────────────────────────────────────────────    │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │ 📚 Study Notes    │  │ 🎬 Video Help     │              │
│  │                   │  │                   │              │
│  │ "Ancient India:   │  │ [▶ Thumbnail]     │              │
│  │  Indus Valley..." │  │ "Understanding    │              │
│  │                   │  │  Article 370"     │              │
│  │ [Create Notes]    │  │ [Watch/Create]    │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │ 🧠 Quick Quiz     │  │ 📅 Today's Plan   │              │
│  │                   │  │                   │              │
│  │ Q: Who founded    │  │ ☑ Morning: Polity │              │
│  │ the Maurya...?    │  │ ☐ Afternoon: CA   │              │
│  │ A) B) C) D)       │  │ ☐ Evening: Essay  │              │
│  │                   │  │                   │              │
│  │ [Start Quiz]      │  │ [View Schedule]   │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │ ✍️ Essay Review   │  │ 🎤 Interview Prep │              │
│  │                   │  │                   │              │
│  │ "Submit your      │  │ "Practice with    │              │
│  │  essays for AI    │  │  AI interviewer   │              │
│  │  feedback"        │  │  anytime"         │              │
│  │                   │  │                   │              │
│  │ [Submit Essay]    │  │ [Start Practice]  │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                             │
│  Your Progress This Week                                    │
│  ───────────────────────────────────────────────────────    │
│  ████████████░░░░░░░░ 65% of weekly goal                    │
│  📊 12 notes • 🎬 3 videos • 🧠 45 questions               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Admin Control Center Design

```
═══════════════════════════════════════════════════════════════
ADMIN CONTROL CENTER (Complete App Management)
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  🎛️ Admin Control Center                    [System ●Live]  │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│   SIDEBAR     │  Overview                                   │
│               │  ─────────────────────────────────────────  │
│  ▸ Dashboard  │                                             │
│  ▸ Users      │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  ▸ Content    │  │ Users   │ │ Revenue │ │ API     │       │
│  ▸ Marketing  │  │ 12,345  │ │ ₹4.5L   │ │ 98.5%   │       │
│  ▸ Features   │  │ +234 ↑  │ │ +15% ↑  │ │ Healthy │       │
│  ───────────  │  └─────────┘ └─────────┘ └─────────┘       │
│  INTELLIGENCE │                                             │
│  ▸ Materials  │  Feature Status                             │
│  ▸ AI Provid. │  ─────────────────────────────────────────  │
│  ▸ Rules      │                                             │
│  ───────────  │  │ Feature          │ Status │ Usage │      │
│  MARKETING    │  ├──────────────────┼────────┼───────┤      │
│  ▸ Leads      │  │ 📚 Study Notes   │ ●Live  │ 2.3K  │      │
│  ▸ Content    │  │ 📰 Current Aff.  │ ●Live  │ 5.1K  │      │
│  ▸ Email      │  │ 🎬 Videos        │ ●Live  │ 890   │      │
│  ▸ Ads        │  │ 🧠 Quiz          │ ●Live  │ 3.2K  │      │
│  ───────────  │  │ 🎤 Interview     │ ●Maint │ 0     │      │
│  SETTINGS     │                                             │
│  ▸ Config     │  Quick Actions                              │
│  ▸ Team       │  ─────────────────────────────────────────  │
│               │  [Upload Material] [Add Provider] [New Rule]│
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════
AI PROVIDERS MANAGEMENT PAGE
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  🤖 AI Model Providers                    [+ Add Provider]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [All] [Active] [Inactive]     🔍 Search providers...       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ACTIVE PROVIDERS                                     │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ 🟢 A4F                           ⭐ DEFAULT     │  │   │
│  │ │    api.a4f.co • 10 RPM • 2,345 requests        │  │   │
│  │ │    Models: grok-fast, kimi-thinking, sonar-pro │  │   │
│  │ │    [Configure] [Test] [Set Default] [Disable]  │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ 🟢 OpenAI                                       │  │   │
│  │ │    api.openai.com • 60 RPM • 567 requests      │  │   │
│  │ │    Models: gpt-4o, gpt-4-turbo, gpt-3.5-turbo  │  │   │
│  │ │    [Configure] [Test] [Set Default] [Disable]  │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ 🟢 Groq                                         │  │   │
│  │ │    api.groq.com • 30 RPM • 123 requests        │  │   │
│  │ │    Models: llama3-70b, mixtral-8x7b            │  │   │
│  │ │    [Configure] [Test] [Set Default] [Disable]  │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AVAILABLE PROVIDERS (Not Configured)                │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │                                                      │   │
│  │ Anthropic • Google • Mistral • Cohere • Together AI │   │
│  │ Fireworks • DeepSeek • Moonshot • Qwen • GLM        │   │
│  │ Perplexity • Ollama (Local) • LM Studio • vLLM      │   │
│  │                                                      │   │
│  │ [View All 50+ Providers →]                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════
MATERIALS LIBRARY PAGE
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  📚 Static Materials Library               [+ Upload Files] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [All] [History] [Geography] [Polity] [Economy] [Science]   │
│                                                             │
│  📁 NCERT Textbooks (Standard)                              │
│  ├── 📄 Class 6 - History (Our Pasts I)         ● Ready    │
│  ├── 📄 Class 7 - History (Our Pasts II)        ● Ready    │
│  ├── 📄 Class 8 - History (Our Pasts III)       ● Ready    │
│  ├── 📄 Class 11 - Indian Economy               ● Ready    │
│  └── 📄 Class 12 - Indian Economy               ● Ready    │
│                                                             │
│  📁 Standard Textbooks                                      │
│  ├── 📄 Indian Polity - Laxmikanth             ● Ready    │
│  ├── 📄 India's Struggle - Bipan Chandra       ⏳ Process. │
│  ├── 📄 Spectrum Modern India                   ● Ready    │
│  └── 📄 Indian Economy - Ramesh Singh          ● Ready    │
│                                                             │
│  📁 Reference Materials                                     │
│  ├── 📄 Economic Survey 2024                    ● Ready    │
│  ├── 📄 India Year Book 2024                    ⏳ Process. │
│  └── 📄 ARC Reports                             ● Ready    │
│                                                             │
│  ───────────────────────────────────────────────────────    │
│  Storage: 2.3 GB / 10 GB used                               │
│  Total Files: 45 • Processed: 42 • Pending: 3               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 PDF Export Preview

```
═══════════════════════════════════════════════════════════════
NOTES PDF EXPORT PREVIEW
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  📄 Export as PDF                             [✕ Close]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  UPSC CSE MASTER                              │  │   │
│  │  │  ─────────────────────────────────────────────│  │   │
│  │  │                                               │  │   │
│  │  │  THE MAURYAN EMPIRE                           │  │   │
│  │  │                                               │  │   │
│  │  │  1. Introduction                              │  │   │
│  │  │  The Mauryan Empire (322-185 BCE) was one    │  │   │
│  │  │  of the largest and most powerful empires    │  │   │
│  │  │  in ancient Indian history...                │  │   │
│  │  │                                               │  │   │
│  │  │  2. Key Points                                │  │   │
│  │  │  • Founded by Chandragupta Maurya            │  │   │
│  │  │  • Capital at Pataliputra                    │  │   │
│  │  │  • Greatest extent under Ashoka              │  │   │
│  │  │                                               │  │   │
│  │  │  ─────────────────────────────────────────    │  │   │
│  │  │  Sources: NCERT Class 6, Spectrum            │  │   │
│  │  │  Generated: Jan 15, 2025                     │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  Page 1 of 5                         [◀] [▶]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Options:                                                   │
│  ☑ Include Quiz Questions                                   │
│  ☑ Include Value Additions                                  │
│  ☑ Include Source Citations                                 │
│  ☐ Include Related Topics                                   │
│                                                             │
│  [📥 Download PDF]  [📧 Email PDF]  [💾 Save to Drive]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## ✅ AGENT 4 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 4: DESIGN AGENT COMPLETE

Deliverables:
☑️ Feature Card with Live Preview Design
☑️ User Dashboard with Content Previews
☑️ Admin Control Center Design
☑️ AI Providers Management Page
☑️ Materials Library Page
☑️ PDF Export Preview

Ready for: AGENT 5 (SCRUM MASTER AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🔵 AGENT 5: SCRUM MASTER AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Create sprint plan and file-by-file task breakdown.

## Deliverables

### 5.1 Sprint Plan

```markdown
## Sprint 0: Cleanup & Preparation (1 day)
- Remove RAG-Anything from codebase
- Remove RAG-Anything from VPS
- Prepare for new integrations

## Sprint 1: Agentic Services Setup (2 days)
- Install services on VPS
- Create integration clients
- Health check endpoints

## Sprint 2: Agentic Orchestrator (3 days)
- Query analysis
- Service routing
- Result aggregation
- Caching layer

## Sprint 3: Content Refiner (2 days)
- UPSC syllabus validator
- Language simplifier
- Fact checker
- Citation generator

## Sprint 4: Admin Intelligence Hub (3 days)
- Materials library
- AI provider manager
- Content rules engine

## Sprint 5: Feature Controls & Config (2 days)
- Feature toggle system
- Preview content system
- User-friendly naming

## Sprint 6: User Experience (2 days)
- Feature cards with previews
- Dashboard redesign
- PDF export

## Sprint 7: Integration & Testing (2 days)
- Connect all systems
- End-to-end testing
- Performance optimization

## Sprint 8: Review & Polish (2 days)
- PO review
- QA testing
- UX polish
- Production deployment
```

### 5.2 File-by-File Task Breakdown

```markdown
## PHASE 0: Cleanup (Remove RAG-Anything)

| # | Task | Action |
|---|------|--------|
| 0.1 | Remove RAG-Anything imports | Delete all imports |
| 0.2 | Remove RAG-Anything API calls | Delete/replace |
| 0.3 | Remove RAG-Anything components | Delete files |
| 0.4 | Update environment variables | Remove RAG vars |
| 0.5 | VPS cleanup | Remove container |

## PHASE 1: Agentic Services Integration

| # | File Path | Priority |
|---|-----------|----------|
| 1 | src/lib/agentic/orchestrator.ts | P0 |
| 2 | src/lib/agentic/web-search.ts | P0 |
| 3 | src/lib/agentic/doc-thinker.ts | P0 |
| 4 | src/lib/agentic/file-search.ts | P0 |
| 5 | src/lib/agentic/content-refiner.ts | P0 |
| 6 | src/lib/agentic/syllabus-validator.ts | P0 |
| 7 | src/lib/agentic/language-simplifier.ts | P0 |
| 8 | src/lib/agentic/citation-generator.ts | P0 |
| 9 | src/lib/agentic/cache-manager.ts | P0 |
| 10 | src/lib/agentic/types.ts | P0 |

## PHASE 2: Admin - AI Providers

| # | File Path | Priority |
|---|-----------|----------|
| 11 | src/lib/admin/ai-providers/provider-manager.ts | P0 |
| 12 | src/lib/admin/ai-providers/provider-client.ts | P0 |
| 13 | src/lib/admin/ai-providers/health-checker.ts | P0 |
| 14 | src/app/(admin)/admin/ai-providers/page.tsx | P0 |
| 15 | src/app/(admin)/admin/ai-providers/[id]/page.tsx | P0 |
| 16 | src/components/admin/ai-providers/provider-card.tsx | P0 |
| 17 | src/components/admin/ai-providers/provider-form.tsx | P0 |
| 18 | src/components/admin/ai-providers/provider-test.tsx | P0 |
| 19 | src/app/api/admin/ai-providers/route.ts | P0 |
| 20 | src/app/api/admin/ai-providers/[id]/route.ts | P0 |
| 21 | src/app/api/admin/ai-providers/[id]/test/route.ts | P0 |

## PHASE 3: Admin - Materials Library

| # | File Path | Priority |
|---|-----------|----------|
| 22 | src/lib/admin/materials/material-manager.ts | P0 |
| 23 | src/lib/admin/materials/file-processor.ts | P0 |
| 24 | src/lib/admin/materials/chunk-generator.ts | P0 |
| 25 | src/app/(admin)/admin/materials/page.tsx | P0 |
| 26 | src/app/(admin)/admin/materials/upload/page.tsx | P0 |
| 27 | src/components/admin/materials/material-list.tsx | P0 |
| 28 | src/components/admin/materials/upload-form.tsx | P0 |
| 29 | src/components/admin/materials/file-preview.tsx | P0 |
| 30 | src/app/api/admin/materials/route.ts | P0 |
| 31 | src/app/api/admin/materials/[id]/route.ts | P0 |
| 32 | src/app/api/admin/materials/[id]/process/route.ts | P0 |

## PHASE 4: Admin - Content Rules

| # | File Path | Priority |
|---|-----------|----------|
| 33 | src/lib/admin/rules/rule-engine.ts | P0 |
| 34 | src/app/(admin)/admin/content-rules/page.tsx | P0 |
| 35 | src/components/admin/rules/rule-form.tsx | P0 |
| 36 | src/components/admin/rules/rule-list.tsx | P0 |
| 37 | src/app/api/admin/content-rules/route.ts | P0 |
| 38 | src/app/api/admin/content-rules/[id]/route.ts | P0 |

## PHASE 5: Admin - Feature Controls

| # | File Path | Priority |
|---|-----------|----------|
| 39 | src/lib/admin/features/feature-manager.ts | P0 |
| 40 | src/app/(admin)/admin/features/page.tsx | P0 |
| 41 | src/components/admin/features/feature-toggle.tsx | P0 |
| 42 | src/components/admin/features/feature-config.tsx | P0 |
| 43 | src/app/api/admin/features/route.ts | P0 |
| 44 | src/app/api/admin/features/[id]/route.ts | P0 |
| 45 | src/app/api/admin/features/[id]/preview/route.ts | P0 |

## PHASE 6: Config & Types

| # | File Path | Priority |
|---|-----------|----------|
| 46 | src/config/feature-names.ts | P0 |
| 47 | src/config/agentic-services.ts | P0 |
| 48 | src/config/ai-providers.ts | P0 |
| 49 | src/types/agentic.ts | P0 |
| 50 | src/types/admin.ts | P0 |

## PHASE 7: User-Facing Updates

| # | File Path | Priority |
|---|-----------|----------|
| 51 | src/components/dashboard/feature-card.tsx | P0 |
| 52 | src/components/dashboard/feature-preview.tsx | P0 |
| 53 | src/components/dashboard/dashboard-grid.tsx | P0 |
| 54 | src/app/(app)/dashboard/page.tsx | P0 |
| 55 | src/components/notes/pdf-export.tsx | P0 |
| 56 | src/lib/export/pdf-generator.ts | P0 |
| 57 | src/app/api/export/pdf/route.ts | P0 |

## PHASE 8: Agentic API Routes

| # | File Path | Priority |
|---|-----------|----------|
| 58 | src/app/api/agentic/query/route.ts | P0 |
| 59 | src/app/api/agentic/web-search/route.ts | P0 |
| 60 | src/app/api/agentic/doc-analyze/route.ts | P0 |
| 61 | src/app/api/agentic/file-search/route.ts | P0 |
| 62 | src/app/api/agentic/refine/route.ts | P0 |

## PHASE 9: Database Migrations

| # | File Path | Priority |
|---|-----------|----------|
| 63 | prisma/migrations/add_ai_providers.sql | P0 |
| 64 | prisma/migrations/add_static_materials.sql | P0 |
| 65 | prisma/migrations/add_content_rules.sql | P0 |
| 66 | prisma/migrations/add_feature_config.sql | P0 |
| 67 | prisma/migrations/add_agentic_cache.sql | P0 |
| 68 | prisma/migrations/add_upsc_syllabus.sql | P0 |

## PHASE 10: Integration Updates

| # | File Path | Priority |
|---|-----------|----------|
| 69 | src/lib/notes/comprehensive-generator.ts | P0 - UPDATE |
| 70 | src/lib/current-affairs/ca-generator.ts | P0 - UPDATE |
| 71 | src/lib/video/script-generator.ts | P0 - UPDATE |
| 72 | src/lib/quiz/quiz-generator.ts | P0 - UPDATE |

## TOTAL FILES: 72
## ESTIMATED HOURS: ~200h
## RECOMMENDED TIMELINE: 4-5 weeks
```

## ✅ AGENT 5 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 5: SCRUM MASTER AGENT COMPLETE

Deliverables:
☑️ Sprint Plan (9 sprints)
☑️ Task Breakdown (72 files + cleanup)
☑️ Phase Organization
☑️ Priority Assignment

Ready for: AGENT 6 (DEV AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🟣 AGENT 6: DEV AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Write COMPLETE, PRODUCTION-READY code for all files.

## CRITICAL RULES

1. **PRESERVE EXISTING** - Do NOT remove existing working features
2. **NO PLACEHOLDERS** - Every function fully implemented
3. **COMPLETE IMPORTS** - All imports valid
4. **ERROR HANDLING** - Try-catch on all async
5. **USER-FRIENDLY** - No technical jargon in UI

## File Creation Order

Follow EXACT order from Agent 5's task breakdown:
1. Phase 0: Cleanup
2. Phase 1: Agentic Services (Files 1-10)
3. Phase 2: AI Providers (Files 11-21)
4. Phase 3: Materials Library (Files 22-32)
5. Phase 4: Content Rules (Files 33-38)
6. Phase 5: Feature Controls (Files 39-45)
7. Phase 6: Config & Types (Files 46-50)
8. Phase 7: User-Facing (Files 51-57)
9. Phase 8: Agentic APIs (Files 58-62)
10. Phase 9: Migrations (Files 63-68)
11. Phase 10: Integration Updates (Files 69-72)

## ✅ AGENT 6 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 6: DEV AGENT COMPLETE

Files created: 72
Lines of code: ~20,000+
Compilation: ✅ No errors

Ready for: AGENT 7 (PO AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# ⚪ AGENT 7: PO (PRODUCT OWNER) AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Review the entire application against requirements.

## Review Checklist

```markdown
## Agentic Intelligence
☐ Web search uses DuckDuckGo (not Google)
☐ AutoDocThinker processes documents correctly
☐ File search navigates materials dynamically
☐ Orchestrator routes to correct service
☐ Content refiner simplifies to 10th std
☐ Citations included in all outputs

## Admin Features
☐ All 50+ AI providers available
☐ Provider configuration works
☐ Materials upload works
☐ Materials processing works
☐ Content rules engine works
☐ Feature toggles work
☐ Marketing tools accessible

## User Experience
☐ No technical jargon visible
☐ All features show live previews
☐ Feature names are user-friendly
☐ PDF export works
☐ Dashboard shows content previews

## Existing Features (Must Work)
☐ Notes generation
☐ Current affairs
☐ Video generation (hybrid)
☐ Quiz generation
☐ Essay evaluation
☐ Mock interview
☐ All subscription features
☐ Authentication
☐ Trial system

## RAG-Anything Removal
☐ No RAG-Anything imports
☐ No RAG-Anything references
☐ VPS container removed
```

## ✅ AGENT 7 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 7: PO AGENT COMPLETE

Review Status: All items verified
Issues Found: [List any]
Approved for QA: ✅

Ready for: AGENT 8 (QA AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# ⬛ AGENT 8: QA AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Test all features thoroughly.

## Test Cases

```markdown
## Unit Tests
- [ ] Agentic orchestrator routing
- [ ] Content refiner simplification
- [ ] PDF generator output
- [ ] AI provider health check

## Integration Tests
- [ ] Web search → Orchestrator → Refiner → Output
- [ ] Doc upload → Process → Search → Results
- [ ] Material upload → Chunk → Index

## E2E Tests
- [ ] User generates notes
- [ ] User takes quiz
- [ ] Admin adds AI provider
- [ ] Admin uploads material
- [ ] Admin creates content rule

## Performance Tests
- [ ] Notes generation < 30s
- [ ] Search results < 5s
- [ ] Dashboard load < 2s
- [ ] PDF export < 10s

## Security Tests
- [ ] API keys encrypted
- [ ] Admin routes protected
- [ ] File upload validation
```

## ✅ AGENT 8 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 8: QA AGENT COMPLETE

Test Results: All passing
Bugs Fixed: [List any]
Performance: ✅ Within limits

Ready for: AGENT 9 (UX AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🔷 AGENT 9: UX AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Final UI polish for Next.js application.

## Tasks

```markdown
## UI Polish
- [ ] Consistent spacing (8px grid)
- [ ] Proper loading states with friendly messages
- [ ] Error states with helpful text
- [ ] Empty states with guidance
- [ ] Responsive design on all pages
- [ ] Proper focus states
- [ ] Smooth transitions

## Accessibility
- [ ] Proper heading hierarchy
- [ ] Alt text for images
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Color contrast

## Mobile Optimization
- [ ] Touch targets 44px minimum
- [ ] Collapsible navigation
- [ ] Swipe gestures where appropriate

## Performance
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Prefetching
```

## ✅ AGENT 9 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 9: UX AGENT COMPLETE

UI Polish: Complete
Accessibility: ✅ WCAG 2.1 AA
Mobile: ✅ Responsive
Performance: ✅ Optimized

Ready for: AGENT 10 (DEVOPS AGENT)
Type "PROCEED" to continue.
═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🔶 AGENT 10: DEVOPS AGENT
# ═══════════════════════════════════════════════════════════════════════════════

## Role
Deploy to production with proper configuration.

## Deliverables

### 10.1 VPS Service Installation Commands

```bash
#!/bin/bash
# install-agentic-services.sh
# Run on VPS: 89.117.60.144

echo "🚀 Installing Agentic Services..."

# SSH to VPS
# ssh root@89.117.60.144

# ═══════════════════════════════════════════════════════════════
# STEP 1: Remove RAG-Anything
# ═══════════════════════════════════════════════════════════════

echo "Removing RAG-Anything..."

# Stop and remove container
docker stop upsc-rag-anything 2>/dev/null || true
docker rm -f upsc-rag-anything 2>/dev/null || true

# Remove image
docker rmi upsc-rag-anything:latest 2>/dev/null || true

# Remove data
rm -rf /opt/upsc-cse-master/RAG-Anything
rm -rf /opt/upsc-cse-master/data/rag

echo "✅ RAG-Anything removed"

# ═══════════════════════════════════════════════════════════════
# STEP 2: Install Agentic Web Search (DuckDuckGo)
# ═══════════════════════════════════════════════════════════════

echo "Installing Agentic Web Search..."

mkdir -p /opt/upsc-cse-master/agentic/web-search
cd /opt/upsc-cse-master/agentic/web-search

# Clone repo
git clone https://github.com/bahathabet/agentic-search.git .

# Create Dockerfile with DuckDuckGo
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    duckduckgo-search \
    httpx \
    pydantic \
    redis

COPY . .

# Create DuckDuckGo search server
COPY server.py /app/server.py

EXPOSE 8030

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8030"]
EOF

# Create DuckDuckGo search server
cat > server.py << 'PYEOF'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from duckduckgo_search import DDGS
from typing import List, Optional
import redis
import hashlib
import json

app = FastAPI(title="Agentic Web Search - DuckDuckGo")

# Redis for caching
try:
    redis_client = redis.Redis(host='upsc-redis', port=6379, password='UPSCRedis2024Secure!', decode_responses=True)
except:
    redis_client = None

# UPSC-relevant domains to prioritize
UPSC_SOURCES = [
    "pib.gov.in",
    "prsindia.org",
    "thehindu.com",
    "indianexpress.com",
    "economictimes.indiatimes.com",
    "ncert.nic.in",
    "niti.gov.in",
    "mea.gov.in",
    "moef.gov.in",
    "drishtiias.com",
    "visionias.in",
    "insightsonindia.com",
    "iasbaba.com",
    "clearias.com",
    "unacademy.com",
]

# Domains to filter out
BLOCKED_DOMAINS = [
    "pinterest.com",
    "quora.com",
    "reddit.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "youtube.com",
]

class SearchRequest(BaseModel):
    query: str
    max_results: int = 10
    region: str = "in-en"
    time_range: Optional[str] = None  # d, w, m, y

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    is_upsc_source: bool

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    cached: bool

@app.get("/health")
def health():
    return {"status": "healthy", "service": "agentic-web-search", "engine": "duckduckgo"}

@app.post("/search", response_model=SearchResponse)
def search(request: SearchRequest):
    # Check cache
    cache_key = f"search:{hashlib.md5(request.query.encode()).hexdigest()}"
    
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            data = json.loads(cached)
            return SearchResponse(query=request.query, results=data, cached=True)
    
    try:
        # Search with DuckDuckGo
        with DDGS() as ddgs:
            # Add "UPSC" context to query for better results
            enhanced_query = f"{request.query} UPSC IAS India"
            
            raw_results = list(ddgs.text(
                enhanced_query,
                region=request.region,
                max_results=request.max_results * 2,  # Get more to filter
                timelimit=request.time_range
            ))
        
        # Process and filter results
        results = []
        for r in raw_results:
            url = r.get("href", "")
            
            # Skip blocked domains
            if any(blocked in url for blocked in BLOCKED_DOMAINS):
                continue
            
            # Check if UPSC source
            is_upsc = any(source in url for source in UPSC_SOURCES)
            
            results.append(SearchResult(
                title=r.get("title", ""),
                url=url,
                snippet=r.get("body", ""),
                source=url.split("/")[2] if "/" in url else url,
                is_upsc_source=is_upsc
            ))
            
            if len(results) >= request.max_results:
                break
        
        # Sort to prioritize UPSC sources
        results.sort(key=lambda x: (not x.is_upsc_source, results.index(x)))
        
        # Cache for 24 hours
        if redis_client:
            redis_client.setex(cache_key, 86400, json.dumps([r.dict() for r in results]))
        
        return SearchResponse(query=request.query, results=results, cached=False)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/current-affairs")
def search_current_affairs(topic: str = "today"):
    """Specialized search for current affairs"""
    sources = ["pib.gov.in", "thehindu.com", "indianexpress.com"]
    query = f"{topic} news today India {' OR '.join(sources)}"
    
    return search(SearchRequest(query=query, max_results=15, time_range="w"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8030)
PYEOF

# Build and run
docker build -t upsc-agentic-web-search:latest .

docker run -d \
  --name upsc-agentic-web-search \
  --network upsc-network \
  -p 8030:8030 \
  --restart unless-stopped \
  upsc-agentic-web-search:latest

echo "✅ Agentic Web Search installed on port 8030"

# ═══════════════════════════════════════════════════════════════
# STEP 3: Install AutoDocThinker
# ═══════════════════════════════════════════════════════════════

echo "Installing AutoDocThinker..."

mkdir -p /opt/upsc-cse-master/agentic/autodoc-thinker
cd /opt/upsc-cse-master/agentic/autodoc-thinker

# Clone repo
git clone https://github.com/Md-Emon-Hasan/AutoDocThinker.git .

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    python-multipart \
    pypdf2 \
    python-docx \
    langchain \
    openai \
    httpx \
    redis

COPY . .
COPY server.py /app/server.py

EXPOSE 8031

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8031"]
EOF

# Create server
cat > server.py << 'PYEOF'
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
from PyPDF2 import PdfReader
from docx import Document
import httpx

app = FastAPI(title="AutoDocThinker - Document RAG")

# A4F API for LLM calls
A4F_API_KEY = os.getenv("A4F_API_KEY", "ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621")
A4F_BASE_URL = "https://api.a4f.co/v1"

class AnalyzeRequest(BaseModel):
    question: str
    document_ids: Optional[List[str]] = None

class AnalyzeResponse(BaseModel):
    answer: str
    sources: List[dict]
    confidence: float

# In-memory document storage (use Redis/DB in production)
documents = {}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "autodoc-thinker"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document"""
    try:
        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Extract text based on file type
        text = ""
        file_type = file.filename.split('.')[-1].lower()
        
        if file_type == 'pdf':
            reader = PdfReader(tmp_path)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        
        elif file_type == 'docx':
            doc = Document(tmp_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        elif file_type == 'txt':
            with open(tmp_path, 'r', encoding='utf-8') as f:
                text = f.read()
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")
        
        # Clean up
        os.unlink(tmp_path)
        
        # Store document
        doc_id = f"doc_{len(documents) + 1}"
        documents[doc_id] = {
            "name": file.filename,
            "content": text,
            "chunks": chunk_text(text)
        }
        
        return {"document_id": doc_id, "name": file.filename, "chunks": len(documents[doc_id]["chunks"])}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[dict]:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    idx = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append({
            "index": idx,
            "content": chunk,
            "start": start,
            "end": min(end, len(text))
        })
        start += chunk_size - overlap
        idx += 1
    
    return chunks

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """Analyze documents to answer a question"""
    try:
        # Get relevant chunks from all documents
        all_chunks = []
        for doc_id, doc in documents.items():
            if request.document_ids is None or doc_id in request.document_ids:
                for chunk in doc["chunks"]:
                    all_chunks.append({
                        "doc_id": doc_id,
                        "doc_name": doc["name"],
                        **chunk
                    })
        
        if not all_chunks:
            raise HTTPException(status_code=400, detail="No documents available")
        
        # Simple relevance scoring (in production, use embeddings)
        query_words = set(request.question.lower().split())
        for chunk in all_chunks:
            chunk_words = set(chunk["content"].lower().split())
            chunk["relevance"] = len(query_words & chunk_words) / len(query_words) if query_words else 0
        
        # Get top relevant chunks
        all_chunks.sort(key=lambda x: x["relevance"], reverse=True)
        top_chunks = all_chunks[:5]
        
        # Build context
        context = "\n\n".join([
            f"[From {c['doc_name']}]:\n{c['content']}"
            for c in top_chunks
        ])
        
        # Call LLM
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{A4F_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {A4F_API_KEY}"},
                json={
                    "model": "provider-3/grok-4.1-fast",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a UPSC expert analyzing documents. Answer based on the provided context. Be accurate and cite sources."
                        },
                        {
                            "role": "user",
                            "content": f"Context:\n{context}\n\nQuestion: {request.question}"
                        }
                    ],
                    "max_tokens": 1500
                },
                timeout=60
            )
            
            result = response.json()
            answer = result["choices"][0]["message"]["content"]
        
        return AnalyzeResponse(
            answer=answer,
            sources=[{"doc": c["doc_name"], "relevance": c["relevance"]} for c in top_chunks],
            confidence=sum(c["relevance"] for c in top_chunks) / len(top_chunks) if top_chunks else 0
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
def list_documents():
    """List all uploaded documents"""
    return [
        {"id": doc_id, "name": doc["name"], "chunks": len(doc["chunks"])}
        for doc_id, doc in documents.items()
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8031)
PYEOF

# Build and run
docker build -t upsc-autodoc-thinker:latest .

docker run -d \
  --name upsc-autodoc-thinker \
  --network upsc-network \
  -e A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621 \
  -p 8031:8031 \
  --restart unless-stopped \
  upsc-autodoc-thinker:latest

echo "✅ AutoDocThinker installed on port 8031"

# ═══════════════════════════════════════════════════════════════
# STEP 4: Install Agentic File Search
# ═══════════════════════════════════════════════════════════════

echo "Installing Agentic File Search..."

mkdir -p /opt/upsc-cse-master/agentic/file-search
cd /opt/upsc-cse-master/agentic/file-search

# Clone repo
git clone https://github.com/PromtEngineer/agentic-file-search.git .

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    httpx \
    redis \
    pypdf2 \
    python-docx

COPY . .
COPY server.py /app/server.py

# Materials directory
RUN mkdir -p /app/materials

EXPOSE 8032

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8032"]
EOF

# Create server
cat > server.py << 'PYEOF'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
from PyPDF2 import PdfReader

app = FastAPI(title="Agentic File Search - Dynamic Navigation")

# A4F API
A4F_API_KEY = os.getenv("A4F_API_KEY", "ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621")
A4F_BASE_URL = "https://api.a4f.co/v1"

MATERIALS_DIR = "/app/materials"

class SearchRequest(BaseModel):
    query: str
    max_depth: int = 3  # How deep to explore cross-references
    material_filter: Optional[List[str]] = None

class SearchStep(BaseModel):
    action: str
    location: str
    finding: str
    relevance: float

class SearchResponse(BaseModel):
    query: str
    answer: str
    reasoning_path: List[SearchStep]
    sources: List[str]

@app.get("/health")
def health():
    return {"status": "healthy", "service": "agentic-file-search"}

@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Dynamic file search - navigates like a human"""
    try:
        # Get available materials
        materials = list_materials()
        if not materials:
            raise HTTPException(status_code=400, detail="No materials available")
        
        # Use LLM to plan search strategy
        search_plan = await plan_search(request.query, materials)
        
        # Execute search with reasoning
        reasoning_path = []
        findings = []
        
        for step in search_plan["steps"]:
            result = await execute_search_step(step, materials)
            reasoning_path.append(SearchStep(
                action=step["action"],
                location=step.get("location", ""),
                finding=result["finding"],
                relevance=result["relevance"]
            ))
            
            if result["relevance"] > 0.5:
                findings.append(result["finding"])
        
        # Synthesize answer
        answer = await synthesize_answer(request.query, findings)
        
        return SearchResponse(
            query=request.query,
            answer=answer,
            reasoning_path=reasoning_path,
            sources=[s["location"] for s in reasoning_path if s.relevance > 0.5]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def list_materials():
    """List available materials"""
    materials = []
    if os.path.exists(MATERIALS_DIR):
        for f in os.listdir(MATERIALS_DIR):
            if f.endswith(('.pdf', '.docx', '.txt')):
                materials.append({
                    "name": f,
                    "path": os.path.join(MATERIALS_DIR, f),
                    "type": f.split('.')[-1]
                })
    return materials

async def plan_search(query: str, materials: List[dict]) -> dict:
    """Use LLM to plan search strategy"""
    material_list = "\n".join([f"- {m['name']}" for m in materials])
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{A4F_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {A4F_API_KEY}"},
            json={
                "model": "provider-3/grok-4.1-fast",
                "messages": [
                    {
                        "role": "system",
                        "content": """You are a research assistant planning a search strategy.
Given a query and available materials, plan which files to search and in what order.
Output JSON: {"steps": [{"action": "search/scan/read", "location": "filename", "target": "what to look for"}]}"""
                    },
                    {
                        "role": "user",
                        "content": f"Query: {query}\n\nAvailable materials:\n{material_list}"
                    }
                ],
                "max_tokens": 500
            },
            timeout=30
        )
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Parse JSON from response
        import json
        try:
            return json.loads(content.replace("```json", "").replace("```", "").strip())
        except:
            return {"steps": [{"action": "scan", "location": materials[0]["name"] if materials else "", "target": query}]}

async def execute_search_step(step: dict, materials: List[dict]) -> dict:
    """Execute a single search step"""
    # Find the material
    material = None
    for m in materials:
        if m["name"] == step.get("location"):
            material = m
            break
    
    if not material:
        return {"finding": "Material not found", "relevance": 0}
    
    # Read content
    try:
        content = read_material(material)
        
        # Search for target
        target = step.get("target", "")
        target_words = set(target.lower().split())
        
        # Find relevant sections
        paragraphs = content.split("\n\n")
        relevant = []
        
        for para in paragraphs:
            para_words = set(para.lower().split())
            overlap = len(target_words & para_words)
            if overlap > 0:
                relevance = overlap / len(target_words) if target_words else 0
                relevant.append({"text": para[:500], "relevance": relevance})
        
        if relevant:
            relevant.sort(key=lambda x: x["relevance"], reverse=True)
            return {
                "finding": relevant[0]["text"],
                "relevance": relevant[0]["relevance"]
            }
        
        return {"finding": "No relevant content found", "relevance": 0}
    
    except Exception as e:
        return {"finding": f"Error: {str(e)}", "relevance": 0}

def read_material(material: dict) -> str:
    """Read content from a material file"""
    path = material["path"]
    
    if material["type"] == "pdf":
        reader = PdfReader(path)
        return "\n".join(page.extract_text() for page in reader.pages)
    
    elif material["type"] == "docx":
        from docx import Document
        doc = Document(path)
        return "\n".join(para.text for para in doc.paragraphs)
    
    elif material["type"] == "txt":
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    
    return ""

async def synthesize_answer(query: str, findings: List[str]) -> str:
    """Synthesize final answer from findings"""
    if not findings:
        return "No relevant information found in the available materials."
    
    context = "\n\n".join(findings)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{A4F_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {A4F_API_KEY}"},
            json={
                "model": "provider-3/grok-4.1-fast",
                "messages": [
                    {
                        "role": "system",
                        "content": "Synthesize a clear, accurate answer from the research findings. Write in simple language suitable for 10th standard students."
                    },
                    {
                        "role": "user",
                        "content": f"Query: {query}\n\nFindings:\n{context}"
                    }
                ],
                "max_tokens": 1000
            },
            timeout=30
        )
        
        result = response.json()
        return result["choices"][0]["message"]["content"]

@app.get("/materials")
def get_materials():
    """List all available materials"""
    return list_materials()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8032)
PYEOF

# Build and run
docker build -t upsc-agentic-file-search:latest .

docker run -d \
  --name upsc-agentic-file-search \
  --network upsc-network \
  -e A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621 \
  -v /opt/upsc-cse-master/data/materials:/app/materials \
  -p 8032:8032 \
  --restart unless-stopped \
  upsc-agentic-file-search:latest

echo "✅ Agentic File Search installed on port 8032"

# ═══════════════════════════════════════════════════════════════
# STEP 5: Verify all services
# ═══════════════════════════════════════════════════════════════

echo ""
echo "=== SERVICE VERIFICATION ==="
sleep 10

curl -s http://localhost:8030/health && echo " ✅ Agentic Web Search OK" || echo " ❌ Agentic Web Search FAILED"
curl -s http://localhost:8031/health && echo " ✅ AutoDocThinker OK" || echo " ❌ AutoDocThinker FAILED"
curl -s http://localhost:8032/health && echo " ✅ Agentic File Search OK" || echo " ❌ Agentic File Search FAILED"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ ALL AGENTIC SERVICES INSTALLED"
echo ""
echo "Services:"
echo "  • Agentic Web Search: http://89.117.60.144:8030"
echo "  • AutoDocThinker:     http://89.117.60.144:8031"
echo "  • Agentic File Search: http://89.117.60.144:8032"
echo ""
echo "RAG-Anything: REMOVED"
echo "═══════════════════════════════════════════════════════════════"
```

### 10.2 Production Environment Variables

```bash
# Add to .env.production

# ═══════════════════════════════════════════════════════════════
# PRODUCTION ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════════════

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Database
DATABASE_URL=postgresql://postgres:UPSCMaster2024SecureDB!@89.117.60.144:5432/upsc_master

# Redis
REDIS_URL=redis://:UPSCRedis2024Secure!@89.117.60.144:6379

# MinIO
S3_ENDPOINT=http://89.117.60.144:9000
S3_ACCESS_KEY=upscadmin
S3_SECRET_KEY=UPSCMinio2024SecureStorage!
S3_BUCKET=uploads

# A4F API (Primary AI Provider)
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1

# Agentic Services
AGENTIC_WEB_SEARCH_URL=http://89.117.60.144:8030
AGENTIC_DOC_THINKER_URL=http://89.117.60.144:8031
AGENTIC_FILE_SEARCH_URL=http://89.117.60.144:8032

# Marketing Services
MAUTIC_URL=http://89.117.60.144:8025
MIXPOST_URL=http://89.117.60.144:8020
LISTMONK_URL=http://89.117.60.144:9090
LISTMONK_USERNAME=admin
LISTMONK_PASSWORD=UPSCListmonk2024!

# Analytics
PLAUSIBLE_URL=http://89.117.60.144:8021
PLAUSIBLE_SITE_ID=upsc-cse-master

# n8n
N8N_URL=http://89.117.60.144:5678

# Video Services
MANIM_URL=http://89.117.60.144:8010
REMOTION_URL=http://89.117.60.144:8012
FFMPEG_URL=http://89.117.60.144:8013

# Payments
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Encryption Key (for API keys in DB)
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
```

### 10.3 RAG-Anything Removal from VPS

```bash
# Run this to completely remove RAG-Anything from VPS

# Stop container
docker stop upsc-rag-anything 2>/dev/null || true

# Remove container
docker rm -f upsc-rag-anything 2>/dev/null || true

# Remove image
docker rmi upsc-rag-anything:latest 2>/dev/null || true

# Remove all RAG-Anything related images
docker images | grep rag | awk '{print $3}' | xargs -r docker rmi -f

# Remove data directory
rm -rf /opt/upsc-cse-master/RAG-Anything
rm -rf /opt/upsc-cse-master/data/rag

# Remove from docker-compose if exists
sed -i '/rag-anything/d' /opt/upsc-cse-master/configs/*.yml 2>/dev/null || true

# Verify removal
echo "Checking for RAG-Anything remnants..."
docker ps -a | grep rag && echo "⚠️ RAG containers still exist" || echo "✅ No RAG containers"
docker images | grep rag && echo "⚠️ RAG images still exist" || echo "✅ No RAG images"
ls /opt/upsc-cse-master/ | grep -i rag && echo "⚠️ RAG directories still exist" || echo "✅ No RAG directories"

echo ""
echo "✅ RAG-Anything completely removed from VPS"
```

## ✅ AGENT 10 CHECKPOINT

```
═══════════════════════════════════════════════════════════════
✅ AGENT 10: DEVOPS AGENT COMPLETE

🎉 DEPLOYMENT COMPLETE!

Services Installed:
✅ Agentic Web Search (DuckDuckGo) → :8030
✅ AutoDocThinker (Document RAG) → :8031
✅ Agentic File Search (Dynamic) → :8032

Services Removed:
❌ RAG-Anything (container + data)

Environment:
✅ Production .env configured
✅ All credentials set
✅ Encryption keys generated

Access URLs:
• Main App: https://your-domain.com
• Admin Panel: https://your-domain.com/admin

═══════════════════════════════════════════════════════════════
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 QUICK START FOR AI IDE
# ═══════════════════════════════════════════════════════════════════════════════

## Copy this to start building:

```
Read the UPSC_AGENTIC_ADMIN_MASTER_PROMPT.md file.

This is a BMAD Master Prompt for adding Agentic Intelligence and Admin enhancements.

Execute the 10 agents in EXACT order:
1. ANALYST - Requirements
2. PM - User Stories
3. ARCHITECT - System Design
4. DESIGN - UI/UX
5. SCRUM MASTER - Task Breakdown
6. DEV - Write Code (72 files)
7. PO - Product Review
8. QA - Testing
9. UX - Final Polish
10. DEVOPS - Deployment

CRITICAL RULES:
- DO NOT remove existing working features
- Replace RAG-Anything with Agentic systems
- Use user-friendly names (no technical jargon)
- All content must be UPSC syllabus aligned
- Create PDF export capability
- Show live previews on feature cards

Start with AGENT 1: ANALYST now.
```

---

# END OF MASTER PROMPT
