-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 038: PHASE 2 PAYMENTS & SUBSCRIPTION ALIGNMENT
-- Align table names and add missing columns for payment system
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. CREATE PAYMENTS TABLE (unified table for payment tracking)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),

    -- Payment Gateway Info
    payment_gateway VARCHAR(50) DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_payment_id VARCHAR(255),
    razorpay_signature TEXT,

    -- Amount Details
    base_amount INTEGER NOT NULL,
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    gst_amount INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),

    -- Invoice
    invoice_number VARCHAR(100),
    invoice_url TEXT,

    -- Metadata
    receipt_id VARCHAR(255),
    payment_method VARCHAR(50),
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);

-- ═══════════════════════════════════════════════════════════════
-- 2. ADD MISSING COLUMNS TO user_subscriptions
-- ═══════════════════════════════════════════════════════════════

-- Add payment_id reference
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

-- Add tier column if missing (for quick lookups without joining plans)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS tier VARCHAR(20);

-- Add billing_cycle
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly'));

-- Add starts_at for clarity
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT NOW();

-- Add ends_at alias for current_period_end
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- Auto-update ends_at from current_period_end
UPDATE user_subscriptions
SET ends_at = current_period_end
WHERE ends_at IS NULL AND current_period_end IS NOT NULL;

-- Add last_renewed_at
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════════
-- 3. ADD MISSING COLUMNS TO subscription_plans
-- ═══════════════════════════════════════════════════════════════

-- Add duration_months for easy access
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS duration_months INTEGER;

-- Set default duration based on tier
UPDATE subscription_plans SET duration_months = 1 WHERE tier = 'trial';
UPDATE subscription_plans SET duration_months = 1 WHERE tier = 'basic' AND duration_months IS NULL;
UPDATE subscription_plans SET duration_months = 1 WHERE tier = 'premium' AND duration_months IS NULL;
UPDATE subscription_plans SET duration_months = 1 WHERE tier = 'premium_plus' AND duration_months IS NULL;

-- Add gst_percentage column
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5,2) DEFAULT 18.00;

-- ═══════════════════════════════════════════════════════════════
-- 4. CREATE USAGE_LIMITS TABLE (for free tier tracking)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Feature Limits
    feature_name VARCHAR(100) NOT NULL,
    limit_type VARCHAR(20) CHECK (limit_type IN ('daily', 'total', 'monthly')),
    limit_value INTEGER NOT NULL,

    -- Current Usage
    current_count INTEGER DEFAULT 0,
    reset_at TIMESTAMPTZ, -- For daily limits

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, feature_name, limit_type)
);

CREATE INDEX idx_usage_limits_user_id ON usage_limits(user_id);
CREATE INDEX idx_usage_limits_feature ON usage_limits(feature_name);

-- ═══════════════════════════════════════════════════════════════
-- 5. CREATE USAGE_TRACKING TABLE (for detailed usage logs)
-- ═══════════════════════════════════════════════════════════════

-- usage_tracking was created by migration 018 with column 'feature'.
-- We keep CREATE TABLE IF NOT EXISTS here for fresh-DB runs, using 'feature'
-- to match 018's schema. On existing DBs this block is a no-op.
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- What was used (column named 'feature' to match migration 018)
    feature VARCHAR(100) NOT NULL,
    resource_id UUID, -- Optional: reference to created resource
    resource_type VARCHAR(50), -- 'note', 'quiz', 'doubt', etc.

    -- Usage details
    tokens_used INTEGER DEFAULT 0, -- For AI features
    credits_consumed INTEGER DEFAULT 0,

    -- Timestamp
    used_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON usage_tracking(feature);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_used_at ON usage_tracking(used_at);

-- ═══════════════════════════════════════════════════════════════
-- 6. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_active BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = p_user_id
        AND status = 'active'
        AND ends_at > NOW()
    ) INTO v_has_active;

    RETURN v_has_active;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_tier VARCHAR(50);
BEGIN
    SELECT tier INTO v_tier
    FROM user_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND ends_at > NOW()
    ORDER BY ends_at DESC
    LIMIT 1;

    RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql STABLE;

-- Check usage limit for a feature
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_user_id UUID,
    p_feature VARCHAR(100),
    p_limit_type VARCHAR(20)
)
RETURNS TABLE(
    allowed BOOLEAN,
    current_count INTEGER,
    limit_value INTEGER,
    remaining INTEGER
) AS $$
DECLARE
    v_usage RECORD;
    v_today_count INTEGER;
