# BMAD Phase 4: Feature F6 - Instant Mains Evaluator

## 🎯 Feature Specification (Master Prompt v8.0 - Section 5)

### Overview
**Instant Mains Answer Evaluation** - KILLER FEATURE
- Response Time: <60 seconds
- 4 Scoring Criteria: Structure, Content, Analysis, Presentation
- AI Evaluation: With SIMPLIFIED_LANGUAGE_PROMPT
- Bilingual: English + Hindi feedback
- Answer Storage: For progress tracking
- TipTap Editor: Rich text answer writing

---

## 📊 User Stories

### US-F6-1: Write Answer
**As a** UPSC aspirant  
**I want to** write answers in a rich text editor  
**So that** I can practice mains answer writing with proper formatting

**Acceptance Criteria:**
- TipTap editor with formatting toolbar
- Word counter (target: 150-250 words for 10 markers)
- Timer (target: 7-8 minutes for 10 markers)
- Auto-save every 30 seconds
- Bilingual UI (EN+HI)

### US-F6-2: Get Instant Evaluation
**As a** UPSC aspirant  
**I want to** get AI evaluation in <60 seconds  
**So that** I know my answer quality immediately

**Acceptance Criteria:**
- 4 scoring criteria (0-10 each)
- Overall score (0-40, converted to 0-100)
- Strengths identification
- Areas for improvement
- Model answer points
- Bilingual feedback (EN+HI)

### US-F6-3: View Evaluation History
**As a** UPSC aspirant  
**I want to** see my past evaluations  
**So that** I can track my improvement over time

**Acceptance Criteria:**
- List of all answered questions
- Score trend visualization
- Filter by subject (GS1, GS2, GS3, GS4)
- Filter by date range
- Export progress report

### US-F6-4: Rate Evaluation Quality
**As a** UPSC aspirant  
**I want to** rate the AI evaluation  
**So that** the system can improve

**Acceptance Criteria:**
- 5-star rating
- Optional feedback text
- "Was this helpful?" thumbs up/down

---

## 🏗️ Technical Architecture

### Database Schema (Migration 022)

```sql
-- Question Bank
mains_questions (
  id uuid PK,
  question_text text NOT NULL,
  question_text_hi text,
  subject gs_subject NOT NULL, -- GS1, GS2, GS3, GS4
  topic text,
  marks integer DEFAULT 10, -- 10 or 15
  word_limit integer DEFAULT 250,
  time_limit_min integer DEFAULT 7,
  syllabus_node_id uuid FK,
  year integer, -- PYQ year
  is_pyd boolean DEFAULT false,
  difficulty difficulty_level,
  created_at timestamptz,
  updated_at timestamptz
);

-- User Answers
mains_answers (
  id uuid PK,
  user_id uuid FK NOT NULL,
  question_id uuid FK NOT NULL,
  answer_text text NOT NULL,
  word_count integer,
  time_taken_sec integer,
  status answer_status DEFAULT 'submitted', -- draft, submitted, evaluated
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE(user_id, question_id, created_at)
);

-- AI Evaluations
mains_evaluations (
  id uuid PK,
  answer_id uuid FK NOT NULL UNIQUE,
  structure_score integer NOT NULL, -- 0-10
  content_score integer NOT NULL, -- 0-10
  analysis_score integer NOT NULL, -- 0-10
  presentation_score integer NOT NULL, -- 0-10
  overall_score integer NOT NULL, -- 0-40
  overall_percentage integer NOT NULL, -- 0-100
  strengths text[], -- AI-generated
  improvements text[], -- AI-generated
  model_answer_points text[], -- Key points to include
  feedback_en text, -- Detailed feedback English
  feedback_hi text, -- Detailed feedback Hindi
  evaluation_time_sec integer, -- AI response time
  ai_model_used text,
  created_at timestamptz DEFAULT now()
);

-- User Feedback on Evaluations
mains_feedback (
  id uuid PK,
  evaluation_id uuid FK NOT NULL UNIQUE,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  was_helpful boolean,
  feedback_text text,
  created_at timestamptz DEFAULT now()
);

-- Enums
CREATE TYPE gs_subject AS ENUM ('GS1', 'GS2', 'GS3', 'GS4', 'Essay');
CREATE TYPE answer_status AS ENUM ('draft', 'submitted', 'evaluated');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
```

### Scoring Rubric

