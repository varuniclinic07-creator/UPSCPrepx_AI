# 🎯 BMAD Phase 4: Feature F1 - Smart Onboarding
## Master Prompt v8.0 Section 5, F1 Implementation

---

## 📋 FEATURE SPECIFICATION (Per Master Prompt v8.0)

### F1: SMART ONBOARDING (`/onboarding`)

**5-Step Wizard:**
1. **Step 1**: Target year selection (2026, 2027, 2028, 2029+)
2. **Step 2**: Attempt number (1st, 2nd, 3rd, 4th+)
3. **Step 3**: Working professional? (Yes/No) + Study hours per day
4. **Step 4**: Optional subject selection (from UPSC list)
5. **Step 5**: 10-question diagnostic quiz (adaptive, covers all GS subjects)

**Post-Quiz AI Analysis:**
- Analyzes quiz responses
- Detects strengths (accuracy >70%)
- Detects weaknesses (accuracy <40%)
- Sets preparation_stage (beginner/intermediate/advanced/revision)
- Creates personalized study plan
- Seeds user_progress for all 330 syllabus nodes
- Grants 3-day trial subscription

**AI Call Requirements:**
- MUST use SIMPLIFIED_LANGUAGE_PROMPT (10th-class level)
- MUST use callAI() with 9Router → Groq → Ollama fallback
- MUST be RAG-grounded (no hallucination)

**Database Tables Used:**
- `users` (created via Supabase Auth)
- `user_profiles` (target_year, attempt_number, optional_subject, preparation_stage, study_hours_per_day, is_working_professional, strengths, weaknesses)
- `subscriptions` (trial_started_at, trial_expires_at = NOW + 3 days)
- `syllabus_nodes` (330 chapters seed)
- `user_progress` (seeds all nodes with initial completion based on quiz)

---

## 🏗️ TECHNICAL ARCHITECTURE

### API Endpoints

#### 1. `POST /api/onboarding/start`
**Purpose**: Initialize onboarding session
**Request**:
```json
{
  "email": "user@example.com",
  "auth_provider": "google" | "email"
}
```
**Response**:
```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "trial_expires_at": "2026-04-09T05:30:00Z"
}
```

#### 2. `POST /api/onboarding/profile`
**Purpose**: Save profile data (Steps 1-4)
**Request**:
```json
{
  "user_id": "uuid",
  "target_year": 2027,
  "attempt_number": 1,
  "is_working_professional": false,
  "study_hours_per_day": 6,
  "optional_subject": "Public Administration",
  "preparation_stage": "beginner"
}
```
**Response**:
```json
{
  "success": true,
  "profile_id": "uuid"
}
```

#### 3. `POST /api/onboarding/quiz`
**Purpose**: Generate 10-question diagnostic quiz
**Request**:
```json
{
  "user_id": "uuid"
}
```
**Response**:
```json
{
  "quiz_id": "uuid",
  "questions": [
    {
      "id": "uuid",
      "question_text": "...",
      "question_text_hi": "...",
      "options": ["A", "B", "C", "D"],
      "subject": "GS1",
      "topic": "History",
      "difficulty": "medium"
    }
    // 10 questions total
  ]
}
```

#### 4. `POST /api/onboarding/complete`
**Purpose**: Submit quiz, AI analysis, generate study plan
**Request**:
```json
{
  "user_id": "uuid",
  "quiz_id": "uuid",
  "answers": [
    {"question_id": "uuid", "selected_option": "A", "time_spent_sec": 45}
  ]
}
```
**Response**:
```json
{
  "success": true,
  "analysis": {
    "strengths": ["Polity", "Geography"],
    "weaknesses": ["Economics", "Ethics"],
    "preparation_stage": "beginner",
    "overall_score": 65.5
  },
  "study_plan": {
    "weekly_schedule": {...},
    "priority_topics": [...],
    "recommended_hours_per_subject": {...}
  },
  "syllabus_progress_seeded": true,
  "trial_active": true,
  "trial_expires_at": "2026-04-09T05:30:00Z"
}
```

