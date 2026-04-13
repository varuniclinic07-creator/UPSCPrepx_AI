-- 044_agent_runs.sql
-- Tracks every agent execution for monitoring and debugging

CREATE TABLE IF NOT EXISTS agent_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type        text NOT NULL CHECK (agent_type IN (
                      'research','notes','quiz','ca_ingestion',
                      'normalizer','evaluator','quality_check','video','animation'
                    )),
  status            text NOT NULL DEFAULT 'running' CHECK (status IN (
                      'running','completed','failed','partial'
                    )),
  nodes_processed   int DEFAULT 0,
  content_generated int DEFAULT 0,
  errors            jsonb DEFAULT '[]',
  started_at        timestamptz DEFAULT now(),
  completed_at      timestamptz,
  metadata          jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS agent_runs_type_idx    ON agent_runs(agent_type);
CREATE INDEX IF NOT EXISTS agent_runs_status_idx  ON agent_runs(status);
CREATE INDEX IF NOT EXISTS agent_runs_started_idx ON agent_runs(started_at DESC);