| Criteria | Weight | Description |
|----------|--------|-------------|
| **Structure** | 25% | Introduction, Body, Conclusion flow |
| **Content** | 25% | Factual accuracy, relevance, coverage |
| **Analysis** | 25% | Critical thinking, multiple perspectives |
| **Presentation** | 25% | Clarity, examples, diagrams mention |

### AI Evaluation Prompt Template

```typescript
const EVALUATION_PROMPT = `
You are an expert UPSC Mains evaluator with 15+ years of experience.

CRITICAL LANGUAGE RULES — FOLLOW STRICTLY:
1. Write for a 10th-class student. One reading = full understanding.
2. No jargon without explanation. Technical terms get parenthetical definitions.
3. Real-life Indian examples for every concept.
4. Analogies. Ex: "Constitution = rulebook of cricket."
5. Max 15 words per sentence. Break long ideas into multiple sentences.
6. Mnemonics. Ex: "6 Fundamental Rights = REFCEP"
7. Exam tips. Ex: "EXAM TIP: Asked in UPSC 2023 Prelims."
8. If Hindi: use simple Hindi (Hinglish acceptable for clarity).

QUESTION:
{question_text}

SUBJECT: {subject}
MARKS: {marks}
WORD LIMIT: {word_limit}

STUDENT ANSWER:
{answer_text}

WORD COUNT: {word_count}

EVALUATE ON 4 CRITERIA (0-10 each):

1. STRUCTURE (0-10):
   - Clear introduction with context?
   - Logical body with headings/sub-headings?
   - Balanced conclusion with way forward?
   Score: __

2. CONTENT (0-10):
   - Factual accuracy?
   - Relevant to question demand?
   - Coverage of all dimensions?
   Score: __

3. ANALYSIS (0-10):
   - Critical thinking shown?
   - Multiple perspectives (political, social, economic)?
   - Interlinking of concepts?
   Score: __

4. PRESENTATION (0-10):
   - Clarity of expression?
   - Examples (Indian context preferred)?
   - Mention of diagrams/flowcharts?
   Score: __

OVERALL SCORE: __/40 (__%)

STRENGTHS (3-5 points):
- ...

AREAS FOR IMPROVEMENT (3-5 points):
- ...

MODEL ANSWER POINTS (5-7 key points to include):
- ...

DETAILED FEEDBACK (English, 150-200 words):
...

DETAILED FEEDBACK (Hindi, 150-200 words):
...

EXAM TIP:
...

RESPONSE TIME TARGET: <30 seconds
`;
```

---

## 🔌 API Endpoints

### POST /api/eval/mains/submit
**Request:**
```json
{
  "question_id": "uuid",
  "answer_text": "...",
  "word_count": 245,
  "time_taken_sec": 420
}
```

**Response:**
```json
{
  "answer_id": "uuid",
  "evaluation": {
    "structure_score": 8,
    "content_score": 7,
    "analysis_score": 6,
    "presentation_score": 8,
    "overall_score": 29,
    "overall_percentage": 73,
    "strengths": ["..."],
    "improvements": ["..."],
    "model_answer_points": ["..."],
    "feedback_en": "...",
    "feedback_hi": "...",
    "evaluation_time_sec": 12
  }
}
```

### GET /api/eval/mains/history
**Query Params:** `?subject=GS1&from=2026-01-01&to=2026-04-06&page=1&limit=20`

**Response:**
```json
{
  "evaluations": [...],
  "pagination": { "page": 1, "total": 50, "hasMore": true },
  "stats": {
    "average_score": 68,
    "total_answered": 50,
    "trend": "improving"
  }
}
```

### GET /api/eval/mains/:id
**Response:** Single evaluation with full details

---

## 🎨 UI Components

### 1. MainsAnswerEditor (TipTap)
- Rich text toolbar (bold, italic, underline, lists)
- Word counter (live)
- Timer (countdown/countup)
- Auto-save indicator
- Submit button
- Keyboard shortcuts (Ctrl+S save, Ctrl+Enter submit)

### 2. MainsQuestionCard
- Question text (EN+HI toggle)
- Subject badge (color-coded)
- Marks & word limit
- Time limit
- Syllabus tag
- PYQ year badge (if applicable)

### 3. MainsEvaluationResult
- Overall score (large display)
- 4-criteria radar chart
- Strengths (green cards)
- Improvements (orange cards)
- Model answer points (blue cards)
- Detailed feedback (EN+HI tabs)
- Exam tip (highlighted box)

### 4. MainsHistoryList
- List of past evaluations
- Score trend line chart
- Filter by subject/date
- Click to view details
- Export button (PDF)