---

## 📁 FILES TO CREATE

### Specification
- [x] `BMAD_PHASE4_FEATURE_F1_ONBOARDING.md` (this file)

### API Routes
- [ ] `src/app/api/onboarding/start/route.ts`
- [ ] `src/app/api/onboarding/profile/route.ts`
- [ ] `src/app/api/onboarding/quiz/route.ts`
- [ ] `src/app/api/onboarding/complete/route.ts`

### Services
- [ ] `src/lib/onboarding/quiz-generator.ts`
- [ ] `src/lib/onboarding/study-plan-generator.ts`
- [ ] `src/lib/onboarding/simplified-language-prompt.ts`

### Components
- [ ] `src/components/onboarding/onboarding-wizard.tsx`
- [ ] `src/components/onboarding/step-indicator.tsx`
- [ ] `src/components/onboarding/target-year-step.tsx`
- [ ] `src/components/onboarding/attempts-step.tsx`
- [ ] `src/components/onboarding/professional-step.tsx`
- [ ] `src/components/onboarding/optional-subject-step.tsx`
- [ ] `src/components/onboarding/quiz-step.tsx`
- [ ] `src/components/onboarding/analysis-loading.tsx`
- [ ] `src/components/onboarding/study-plan-view.tsx`

### Pages
- [ ] `src/app/(auth)/onboarding/page.tsx`

### Database
- [ ] `supabase/migrations/022_master_prompt_alignment.sql` (27 tables)

---

## 🎯 SIMPLIFIED LANGUAGE PROMPT (Rule 3)

```typescript
// src/lib/onboarding/simplified-language-prompt.ts

export const SIMPLIFIED_LANGUAGE_PROMPT = `
CRITICAL LANGUAGE RULES — FOLLOW STRICTLY:

1. Write for a 10th-class student. One reading = full understanding.

2. No jargon without explanation. Technical terms get parenthetical definitions.
   Example: "Writ of Habeas Corpus (a court order that asks the government to bring a detained person before the judge)"

3. Real-life Indian examples for every concept.
   Example: "Article 21 = Right to Life. Government cannot demolish your house to build a highway without giving you proper notice."

4. Analogies. Example: "Constitution = rulebook of cricket."

5. Max 15 words per sentence. Break long ideas into multiple sentences.

6. Mnemonics. Example: "6 Fundamental Rights = REFCEP"

7. Exam tips. Example: "EXAM TIP: Asked in UPSC 2023 Prelims."

8. If Hindi: use simple Hindi (Hinglish acceptable for clarity).

9. ALWAYS use this prompt for ALL user-facing AI-generated content.
`;
```

---

## 📊 QUIZ GENERATION LOGIC

### Question Distribution (10 questions)
| Subject | Questions | Topics |
|---------|-----------|--------|
| GS1 (History) | 2 | Modern India, Art & Culture |
| GS1 (Geography) | 1 | Physical Geography |
| GS2 (Polity) | 2 | Constitution, Fundamental Rights |
| GS3 (Economy) | 2 | Basic Economics, Budget |
| GS3 (Environment) | 1 | Ecology, Biodiversity |
| GS4 (Ethics) | 1 | Basic Ethics |
| CSAT | 1 | Quantitative Aptitude |

### Difficulty Adaptation
- Q1-Q3: Medium (baseline)
- Q4-Q7: Adaptive (based on previous accuracy)
- Q8-Q10: Hard (challenge level)

### AI Quiz Generation Prompt
```typescript
const quizPrompt = `
Generate 10 UPSC Prelims-style MCQs for diagnostic quiz.

DISTRIBUTION:
- 2 History (Modern India, Art & Culture)
- 1 Geography (Physical)
- 2 Polity (Constitution, Fundamental Rights)
- 2 Economy (Basic concepts, Budget)
- 1 Environment (Ecology)
- 1 Ethics (Basic)
- 1 CSAT (Quant)

