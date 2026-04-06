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

CREATE INDEX idx_user_xp_total ON user_xp_stats(total_earned DESC);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_xp_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Stats Policies
CREATE POLICY "Users view own XP"