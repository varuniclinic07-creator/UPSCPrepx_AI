# BMAD Phase 4 - Feature F8: AI Study Planner

## Master Prompt v8.0 Compliance
- **READ Mode Feature** (Section 5 - Core Learning Features)
- **AI Provider**: 9Router → Groq → Ollama (NOT A4F)
- **Rule 3**: SIMPLIFIED_LANGUAGE_PROMPT for all user-facing content
- **Bilingual**: English + Hindi throughout
- **Mobile-first**: 360px viewport support

---

## 1. Feature Overview

### 1.1 Purpose
AI-powered study planner that creates dynamic, personalized study schedules based on:
- User's target exam date
- Weak areas from MCQ analytics
- Progress tracking data
- Subject balance requirements
- Available study time per day

### 1.2 User Stories

#### US-F8-01: Generate Study Plan
**As a** UPSC aspirant  
**I want to** create a personalized study plan  
**So that** I know exactly what to study each day  

**Acceptance Criteria:**
- User inputs exam date, daily study hours, and subjects to cover
- AI generates day-by-day schedule with specific topics
- Schedule balances all GS subjects + Optional + CSAT
- Includes revision slots and mock tests
- Schedule is bilingual (EN+HI)

---

#### US-F8-02: View Daily Tasks
**As a** user  
**I want to** see today's study tasks  
**So that** I know what to accomplish  

**Acceptance Criteria:**
- Dashboard shows today's tasks with checkboxes
- Each task has estimated duration
- Tasks link to relevant content (notes, CA, videos)
- Completion tracking with streak counter
- Bilingual task descriptions

---

#### US-F8-03: Track Milestones
**As a** user  
**I want to** see my milestone progress  
**So that** I stay motivated  

**Acceptance Criteria:**
- Milestones: Syllabus 25%/50%/75%/100%, Mock tests completed
- Progress bars with percentages
- Estimated completion date
- Celebration on milestone achievement
- Bilingual milestone names

---

#### US-F8-04: Adaptive Rescheduling
**As a** user  
**I want** my schedule to adjust based on performance  
**So that** I focus on weak areas  

**Acceptance Criteria:**
- Poor MCQ performance triggers extra revision
- Completed tasks ahead of schedule = accelerated plan
- Missed tasks = automatic reschedule
- Weekly review suggests adjustments
- User can manually request reschedule

---

#### US-F8-05: Subject Balance
**As a** user  
**I want** balanced subject coverage  
**So that** I don't neglect any GS subject  

**Acceptance Criteria:**
- Weekly view shows subject distribution
- Alerts if subject neglected for 7+ days
- AI ensures all subjects covered weekly
- Optional subject gets adequate time
- CSAT practice scheduled regularly

---

## 2. Database Schema

### 2.1 Tables

```sql
-- Study Plans
CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  daily_study_hours INTEGER DEFAULT 4,
  subjects TEXT[] DEFAULT '{"GS1","GS2","GS3","GS4","CSAT"}',
  optional_subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Study Schedules (Daily)
CREATE TABLE study_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, in-progress, completed, missed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, date)
);

-- Study Tasks (Individual)
CREATE TABLE study_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES study_schedules(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- study, revision, mock_test, analysis
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  estimated_minutes INTEGER DEFAULT 60,
  actual_minutes INTEGER,
  content_links TEXT[], -- URLs to notes, videos, CA articles
  status TEXT DEFAULT 'pending', -- pending, in-progress, completed, skipped
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Milestones
CREATE TABLE study_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- syllabus_coverage, mock_count, revision_rounds
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  unit TEXT NOT NULL, -- percentage, count, rounds
  title TEXT NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Completions (History)
CREATE TABLE study_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES study_tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_minutes INTEGER,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  notes TEXT
);

-- Study Preferences
CREATE TABLE study_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_study_times TEXT[] DEFAULT '{"morning","evening"}',
  break_frequency_minutes INTEGER DEFAULT 50,
  revision_interval_days INTEGER DEFAULT 7,
  mock_frequency_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Adjustments (Audit)
CREATE TABLE schedule_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- poor_performance, ahead_of_schedule, manual_request
  tasks_rescheduled INTEGER DEFAULT 0,
  old_exam_date DATE,
  new_exam_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Indexes
```sql
CREATE INDEX idx_study_schedules_date ON study_schedules(date);
CREATE INDEX idx_study_tasks_status ON study_tasks(status);
CREATE INDEX idx_study_tasks_subject ON study_tasks(subject);
CREATE INDEX idx_study_completions_user ON study_completions(user_id);
CREATE INDEX idx_study_milestones_plan ON study_milestones(plan_id);
```

### 2.3 RLS Policies
```sql
-- Users can only access their own data
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study plans"
  ON study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study plans"
  ON study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans"
  ON study_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Similar policies for all other tables
