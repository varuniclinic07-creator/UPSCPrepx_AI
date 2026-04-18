-- 057_agent_traces.sql
-- Observability table for the three v8 production agents.
-- Distinct from agent_runs (044) which tracks Hermes pipeline runs.
--
-- Spec clarification: parent_trace_id originally specified as
-- REFERENCES agent_traces(trace_id). Postgres requires FK targets to be
-- UNIQUE or PRIMARY KEY; trace_id is intentionally non-unique (multi-row
-- per trace), so the FK target was changed to agent_traces(id) — nested
-- calls reference the parent row's PK. DEFERRABLE dropped (not needed when
-- referencing a stable PK).

CREATE TABLE IF NOT EXISTS agent_traces (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id          uuid NOT NULL,
  parent_trace_id   uuid REFERENCES agent_traces(id),
  agent             text NOT NULL CHECK (agent IN (
                      'knowledge','evaluation','orchestrator'
                    )),
  method            text NOT NULL,
  feature           text,
  status            text NOT NULL DEFAULT 'success' CHECK (status IN (
                      'success','failure','degraded'
                    )),
  user_id           uuid,
  input             jsonb,
  output            jsonb,
  latency_ms        integer,
  tokens_in         integer,
  tokens_out        integer,
  cost_usd          numeric(10,6),
  model             text,
  error             text,
  version           text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_traces_trace_idx ON agent_traces(trace_id);
CREATE INDEX IF NOT EXISTS agent_traces_parent_idx ON agent_traces(parent_trace_id)
  WHERE parent_trace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_traces_agent_created_idx
  ON agent_traces(agent, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_traces_feature_created_idx
  ON agent_traces(feature, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_traces_user_created_idx
  ON agent_traces(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_traces_status_idx
  ON agent_traces(status) WHERE status != 'success';

COMMENT ON TABLE agent_traces IS
  'Per-method call trace for v8 agents. Every agent call MUST produce a row.';
