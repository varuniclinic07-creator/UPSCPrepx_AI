# BMAD Phase 4 - Feature F14: Bookmarks & Spaced Repetition

## Master Prompt v8.0 Compliance
- **READ Mode Feature** (Section 5 - Core Learning Features)
- **Bilingual**: English + Hindi throughout
- **Mobile-first**: 360px viewport support

---

## 1. Feature Overview

### 1.1 Purpose
Enhance retention through:
- **Smart Bookmarks**: Snippets from Notes, PDFs, CA, Videos.
- **Spaced Repetition**: Automated review schedule (SM-2 algorithm).
- **Review Mode**: Flashcard-style active recall sessions.

### 1.2 User Stories

#### US-F14-01: Save Bookmarks
**As a** student  
**I want to** bookmark text/images  
**So that** I can save them  

**Acceptance Criteria:**
- Support text, images, context links
- Tags: #Important, #Confused, #Revision

#### US-F14-02: Smart Reviews (SRS)
**As a** student  
**I want** the app to schedule reviews  
**So that** I don't forget  

**Acceptance Criteria:**
- SM-2 Algorithm (Interval, Ease Factor)
- Push/In-app notifications: "5 bookmarks due"

#### US-F14-03: Flashcard Mode
**As a** student  
**I want** a quiz mode  
**So that** I test memory  

**Acceptance Criteria:**
- Show Snippet -> Reveal Context
- Rate: Hard, Good, Easy
- Update next review date based on rating

#### US-F14-04: Stats
**As a** student  
**I want** to see my retention  
**So that** I track progress  

**Acceptance Criteria:**
- Heatmap of reviews
- Retention % over time

---

## 2. Database Schema

### 2.1 Tables
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  source_type TEXT, -- 'NOTE', 'PDF', 'CA_ARTICLE'
  source_id UUID,
  content TEXT NOT NULL,
  front_content TEXT, -- For flashcards
  back_content TEXT,
  context_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE srs_stats (
  bookmark_id UUID REFERENCES bookmarks(id) PRIMARY KEY,
  interval_days INT DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  repetitions INT DEFAULT 0,
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  lapses INT DEFAULT 0
);
```

---

## 3. API Endpoints

### 3.1 POST /api/bookmarks
Save a new bookmark.

### 3.2 POST /api/bookmarks/review
Submit a review (Hard/Good/Easy). Updates SRS.

### 3.3 GET /api/bookmarks/due
Get bookmarks due for review today.

---

## 4. UI Components

### 4.1 ReviewSession.tsx
- Full-screen flashcard interface
- Swipe/Buttons for rating

### 4.2 BookmarkContext.tsx
- Quick add bookmark toolbar

### 4.3 DashboardWidget.tsx
- "Due for Review: 12"
- Mini heatmap
