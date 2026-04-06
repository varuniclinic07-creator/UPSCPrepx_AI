-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - 24-HOUR TRIAL SYSTEM
-- Migration: 003_trial_system.sql
-- Description: Auto-block after 24 hours, post-trial access control
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- TRIAL TRACKING
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.trial_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Trial Info
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    is_expired BOOLEAN DEFAULT FALSE,
    
    -- Access Tracking
    features_used JSONB DEFAULT '[]'::jsonb, -- Track which features they tried
    total_notes_generated INTEGER DEFAULT 0,
    total_quizzes_taken INTEGER DEFAULT 0,
    total_time_spent_minutes INTEGER DEFAULT 0,
    
    -- Conversion Tracking
   converted_to_paid BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMPTZ,
    converted_to_plan VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trial_sessions_user_id ON trial_sessions(user_id);
CREATE INDEX idx_trial_sessions_ends_at ON trial_sessions(ends_at);

-- ═══════════════════════════════════════════════════════════════
-- AUTO-ACTIVATE TRIAL ON USER CREATION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION activate_trial_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Set trial dates in users table
    NEW.trial_started_at := NOW();
    NEW.trial_ends_at := NOW() + INTERVAL '24 hours';
    NEW.trial_used := TRUE;
    NEW.subscription_status := 'trial';
    
    -- Create trial session record
    INSERT INTO trial_sessions (user_id, started_at, ends_at)
    VALUES (NEW.id, NOW(), NOW() + INTERVAL '24 hours');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activate_trial
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION activate_trial_on_signup();

-- ═══════════════════════════════════════════════════════════════
-- CHECK TRIAL STATUS FUNCTION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_trial_status(p_user_id UUID)
RETURNS TABLE(
    is_active BOOLEAN,
    time_remaining_seconds INTEGER,
    has_expired BOOLEAN,
    can_access_premium BOOLEAN
) AS $$
DECLARE
    v_user RECORD;
    v_trial RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Get user data
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Get trial data
    SELECT * INTO v_trial FROM trial_sessions WHERE user_id = p_user_id;
    
    -- Check if paid subscriber
    IF v_user.subscription_tier IN ('basic', 'premium', 'premium_plus') 
       AND v_user.subscription_status = 'active' THEN
        RETURN QUERY SELECT 
            FALSE as is_active,
            0 as time_remaining_seconds,
            FALSE as has_expired,
            TRUE as can_access_premium;
        RETURN;
    END IF;
    
    -- Check trial status
    IF v_trial.ends_at > v_now THEN
        -- Trial still active
        RETURN QUERY SELECT 
            TRUE as is_active,
            EXTRACT(EPOCH FROM (v_trial.ends_at - v_now))::INTEGER as time_remaining_seconds,
            FALSE as has_expired,
            TRUE as can_access_premium;
    ELSE
        -- Trial expired
        RETURN QUERY SELECT 
            FALSE as is_active,
            0 as time_remaining_seconds,
            TRUE as has_expired,
            FALSE as can_access_premium;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- EXPIRE TRIALS (Run via cron/scheduled job)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION expire_trials()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Update trial sessions
    UPDATE trial_sessions
    SET is_expired = TRUE
    WHERE ends_at < NOW()
    AND is_expired = FALSE
    AND converted_to_paid = FALSE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Update users table
    UPDATE users
    SET 
        subscription_status = 'expired',
        post_trial = TRUE
    WHERE id IN (
        SELECT user_id 
        FROM trial_sessions 
        WHERE is_expired = TRUE 
        AND converted_to_paid = FALSE
    )
    AND subscription_status = 'trial';
    
    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- POST-TRIAL ACCESS RULES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.post_trial_access_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Feature/Content Type
    feature_name VARCHAR(100) NOT NULL,
    content_type VARCHAR(50), -- 'ca_pdf', 'ca_text', 'notes', etc.
    
    -- Access Level
    is_allowed BOOLEAN DEFAULT FALSE,
    limit_per_day INTEGER, -- NULL = unlimited, 0 = not allowed
    
    -- Description
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default post-trial access rules
INSERT INTO post_trial_access_rules (feature_name, content_type, is_allowed, limit_per_day, description) VALUES
('current-affairs', 'pdf', TRUE, NULL, 'CA PDFs remain free after trial'),
('current-affairs', 'text', TRUE, NULL, 'CA reading on screen remains free'),
('notes', NULL, FALSE, 0, 'Notes blocked after trial'),
('quiz', NULL, FALSE, 0, 'Quiz blocked after trial'),
('lectures', NULL, FALSE, 0, '3-hour lectures blocked after trial'),
('mock-interview', NULL, FALSE, 0, 'Mock interviews blocked after trial'),
('essay-evaluation', NULL, FALSE, 0, 'Essay evaluation blocked after trial');

-- ═══════════════════════════════════════════════════════════════
-- CHECK POST-TRIAL ACCESS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION can_access_feature_post_trial(
    p_user_id UUID,
    p_feature_name VARCHAR(100),
    p_content_type VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user RECORD;
    v_access_rule RECORD;
BEGIN
    -- Get user
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    -- If paid subscriber, allow everything
    IF v_user.subscription_tier IN ('basic', 'premium', 'premium_plus') 
       AND v_user.subscription_status = 'active' THEN
        RETURN TRUE;
    END IF;
    
    -- If not post-trial, check trial status
    IF v_user.post_trial = FALSE THEN
        -- Check if trial active
        IF v_user.trial_ends_at > NOW() THEN
            RETURN TRUE; -- Trial active
        ELSE
            RETURN FALSE; -- Trial expired but not marked as post-trial yet
        END IF;
    END IF;
    
    -- Post-trial user - check access rules
    SELECT * INTO v_access_rule
    FROM post_trial_access_rules
    WHERE feature_name = p_feature_name
    AND (content_type IS NULL OR content_type = p_content_type)
    LIMIT 1;
    
    IF FOUND THEN
        RETURN v_access_rule.is_allowed;
    ELSE
        RETURN FALSE; -- Default deny
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- TRACK TRIAL FEATURE USAGE
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION track_trial_feature_usage(
    p_user_id UUID,
    p_feature_name VARCHAR(100)
)
RETURNS VOID AS $$
BEGIN
    UPDATE trial_sessions
    SET 
        features_used = features_used || jsonb_build_object(
            'feature', p_feature_name,
            'used_at', NOW()
        ),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Increment specific counters
    CASE p_feature_name
        WHEN 'notes' THEN
            UPDATE trial_sessions
            SET total_notes_generated = total_notes_generated + 1
            WHERE user_id = p_user_id;
        WHEN 'quiz' THEN
            UPDATE trial_sessions
            SET total_quizzes_taken = total_quizzes_taken + 1
            WHERE user_id = p_user_id;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 003
-- ═══════════════════════════════════════════════════════════════
