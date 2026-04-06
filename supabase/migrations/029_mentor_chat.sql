-- ============================================================================
-- Migration 029: AI Mentor Chat Tables & Policies
-- Master Prompt v8.0 - Feature F10 (READ Mode)
-- ============================================================================

-- Create tables
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES mentor_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('daily', 'weekly', 'exam')) DEFAULT 'daily',
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mentor_sessions_user ON mentor_sessions(user_id);
CREATE INDEX idx_mentor_sessions_created ON mentor_sessions(created_at DESC);
CREATE INDEX idx_mentor_messages_session ON mentor_messages(session_id);
CREATE INDEX idx_mentor_messages_created ON mentor_messages(created_at ASC);
CREATE INDEX idx_mentor_goals_user ON mentor_goals(user_id);
CREATE INDEX idx_mentor_goals_status ON mentor_goals(status);
CREATE INDEX idx_mentor_goals_due ON mentor_goals(due_date);

-- Enable Row Level Security
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_sessions
CREATE POLICY "Users can view own sessions"
  ON mentor_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON mentor_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON mentor_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for mentor_messages
CREATE POLICY "Users can view messages in own sessions"
  ON mentor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentor_sessions ms
      WHERE ms.id = session_id AND ms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON mentor_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mentor_sessions ms
      WHERE ms.id = session_id AND ms.user_id = auth.uid()
    )
  );

-- RLS Policies for mentor_goals
CREATE POLICY "Users can view own goals"
  ON mentor_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON mentor_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON mentor_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON mentor_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_mentor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mentor_sessions_timestamp
  BEFORE UPDATE ON mentor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_updated_at();

CREATE TRIGGER update_mentor_goals_timestamp
  BEFORE UPDATE ON mentor_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_updated_at();