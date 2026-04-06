-- ============================================================================
-- Migration 033: AI Video Generation
-- Master Prompt v8.0 - Feature F15 (WATCH Mode)
-- ============================================================================

-- 1. Video Requests Table
-- Tracks the lifecycle of a user's video generation request.
CREATE TABLE IF NOT EXISTS video_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL, -- e.g. "Fundamental Rights"
  subject TEXT, -- e.g. "POLITY"
  
  -- Status Pipeline: 
  -- PENDING (In Queue) -> GENERATING (AI writing script) -> 
  -- RENDERING (Manim/Remotion) -> DONE -> FAILED
  status TEXT DEFAULT 'PENDING', 
  
  -- Output Artifacts
  video_url TEXT, -- URL to final MP4
  thumbnail_url TEXT, -- URL to thumbnail image
  transcript TEXT, -- Transcript for subtitles
  script_content TEXT, -- The actual python/manim script generated (for debugging/reuse)
  
  -- Metadata
  error_message TEXT, -- If status is FAILED
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX idx_video_req_user ON video_requests(user_id);
CREATE INDEX idx_video_req_status ON video_requests(status);

-- 3. RLS
ALTER TABLE video_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own videos" ON video_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own videos" ON video_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Trigger
CREATE OR REPLACE TRIGGER update_video_req_updated_at
  BEFORE UPDATE ON video_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
