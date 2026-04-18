-- 054_v8_user_interactions.sql
-- Append-only source of truth for the three-agent v8 architecture.
-- This table is NEVER updated and NEVER deleted from. v8_user_mastery
-- (migration 055) is fully reconstructible from this table alone.

CREATE TABLE IF NOT EXISTS v8_user_interactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN (
                 'quiz_attempt',
                 'note_read',
                 'note_generated',
                 'mentor_turn',
                 'ca_read',
                 'doubt_asked'
               )),
  topic_id     text,
  payload      jsonb NOT NULL,           -- full event detail, shape varies by type
  result       jsonb,                     -- score, mastery delta, citations, etc.
  time_spent_ms integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS v8_user_interactions_user_created_idx
  ON v8_user_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS v8_user_interactions_type_idx
  ON v8_user_interactions(type);
CREATE INDEX IF NOT EXISTS v8_user_interactions_topic_idx
  ON v8_user_interactions(topic_id) WHERE topic_id IS NOT NULL;

-- RLS: users read their own rows; only service-role writes.
ALTER TABLE v8_user_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY v8_ui_self_read ON v8_user_interactions
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy — service role bypasses RLS.

COMMENT ON TABLE v8_user_interactions IS
  'v8 append-only event log. Source of truth. v8_user_mastery recomputes from here.';
