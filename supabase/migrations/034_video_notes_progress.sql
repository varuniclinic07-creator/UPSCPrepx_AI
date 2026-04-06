-- ============================================================================
-- Migration 034: Video Notes & Watch Progress
-- Master Prompt v8.0 - Feature F16 (WATCH Mode)
-- ============================================================================

-- 1. Video Notes Table
-- Timestamped notes anchored to specific moments in a video.
CREATE TABLE IF NOT EXISTS video_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_request_id UUID REFERENCES video_requests(id) ON DELETE CASCADE NOT NULL,
  
  timestamp_seconds INT NOT NULL, -- e.g. 85 for 01:25
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Watch Progress Table
-- Tracks where the user left off and playback speed preferences.
CREATE TABLE IF NOT EXISTS video_watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_request_id UUID REFERENCES video_requests(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  last_position_seconds INT DEFAULT 0,
  playback_speed FLOAT DEFAULT 1.0,
  percent_watched NUMERIC(5,2) DEFAULT 0,
  
  -- If 100%, the video is marked complete
  is_completed BOOLEAN DEFAULT FALSE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_video_notes_user ON video_notes(user_id);
CREATE INDEX idx_video_notes_video ON video_notes(video_request_id);
CREATE INDEX idx_vid_prog_user ON video_watch_progress(user_id);

-- RLS
ALTER TABLE video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_watch_progress ENABLE ROW LEVEL SECURITY;

-- Notes Policies
CREATE POLICY "Users view own notes" ON video_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own notes" ON video_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notes" ON video_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notes" ON video_notes FOR DELETE USING (auth.uid() = user_id);

-- Progress Policies
CREATE POLICY "Users view own prog" ON video_watch_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own prog" ON video_watch_progress FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_vid_notes_updated_at
  BEFORE UPDATE ON video_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
