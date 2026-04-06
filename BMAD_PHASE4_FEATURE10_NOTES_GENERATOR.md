# BMAD Phase 4: Feature 10 - Agentic Notes Generator & Library
## Enterprise-Grade Notes System (Like Unacademy)

**Version**: 1.0  
**Date**: 2026-04-05  
**Status**: 🟢 IMPLEMENTATION  
**Goal**: Ready-to-use notes library + AI-powered notes generation with Agentic Intelligence

---

## 🎯 CRITICAL REQUIREMENTS (From User)

### 1. Ready-to-Use Notes Library (Like Unacademy)
- Pre-existing notes users can browse immediately
- Categorized by subject (GS1, GS2, GS3, GS4, CSAT, Essay)
- Searchable notes database
- PDF download for all notes
- No "dummy" or empty features

### 2. Agentic Intelligence (NOT Basic RAG)
| System | Source | Purpose |
|--------|--------|---------|
| **Agentic Web Search** | github.com/bahathabet/agentic-search | Live web search for current affairs |
| **AutoDocThinker** | github.com/Md-Emon-Hasan/AutoDocThinker | Document RAG with multi-agent |
| **Agentic File Search** | github.com/PromtEngineer/agentic-file-search | Dynamic document navigation |

### 3. AI Provider Settings (CRITICAL - User Specified)
```
Priority Order: 9Router → Groq → Ollama
DO NOT USE: A4F (from uploaded file - user specifically said NOT to use)
```

| Provider | Model | Priority |
|----------|-------|----------|
| 9Router | `upsc` | Primary |
| Groq | `groq/llama-3.3-70b-versatile` | Fallback 1 (7-key rotation) |
| Ollama | `qwen3.5:397b-cloud` | Fallback 2 |

### 4. Admin Features Required
- Materials Library (upload/manage static study materials)
- AI Provider Manager (configure providers)
- Content Rules Engine (accuracy rules)
- Feature Controls (enable/disable)

---

## 📋 FEATURE SPECIFICATION (Original - Unchanged)

```
Feature 10: Static & Animated Notes Generator

What it does
* Ready to available as well as search to Generate short and comprehensive long notes, PDF export, and animated diagrams for each topic.

Sub-features
* Multiple brevity levels (100/250/500 words), bullet points, memory tips.

Inputs / Outputs
* Input: topic or URL/book chapter.
* Output: PDFs, markdown, Manim diagrams & short videos.

Revideo / Manim
* Manim for diagrams; Revideo only for short video summaries.

Monetization
* Notes store; subscription for full notes set.

Complexity
* Medium
```

**PLUS: Ready-to-Use Notes Library (Like Unacademy)**
- Browse existing notes by subject/topic
- Search notes database
- Download PDFs
- Bookmark/favorite notes

---

## 🏗️ TECHNICAL ARCHITECTURE

### Agentic Intelligence Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
│  "Generate notes on Indian Constitution"                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  AGENTIC ORCHESTRATOR                        │
│  Routes to appropriate agentic system based on query        │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│  AGENTIC WEB    │  │  AUTODOC    │  │   AGENTIC       │
│  SEARCH         │  │  THINKER    │  │   FILE SEARCH   │
│  (DuckDuckGo)   │  │  (Doc RAG)  │  │   (Navigate)    │
│                 │  │             │  │                 │
│  For: Current   │  │  For:       │  │  For: Static    │
│  Affairs, Live  │  │  Uploaded   │  │  Materials      │
│  Data           │  │  Documents  │  │  (NCERTs, etc)  │
└────────┬────────┘  └──────┬──────┘  └────────┬────────┘
         │                  │                   │
         └──────────────────┼───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI PROVIDER (9Router → Groq → Ollama)       │
│  - Content Generation                                        │
│  - Language Simplification (10th std)                        │
│  - Summarization                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTENT REFINER                             │
│  - UPSC Syllabus Filter                                      │
│  - Source Citation                                           │
│  - Accuracy Check                                            │
│  - PDF Formatting                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  FINAL OUTPUT                                │
│  - Comprehensive Notes (HTML/Markdown)                       │
│  - PDF Download                                              │
│  - Manim Diagrams (optional)                                 │
│  - Video Summary (optional)                                  │
│  - Quiz Questions                                            │
│  - Sources/Citations                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 FILES TO CREATE

### Database Migration
- [ ] `supabase/migrations/019_notes_library_and_generator.sql`

### Agentic Services
- [ ] `src/lib/agentic/agentic-orchestrator.ts`
- [ ] `src/lib/agentic/web-search-client.ts`
- [ ] `src/lib/agentic/autodoc-client.ts`
- [ ] `src/lib/agentic/file-search-client.ts`

### Notes Generator
- [ ] `src/lib/notes/agentic-notes-generator.ts`
- [ ] `src/lib/notes/pdf-generator.ts`
- [ ] `src/lib/notes/brevity-controller.ts`

