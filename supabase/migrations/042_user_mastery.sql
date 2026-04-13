-- 042_user_mastery.sql
-- Per-user per-node mastery tracking with SRS scheduling

CREATE TABLE IF NOT EXISTS user_mastery (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id             uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  accuracy_score      float DEFAULT 0 CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  attempts            int DEFAULT 0,
  correct             int DEFAULT 0,
  time_spent_seconds  int DEFAULT 0,
  mastery_level       text NOT NULL DEFAULT 'not_started' CHECK (mastery_level IN (
                        'not_started','weak','developing','strong','mastered'
                      )),
  next_revision_at    timestamptz,
  last_attempted_at   timestamptz,
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, node_id)
);

CREATE INDEX IF NOT EXISTS user_mastery_user_idx     ON user_mastery(user_id);
CREATE INDEX IF NOT EXISTS user_mastery_node_idx     ON user_mastery(node_id);
CREATE INDEX IF NOT EXISTS user_mastery_level_idx    ON user_mastery(mastery_level);
CREATE INDEX IF NOT EXISTS user_mastery_revision_idx ON user_mastery(next_revision_at)
  WHERE next_revision_at IS NOT NULL;
