-- ============================================================================
-- Migration 027: AI Study Planner
-- Master Prompt v8.0 - Feature F8 (READ Mode)
-- AI Provider: 9Router → Groq → Ollama (NOT A4F)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Study Plans (User's overall plan)
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_date DATE NOT NULL,
  daily_study_hours INTEGER DEFAULT 4 CHECK (daily_study_hours BETWEEN 1 AND 16),
  subjects TEXT[] DEFAULT '{"GS1","GS2","GS3","GS4","CSAT"}',
  optional_subject TEXT,
  current_syllabus_coverage NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Study Schedules (Daily breakdown)
CREATE TABLE IF NOT EXISTS study_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  total_estimated_minutes INTEGER DEFAULT 0,
  total_actual_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, date)
);

-- Study Tasks (Individual tasks)
CREATE TABLE IF NOT EXISTS study_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES study_schedules(id) ON DELETE CASCADE NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('study', 'revision', 'mock_test', 'analysis', 'current_affairs')),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  estimated_minutes INTEGER DEFAULT 60 CHECK (estimated_minutes BETWEEN 15 AND 480),
  actual_minutes INTEGER,
  content_links TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Milestones
CREATE TABLE IF NOT EXISTS study_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('syllabus_25', 'syllabus_50', 'syllabus_75', 'syllabus_100', 'mock_5', 'mock_10', 'mock_20', 'revision_1', 'revision_2', 'revision_3')),
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('percentage', 'count', 'rounds')),
  title TEXT NOT NULL,
  description TEXT,
  estimated_date DATE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Completions (History for analytics)
CREATE TABLE IF NOT EXISTS study_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES study_tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_minutes INTEGER CHECK (time_spent_minutes > 0),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  notes TEXT,
  xp_earned INTEGER DEFAULT 0
);

-- Study Preferences
CREATE TABLE IF NOT EXISTS study_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  preferred_study_times TEXT[] DEFAULT '{"morning","evening"}',
  break_frequency_minutes INTEGER DEFAULT 50 CHECK (break_frequency_minutes BETWEEN 25 AND 90),
  revision_interval_days INTEGER DEFAULT 7 CHECK (revision_interval_days BETWEEN 3 AND 14),
  mock_frequency_days INTEGER DEFAULT 7 CHECK (mock_frequency_days BETWEEN 3 AND 14),
  wake_up_time TIME DEFAULT '06:00:00',
  sleep_time TIME DEFAULT '23:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Adjustments (Audit trail)
CREATE TABLE IF NOT EXISTS schedule_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('poor_performance', 'ahead_of_schedule', 'behind_schedule', 'manual_request', 'exam_date_change')),
  tasks_rescheduled INTEGER DEFAULT 0,
  tasks_added INTEGER DEFAULT 0,
  tasks_removed INTEGER DEFAULT 0,
  old_exam_date DATE,
  new_exam_date DATE,
  ai_recommendations JSONB,
  user_accepted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Subject Balance (Tracking)
CREATE TABLE IF NOT EXISTS weekly_subject_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  gs1_minutes INTEGER DEFAULT 0,
  gs2_minutes INTEGER DEFAULT 0,
  gs3_minutes INTEGER DEFAULT 0,
  gs4_minutes INTEGER DEFAULT 0,
  csat_minutes INTEGER DEFAULT 0,
  optional_minutes INTEGER DEFAULT 0,
  revision_minutes INTEGER DEFAULT 0,
  mock_test_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, week_start_date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_active ON study_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_study_schedules_date ON study_schedules(date);
CREATE INDEX IF NOT EXISTS idx_study_schedules_plan ON study_schedules(plan_id);
CREATE INDEX IF NOT EXISTS idx_study_schedules_status ON study_schedules(status);
CREATE INDEX IF NOT EXISTS idx_study_tasks_schedule ON study_tasks(schedule_id);
CREATE INDEX IF NOT EXISTS idx_study_tasks_status ON study_tasks(status);
CREATE INDEX IF NOT EXISTS idx_study_tasks_subject ON study_tasks(subject);
CREATE INDEX IF NOT EXISTS idx_study_tasks_type ON study_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_study_milestones_plan ON study_milestones(plan_id);
CREATE INDEX IF NOT EXISTS idx_study_milestones_type ON study_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_study_completions_user ON study_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_completions_date ON study_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_weekly_balance_plan ON weekly_subject_balance(plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_balance_date ON weekly_subject_balance(week_start_date);
CREATE INDEX IF NOT EXISTS idx_schedule_adjustments_plan ON schedule_adjustments(plan_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_subject_balance ENABLE ROW LEVEL SECURITY;

-- Study Plans Policies
CREATE POLICY "Users can view own study plans"
  ON study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study plans"
  ON study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans"
  ON study_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study plans"
  ON study_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Study Schedules Policies (via plan)
CREATE POLICY "Users can view own study schedules"
  ON study_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own study schedules"
  ON study_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own study schedules"
  ON study_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

-- Study Tasks Policies (via schedule)
CREATE POLICY "Users can view own study tasks"
  ON study_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_schedules ss
      JOIN study_plans sp ON ss.plan_id = sp.id
      WHERE ss.id = schedule_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own study tasks"
  ON study_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM study_schedules ss
      JOIN study_plans sp ON ss.plan_id = sp.id
      WHERE ss.id = schedule_id AND sp.user_id = auth.uid()
    )
  );

-- Study Milestones Policies
CREATE POLICY "Users can view own milestones"
  ON study_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own milestones"
  ON study_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

