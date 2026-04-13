-- 043_content_queue.sql
-- AI content factory queue with approval workflow

CREATE TABLE IF NOT EXISTS content_queue (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id           uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  content_type      text NOT NULL CHECK (content_type IN (
                      'note','quiz','mind_map','answer_framework',
                      'ca_brief','mcq_set','video_script','animation_prompt'
                    )),
  generated_content jsonb NOT NULL DEFAULT '{}',
  ai_provider       text,
  agent_type        text,
  confidence_score  float CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending','approved','rejected','needs_revision'
                    )),
  reviewed_by       uuid,
  reviewed_at       timestamptz,
  review_notes      text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_queue_status_idx ON content_queue(status);
CREATE INDEX IF NOT EXISTS content_queue_node_idx   ON content_queue(node_id);
CREATE INDEX IF NOT EXISTS content_queue_type_idx   ON content_queue(content_type);
CREATE INDEX IF NOT EXISTS content_queue_pending_idx ON content_queue(created_at)
  WHERE status = 'pending';
