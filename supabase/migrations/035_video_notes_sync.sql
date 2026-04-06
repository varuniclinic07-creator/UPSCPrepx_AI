-- ============================================================================
-- Migration 035: Video Notes Sync (Update Notes Table)
-- Master Prompt v8.0 - Feature F17 (WATCH Mode)
-- ============================================================================

-- 1. Update User Notes Table
-- Add columns to link a note to a specific video moment.
ALTER TABLE user_notes 
  ADD COLUMN IF NOT EXISTS source_video_id UUID REFERENCES video_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS video_timestamp_seconds INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT NULL CHECK (source_type IN ('TEXT', 'VIDEO', 'PDF', 'MCQ', 'CA')); -- Identify if note came from video

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_notes_video_src ON user_notes(source_video_id);

-- 3. Notes are already fully secured by existing RLS policies on user_notes.
