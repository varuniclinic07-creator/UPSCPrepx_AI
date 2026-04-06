-- ============================================================================
-- Migration 032: Bookmarks & Spaced Repetition System
-- Master Prompt v8.0 - Feature F14 (READ Mode)
-- ============================================================================

-- 1. Bookmarks Table
-- Stores the bookmarked content from Notes, PDFs, Current Affairs, etc.
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Source Context
  source_type TEXT NOT NULL CHECK (source_type IN ('NOTE', 'PDF', 'CA_ARTICLE', 'VIDEO')),
  source_id UUID NOT NULL,
  content TEXT NOT NULL, -- The bookmarked text
  context_url TEXT,      -- Link back to source

  -- Flashcard Data (Optional)
  front_content TEXT,    -- Question/Front side
  back_content TEXT,     -- Answer/Back side

  -- Metadata
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SRS Stats Table
-- Tracks the spaced repetition state for each bookmark (SM-2 Algorithm)
CREATE TABLE IF NOT EXISTS srs_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  interval_days INTEGER DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  lapses INTEGER DEFAULT 0,

  last_reviewed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_source ON bookmarks(source_type, source_id);
CREATE INDEX idx_srs_due ON srs_stats(next_review_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_stats ENABLE ROW LEVEL SECURITY;

-- Bookmarks Policies
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON bookmarks FOR UPDATE USING (auth.uid() = user_id);

-- SRS Policies
CREATE POLICY "Users can view own srs"
  ON srs_stats FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookmarks b WHERE b.id = srs_stats.bookmark_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own srs"
  ON srs_stats FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookmarks b WHERE b.id = srs_stats.bookmark_id AND b.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
