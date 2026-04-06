# BMAD Phase 4 - Feature F9: Progress Dashboard

## Master Prompt v8.0 Compliance
- **READ Mode Feature** (Section 5 - Core Learning Features)
- **AI Provider**: 9Router → Groq → Ollama (NOT A4F)
- **Rule 3**: SIMPLIFIED_LANGUAGE_PROMPT for all user-facing content
- **Bilingual**: English + Hindi throughout
- **Mobile-first**: 360px viewport support

---

## 1. Feature Overview

### 1.1 Purpose
Real-time data visualization dashboard that shows:
- Study trends over time (daily/weekly/monthly)
- Subject-wise performance analytics
- Time tracking & distribution
- Exam readiness score
- Week-over-week comparisons
- Predictive insights

### 1.2 User Stories

#### US-F9-01: View Study Trends
**As a** UPSC aspirant  
**I want to** see my study hours over time  
**So that** I can track consistency  

**Acceptance Criteria:**
- Line chart showing daily study hours (last 30 days)
- Weekly/monthly toggle
- Color-coded by subject
- Bilingual labels

#### US-F9-02: Subject Performance
**As a** user  
**I want to** see accuracy by subject  
**So that** I know where to focus  

**Acceptance Criteria:**
- Bar chart of MCQ accuracy per subject
- Trend arrows (improving/declining)
- Target line (70% accuracy goal)
- Weak subject highlighting

#### US-F9-03: Time Distribution
**As a** user  
**I want to** see how I spend study time  
**So that** I can balance subjects  

**Acceptance Criteria:**
- Pie/donut chart of time per subject
- Weekly vs monthly view
- Ideal vs actual comparison
- Neglect alerts

#### US-F9-04: Exam Readiness
**As a** user  
**I want to** see my readiness score  
**So that** I know if I'm on track  

**Acceptance Criteria:**
- Overall score (0-100) with color coding
- Factors: coverage, accuracy, consistency, mocks
- Predicted timeline to readiness
- Improvement suggestions

#### US-F9-05: Weekly Comparison
**As a** user  
**I want to** compare weeks  
**So that** I see progress  

**Acceptance Criteria:**
- Side-by-side week comparison
- Key metrics: hours, tasks, accuracy
- Green (improved) / Red (declined) indicators

---

## 2. Database Schema

### 2.1 Tables (extending existing)

No new tables needed - uses existing:
- `study_completions` - for time tracking
- `mcq_attempts` - for accuracy
- `study_schedules` - for planned vs actual
- `study_tasks` - for completion rates

### 2.2 Views (for analytics)

```sql
-- Daily study hours view
CREATE OR REPLACE VIEW v_daily_study_hours AS
SELECT 
  DATE(completed_at) as study_date,
  subject,
  COUNT(*) as tasks_completed,
  SUM(time_spent_minutes) as total_minutes
FROM study_completions sc
JOIN study_tasks st ON sc.task_id = st.id
GROUP BY DATE(completed_at), subject;

-- Subject accuracy view
CREATE OR REPLACE VIEW v_subject_accuracy AS
SELECT 
  subject,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE is_correct) as correct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct) / COUNT(*), 1) as accuracy
FROM mcq_attempts
GROUP BY subject;

-- Weekly summary view
CREATE OR REPLACE VIEW v_weekly_summary AS
SELECT 
  DATE_TRUNC('week', completed_at) as week_start,
  COUNT(*) as tasks,
  SUM(time_spent_minutes) as total_minutes,
  ROUND(SUM(time_spent_minutes) / 60.0, 1) as total_hours
FROM study_completions
GROUP BY DATE_TRUNC('week', completed_at);
```

---

## 3. Exam Readiness Score Calculation

```typescript
function calculateReadinessScore(data: ReadinessData): number {
  // Coverage (35% weight)
  const coverageScore = data.syllabusCoverage * 0.35;
  
  // Accuracy (30% weight)
  const accuracyScore = Math.min(data.overallAccuracy, 100) * 0.30;
  
  // Consistency (20% weight)
  const consistencyScore = Math.min(data.currentStreak / 30, 1) * 100 * 0.20;
  
  // Mock Performance (15% weight)
  const mockScore = Math.min(data.mockTestsCompleted / 20, 1) * 100 * 0.15;
  
  return Math.round(coverageScore + accuracyScore + consistencyScore + mockScore);
}
```

---

## 4. API Endpoints

### 4.1 GET /api/analytics/study-trends?range=30d
Returns daily study hours by subject for charting.

### 4.2 GET /api/analytics/subject-performance
Returns accuracy, time, and trends per subject.

### 4.3 GET /api/analytics/time-distribution?range=7d
Returns time breakdown by subject for pie charts.

### 4.4 GET /api/analytics/readiness-score
Returns overall readiness score with breakdown.

### 4.5 GET /api/analytics/weekly-comparison
Returns current vs previous week metrics.

---

## 5. UI Components

### 5.1 StudyTrendChart
- Line chart with multiple series (by subject)
- 7d/30d/90d toggle
- Moving average line

### 5.2 SubjectPerformanceChart
- Horizontal bar chart
- Accuracy bars with target line (70%)
- Trend indicators

### 5.3 TimeDistributionChart
- Donut chart of time allocation
- Subject colors matching planner
- Percentage labels

### 5.4 ReadinessScoreCard
- Large score display with gauge
- Factor breakdown
- Predicted readiness date

### 5.5 WeeklyComparisonCard
- Side-by-side metrics
- Green/red deltas
- Key highlights

### 5.6 ConsistencyHeatmap
- Calendar heatmap (like GitHub)
- Color intensity = study hours
- Streak indicators

---

## 6. Security & Privacy

- All data scoped to user_id
- RLS policies enforced
- No personal data shared externally

---

## 7. Testing Requirements

### 7.1 Unit Tests
- Readiness score calculation
- Time aggregation logic
- Chart data transformation

### 7.2 Integration Tests
- API endpoint responses
- View query correctness

---

## 8. Implementation Checklist

- [ ] BMAD Specification
- [ ] Database views (028)
- [ ] Analytics services
- [ ] API endpoints
- [ ] UI chart components
- [ ] Dashboard page
- [ ] Master Prompt compliance

---

**Total Estimated**: 15-18 files, ~4,500+ lines
**AI Provider**: 9Router → Groq → Ollama
**Language**: Simplified English + Hindi
**Priority**: High (Core READ Mode Feature)