### 5. MainsScoreCard
- 4 criteria scores (radial bars)
- Percentage display
- Comparison with average
- Improvement arrow

---

## 📁 File Structure

```
src/
├── lib/
│   └── eval/
│       ├── mains-evaluator-service.ts
│       ├── scoring-rubric.ts
│       └── feedback-generator.ts
├── components/
│   └── eval/
│       ├── mains-answer-editor.tsx
│       ├── mains-question-card.tsx
│       ├── mains-evaluation-result.tsx
│       ├── mains-history-list.tsx
│       └── mains-score-card.tsx
└── app/
    ├── api/
    │   └── eval/
    │       └── mains/
    │           ├── submit/
    │           │   └── route.ts
    │           ├── history/
    │           │   └── route.ts
    │           └── [id]/
    │               └── route.ts
    └── (dashboard)/
        └── answer-practice/
            ├── page.tsx
            └── [id]/
                └── page.tsx
```

---

## ✅ Acceptance Criteria

### Functional
- [ ] User can select a question from question bank
- [ ] User can write answer in TipTap editor
- [ ] Word counter updates live
- [ ] Timer shows elapsed time
- [ ] Auto-save every 30 seconds
- [ ] Submit triggers AI evaluation
- [ ] Evaluation completes in <60 seconds
- [ ] 4 criteria scores displayed (0-10 each)
- [ ] Strengths and improvements shown
- [ ] Model answer points provided
- [ ] Bilingual feedback (EN+HI)
- [ ] User can rate evaluation
- [ ] History shows all past evaluations
- [ ] Score trend visualization

### Non-Functional
- [ ] Mobile-responsive (360px viewport)
- [ ] Bilingual toggle on all pages
- [ ] SIMPLIFIED_LANGUAGE_PROMPT enforced
- [ ] AI Provider: 9Router → Groq → Ollama
- [ ] RLS enabled on all tables
- [ ] Error boundaries on all pages
- [ ] Skeleton loaders (not spinners)
- [ ] Retry logic on API calls

---

## 🧪 Testing Strategy

### Unit Tests
- Scoring rubric calculation
- Word count validation
- Timer functionality
- AI prompt generation

### Integration Tests
- Submit answer → Get evaluation flow
- History pagination
- Filter by subject/date

### E2E Tests
- Complete answer writing flow
- Evaluation display
- Rating submission

### Performance Tests
- <60s evaluation response time
- Auto-save reliability
- Large answer handling (500+ words)

---

## 🚀 Implementation Tasks

### Task 1: Database Migration
- [ ] Create mains_questions table
- [ ] Create mains_answers table
- [ ] Create mains_evaluations table
- [ ] Create mains_feedback table
- [ ] Create enums (gs_subject, answer_status, difficulty_level)
- [ ] Enable RLS + policies
- [ ] Seed 100+ questions (GS1-GS4, PYQs)

### Task 2: Evaluation Service
- [ ] Create scoring-rubric.ts
- [ ] Create mains-evaluator-service.ts
- [ ] Create feedback-generator.ts
- [ ] Implement SIMPLIFIED_LANGUAGE_PROMPT
- [ ] Implement 9Router → Groq → Ollama fallback
- [ ] Add response time tracking

### Task 3: API Routes
- [ ] POST /api/eval/mains/submit
- [ ] GET /api/eval/mains/history
- [ ] GET /api/eval/mains/:id
- [ ] POST /api/eval/mains/:id/feedback

### Task 4: UI Components
- [ ] MainsAnswerEditor (TipTap)
- [ ] MainsQuestionCard
- [ ] MainsEvaluationResult
- [ ] MainsHistoryList
- [ ] MainsScoreCard

### Task 5: Pages
- [ ] /answer-practice (main page)
- [ ] /answer-practice/[id] (single question)

### Task 6: Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Evaluation Time | <60s | API response time |
| User Satisfaction | >4.0/5.0 | Rating average |
| Daily Active Users | >500 | /answer-practice visits |
| Answer Completion Rate | >70% | Submitted / Started |
| Score Improvement | >10% in 30 days | User trend analysis |

---

**Master Prompt v8.0 Compliant** ✅  
**AI Provider: 9Router → Groq → Ollama (NOT A4F)** ✅  
**SIMPLIFIED_LANGUAGE_PROMPT Enforced** ✅  
**Bilingual (EN+HI)** ✅  
**Mobile-First (360px)** ✅