BEGIN
    -- Get the limit config
    SELECT * INTO v_usage
    FROM usage_limits
    WHERE user_id = p_user_id
    AND feature_name = p_feature
    AND limit_type = p_limit_type;

    -- If no limit configured, allow (no restrictions)
    IF NOT FOUND THEN
        RETURN QUERY SELECT TRUE, 0, 0, 0;
        RETURN;
    END IF;

    -- For daily limits, count today's usage
    IF p_limit_type = 'daily' THEN
        SELECT COUNT(*) INTO v_today_count
        FROM usage_tracking
        WHERE user_id = p_user_id
        AND feature = p_feature
        AND used_at >= DATE_TRUNC('day', NOW());

        current_count := v_today_count;
    ELSE
        current_count := v_usage.current_count;
    END IF;

    limit_value := v_usage.limit_value;
    remaining := GREATEST(0, limit_value - current_count);
    allowed := current_count < limit_value;

    RETURN QUERY SELECT allowed, current_count, limit_value, remaining;
END;
$$ LANGUAGE plpgsql;

-- Record usage
CREATE OR REPLACE FUNCTION record_usage(
    p_user_id UUID,
    p_feature VARCHAR(100),
    p_resource_id UUID DEFAULT NULL,
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_tokens INTEGER DEFAULT 0,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    -- Insert usage record
    INSERT INTO usage_tracking (
        user_id, feature, resource_id, resource_type,
        tokens_used, credits_consumed, metadata
    ) VALUES (
        p_user_id, p_feature, p_resource_id, p_resource_type,
        p_tokens, 1, p_metadata
    );

    -- Update daily counter if exists
    INSERT INTO usage_limits (user_id, feature_name, limit_type, limit_value, current_count, reset_at)
    VALUES (p_user_id, p_feature, 'daily', 0, 1, DATE_TRUNC('day', NOW()) + INTERVAL '1 day')
    ON CONFLICT (user_id, feature_name, limit_type) DO UPDATE
    SET
        current_count = usage_limits.current_count + 1,
        updated_at = NOW()
    WHERE usage_limits.limit_type = 'daily';
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 7. SEED DEFAULT USAGE LIMITS (Free Tier)
-- ═══════════════════════════════════════════════════════════════

-- Note: These are applied to users on signup via trigger
-- See trigger function below

-- ═══════════════════════════════════════════════════════════════
-- 8. TRIGGER: Setup usage limits on user signup
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION setup_user_usage_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Free tier limits (spec v8.0)
    INSERT INTO usage_limits (user_id, feature_name, limit_type, limit_value, reset_at) VALUES
    (NEW.id, 'mcq', 'daily', 3, DATE_TRUNC('day', NOW()) + INTERVAL '1 day'),
    (NEW.id, 'mains_eval', 'daily', 1, DATE_TRUNC('day', NOW()) + INTERVAL '1 day'),
    (NEW.id, 'custom_notes', 'total', 2, NULL),
    (NEW.id, 'doubt', 'daily', 3, DATE_TRUNC('day', NOW()) + INTERVAL '1 day'),
    (NEW.id, 'notes_generate', 'daily', 5, DATE_TRUNC('day', NOW()) + INTERVAL '1 day'),
    (NEW.id, 'mind_maps', 'daily', 2, DATE_TRUNC('day', NOW()) + INTERVAL '1 day');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_setup_usage_limits ON users;
CREATE TRIGGER trigger_setup_usage_limits
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION setup_user_usage_limits();

-- ═══════════════════════════════════════════════════════════════
-- 9. RLS POLICIES FOR NEW TABLES
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Payments: Users can only see their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert payments" ON payments;
CREATE POLICY "System can insert payments"
ON payments FOR INSERT
WITH CHECK (true); -- Allow service role to insert

DROP POLICY IF EXISTS "System can update payments" ON payments;
CREATE POLICY "System can update payments"
ON payments FOR UPDATE
USING (true); -- Allow service role to update

-- Usage limits: Users can see their own limits
DROP POLICY IF EXISTS "Users can view own usage limits" ON usage_limits;
CREATE POLICY "Users can view own usage limits"
ON usage_limits FOR SELECT
USING (auth.uid() = user_id);

-- Usage tracking: Users can see their own usage
DROP POLICY IF EXISTS "Users can view own usage tracking" ON usage_tracking;
CREATE POLICY "Users can view own usage tracking"
ON usage_tracking FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert usage tracking" ON usage_tracking;
CREATE POLICY "System can insert usage tracking"
ON usage_tracking FOR INSERT
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 038
-- ═══════════════════════════════════════════════════════════════
