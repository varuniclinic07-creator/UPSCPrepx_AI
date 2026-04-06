# BMAD Phase 4 - Feature F12: PDF Reader + Annotations

## Master Prompt v8.0 Compliance
- **READ Mode Feature** (Section 5 - Core Learning Features)
- **AI Provider**: 9Router → Groq → Ollama (for note generation)
- **Rule 3**: SIMPLIFIED_LANGUAGE_PROMPT for all user-facing content
- **Bilingual**: English + Hindi throughout
- **Mobile-first**: 360px viewport support

---

## 1. Feature Overview

### 1.1 Purpose
Native PDF reading experience with:
- Annotation tools (Highlight, Underline, Sticky Note, Drawing)
- Text search within PDF
- AI-generated summaries of selected text
- Reading progress tracking
- Bilingual UI

### 1.2 User Stories

#### US-F12-01: Read & Annotate PDFs
**As a** UPSC aspirant  
**I want to** highlight and annotate PDFs  
**So that** I can mark important points  

**Acceptance Criteria:**
- `react-pdf` rendering engine
- Multi-colored highlights
- Sticky notes with text
- Undo/Redo support

#### US-F12-02: Search & Navigate
**As a** user  
**I want to** search text inside the PDF  
**So that** I can find concepts quickly  

**Acceptance Criteria:**
- Ctrl+F style search
- Highlight matches in document
- Jump to match location

#### US-F12-03: AI Summarization
**As a** user  
**I want** AI to summarize my highlights  
**So that** I can review quickly  

**Acceptance Criteria:**
- "Summarize Highlights" button
- AI generates concise notes from highlights
- Exportable to Notes Library

#### US-F12-04: Track Progress
**As a** user  
**I want** to see how much I've read  
**So that** I stay motivated  

**Acceptance Criteria:**
- Percentage complete display
- Resume reading feature
- Integration with Study Planner (F8)

---

## 2. Database Schema

### 2.1 Tables

```sql
-- PDF Documents Metadata
CREATE TABLE pdf_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_url TEXT,
  storage_path TEXT, -- Supabase Storage path
  total_pages INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotations (Highlights, Notes, etc.)
CREATE TABLE pdf_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  page_index INTEGER NOT NULL,
  type TEXT CHECK (type IN ('highlight', 'underline', 'note', 'drawing')),
  content TEXT, -- Text content for highlights/notes
  color TEXT, -- Hex color for highlights
  position JSONB, -- Coordinates {x, y, width, height}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Progress
CREATE TABLE pdf_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
  last_page INTEGER DEFAULT 0,
  percentage_completed NUMERIC(5,2) DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);
```

---

## 3. API Endpoints

### 3.1 POST /api/pdf/upload
Upload PDF document.
Request: Form Data (File, Title)
Response: `{ document_id, storage_url }`

### 3.2 GET /api/pdf/documents
List user's PDF documents.

### 3.3 POST /api/pdf/annotations
Save annotation.
Request: `{ document_id, type, content, color, position, page_index }`

### 3.4 GET /api/pdf/annotations?document_id=...
Get annotations for a document.

### 3.5 POST /api/pdf/ai-summarize
Summarize highlights.
Request: `{ highlights_text[] }`
Response: `{ summary_text }`

---

## 4. UI Components

### 4.1 PDF Reader Page
- Main viewer area (`react-pdf`)
- Toolbar (Zoom, Page, Tools)
- Annotation Sidebar
- Search Overlay

### 4.2 Toolbar
- Page navigation
- Zoom controls
- Annotation tools
- Theme toggle (Dark/Light)

### 4.3 Annotation Layer
- Canvas overlay for drawing/highlighting
- Note popups

### 4.4 Document List
- Grid of uploaded PDFs
- Progress bars
- Quick access

---

## 5. Security

- RLS policies for user isolation
- Virus scanning on upload (via Edge Function)
- Copyright compliance checks

---

## 6. Implementation Checklist

- [ ] BMAD Specification
- [ ] Database Migration (030)
- [ ] PDF Upload API
- [ ] Annotation Services
- [ ] UI Components
- [ ] Reader Page
- [ ] AI Summarization
- [ ] Master Prompt Compliance

---

**Total Estimated**: 20-25 files, ~7,000+ lines
