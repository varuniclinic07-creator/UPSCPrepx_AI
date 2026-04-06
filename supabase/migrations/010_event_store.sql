-- ═══════════════════════════════════════════════════════════════
-- EVENT STORE TABLE
-- For audit trail and event sourcing
-- ═══════════════════════════════════════════════════════════════

-- Event store table
CREATE TABLE IF NOT EXISTS event_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure events are ordered correctly per aggregate
    UNIQUE(aggregate_id, version)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate ON event_store(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_event_store_type ON event_store(event_type);
CREATE INDEX IF NOT EXISTS idx_event_store_created ON event_store(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate_type ON event_store(aggregate_type);

-- Audit log table for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    ip_address VARCHAR(45),
    ip_hash VARCHAR(64),
    user_agent TEXT,
    endpoint VARCHAR(255),
    request_method VARCHAR(10),
    status_code INTEGER,
    error_message TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_ip ON security_audit_log(ip_hash);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(50),
    p_user_id UUID DEFAULT NULL,
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_endpoint VARCHAR(255) DEFAULT NULL,
    p_status_code INTEGER DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_ip_hash VARCHAR(64);
    v_log_id UUID;
BEGIN
    -- Hash IP for privacy
    IF p_ip_address IS NOT NULL THEN
        v_ip_hash := encode(sha256((p_ip_address || current_setting('app.ip_salt', true))::bytea), 'hex');
    END IF;
    
    INSERT INTO security_audit_log (
        event_type, user_id, ip_address, ip_hash, user_agent, 
        endpoint, status_code, details
    ) VALUES (
        p_event_type, p_user_id, p_ip_address, v_ip_hash, p_user_agent,
        p_endpoint, p_status_code, p_details
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for event store
ALTER TABLE event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read event store directly
CREATE POLICY event_store_admin_only ON event_store
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Security logs only visible to admins
CREATE POLICY security_log_admin_only ON security_audit_log
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );
