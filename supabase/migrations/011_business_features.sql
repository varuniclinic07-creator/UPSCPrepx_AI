-- ═══════════════════════════════════════════════════════════════
-- BUSINESS FEATURES: Referrals & Promo Codes
-- Migration: 011_business_features.sql
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- REFERRAL PROGRAM
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
    referee_signed_up_at TIMESTAMPTZ DEFAULT NOW(),
    referee_subscribed_at TIMESTAMPTZ,
    referrer_rewarded_at TIMESTAMPTZ,
    reward_type VARCHAR(20), -- 'free_days', 'discount'
    reward_value INTEGER, -- Days or discount percentage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Auto-generate referral code on user creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    v_code VARCHAR(20);
BEGIN
    -- Generate unique 8-char code
    v_code := UPPER(SUBSTRING(MD5(NEW.id::text || RANDOM()::text) FROM 1 FOR 8));
    
    INSERT INTO referral_codes (user_id, code)
    VALUES (NEW.id, v_code)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_code
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();

-- ═══════════════════════════════════════════════════════════════
-- PROMO CODES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    
    -- Discount
    discount_type VARCHAR(10) CHECK (discount_type IN ('percent', 'fixed')),
    discount_value INTEGER NOT NULL, -- Percentage or fixed amount
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Usage limits
    max_uses INTEGER, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    
    -- Restrictions
    minimum_amount INTEGER, -- Minimum purchase amount
    applicable_plans TEXT[], -- NULL = all plans
    first_purchase_only BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);

-- Promo code usage tracking
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID REFERENCES promo_codes(id),
    user_id UUID REFERENCES users(id),
    payment_id UUID,
    discount_applied INTEGER NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promo_usage_user ON promo_code_usage(user_id);
CREATE INDEX idx_promo_usage_code ON promo_code_usage(promo_code_id);

-- Validate and apply promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
    p_code VARCHAR(30),
    p_user_id UUID,
    p_amount INTEGER,
    p_plan_slug VARCHAR(50)
)
RETURNS TABLE(
    is_valid BOOLEAN,
    discount_amount INTEGER,
    error_message TEXT
) AS $$
DECLARE
    v_promo RECORD;
    v_user_uses INTEGER;
    v_discount INTEGER;
BEGIN
    -- Get promo code
    SELECT * INTO v_promo FROM promo_codes 
    WHERE UPPER(code) = UPPER(p_code) AND is_active = TRUE;
    
    IF v_promo IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 'Invalid promo code';
        RETURN;
    END IF;
    
    -- Check validity period
    IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
        RETURN QUERY SELECT FALSE, 0, 'Promo code has expired';
        RETURN;
    END IF;
    
    IF v_promo.valid_from > NOW() THEN
        RETURN QUERY SELECT FALSE, 0, 'Promo code is not yet active';
        RETURN;
    END IF;
    
    -- Check max uses
    IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
        RETURN QUERY SELECT FALSE, 0, 'Promo code usage limit reached';
        RETURN;
    END IF;
    
    -- Check user's usage
    SELECT COUNT(*) INTO v_user_uses FROM promo_code_usage
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
    
    IF v_user_uses >= v_promo.max_uses_per_user THEN
        RETURN QUERY SELECT FALSE, 0, 'You have already used this promo code';
        RETURN;
    END IF;
    
    -- Check minimum amount
    IF v_promo.minimum_amount IS NOT NULL AND p_amount < v_promo.minimum_amount THEN
        RETURN QUERY SELECT FALSE, 0, 'Minimum purchase amount not met';
        RETURN;
    END IF;
    
    -- Check applicable plans
    IF v_promo.applicable_plans IS NOT NULL AND 
       NOT (p_plan_slug = ANY(v_promo.applicable_plans)) THEN
        RETURN QUERY SELECT FALSE, 0, 'Promo code not valid for this plan';
        RETURN;
    END IF;
    
    -- Check first purchase only
    IF v_promo.first_purchase_only THEN
        IF EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = p_user_id) THEN
            RETURN QUERY SELECT FALSE, 0, 'Promo code only valid for first purchase';
            RETURN;
        END IF;
    END IF;
    
    -- Calculate discount
    IF v_promo.discount_type = 'percent' THEN
        v_discount := (p_amount * v_promo.discount_value) / 100;
    ELSE
        v_discount := v_promo.discount_value;
    END IF;
    
    -- Cap at purchase amount
    v_discount := LEAST(v_discount, p_amount);
    
    RETURN QUERY SELECT TRUE, v_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Insert default promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, valid_until, first_purchase_only)
VALUES 
    ('WELCOME10', 'Welcome 10% off', 'percent', 10, NOW() + INTERVAL '1 year', TRUE),
    ('COMEBACK20', 'Win-back 20% off', 'percent', 20, NOW() + INTERVAL '1 year', FALSE),
    ('UPSC2024', 'New Year 15% off', 'percent', 15, '2024-12-31'::TIMESTAMPTZ, FALSE)
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'trial_expiring', 'payment', 'system', 'feature'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_marketing BOOLEAN DEFAULT TRUE,
    email_transactional BOOLEAN DEFAULT TRUE,
    email_trial_reminders BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    push_current_affairs BOOLEAN DEFAULT TRUE,
    push_study_reminders BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_preferences
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_preferences();

-- ═══════════════════════════════════════════════════════════════
-- ONBOARDING TRACKING
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    step_welcome BOOLEAN DEFAULT FALSE,
    step_profile BOOLEAN DEFAULT FALSE,
    step_first_note BOOLEAN DEFAULT FALSE,
    step_first_quiz BOOLEAN DEFAULT FALSE,
    step_explore_features BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create onboarding for new users
CREATE OR REPLACE FUNCTION create_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO onboarding_progress (user_id, step_welcome)
    VALUES (NEW.id, TRUE)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_onboarding
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_onboarding_progress();
