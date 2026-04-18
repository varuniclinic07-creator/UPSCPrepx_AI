-- 055_v8_user_mastery.sql
-- Derived aggregated mastery state for v8 architecture.
-- WRITE ACCESS: Evaluation Agent ONLY (src/lib/agents/core/evaluation-agent.ts).
-- Fully reconstructible from v8_user_interactions via recomputeMastery().
-- Named with v8_ prefix to coexist with legacy user_mastery (migration 042).

CREATE TABLE IF NOT EXISTS v8_user_mastery (
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id         text NOT NULL,
  mastery          numeric(3,2) NOT NULL CHECK (mastery BETWEEN 0 AND 1),
  confidence       numeric(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  last_seen        timestamptz NOT NULL DEFAULT now(),
  streak_days      integer NOT NULL DEFAULT 0,
  scoring_version  text NOT NULL,          -- which scoring logic produced this row
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS v8_user_mastery_user_last_seen_idx
  ON v8_user_mastery(user_id, last_seen DESC);
CREATE INDEX IF NOT EXISTS v8_user_mastery_user_mastery_idx
  ON v8_user_mastery(user_id, mastery ASC);

ALTER TABLE v8_user_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY v8_um_self_read ON v8_user_mastery
  FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE v8_user_mastery IS
  'v8 derived mastery state. Evaluation Agent is the ONLY legal writer.';
