-- 062_agent_traces_drop_parent_fk.sql
-- Drop the self-referential FK on agent_traces.parent_trace_id.
--
-- Rationale: agent_traces is write-only observability. Children are written
-- BEFORE their parent (the orchestrator records its own trace last, after
-- sub-agent calls complete), which triggered FK violations. Referential
-- integrity on trace chains is nice-to-have; uniqueness of trace_id +
-- best-effort linkage is sufficient for the dashboard join.
ALTER TABLE agent_traces DROP CONSTRAINT IF EXISTS agent_traces_parent_trace_id_fkey;