### API Endpoints
- [ ] `src/app/api/notes/generate/route.ts`
- [ ] `src/app/api/notes/library/route.ts`
- [ ] `src/app/api/notes/[id]/pdf/route.ts`
- [ ] `src/app/api/notes/[id]/route.ts`

### UI Components
- [ ] `src/components/notes/notes-library.tsx`
- [ ] `src/components/notes/notes-generator-form.tsx`
- [ ] `src/components/notes/notes-viewer.tsx`
- [ ] `src/components/notes/notes-card.tsx`
- [ ] `src/components/notes/pdf-download-button.tsx`

### Admin Components
- [ ] `src/components/admin/materials-library.tsx`
- [ ] `src/components/admin/ai-provider-manager.tsx`
- [ ] `src/components/admin/content-rules.tsx`

---

## 🗄️ DATABASE SCHEMA

```sql
-- Notes Library (ready-to-use notes like Unacademy)
CREATE TABLE notes_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  topic VARCHAR(500) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  sub_subject VARCHAR(100),
  content_markdown TEXT NOT NULL,
  content_html TEXT,
  brevity_level VARCHAR(50) DEFAULT 'comprehensive',
  word_count INTEGER,
  pdf_url TEXT,
  thumbnail_url TEXT,
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes tags (many-to-many)
CREATE TABLE notes_tags (
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  tag VARCHAR(100),
  PRIMARY KEY (note_id, tag)
);

-- Notes syllabus mapping
CREATE TABLE notes_syllabus_mapping (
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  syllabus_code VARCHAR(100),
  syllabus_topic TEXT,
  PRIMARY KEY (note_id, syllabus_code)
);

-- Notes sources/citations
CREATE TABLE notes_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  source_name VARCHAR(255),
  source_url TEXT,
  source_type VARCHAR(50),
  page_number INTEGER,
  chapter VARCHAR(255)
);

-- User bookmarks for notes
CREATE TABLE user_notes_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, note_id)
);

-- User notes (generated by users)
CREATE TABLE user_generated_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(500) NOT NULL,
  brevity_level VARCHAR(50),
  content_markdown TEXT,
  content_html TEXT,
  pdf_url TEXT,
  status VARCHAR(50) DEFAULT 'processing',
  agentic_sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin: Static Materials Library
CREATE TABLE admin_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  subject VARCHAR(100),
  category VARCHAR(100),
  file_type VARCHAR(50),
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  page_count INTEGER,
  description TEXT,
  is_standard BOOLEAN DEFAULT true,
  is_reference BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin: AI Provider Configuration
CREATE TABLE admin_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50),
  base_url TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  rate_limit_rpm INTEGER,
  rate_limit_concurrent INTEGER,
  default_model VARCHAR(100),
  config JSONB DEFAULT '{}',
  last_tested_at TIMESTAMP WITH TIME ZONE,
  is_healthy BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin: Content Rules
CREATE TABLE admin_content_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50),
  rule_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX notes_library_subject_idx ON notes_library(subject);
CREATE INDEX notes_library_topic_idx ON notes_library USING GIN(to_tsvector('english', topic));
CREATE INDEX notes_library_content_idx ON notes_library USING GIN(to_tsvector('english', content_markdown));
CREATE INDEX notes_tags_idx ON notes_tags(tag);
CREATE INDEX user_notes_bookmarks_user_idx ON user_notes_bookmarks(user_id);
CREATE INDEX admin_materials_subject_idx ON admin_materials(subject);
```

---

## 🚀 IMPLEMENTATION PLAN

### Day 1: Database + Agentic Services
- [ ] Create migration 019
- [ ] Apply to Supabase
- [ ] Create agentic orchestrator
- [ ] Test agentic services connection

### Day 2: Notes Generator Core
- [ ] Create agentic notes generator
- [ ] Implement brevity control
- [ ] Add PDF generation
- [ ] Create API endpoint

### Day 3: Notes Library (Ready-to-Use)
- [ ] Seed initial notes (50+ UPSC topics)
- [ ] Create notes library UI
- [ ] Add search/filter
- [ ] Add PDF download

### Day 4: Admin Features
- [ ] Materials library admin UI
- [ ] AI provider manager
- [ ] Content rules engine

### Day 5: Testing + Polish
- [ ] Test full flow
- [ ] Fix bugs
- [ ] Performance optimization
- [ ] Deploy to Coolify

---

## ✅ SUCCESS CRITERIA

- [ ] 50+ ready-to-use notes available in library
- [ ] Notes generation uses Agentic Intelligence (not basic RAG)
- [ ] AI Provider: 9Router → Groq → Ollama (NOT A4F)
- [ ] PDF download works for all notes
- [ ] Admin can upload materials
- [ ] Admin can configure AI providers
- [ ] No "dummy" or empty features
- [ ] Looks enterprise-grade (like Unacademy)

---

**Ready to implement!**
