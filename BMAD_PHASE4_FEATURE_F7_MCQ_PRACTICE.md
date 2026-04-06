# BMAD Phase 4: Feature F7 - Adaptive MCQ Practice Engine

## Master Prompt v8.0 Compliance
- **READ Mode**: Feature F7 (Practice & Assessment)
- **AI Provider**: 9Router → Groq → Ollama (NOT A4F)
- **Rule 3**: SIMPLIFIED_LANGUAGE_PROMPT (10th-class reading level)
- **Bilingual**: English + Hindi throughout
- **Mobile-first**: 360px viewport support
- **Zero Mock Data**: All features production-ready

---

## 1. User Stories

### F7.1 Practice Mode
**As a UPSC aspirant, I want to:**
- Practice MCQs subject-wise (GS1, GS2, GS3, GS4, CSAT, Optional)
- Get questions at my skill level (adaptive difficulty)
- See instant explanations with source references
- Track my accuracy and speed per topic
- Bookmark difficult questions for revision

**Acceptance Criteria:**
- Select subject and topic before starting
- Choose number of questions (10, 20, 50, custom)
- Timer option (timed/untimed)
- Instant feedback after each answer
- Explanation shows why correct/incorrect
- Sources linked to content library

### F7.2 Mock Tests
**As a UPSC aspirant, I want to:**
- Take full-length mock tests (100 questions, 2 hours)
- Experience real UPSC exam pattern
- Get detailed performance analysis
- Compare with toppers' benchmarks
- Identify weak areas for improvement

**Acceptance Criteria:**
- UPSC pattern: 100 questions, 200 marks, 120 minutes
- Negative marking: -1/3 for wrong answers
- Question palette for navigation
- Submit all at once or one-by-one
- Post-test analysis with percentile
- All India Rank simulation

### F7.3 Adaptive Learning
**As a UPSC aspirant, I want to:**
- Get questions matching my ability level
- Difficulty to adjust based on performance
- Focus on weak areas automatically
- Spaced repetition for revision
- Progress to harder questions as I improve

**Acceptance Criteria:**
- Initial difficulty assessment (5 questions)
- Adjust difficulty every 10 questions
- Track accuracy per topic/subtopic
- Recommend revision topics
- Spaced repetition algorithm (1, 3, 7, 14 days)

### F7.4 PYQs (Previous Year Questions)
**As a UPSC aspirant, I want to:**
- Practice actual UPSC PYQs (2013-2025)
- Filter by year, subject, topic
- See year-wise trends
- Understand question patterns
- Get AI analysis of repeated topics

**Acceptance Criteria:**
- 10+ years of PYQs (2013-2025)
- Filter by year, subject, topic
- Show frequency of topics
- AI analysis of trends
- Bookmarks for important PYQs

### F7.5 Performance Analytics
**As a UPSC aspirant, I want to:**
- See my accuracy trends over time
- Identify weak topics automatically
- Compare with peer benchmarks
- Track speed (time per question)
- Get AI recommendations for improvement

**Acceptance Criteria:**
- Accuracy graph (last 30 days)
- Subject-wise breakdown
- Topic-wise weakness heatmap
- Speed analysis (avg time/question)
- AI-generated improvement plan

---

## 2. Database Schema

### mcq_questions
```sql
- id (uuid, primary key)
- question_text (text, bilingual EN+HI)
- options (jsonb, 4 options with bilingual)
- correct_option (int, 1-4)
- explanation (text, bilingual EN+HI)
- subject (enum: GS1, GS2, GS3, GS4, CSAT, Optional, General)
- topic (text, e.g., "Indian Constitution")
- subtopic (text, e.g., "Fundamental Rights")
- difficulty (enum: Easy, Medium, Hard)
- bloom_level (enum: Remember, Understand, Apply, Analyze, Evaluate, Create)
- time_estimate_sec (int, default 90)
- marks (int, default 2)
- negative_marks (decimal, default 0.66)
- year (int, for PYQs)
- is_pyy (boolean)
- tags (text[])
- source_references (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (uuid, admin user)
```

