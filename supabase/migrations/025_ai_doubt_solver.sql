-- ============================================================================
-- Migration 025: AI Doubt Solver
-- Feature F5 - READ Mode
-- Master Prompt v8.0 Compliant
-- ============================================================================

-- ============================================================================
-- DOUBT THREADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS doubt_threads (
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

CREATE INDEX IF NOT EXISTS idx_doubt_threads_user ON doubt_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_doubt_threads_subject ON doubt_threads(subject);
CREATE INDEX IF NOT EXISTS idx_doubt_threads_status ON doubt_threads(status);
CREATE INDEX IF NOT EXISTS idx_doubt_threads_created ON doubt_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doubt_threads_bookmarked ON doubt_threads(is_bookmarked) WHERE is_bookmarked = TRUE;

-- ============================================================================
-- DOUBT QUESTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS doubt_questions (
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

CREATE INDEX IF NOT EXISTS idx_doubt_questions_thread ON doubt_questions(thread_id);
CREATE INDEX IF NOT EXISTS idx_doubt_questions_user ON doubt_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_doubt_questions_created ON doubt_questions(created_at DESC);

-- ============================================================================
-- DOUBT ANSWERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS doubt_answers (
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

CREATE INDEX IF NOT EXISTS idx_doubt_answers_thread ON doubt_answers(thread_id);
CREATE INDEX IF NOT EXISTS idx_doubt_answers_question ON doubt_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_doubt_answers_created ON doubt_answers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doubt_answers_provider ON doubt_answers(ai_provider);

-- ============================================================================
-- DOUBT RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS doubt_ratings (
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

CREATE INDEX IF NOT EXISTS idx_doubt_ratings_answer ON doubt_ratings(answer_id);
CREATE INDEX IF NOT EXISTS idx_doubt_ratings_user ON doubt_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_doubt_ratings_flagged ON doubt_ratings(is_flagged) WHERE is_flagged = TRUE;

-- ============================================================================
-- DOUBT ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS doubt_attachments (
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

CREATE INDEX IF NOT EXISTS idx_doubt_attachments_question ON doubt_attachments(question_id);
CREATE INDEX IF NOT EXISTS idx_doubt_attachments_user ON doubt_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_doubt_attachments_type ON doubt_attachments(file_type);

-- ============================================================================
-- DOUBT USAGE TRACKING (for free/premium limits)
-- ============================================================================

CREATE TABLE IF NOT EXISTS doubt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM format
  text_doubts INTEGER DEFAULT 0,
  image_doubts INTEGER DEFAULT 0,
  voice_doubts INTEGER DEFAULT 0,
  total_doubts INTEGER DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_doubt_usage_user ON doubt_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_doubt_usage_month ON doubt_usage(month);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE doubt_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_usage ENABLE ROW LEVEL SECURITY;

-- Doubt threads policies
DROP POLICY IF EXISTS "Users can view own threads" ON doubt_threads;
CREATE POLICY "Users can view own threads"
  ON doubt_threads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own threads" ON doubt_threads;
CREATE POLICY "Users can create own threads"
  ON doubt_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own threads" ON doubt_threads;
CREATE POLICY "Users can update own threads"
  ON doubt_threads FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own threads" ON doubt_threads;
CREATE POLICY "Users can delete own threads"
  ON doubt_threads FOR DELETE
  USING (auth.uid() = user_id);

-- Doubt questions policies
DROP POLICY IF EXISTS "Users can view own questions" ON doubt_questions;
CREATE POLICY "Users can view own questions"
  ON doubt_questions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own questions" ON doubt_questions;
CREATE POLICY "Users can create own questions"
  ON doubt_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Doubt answers policies (read access to all for learning)
DROP POLICY IF EXISTS "Users can view all answers" ON doubt_answers;
CREATE POLICY "Users can view all answers"
  ON doubt_answers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can create answers" ON doubt_answers;
CREATE POLICY "System can create answers"
  ON doubt_answers FOR INSERT
  WITH CHECK (true);

-- Doubt ratings policies
DROP POLICY IF EXISTS "Users can view all ratings" ON doubt_ratings;
CREATE POLICY "Users can view all ratings"
  ON doubt_ratings FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can rate answers" ON doubt_ratings;
CREATE POLICY "Users can rate answers"
  ON doubt_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON doubt_ratings;
CREATE POLICY "Users can update own ratings"
  ON doubt_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Doubt attachments policies
DROP POLICY IF EXISTS "Users can view own attachments" ON doubt_attachments;
CREATE POLICY "Users can view own attachments"
  ON doubt_attachments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own attachments" ON doubt_attachments;
CREATE POLICY "Users can create own attachments"
  ON doubt_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Doubt usage policies
DROP POLICY IF EXISTS "Users can view own usage" ON doubt_usage;
CREATE POLICY "Users can view own usage"
  ON doubt_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update usage" ON doubt_usage;
CREATE POLICY "System can update usage"
  ON doubt_usage FOR ALL
  USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update thread updated_at timestamp
CREATE OR REPLACE FUNCTION update_doubt_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_doubt_thread_updated_at ON doubt_threads;
CREATE TRIGGER update_doubt_thread_updated_at
  BEFORE UPDATE ON doubt_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_doubt_thread_updated_at();

-- Function to auto-resolve thread when answered
CREATE OR REPLACE FUNCTION auto_resolve_doubt_thread()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE doubt_threads
  SET status = 'answered', resolved_at = NOW()
  WHERE id = NEW.thread_id AND status = 'open';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-resolve
DROP TRIGGER IF EXISTS auto_resolve_doubt_thread ON doubt_answers;
CREATE TRIGGER auto_resolve_doubt_thread
  AFTER INSERT ON doubt_answers
  FOR EACH ROW
  EXECUTE FUNCTION auto_resolve_doubt_thread();

-- Function to update doubt usage on new question
CREATE OR REPLACE FUNCTION update_doubt_usage_on_question()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
  attachment_type TEXT;
BEGIN
  current_month := TO_CHAR(NEW.created_at, 'YYYY-MM');
  
  -- Determine doubt type from attachments
  IF NEW.attachments IS NOT NULL AND jsonb_array_length(NEW.attachments) > 0 THEN
    attachment_type := (NEW.attachments->0->>'type');
  ELSE
    attachment_type := 'text';
  END IF;
  
  -- Insert or update usage
  INSERT INTO doubt_usage (user_id, month, text_doubts, image_doubts, voice_doubts, total_doubts)
  VALUES (
    NEW.user_id,
    current_month,
    CASE WHEN attachment_type = 'text' THEN 1 ELSE 0 END,
    CASE WHEN attachment_type = 'image' THEN 1 ELSE 0 END,
    CASE WHEN attachment_type = 'audio' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (user_id, month) DO UPDATE SET
    text_doubts = doubt_usage.text_doubts + CASE WHEN attachment_type = 'text' THEN 1 ELSE 0 END,
    image_doubts = doubt_usage.image_doubts + CASE WHEN attachment_type = 'image' THEN 1 ELSE 0 END,
    voice_doubts = doubt_usage.voice_doubts + CASE WHEN attachment_type = 'audio' THEN 1 ELSE 0 END,
    total_doubts = doubt_usage.total_doubts + 1,
    last_reset = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for usage tracking
DROP TRIGGER IF EXISTS update_doubt_usage_on_question ON doubt_questions;
CREATE TRIGGER update_doubt_usage_on_question
  AFTER INSERT ON doubt_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_doubt_usage_on_question();

-- Function to get monthly usage for a user
CREATE OR REPLACE FUNCTION get_doubt_usage_for_user(user_uuid UUID)
RETURNS TABLE (
  month TEXT,
  text_doubts INTEGER,
  image_doubts INTEGER,
  voice_doubts INTEGER,
  total_doubts INTEGER,
  limit_remaining INTEGER
) AS $$
DECLARE
  current_month TEXT;
  user_plan TEXT;
  monthly_limit INTEGER;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get user's plan
  SELECT plan_type INTO user_plan
  FROM user_subscriptions
  WHERE user_id = user_uuid AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;
  
  -- Set limits based on plan
  IF user_plan = 'premium' OR user_plan = 'premium_plus' THEN
    monthly_limit := 999999; -- Unlimited
  ELSE
    monthly_limit := 10; -- Free tier
  END IF;
  
  RETURN QUERY
  SELECT
    COALESCE(du.month, current_month) AS month,
    COALESCE(du.text_doubts, 0)::INTEGER AS text_doubts,
    COALESCE(du.image_doubts, 0)::INTEGER AS image_doubts,
    COALESCE(du.voice_doubts, 0)::INTEGER AS voice_doubts,
    COALESCE(du.total_doubts, 0)::INTEGER AS total_doubts,
    GREATEST(0, monthly_limit - COALESCE(du.total_doubts, 0))::INTEGER AS limit_remaining
  FROM doubt_usage du
  WHERE du.user_id = user_uuid AND du.month = current_month;

  -- If no record exists, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      current_month,
      0::INTEGER,
      0::INTEGER,
      0::INTEGER,
      0::INTEGER,
      monthly_limit::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA: Sample Doubt Threads (for testing)
-- ============================================================================

-- Note: Actual seed data will be created by admin or through user usage
-- These are placeholder comments for future seed data

-- Example seed structure:
-- INSERT INTO doubt_threads (user_id, title_en, title_hi, subject, topic, status)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'What is fiscal federalism?', 'राजकोषीय संघवाद क्या है?', 'GS2', 'Federalism', 'answered');

-- ============================================================================
-- MIGRATION METADATA
-- ============================================================================

-- schema_migrations stub (safe if already exists)
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version, name, applied_at)
VALUES ('025', 'AI Doubt Solver', NOW())
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION 025
-- ============================================================================