-- Study Completions Policies
CREATE POLICY "Users can view own completions"
  ON study_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON study_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Study Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON study_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON study_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON study_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Schedule Adjustments Policies
CREATE POLICY "Users can view own adjustments"
  ON schedule_adjustments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own adjustments"
  ON schedule_adjustments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

-- Weekly Subject Balance Policies
CREATE POLICY "Users can view own weekly balance"
  ON weekly_subject_balance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own weekly balance"
  ON weekly_subject_balance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own weekly balance"
  ON weekly_subject_balance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM study_plans sp
      WHERE sp.id = plan_id AND sp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_study_plans_updated_at
  BEFORE UPDATE ON study_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_preferences_updated_at
  BEFORE UPDATE ON study_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update schedule completion stats
CREATE OR REPLACE FUNCTION update_schedule_completion_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE study_schedules
    SET completed_tasks = completed_tasks + 1
    WHERE id = NEW.schedule_id;
  ELSIF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE study_schedules
    SET completed_tasks = completed_tasks + 1
    WHERE id = NEW.schedule_id;
  END IF;
  
  -- Update total tasks count
  UPDATE study_schedules
  SET total_tasks = (
    SELECT COUNT(*) FROM study_tasks WHERE schedule_id = NEW.schedule_id
  )
  WHERE id = NEW.schedule_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedule_on_task_status_change
  AFTER INSERT OR UPDATE ON study_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_completion_stats();

-- Update milestone progress
CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update syllabus coverage milestone
  IF TG_TABLE_NAME = 'study_completions' THEN
    UPDATE study_milestones
    SET current_value = (
      SELECT COUNT(*) * 100 / 
        (SELECT COUNT(*) FROM study_tasks st
         JOIN study_schedules ss ON st.schedule_id = ss.id
         JOIN study_plans sp ON ss.plan_id = sp.id
         WHERE sp.id = study_milestones.plan_id)
    )
    WHERE milestone_type = 'syllabus_coverage'
    AND plan_id IN (
      SELECT ss.plan_id FROM study_tasks st
      JOIN study_schedules ss ON st.schedule_id = ss.id
      WHERE st.id = NEW.task_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_milestone_on_completion
  AFTER INSERT ON study_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_progress();

-- ============================================================================
-- SEED DATA: Default Milestones Template
-- ============================================================================

-- This function creates default milestones for a new study plan
CREATE OR REPLACE FUNCTION create_default_milestones(plan_uuid UUID, exam_date_val DATE)
RETURNS VOID AS $$
DECLARE
  start_date DATE := CURRENT_DATE;
  total_days INTEGER := exam_date_val - start_date;
BEGIN
  -- Syllabus Coverage Milestones
  INSERT INTO study_milestones (plan_id, milestone_type, target_value, current_value, unit, title, description, estimated_date)
  VALUES 
    (plan_uuid, 'syllabus_25', 25, 0, 'percentage', 
     '25% Syllabus Coverage', 'Complete first quarter of GS syllabus',
     start_date + (total_days * 0.25)::INTEGER),
    
    (plan_uuid, 'syllabus_50', 50, 0, 'percentage',
     '50% Syllabus Coverage', 'Complete half of GS syllabus',
     start_date + (total_days * 0.5)::INTEGER),
    
    (plan_uuid, 'syllabus_75', 75, 0, 'percentage',
     '75% Syllabus Coverage', 'Complete three quarters of GS syllabus',
     start_date + (total_days * 0.75)::INTEGER),
    
    (plan_uuid, 'syllabus_100', 100, 0, 'percentage',
     '100% Syllabus Coverage', 'Complete entire GS syllabus',
     start_date + (total_days * 0.9)::INTEGER),
    
    -- Mock Test Milestones
    (plan_uuid, 'mock_5', 5, 0, 'count',
     '5 Mock Tests Completed', 'Complete 5 full-length mock tests',
     start_date + (total_days * 0.4)::INTEGER),
    
    (plan_uuid, 'mock_10', 10, 0, 'count',
     '10 Mock Tests Completed', 'Complete 10 full-length mock tests',
     start_date + (total_days * 0.6)::INTEGER),
    
    (plan_uuid, 'mock_20', 20, 0, 'count',
     '20 Mock Tests Completed', 'Complete 20 full-length mock tests',
     exam_date_val - INTERVAL '30 days'),
    
    -- Revision Round Milestones
    (plan_uuid, 'revision_1', 1, 0, 'rounds',
     'First Revision Complete', 'Complete first round of revision for all subjects',
     start_date + (total_days * 0.7)::INTEGER),
    
    (plan_uuid, 'revision_2', 2, 0, 'rounds',
     'Second Revision Complete', 'Complete second round of revision',
     start_date + (total_days * 0.85)::INTEGER),
    
    (plan_uuid, 'revision_3', 3, 0, 'rounds',
     'Third Revision Complete', 'Complete final revision round',
     exam_date_val - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE study_plans IS 'User study plans with exam date and preferences';
COMMENT ON TABLE study_schedules IS 'Daily study schedules linked to plans';
COMMENT ON TABLE study_tasks IS 'Individual study tasks with subject/topic';
COMMENT ON TABLE study_milestones IS 'Milestone goals for motivation tracking';
COMMENT ON TABLE study_completions IS 'History of completed tasks for analytics';
COMMENT ON TABLE study_preferences IS 'User study preferences and habits';
COMMENT ON TABLE schedule_adjustments IS 'Audit trail for schedule changes';
COMMENT ON TABLE weekly_subject_balance IS 'Weekly subject time distribution tracking';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
