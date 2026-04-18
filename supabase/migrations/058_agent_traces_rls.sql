-- 058_agent_traces_rls.sql
-- Lock down agent_traces: service_role only.
-- Observability data contains user PII and cost/model metadata that must
-- never leak to authenticated or anon roles via PostgREST.
-- No SELECT/INSERT/UPDATE/DELETE policies means only service_role (which
-- bypasses RLS) can access the table.

ALTER TABLE agent_traces ENABLE ROW LEVEL SECURITY;