RULES:
1. Each question has 4 options (A, B, C, D)
2. Only ONE correct answer
3. Include explanation for each answer
4. Use SIMPLIFIED_LANGUAGE_PROMPT
5. Tag with subject, topic, difficulty
6. Include UPSC exam year if from PYQ

FORMAT (JSON):
{
  "questions": [
    {
      "question_text": "...",
      "question_text_hi": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "A",
      "explanation": "...",
      "explanation_hi": "...",
      "subject": "GS1",
      "topic": "History",
      "difficulty": "medium",
      "upsc_year": 2023 // if PYQ
    }
  ]
}
`;
```

---

## 📈 STUDY PLAN GENERATION

### AI Analysis Prompt
```typescript
const analysisPrompt = `
Analyze user's quiz performance and generate personalized study plan.

INPUT:
- Quiz answers (10 questions)
- Time spent per question
- User profile (target year, attempt, working professional, study hours)

OUTPUT:
1. Strengths (subjects with >70% accuracy)
2. Weaknesses (subjects with <40% accuracy)
3. Preparation stage (beginner/intermediate/advanced/revision)
4. Overall score (0-100)
5. Weekly study schedule (based on study_hours_per_day)
6. Priority topics (weak areas first)
7. Recommended hours per subject

RULES:
1. Use SIMPLIFIED_LANGUAGE_PROMPT
2. Be encouraging but honest
3. Consider working professional status (less time on weekdays)
4. Adjust for target year (2027 = more time, 2026 = intensive)
5. Include rest days and revision time

FORMAT (JSON):
{
  "strengths": ["Polity", "Geography"],
  "weaknesses": ["Economics", "Ethics"],
  "preparation_stage": "beginner",
  "overall_score": 65.5,
  "weekly_schedule": {
    "monday": {"subject": "GS2", "topic": "Polity", "hours": 3},
    ...
  },
  "priority_topics": [
    {"subject": "GS3", "topic": "Economy", "reason": "Low quiz score, high weightage"}
  ],
  "recommended_hours_per_subject": {
    "GS1": 8,
    "GS2": 10,
    "GS3": 12,
    "GS4": 4,
    "CSAT": 4
  }
}
`;
```

---

## 🗄️ DATABASE SEEDING

### Seed syllabus_nodes (330 chapters)
```sql
-- Simplified example (full seed is ~500 lines)
INSERT INTO syllabus_nodes (code, title, exam_type, subject, paper, level, weightage) VALUES
  -- GS1 (60 chapters)
  ('GS1-HIST-01', 'Indus Valley Civilization', 'Both', 'GS1', 'History', 1, 80),
  ('GS1-HIST-02', 'Vedic Period', 'Both', 'GS1', 'History', 1, 75),
  ...
  -- GS2 (70 chapters)
  ('GS2-POL-01', 'Historical Background', 'Both', 'GS2', 'Polity', 1, 100),
  ('GS2-POL-02', 'Constitution Making', 'Both', 'GS2', 'Polity', 1, 90),
  ...
  -- GS3 (80 chapters)
  ('GS3-ECO-01', 'Basic Economics', 'Both', 'GS3', 'Economy', 1, 95),
  ...
  -- GS4 (40 chapters)
  ('GS4-ETH-01', 'Ethics and Human Interface', 'Mains', 'GS4', 'Ethics', 1, 70),
  ...
  -- CSAT (50 chapters)
  ('CSAT-MATH-01', 'Number System', 'Prelims', 'CSAT', 'Math', 1, 60),
  ...
  -- Essay (30 chapters)
  ('ESSAY-01', 'Philosophical Topics', 'Mains', 'Essay', 'Essay', 1, 50),
  ...;
```