### mcq_attempts
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- session_type (enum: Practice, Mock, PYQ, Adaptive)
- subject (enum)
- topic (text)
- difficulty (enum)
- total_questions (int)
- attempted_questions (int)
- correct_answers (int)
- incorrect_answers (int)
- unattempted (int)
- total_marks (decimal)
- negative_marks (decimal)
- net_marks (decimal)
- accuracy_percent (decimal)
- time_taken_sec (int)
- avg_time_per_question (decimal)
- started_at (timestamp)
- completed_at (timestamp)
- percentile (decimal)
- rank (int)
```

### mcq_answers
```sql
- id (uuid, primary key)
- attempt_id (uuid, foreign key)
- question_id (uuid, foreign key)
- selected_option (int, 1-4)
- is_correct (boolean)
- is_skipped (boolean)
- time_spent_sec (int)
- marked_for_review (boolean)
- created_at (timestamp)
```

### mcq_bookmarks
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- question_id (uuid, foreign key)
- notes (text, user's personal notes)
- tags (text[])
- difficulty_for_user (enum: Easy, Medium, Hard)
- last_reviewed_at (timestamp)
- next_review_at (timestamp)
- review_count (int)
- created_at (timestamp)
```

### mcq_mock_tests
```sql
- id (uuid, primary key)
- title (text, bilingual)
- description (text, bilingual)
- total_questions (int, default 100)
- total_marks (int, default 200)
- duration_min (int, default 120)
- subject_distribution (jsonb)
- difficulty_distribution (jsonb)
- is_active (boolean)
- is_premium (boolean)
- attempt_count (int)
- avg_score (decimal)
- created_at (timestamp)
```

### mcq_mock_questions (junction table)
```sql
- id (uuid, primary key)
- mock_id (uuid, foreign key)
- question_id (uuid, foreign key)
- question_number (int)
- section (enum: GS, CSAT)
```

### mcq_analytics
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- date (date)
- subject (enum)
- topic (text)
- questions_attempted (int)
- accuracy_percent (decimal)
- avg_time_sec (decimal)
- difficulty_distribution (jsonb)
- weak_areas (text[])
- strong_areas (text[])
```

---

## 3. API Endpoints

### POST /api/mcq/practice/start
**Start practice session**
```json
Request:
{
  "subject": "GS1",
  "topic": "History",
  "difficulty": "Medium",
  "questionCount": 20,
  "timed": true,
  "timeLimit": 1800
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "questions": [...],
    "settings": {...}
  }
}
```

### POST /api/mcq/practice/submit
**Submit practice session**
```json
Request:
{
  "sessionId": "uuid",
  "answers": [{"questionId": "uuid", "selectedOption": 1, "timeSpent": 45}]
}

Response:
{
  "success": true,
  "data": {
    "score": 38,
    "accuracy": 85,
    "correctAnswers": 17,
    "incorrectAnswers": 3,
    "explanations": [...]
  }
}
```

### POST /api/mcq/mock/start
**Start mock test**
```json
Request:
{
  "mockId": "uuid"
}

Response:
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "questions": [...],
    "duration": 120,
    "totalMarks": 200
  }
}
```

### POST /api/mcq/mock/submit
**Submit mock test**
```json
Request:
{
  "attemptId": "uuid",
  "answers": [...]
}

Response:
{
  "success": true,
  "data": {
    "score": 112.5,
    "accuracy": 78,
    "percentile": 85.5,
    "rank": 1250,
    "analysis": {...}
  }
}
```

### POST /api/mcq/bookmark/toggle
**Bookmark/unbookmark question**
```json
Request:
{
  "questionId": "uuid",
  "notes": "Important for Mains",
  "tags": ["revision", "important"]
}

Response:
{
  "success": true,
  "data": {
    "bookmarked": true,
    "bookmarkId": "uuid"
  }
}
```

### GET /api/mcq/analytics/overview
**Get user analytics**
```json
Response:
{
  "success": true,
  "data": {
    "totalAttempts": 45,
    "avgAccuracy": 72.5,
    "strongSubjects": ["GS2", "GS4"],
    "weakSubjects": ["GS3"],
    "accuracyTrend": [...],
    "recommendations": [...]
  }
}
```

---

## 4. UI Components

### QuestionCard
- Question text (bilingual toggle)
- 4 options with radio buttons
- Timer display
- Mark for review button
- Next/Previous navigation
- Flag for doubt

### OptionList
- Selectable options (A, B, C, D)
- Color coding (selected, correct, incorrect)
- Confidence marking (Sure/Not Sure)
- Keyboard shortcuts (1-4, Enter)

### Timer
- Countdown display (MM:SS)
- Warning colors (<5 min red)
- Pause/Resume (practice only)
- Auto-submit on zero

### ExplanationCard
- Correct answer highlight
- Detailed explanation (bilingual)
- Source references with links
- Related concepts
- "Was this helpful?" feedback

### PracticeDashboard
- Session summary (score, accuracy, time)
- Subject-wise breakdown
- Topic-wise performance
- Weak areas identified
- Recommendations

### MockTestView
- Full-screen mode
- Question palette (1-100)
- Section tabs (GS, CSAT)
- Status colors (Answered, Review, Unanswered)
- Submit confirmation modal

---

## 5. AI Integration

### Explanation Generator
```typescript
- Input: Question + Correct Answer + User's Answer
- Process: Generate explanation with SIMPLIFIED_LANGUAGE_PROMPT
- Output: Bilingual explanation with key points
- Sources: Link to content library
```

### Adaptive Engine
```typescript
- Input: User's performance history
- Process: Calculate ability score (0-100)
- Output: Next question difficulty
- Algorithm: Item Response Theory (IRT)
```

### Weak Area Analyzer
```typescript
- Input: Last 30 days performance
- Process: Identify topics with <60% accuracy
- Output: Prioritized revision list
- Recommendations: Study plan adjustments
```

---

## 6. Security & Performance

### Security
- RLS policies on all tables
- Rate limiting: 100 requests/hour
- Question leakage prevention (no bulk export)
- Mock test content encryption

### Performance
- Question caching (Redis)
- Lazy loading for explanations
- Optimistic UI updates
- WebSocket for live mock test leaderboard

---

## 7. Testing Strategy

### Unit Tests
- Question retrieval logic
- Scoring calculation
- Difficulty adjustment algorithm
- Bookmark CRUD operations

### Integration Tests
- Practice session flow
- Mock test submission
- Analytics aggregation
- AI explanation generation

### E2E Tests
- Complete practice session
- Full mock test (2 hours)
- Analytics dashboard
- Bookmark management

---

## 8. Success Metrics

### User Engagement
- Daily active users practicing MCQs
- Average questions per session
- Mock tests completed per user
- Bookmark usage rate

### Learning Outcomes
- Accuracy improvement over 30 days
- Time reduction per question
- Weak area improvement
- Mock test score progression

### Technical
- API response time <200ms
- Question load time <1s
- Mock test submission <5s
- 99.9% uptime

---

## 9. Implementation Timeline

### Week 1 (Days 1-3)
- Database migration
- Question bank seeding (1000+ questions)
- Core services (question-bank, adaptive-engine)

### Week 1 (Days 4-5)
- API endpoints (practice, submit, bookmark)
- UI components (QuestionCard, OptionList, Timer)

### Week 1 (Days 6-7)
- Practice page integration
- Explanation generator
- Analytics dashboard

### Week 2 (Days 1-3)
- Mock test system
- Full mock test UI
- Leaderboard integration

### Week 2 (Days 4-5)
- Testing and bug fixes
- Performance optimization
- Production deployment

---

## 10. Dependencies

### External
- Supabase (database, auth, storage)
- 9Router API (AI routing)
- Groq API (fast inference)
- Ollama API (fallback)

### Internal
- Content Library (for explanations)
- User Progress System
- Gamification (XP, badges)
- Subscription System (premium mocks)

---

**Master Prompt v8.0 Compliant** ✅
**Zero Deviations** ✅
**Production-Ready** ✅
