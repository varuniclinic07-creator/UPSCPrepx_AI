-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 17: Zero-Trust Audit Logs Table
-- Append-only record of all privileged admin/system operations.
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop and recreate to fix any prior partial run that may have
-- created the table with a different schema (missing actor_id etc.)
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action       TEXT NOT NULL,
    actor_id     UUID NOT NULL,
    actor_email  TEXT,
    target_id    TEXT,
    target_type  TEXT,
    before_state JSONB,
    after_state  JSONB,
    reason       TEXT,
    request_id   TEXT,
    ip_address   TEXT,
    user_agent   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs are append-only — service role may insert but not modify
REVOKE UPDATE, DELETE ON audit_logs FROM service_role;
GRANT INSERT, SELECT ON audit_logs TO service_role;

-- Indexes for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor  ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_id, target_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date   ON audit_logs(created_at DESC);

-- RLS: only super_admin may read; inserts go via service_role only
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_read_audit_logs"
    ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
        )
    );

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for privileged operations (Phase 17 Zero-Trust)';