```

---

## 3. AI Integration

### 3.1 Schedule Generation Prompt
```typescript
const SCHEDULE_GENERATION_PROMPT = `
You are an expert UPSC study planner. Create a day-by-day study schedule.

INPUT:
- Exam Date: {exam_date}
- Daily Study Hours: {daily_hours}
- Subjects: {subjects}
- Optional: {optional_subject}
- Current Date: {current_date}

REQUIREMENTS:
1. Cover complete GS1-4 syllabus before exam date
2. Include 3 revision rounds (spaced repetition)
3. Weekly mock tests (Sundays)
4. Balance all subjects evenly
5. Account for current affairs daily (30 min)
6. Include buffer days for catch-up

OUTPUT FORMAT:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "day_number": 1,
      "tasks": [
        {
          "type": "study|revision|mock_test|analysis",
          "subject": "GS1",
          "topic": "Indian Heritage and Culture",
          "subtopic": "Art Forms",
          "estimated_minutes": 90,
          "content_links": []
        }
      ]
    }
  ]
}

Generate schedule in SIMPLIFIED LANGUAGE suitable for 10th grade reading level.
Provide both English and Hindi versions.
`;
```

### 3.2 Adaptive Adjustment Prompt
```typescript
const ADJUSTMENT_PROMPT = `
Analyze user's study progress and MCQ performance.
Recommend schedule adjustments.

INPUT:
- Completed Tasks: {completed_count}/{total_count}
- MCQ Accuracy: {accuracy}%
- Weak Subjects: {weak_subjects}
- Days Behind/Ahead: {days_delta}

RECOMMENDATIONS:
1. If accuracy < 60%: Add extra revision for weak subjects
2. If behind schedule: Increase daily hours or extend timeline
3. If ahead: Accelerate to include more mock tests
4. If streak broken: Add motivational milestones

OUTPUT:
{
  "adjustments": [
    {
      "type": "add_revision|reschedule|increase_hours|extend_date",
      "subject": "GS2",
      "reason": "Low accuracy (45%) in Polity MCQs",
      "action": "Add 2 extra revision sessions this week"
    }
  ],
  "new_milestones": [],
  "motivational_message": ""
}
`;
```

---

## 4. API Endpoints

### 4.1 POST /api/planner/schedule
**Create/Get Study Schedule**

Request:
```json
{
  "exam_date": "2026-11-30",
  "daily_hours": 6,
  "subjects": ["GS1", "GS2", "GS3", "GS4", "CSAT"],
  "optional": "Public Administration"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "plan_id": "uuid",
    "total_days": 180,
    "total_tasks": 540,
    "milestones": [
      {"type": "syllabus_25", "date": "2026-06-15"},
      {"type": "syllabus_50", "date": "2026-08-01"},
      {"type": "syllabus_75", "date": "2026-09-15"},
      {"type": "syllabus_100", "date": "2026-10-30"}
    ],
    "week_1": [...]
  }
}
```

### 4.2 GET /api/planner/daily-tasks?date=YYYY-MM-DD
**Get Tasks for Specific Date**

Response:
```json
{
  "success": true,
  "data": {
    "date": "2026-04-07",
    "day_number": 1,
    "status": "pending",
    "tasks": [
      {
        "id": "uuid",
        "type": "study",
        "subject": "GS1",
        "topic": "Indian Heritage",
        "estimated_minutes": 90,
        "status": "pending",
        "content_links": ["/notes/gs1/heritage"]
      }
    ],
    "total_estimated_minutes": 360
  }
}
```

### 4.3 POST /api/planner/complete
**Mark Task as Complete**

Request:
```json
{
  "task_id": "uuid",
  "time_spent_minutes": 85,
  "quality_rating": 4,
  "notes": "Understood concepts well"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "streak_days": 5,
    "xp_earned": 50,
    "daily_progress": "3/5 tasks completed"
  }
}
```

### 4.4 GET /api/planner/milestones
**Get Milestone Progress**

Response:
```json
{
  "success": true,
  "data": {
    "milestones": [
      {
        "type": "syllabus_coverage",
        "target": 100,
        "current": 35,
        "unit": "percentage",
        "achieved": false
      },
      {
        "type": "mock_tests",
        "target": 20,
        "current": 3,
        "unit": "count",
        "achieved": false
      }
    ],
    "next_milestone": {
      "type": "syllabus_50",
      "estimated_date": "2026-08-01"
    }
  }
}
```

### 4.5 POST /api/planner/adjust
**Request Schedule Adjustment**

Request:
```json
{
  "reason": "poor_performance",
  "weak_subjects": ["GS2", "GS3"],
  "request_type": "add_revision"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "adjustments_made": 5,
    "new_tasks_added": [
      {
        "date": "2026-04-10",
        "subject": "GS2",
        "topic": "Polity Revision"
      }
    ],
    "message": "Schedule adjusted to add extra revision for weak areas"
  }
}
```

---

## 5. UI Components

### 5.1 Schedule Calendar
- Monthly/weekly/daily views
- Color-coded tasks by subject
- Completion status indicators
- Click to view/edit day's tasks

### 5.2 Daily Tasks Panel
- Checklist with checkboxes
- Estimated vs actual time
- Content links (notes, videos, CA)
- Timer for each task
- Quick complete button

### 5.3 Milestone Tracker
- Progress bars for each milestone
- Celebration animations on achievement
- Estimated completion dates
- Share functionality

### 5.4 Subject Balance Chart
- Weekly subject distribution pie chart
- Alerts for neglected subjects
- Recommended adjustments

### 5.5 Goal Progress Dashboard
- Overall syllabus coverage %
- Mock tests completed
- Revision rounds completed
- Current streak display

---

## 6. Security & Privacy

### 6.1 Data Protection
- All user data encrypted at rest
- RLS policies enforce user isolation
- No schedule data shared with third parties

### 6.2 Subscription Validation
- Free tier: Basic schedule generation (1 plan)
- Premium: Unlimited plans, AI adjustments, detailed analytics
- All API endpoints validate subscription

---

## 7. Testing Requirements

### 7.1 Unit Tests
- Schedule generation algorithm
- Progress calculation
- Milestone tracking
- Adjustment logic

### 7.2 Integration Tests
- API endpoint responses
- Database operations
- AI provider fallback chain

### 7.3 E2E Tests
- Complete user flow: create plan → complete tasks → view progress
- Mobile responsive testing
- Bilingual toggle functionality

---

## 8. Success Metrics

### 8.1 User Engagement
- Daily active users with planner
- Average tasks completed per day
- Streak retention rate

### 8.2 Learning Outcomes
- Correlation between planner usage and MCQ scores
- Syllabus completion rate
- Mock test performance improvement

---

## 9. Implementation Checklist

- [ ] Database migration (027)
- [ ] Schedule generator service
- [ ] Progress tracker service
- [ ] Recommendation engine
- [ ] Milestone manager
- [ ] Adaptive adjuster service
- [ ] All API routes (5 endpoints)
- [ ] UI components (5 components)
- [ ] Main planner page
- [ ] Calendar view page
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation

---

**Total Estimated**: 20-24 files, ~6,000+ lines
**AI Provider**: 9Router → Groq → Ollama
**Language**: Simplified English + Hindi
**Priority**: High (Core READ Mode Feature)
