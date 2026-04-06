-- ═══════════════════════════════════════════════════════════════
-- AUDIT LOGGING SYSTEM
-- Migration: 014_audit_logging.sql
-- Tracks admin actions, security events, and compliance
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- AUDIT LOG TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(20),
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- 'user.update', 'payment.refund', 'admin.login', etc.
    resource_type VARCHAR(50), -- 'user', 'payment', 'subscription', etc.
    resource_id UUID,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changes JSONB, -- Computed diff
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Metadata
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'error')),
    error_message TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- ═══════════════════════════════════════════════════════════════
-- SECURITY EVENTS TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'failed_login', 'suspicious_activity', 'rate_limit_exceeded'
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- User context
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    
    -- Request details
    ip_address INET NOT NULL,
    user_agent TEXT,
    endpoint VARCHAR(255),
    
    -- Event data
    details JSONB,
    
    -- Response
    blocked BOOLEAN DEFAULT FALSE,
    action_taken VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_date ON security_events(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- ENABLE RLS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can view security events"
    ON security_events FOR SELECT
    USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- AUDIT LOGGING FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_email VARCHAR(255);
    v_user_role VARCHAR(20);
BEGIN
    -- Get user details
    SELECT email, role INTO v_user_email, v_user_role
    FROM users WHERE id = p_user_id;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        v_user_email,
        v_user_role,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(50),
    p_severity VARCHAR(20),
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_blocked BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO security_events (
        event_type,
        severity,
        user_id,
        ip_address,
        details,
        blocked
    ) VALUES (
        p_event_type,
        p_severity,
        p_user_id,
        p_ip_address,
        p_details,
        p_blocked
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- AUTOMATIC AUDIT TRIGGERS FOR CRITICAL TABLES
-- ═══════════════════════════════════════════════════════════════

-- Trigger for user role changes
CREATE OR REPLACE FUNCTION audit_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        PERFORM log_audit_event(
            NEW.id,
            'user.role_changed',
            'user',
            NEW.id,
            jsonb_build_object('role', OLD.role),
            jsonb_build_object('role', NEW.role)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_user_role
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION audit_user_role_change();

-- Trigger for subscription changes
CREATE OR REPLACE FUNCTION audit_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier 
       OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status THEN
        PERFORM log_audit_event(
            NEW.id,
            'user.subscription_changed',
            'user',
            NEW.id,
            jsonb_build_object(
                'tier', OLD.subscription_tier,
                'status', OLD.subscription_status
            ),
            jsonb_build_object(
                'tier', NEW.subscription_tier,
                'status', NEW.subscription_status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_subscription
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier 
          OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
    EXECUTE FUNCTION audit_subscription_change();

-- ═══════════════════════════════════════════════════════════════
-- AUDIT LOG RETENTION POLICY
-- ═══════════════════════════════════════════════════════════════

-- Function to clean old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND severity = 'info';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 014
-- ═══════════════════════════════════════════════════════════════