### Seed user_progress (after quiz)
```sql
-- Seed progress for all 330 nodes
INSERT INTO user_progress (user_id, syllabus_node_id, completion_percent, confidence_score, next_revision_date)
SELECT 
  :user_id,
  sn.id,
  CASE 
    WHEN sn.subject = ANY(:strengths) THEN 20
    WHEN sn.subject = ANY(:weaknesses) THEN 0
    ELSE 10
  END,
  CASE 
    WHEN sn.subject = ANY(:strengths) THEN 0.7
    WHEN sn.subject = ANY(:weaknesses) THEN 0.2
    ELSE 0.4
  END,
  CURRENT_DATE + INTERVAL '7 days'
FROM syllabus_nodes sn;
```

---

## 🎨 UI/UX SPECIFICATIONS

### Step Indicator
- 6 steps total (5 wizard + 1 analysis)
- Progress bar at top
- Step titles: Target → Attempts → Professional → Subject → Quiz → Analysis
- Mobile-responsive (stack vertically on small screens)

### Step 1: Target Year
- Cards: 2026 | 2027 | 2028 | 2029+
- Description: "When do you plan to take UPSC?"
- Visual: Calendar icon

### Step 2: Attempt Number
- Cards: 1st Attempt | 2nd Attempt | 3rd Attempt | 4th+ Attempt
- Description: "Is this your first attempt?"
- Visual: Trophy icon

### Step 3: Working Professional
- Toggle: Yes / No
- If Yes: Show study hours slider (2-12 hours)
- If No: Default 8 hours/day
- Visual: Briefcase icon

### Step 4: Optional Subject
- Dropdown: All 48 UPSC optional subjects
- Search functionality
- Visual: Book icon

### Step 5: Diagnostic Quiz
- 10 questions, one per screen
- Timer per question (shows time spent)
- Options: A, B, C, D (radio buttons)
- "Skip" button (counts as wrong)
- Progress: "Question 3 of 10"
- Visual: Quiz icon

### Step 6: AI Analysis (Loading)
- Animated spinner
- Message: "Analyzing your responses..."
- Sub-messages (rotating):
  - "Identifying strengths..."
  - "Detecting weak areas..."
  - "Creating personalized study plan..."
  - "Seeding syllabus progress..."
  - "Activating 3-day trial..."

### Step 7: Study Plan Display
- Overall score (gauge chart)
- Strengths (green badges)
- Weaknesses (red badges)
- Preparation stage (colored badge)
- Weekly schedule (calendar view)
- Priority topics (list with reasons)
- "Start Learning" button → redirects to `/dashboard/notes`

---

## ✅ ACCEPTANCE CRITERIA

- [ ] User can complete all 5 wizard steps
- [ ] Quiz generates 10 questions with correct distribution
- [ ] AI analysis uses SIMPLIFIED_LANGUAGE_PROMPT
- [ ] Strengths/weaknesses correctly identified from quiz
- [ ] Study plan generated based on profile + quiz
- [ ] user_progress seeded for all 330 syllabus nodes
- [ ] 3-day trial subscription activated
- [ ] All content in Hindi + English (toggle)
- [ ] Mobile-responsive (360px viewport)
- [ ] Error boundaries on all steps
- [ ] Skeleton loaders during API calls
- [ ] Retry logic for failed API calls
- [ ] No localStorage (Supabase Auth cookies only)
- [ ] All API calls via Edge Functions (not browser)

---

## 🔗 RELATED FEATURES

- **F8**: AI Study Planner (enhances onboarding plan)
- **F9**: Progress Dashboard (shows seeded progress)
- **F11**: Smart Search (used in quiz generation for RAG)
- **F13**: Gamification (awards XP for onboarding completion)

---

## 📝 NOTES

- Onboarding is CRITICAL first impression
- Must be fast (<60 seconds total)
- Must be encouraging (not discouraging)
- Trial activation happens AFTER quiz completion
- Quiz questions stored in `questions` table for reuse
- Study plan stored in `user_profiles.study_plan` JSONB

---

**Next Step**: Implement API routes, services, components, and page.
