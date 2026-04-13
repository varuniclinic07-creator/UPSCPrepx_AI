-- 045_alter_existing_tables.sql
-- Add KG linkage columns to existing content tables

-- current_affairs
ALTER TABLE current_affairs
  ADD COLUMN IF NOT EXISTS node_id           uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version           int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS confidence_score  float DEFAULT 0.7;

-- notes
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS node_id           uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version           int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS confidence_score  float DEFAULT 0.7;

-- quizzes (only if table exists — name may differ)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quizzes'
  ) THEN
    ALTER TABLE quizzes
      ADD COLUMN IF NOT EXISTS node_id           uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS version           int DEFAULT 1,
      ADD COLUMN IF NOT EXISTS confidence_score  float DEFAULT 0.7;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS current_affairs_node_idx ON current_affairs(node_id)
  WHERE node_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notes_node_idx ON notes(node_id)
  WHERE node_id IS NOT NULL;
