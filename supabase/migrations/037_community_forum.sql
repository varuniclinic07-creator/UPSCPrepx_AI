-- ============================================================================
-- Migration 037: Community Forum
-- Master Prompt v8.0 - F19 Community Features
-- ============================================================================

-- 1. Forum Threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[], -- e.g. 'Polity', 'History', 'Doubt'
  upvotes INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Forum Replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  is_solution BOOLEAN DEFAULT FALSE, -- Mark best answer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_forum_threads_created ON forum_threads(created_at DESC);
CREATE INDEX idx_forum_threads_tags ON forum_threads USING GIN(tags);
CREATE INDEX idx_forum_replies_thread ON forum_replies(thread_id);

-- RLS
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view threads" ON forum_threads FOR SELECT USING (true); -- Public read
CREATE POLICY "Users create threads" ON forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users delete own threads" ON forum_threads FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Users view replies" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Users create replies" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);