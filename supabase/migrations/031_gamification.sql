-- ============================================================================
-- Migration 031: Gamification & Leaderboard
-- Master Prompt v8.0 - Feature F13 (READ Mode)
-- ============================================================================

-- 1. User XP Stats Table
-- Keeps track of current level, total XP, and balance.
CREATE TABLE IF NOT EXISTS user_xp_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  current_balance INTEGER DEFAULT 0, -- Spendable XP
  total_earned INTEGER DEFAULT 0,    -- Lifetime XP (for Ranking)
  level INTEGER DEFAULT 1,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_freezes INTEGER DEFAULT 0,  -- Number of freeze items owned

  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Achievements (Master List)
-- Static or dynamic definitions of badges.
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'FIRST_STUDY'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- URL or icon key
  xp_reward INTEGER DEFAULT 0 -- Bonus XP for unlocking
);

-- 3. User Achievements Unlocked
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 4. XP Transactions (Audit Log)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  amount INTEGER NOT NULL, -- Positive for earn, Negative for spend
  source TEXT NOT NULL, -- 'quiz', 'streak', 'shop', 'task'
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_xp_total ON user_xp_stats(total_earned DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_xp_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- user_xp_stats policies
DROP POLICY IF EXISTS "Users view own XP" ON user_xp_stats;
CREATE POLICY "Users view own XP"
  ON user_xp_stats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view leaderboard XP" ON user_xp_stats;
CREATE POLICY "Users view leaderboard XP"
  ON user_xp_stats FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System manages XP stats" ON user_xp_stats;
CREATE POLICY "System manages XP stats"
  ON user_xp_stats FOR ALL
  USING (true);

-- achievements policies (public read, admin write)
DROP POLICY IF EXISTS "Achievements public read" ON achievements;
CREATE POLICY "Achievements public read"
  ON achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Achievements admin write" ON achievements;
CREATE POLICY "Achievements admin write"
  ON achievements FOR ALL
  USING (auth.jwt()->>'role' = 'admin');

-- user_achievements policies
DROP POLICY IF EXISTS "Users view own achievements" ON user_achievements;
CREATE POLICY "Users view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System grants achievements" ON user_achievements;
CREATE POLICY "System grants achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- xp_transactions policies
DROP POLICY IF EXISTS "Users view own XP transactions" ON xp_transactions;
CREATE POLICY "Users view own XP transactions"
  ON xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System records XP transactions" ON xp_transactions;
CREATE POLICY "System records XP transactions"
  ON xp_transactions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Award XP to a user and update their stats
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Insert transaction record
  INSERT INTO xp_transactions (user_id, amount, source, description)
  VALUES (p_user_id, p_amount, p_source, p_description);

  -- Upsert user_xp_stats
  INSERT INTO user_xp_stats (user_id, current_balance, total_earned, last_updated)
  VALUES (p_user_id, GREATEST(0, p_amount), GREATEST(0, p_amount), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_balance = GREATEST(0, user_xp_stats.current_balance + p_amount),
    total_earned    = CASE WHEN p_amount > 0
                           THEN user_xp_stats.total_earned + p_amount
                           ELSE user_xp_stats.total_earned END,
    last_updated    = NOW();

  -- Recalculate level (every 500 XP = 1 level)
  SELECT total_earned INTO v_new_total
  FROM user_xp_stats WHERE user_id = p_user_id;

  v_new_level := GREATEST(1, (v_new_total / 500) + 1);

  UPDATE user_xp_stats
  SET level = v_new_level
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update streak on daily login/study activity
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_updated DATE;
  v_streak INTEGER;
  v_longest INTEGER;
BEGIN
  SELECT DATE(last_updated), streak_count, longest_streak
  INTO v_last_updated, v_streak, v_longest
  FROM user_xp_stats
  WHERE user_id = p_user_id;

  IF v_last_updated IS NULL THEN
    -- First activity
    INSERT INTO user_xp_stats (user_id, streak_count, longest_streak, last_updated)
    VALUES (p_user_id, 1, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      streak_count    = 1,
      longest_streak  = 1,
      last_updated    = NOW();

  ELSIF v_last_updated = CURRENT_DATE THEN
    -- Already updated today, do nothing
    NULL;

  ELSIF v_last_updated = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day — extend streak
    UPDATE user_xp_stats
    SET streak_count   = streak_count + 1,
        longest_streak = GREATEST(longest_streak, streak_count + 1),
        last_updated   = NOW()
    WHERE user_id = p_user_id;

  ELSE
    -- Streak broken — reset to 1
    UPDATE user_xp_stats
    SET streak_count = 1,
        last_updated = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Achievements Master List
-- ============================================================================

INSERT INTO achievements (code, name, description, icon, xp_reward) VALUES
  ('FIRST_STUDY',      'First Step',         'Complete your first study session',                  'star',       50),
  ('STREAK_3',         '3-Day Streak',        'Study for 3 consecutive days',                       'fire',       75),
  ('STREAK_7',         'Weekly Warrior',      'Study for 7 consecutive days',                       'fire',      150),
  ('STREAK_30',        'Monthly Master',      'Study for 30 consecutive days',                      'trophy',    500),
  ('MCQ_10',           'Quiz Starter',        'Answer 10 MCQs',                                     'quiz',       50),
  ('MCQ_100',          'Quiz Champion',       'Answer 100 MCQs',                                    'medal',     200),
  ('MCQ_500',          'MCQ Legend',          'Answer 500 MCQs',                                    'crown',     750),
  ('ACCURACY_80',      'Sharp Shooter',       'Achieve 80% accuracy in a practice session',         'target',    100),
  ('ACCURACY_90',      'Perfectionist',       'Achieve 90% accuracy in a practice session',         'diamond',   250),
  ('FIRST_MOCK',       'Mock Debut',          'Complete your first mock test',                      'paper',     100),
  ('MOCK_5',           'Mock Veteran',        'Complete 5 mock tests',                              'scroll',    300),
  ('DOUBT_SOLVED',     'Curious Mind',        'Get your first doubt answered',                      'lightbulb',  50),
  ('ESSAY_FIRST',      'Pen to Paper',        'Submit your first essay for evaluation',             'pen',       100),
  ('LEVEL_5',          'Rising Star',         'Reach Level 5',                                      'star',      200),
  ('LEVEL_10',         'Dedicated Scholar',   'Reach Level 10',                                     'book',      500),
  ('LEVEL_20',         'UPSC Warrior',        'Reach Level 20',                                     'shield',   1000)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- MIGRATION METADATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version, name, applied_at)
VALUES ('031', 'Gamification & Leaderboard', NOW())
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION 031
-- ============================================================================
