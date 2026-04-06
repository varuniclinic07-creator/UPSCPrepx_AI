-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - IP RESTRICTIONS & ONE REG PER IP
-- Migration: 002_ip_restrictions.sql
-- Description: Prevent multiple registrations from same IP
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- IP TRACKING TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ip_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- IP Info
    ip_address INET NOT NULL,
    ip_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash for privacy
    
    -- User Reference
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    
    -- Device Info
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Location (Optional)
    country_code VARCHAR(2),
    city VARCHAR(100),
    
    -- Status
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    
    -- Tracking
    registration_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ip_hash ON ip_registrations(ip_hash);
CREATE INDEX idx_ip_address ON ip_registrations(ip_address);
CREATE INDEX idx_ip_user_id ON ip_registrations(user_id);

-- ═══════════════════════════════════════════════════════════════
-- IP WHITELIST/BLACKLIST
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ip_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- IP/Range
    ip_address INET,
    ip_range CIDR, -- For blocking ranges
    
    -- Rule Type
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('whitelist', 'blacklist')),
    reason TEXT,
    
    -- Applied By
    created_by UUID REFERENCES users(id),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Optional expiry
);

CREATE INDEX idx_ip_rules_address ON ip_rules(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_ip_rules_range ON ip_rules USING gist(ip_range) WHERE ip_range IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- IP VALIDATION FUNCTION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_ip_registration(
    p_ip_address INET,
    p_email VARCHAR(255)
)
RETURNS TABLE(
    can_register BOOLEAN,
    reason TEXT,
    existing_email VARCHAR(255)
) AS $$
DECLARE
    v_ip_hash VARCHAR(64);
    v_existing_registration RECORD;
    v_blocked_rule RECORD;
BEGIN
    -- Generate IP hash (server-side hashing should be done in app)
    v_ip_hash := encode(digest(p_ip_address::TEXT, 'sha256'), 'hex');
    
    -- Check if IP is blacklisted
    SELECT * INTO v_blocked_rule
    FROM ip_rules
    WHERE rule_type = 'blacklist'
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
        ip_address = p_ip_address
        OR (ip_range IS NOT NULL AND p_ip_address <<= ip_range)
    )
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT FALSE, 'IP address is blocked: ' || v_blocked_rule.reason, NULL::VARCHAR;
        RETURN;
    END IF;
    
    -- Check if IP already used for registration
    SELECT * INTO v_existing_registration
    FROM ip_registrations
    WHERE ip_hash = v_ip_hash
    AND is_blocked = FALSE
    LIMIT 1;
    
    IF FOUND THEN
        -- Check if same email (allow same user from same IP)
        IF v_existing_registration.user_email = p_email THEN
            RETURN QUERY SELECT TRUE, 'Same user from same IP', NULL::VARCHAR;
        ELSE
            RETURN QUERY SELECT FALSE, 'One registration per IP allowed', v_existing_registration.user_email;
        END IF;
    ELSE
        RETURN QUERY SELECT TRUE, 'IP available for registration', NULL::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- RECORD IP REGISTRATION FUNCTION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION record_ip_registration(
    p_user_id UUID,
    p_email VARCHAR(255),
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_ip_hash VARCHAR(64);
    v_registration_id UUID;
    v_existing RECORD;
BEGIN
    -- Generate IP hash
    v_ip_hash := encode(digest(p_ip_address::TEXT, 'sha256'), 'hex');
    
    -- Check if IP already exists
    SELECT * INTO v_existing
    FROM ip_registrations
    WHERE ip_hash = v_ip_hash;
    
    IF FOUND THEN
        -- Update existing record
        UPDATE ip_registrations
        SET 
            registration_count = registration_count + 1,
            last_attempt_at = NOW(),
            user_id = COALESCE(user_id, p_user_id),
            user_email = COALESCE(user_email, p_email)
        WHERE ip_hash = v_ip_hash
        RETURNING id INTO v_registration_id;
    ELSE
        -- Insert new record
        INSERT INTO ip_registrations (
            ip_address,
            ip_hash,
            user_id,
            user_email,
            user_agent,
            device_fingerprint
        ) VALUES (
            p_ip_address,
            v_ip_hash,
            p_user_id,
            p_email,
            p_user_agent,
            p_device_fingerprint
        )
        RETURNING id INTO v_registration_id;
    END IF;
    
    RETURN v_registration_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- ADMIN OVERRIDE FUNCTION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_override_ip_block(
    p_ip_hash VARCHAR(64),
    p_admin_user_id UUID,
    p_action VARCHAR(20)  -- 'unblock' or 'permanent_block'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_role VARCHAR(20);
BEGIN
    -- Verify admin role
    SELECT role INTO v_admin_role
    FROM users
    WHERE id = p_admin_user_id;
    
    IF v_admin_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    -- Perform action
    IF p_action = 'unblock' THEN
        UPDATE ip_registrations
        SET is_blocked = FALSE, block_reason = NULL
        WHERE ip_hash = p_ip_hash;
        RETURN TRUE;
    ELSIF p_action = 'permanent_block' THEN
        UPDATE ip_registrations
        SET is_blocked = TRUE, block_reason = 'Admin blocked'
        WHERE ip_hash = p_ip_hash;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 002
-- ═══════════════════════════════════════════════════════════════
