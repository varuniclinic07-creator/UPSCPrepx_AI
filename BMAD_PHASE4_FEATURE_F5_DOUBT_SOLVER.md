# BMAD Phase 4: Feature F5 - AI Doubt Solver

## 🎯 Feature Overview

**Feature Name**: AI Doubt Solver  
**Feature ID**: F5  
**Mode**: READ Mode  
**Priority**: High (Core differentiator)  
**Master Prompt v8.0 Section**: 5 - READ Mode Features  

---

## 📋 User Stories

### US-F5-1: Submit Doubt with Text
**As a** UPSC aspirant  
**I want to** type my doubt/question in English or Hindi  
**So that** I can get instant AI-powered clarification  

**Acceptance Criteria**:
- Text input with bilingual support (EN/HI toggle)
- Subject tagging (GS1, GS2, GS3, GS4, Essay, Optional, CSAT)
- Auto-suggest related topics while typing
- Character limit: 2000 characters
- Submit button with loading state

---

### US-F5-2: Submit Doubt with Image
**As a** UPSC aspirant  
**I want to** upload an image of my doubt (textbook page, handwritten note, diagram)  
**So that** I can get explanation for visual content  

**Acceptance Criteria**:
- Image upload (PNG, JPG, JPEG, WebP)
- Max file size: 5MB
- OCR processing for text extraction
- Image preview before submit
- Multiple image support (up to 3)
- Progress indicator during upload

---

### US-F5-3: Submit Doubt with Voice
**As a** UPSC aspirant  
**I want to** speak my doubt using microphone  
**So that** I can ask questions hands-free  

**Acceptance Criteria**:
- Voice recording button
- Real-time speech-to-text transcription
- Support for English and Hindi
- Recording duration limit: 60 seconds
- Playback recorded audio before submit
- Edit transcribed text before submit

---

### US-F5-4: Get AI-Powered Answer
**As a** UPSC aspirant  
**I want to** receive accurate, syllabus-grounded answer  
**So that** I can understand the concept clearly  

**Acceptance Criteria**:
- Response time: <30 seconds target
- Bilingual answer (English + Hindi toggle)
- SIMPLIFIED_LANGUAGE_PROMPT enforced (10th-class level)
- RAG-grounded (content library, notes, CA, NCERTs)
- Source citations (book name, chapter, page if available)
- Related concepts links
- Option to ask follow-up questions

---

### US-F5-5: Follow-up Questions Thread
**As a** UPSC aspirant  
**I want to** ask follow-up questions in a thread  
**So that** I can have a conversation about the topic  

**Acceptance Criteria**:
- Thread-based conversation view
- Context preserved across follow-ups
- Maximum 10 follow-ups per thread
- Option to start new thread
- Thread history saved
- Export thread as PDF/notes

---

### US-F5-6: Rate Answer Quality
**As a** UPSC aspirant  
**I want to** rate the AI answer  
**So that** I can provide feedback for improvement  

**Acceptance Criteria**:
- 1-5 star rating
- Optional feedback text
- "Was this helpful?" thumbs up/down
- Flag incorrect answers for review
- Rating affects AI provider selection

---

### US-F5-7: View Doubt History
**As a** UPSC aspirant  
**I want to** see all my past doubts and answers  
**So that** I can revise and track my learning  

**Acceptance Criteria**:
- Chronological list of doubt threads
- Search by keyword, subject, date
- Filter by subject, rating, resolved status
- Bookmark important threads
- Export history as PDF

---

### US-F5-8: AI Provider Fallback
**As a** UPSC aspirant  
**I want to** always get an answer even if primary AI fails  
**So that** my learning is not interrupted  

**Acceptance Criteria**:
- 9Router → Groq → Ollama fallback chain
- Automatic retry on failure
- User notified of fallback (subtle)
- Response time tracking per provider
- Provider performance analytics (admin)

---

## 🗄️ Database Schema

### doubt_threads
```sql
CREATE TABLE doubt_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_hi TEXT,
  subject TEXT CHECK (subject IN ('GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'CSAT', 'General')),
  topic TEXT,
  status TEXT CHECK (status IN ('open', 'answered', 'resolved', 'flagged')) DEFAULT 'open',
  is_bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_doubt_threads_user ON doubt_threads(user_id);
CREATE INDEX idx_doubt_threads_subject ON doubt_threads(subject);
CREATE INDEX idx_doubt_threads_status ON doubt_threads(status);
CREATE INDEX idx_doubt_threads_created ON doubt_threads(created_at DESC);
```

### doubt_questions
```sql
CREATE TABLE doubt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES doubt_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_html TEXT,
  attachments JSONB DEFAULT '[]',
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_doubt_questions_thread ON doubt_questions(thread_id);
CREATE INDEX idx_doubt_questions_user ON doubt_questions(user_id);
```

### doubt_answers
```sql
CREATE TABLE doubt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES doubt_threads(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES doubt_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  answer_html TEXT,
  sources JSONB DEFAULT '[]',
  ai_provider TEXT,
  response_time_ms INTEGER,
  word_count INTEGER,
  is_followup BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_doubt_answers_thread ON doubt_answers(thread_id);
CREATE INDEX idx_doubt_answers_question ON doubt_answers(question_id);
```

### doubt_ratings
```sql
CREATE TABLE doubt_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES doubt_answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  is_helpful BOOLEAN,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(answer_id, user_id)
);

CREATE INDEX idx_doubt_ratings_answer ON doubt_ratings(answer_id);
CREATE INDEX idx_doubt_ratings_user ON doubt_ratings(user_id);
```

### doubt_attachments
```sql
CREATE TABLE doubt_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES doubt_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_type TEXT CHECK (file_type IN ('image', 'audio', 'document')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  ocr_text TEXT,
  transcription TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doubt_attachments_question ON doubt_attachments(question_id);
```

---

## 🔌 API Endpoints

### POST /api/doubt/ask
Submit a new doubt with text, image, or voice.

**Request**:
```json
{
  "title": { "en": "What is fiscal federalism?", "hi": "राजकोषीय संघवाद क्या है?" },
  "subject": "GS2",
  "question": "Explain fiscal federalism in Indian context...",
  "attachments": [{ "type": "image", "url": "...", "ocr_text": "..." }],
  "isVoice": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "threadId": "uuid",
    "questionId": "uuid",
    "answer": {
      "text": "...",
      "sources": [...],
      "responseTimeMs": 2500
    }
  }
}
```

### GET /api/doubt/thread/[id]
Get complete thread with all questions and answers.

### POST /api/doubt/followup
Add follow-up question to existing thread.

### POST /api/doubt/rate
Rate an answer (1-5 stars, helpful, flag).

### GET /api/doubt/history
Get user's doubt history with filters.

### DELETE /api/doubt/thread/[id]
Delete a doubt thread.

---

## 🎨 UI Components

### DoubtInput Component
- Multi-modal input (text, image, voice)
- Subject selector dropdown
- Character counter
- Attachment preview
- Submit button with loading state

### AnswerCard Component
- Answer text with bilingual toggle
- Source citations
- Related concepts links
- Rating stars (1-5)
- Helpful thumbs up/down
- Flag button
- Copy/export options

### ThreadView Component
- Conversation thread layout
- Question-answer pairs
- Follow-up input
- Thread metadata (subject, created, status)
- Bookmark toggle
- Export thread button

### ImageUpload Component
- Drag-drop upload
- File picker
- Image preview
- OCR progress indicator
- Multiple image support

### VoiceRecorder Component
- Record button
- Recording timer
- Audio waveform visualization
- Playback controls
- Transcription preview
- Edit transcribed text

---

## 🔒 Security & RLS Policies

```sql
-- Doubt threads
CREATE POLICY "Users can view own threads"
  ON doubt_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own threads"
  ON doubt_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads"
  ON doubt_threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads"
  ON doubt_threads FOR DELETE
  USING (auth.uid() = user_id);

-- Doubt answers (read access to all for learning)
CREATE POLICY "Users can view all answers"
  ON doubt_answers FOR SELECT
  USING (true);

-- Doubt ratings
CREATE POLICY "Users can rate answers"
  ON doubt_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON doubt_ratings FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 📊 AI Provider Configuration

### Priority Chain (NOT A4F)
1. **9Router** (Primary) - Multi-model routing
2. **Groq** (Fallback 1) - 7-key rotation
3. **Ollama** (Fallback 2) - Self-hosted LLMs

### SIMPLIFIED_LANGUAGE_PROMPT
All answers must:
- Use 10th-class reading level
- Avoid jargon or explain with simple analogies
- Max 15 words per sentence
- Include Hindi translation for key terms
- Use examples from Indian context

---

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time | <30 seconds | AI service logging |
| Answer Accuracy | >85% helpful | User ratings |
| User Satisfaction | >4.0/5.0 | Average rating |
| Thread Resolution | >70% resolved | Status tracking |
| Follow-up Rate | <3 per thread | Conversation analytics |
| RAG Grounding | >90% cited | Source citations |

---

## 🧪 Testing Strategy

### Unit Tests
- Doubt service CRUD operations
- Image OCR processing
- Voice transcription accuracy
- AI provider fallback logic
- RAG search relevance

### Integration Tests
- End-to-end doubt submission flow
- Multi-modal input handling
- Thread conversation preservation
- Rating system functionality

### E2E Tests
- Complete user journey (submit → answer → rate)
- Voice recording and transcription
- Image upload and OCR
- Follow-up conversation thread

---

## 🚀 Implementation Priority

1. **Database Migration 025** - Schema + RLS
2. **Doubt Service** - Core CRUD operations
3. **AI Answer Generator** - 9Router integration + RAG
4. **Image Processor** - OCR with Tesseract.js
5. **Voice Processor** - Web Speech API
6. **API Routes** - All endpoints
7. **UI Components** - Input, Answer, Thread
8. **Pages** - Main solver + thread view
9. **Testing** - Unit, integration, E2E

---

## 📝 Notes

- **Free Tier**: 10 doubts/month
- **Premium**: Unlimited doubts
- **Voice/Image**: Premium feature (optional)
- **Thread Export**: Premium feature
- **Admin Review**: Flagged answers queue
- **Analytics**: Provider performance dashboard

---

**AI Provider: 9Router → Groq → Ollama (NOT A4F)** ✅  
**Master Prompt v8.0 Compliant** ✅  
**Bilingual (EN+HI)** ✅  
**SIMPLIFIED_LANGUAGE_PROMPT** ✅
