-- 049: Lecture bookmarks + watch history for WATCH mode classroom features

-- Lecture bookmarks — timestamp-synced bookmarks within lectures
CREATE TABLE IF NOT EXISTS lecture_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lecture_job_id UUID NOT NULL,
  chapter_number INTEGER NOT NULL DEFAULT 1,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lecture_bookmarks_user ON lecture_bookmarks(user_id);
CREATE INDEX idx_lecture_bookmarks_job ON lecture_bookmarks(lecture_job_id);

ALTER TABLE lecture_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lecture bookmarks"
  ON lecture_bookmarks FOR ALL USING (auth.uid() = user_id);

-- Lecture watch history — resume position + analytics
CREATE TABLE IF NOT EXISTS lecture_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lecture_job_id UUID NOT NULL,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  last_chapter INTEGER NOT NULL DEFAULT 1,
  total_watch_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lecture_job_id)
);

CREATE INDEX idx_lecture_watch_user ON lecture_watch_history(user_id);

ALTER TABLE lecture_watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watch history"
  ON lecture_watch_history FOR ALL USING (auth.uid() = user_id);
