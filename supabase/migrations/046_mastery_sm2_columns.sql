-- 046_mastery_sm2_columns.sql
-- Add SM-2 algorithm columns to user_mastery for proper spaced repetition

ALTER TABLE user_mastery
  ADD COLUMN IF NOT EXISTS ease_factor    float DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days  int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repetitions    int DEFAULT 0;
