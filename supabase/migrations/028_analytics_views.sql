-- ============================================================================
-- Migration 028: Analytics Views for F9 Progress Dashboard
-- Master Prompt v8.0 - Feature F9 (READ Mode)
-- ============================================================================

-- View: Daily study hours by subject
CREATE OR REPLACE VIEW v_daily_study_hours AS
SELECT 
  DATE(sc.completed_at) as study_date,
  st.subject,
  COUNT(*) as tasks_completed,
  COALESCE(SUM(sc.time_spent_minutes), 0) as total_minutes,
  ROUND(COALESCE(SUM(sc.time_spent_minutes), 0) / 60.0, 2) as total_hours
FROM study_completions sc
JOIN study_tasks st ON sc.task_id = st.id
WHERE sc.completed_at IS NOT NULL
GROUP BY DATE(sc.completed_at), st.subject;

-- View: Subject MCQ accuracy over time
CREATE OR REPLACE VIEW v_subject_accuracy AS
SELECT 
  subject,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE is_correct) as correct_answers,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct) / NULLIF(COUNT(*), 0), 1) as accuracy_percentage,
  DATE_TRUNC('week', created_at) as week_start
FROM mcq_attempts
GROUP BY subject, DATE_TRUNC('week', created_at);

-- View: Weekly summary of study activity
CREATE OR REPLACE VIEW v_weekly_summary AS
SELECT 
  DATE_TRUNC('week', completed_at) as week_start,
  COUNT(DISTINCT DATE(completed_at)) as active_days,
  COUNT(*) as total_tasks,
  COALESCE(SUM(time_spent_minutes), 0) as total_minutes,
  ROUND(COALESCE(SUM(time_spent_minutes), 0) / 60.0, 1) as total_hours
FROM study_completions
WHERE completed_at IS NOT NULL
GROUP BY DATE_TRUNC('week', completed_at);

-- View: Overall syllabus coverage by subject
CREATE OR REPLACE VIEW v_syllabus_coverage AS
SELECT 
  st.subject,
  COUNT(DISTINCT st.id) as topics_studied,
  COUNT(DISTINCT sp.subject) as topics_in_plan
FROM (
  SELECT DISTINCT subject
  FROM study_tasks
) sp
LEFT JOIN study_tasks st ON sp.subject = st.subject AND st.status = 'completed'
GROUP BY st.subject;

-- View: User readiness factors
CREATE OR REPLACE VIEW v_readiness_factors AS
SELECT 
  -- Coverage factor
  (SELECT COALESCE(COUNT(DISTINCT subject), 0) * 100 / 5 FROM study_tasks WHERE status = 'completed') as coverage_factor,
  
  -- Accuracy factor
  (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct) / NULLIF(COUNT(*), 0), 1) FROM mcq_attempts) as accuracy_factor,
  
  -- Consistency factor (current streak / 30 * 100)
  (SELECT 
    CASE 
      WHEN MAX(streak) > 30 THEN 100 
      ELSE COALESCE(MAX(streak) * 100 / 30, 0)
    END
    FROM (
      SELECT COUNT(*) as streak
      FROM (
        SELECT DATE(completed_at) as study_date
        FROM study_completions
        WHERE completed_at IS NOT NULL
        GROUP BY DATE(completed_at)
      ) dates
      GROUP BY DATE(completed_at)
    )
  ) as consistency_factor,
  
  -- Mock test factor (mocks completed / 20 * 100, capped at 100)
  (SELECT LEAST(COUNT(*) * 100 / 20, 100) FROM study_tasks WHERE task_type = 'mock_test' AND status = 'completed') as mock_factor;

-- View: Daily activity heatmap data (last 120 days)
CREATE OR REPLACE VIEW v_activity_heatmap AS
SELECT 
  DATE(d)::date as study_date,
  COALESCE(SUM(sc.time_spent_minutes), 0) / 60.0 as total_hours,
  COUNT(DISTINCT sc.id) as tasks_completed
FROM generate_series(CURRENT_DATE - INTERVAL '119 days', CURRENT_DATE, '1 day'::interval) d
LEFT JOIN study_completions sc ON DATE(sc.completed_at) = DATE(d)
GROUP BY DATE(d);

