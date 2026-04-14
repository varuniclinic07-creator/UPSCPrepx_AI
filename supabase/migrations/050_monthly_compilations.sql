-- 050: Monthly compilations table for video + PDF compilations

CREATE TABLE IF NOT EXISTS monthly_compilations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  pdf_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  topic_count INTEGER DEFAULT 0,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month, year)
);

CREATE INDEX idx_monthly_comp_user ON monthly_compilations(user_id);

ALTER TABLE monthly_compilations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own compilations"
  ON monthly_compilations FOR ALL USING (auth.uid() = user_id);
