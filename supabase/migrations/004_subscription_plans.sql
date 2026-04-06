-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - SUBSCRIPTION PLANS
-- Migration: 004_subscription_plans.sql
-- Description: ₹599/1199/2399/4799 + 18% GST subscription system
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- SUBSCRIPTION PLANS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Plan Info
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    tier VARCHAR(20) UNIQUE NOT NULL CHECK (tier IN ('trial', 'basic', 'premium', 'premium_plus')),
    
    -- Pricing (in INR, excluding GST)
    price_monthly INTEGER NOT NULL,
    price_quarterly INTEGER,
    price_yearly INTEGER,
    
    -- GST (18%)
    gst_percent DECIMAL(5,2) DEFAULT 18.00,
    
    -- Features access_features JSONB DEFAULT '[]'::jsonb, -- Array of feature slugs
    limits JSONB DEFAULT '{}'::jsonb, -- Feature-specific limits
    
    -- Display
    display_name VARCHAR(100),
    description TEXT,
    features_list TEXT[], -- Human-readable features for UI
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert subscription plans
INSERT INTO subscription_plans (
    name, slug, tier, 
    price_monthly, price_quarterly, price_yearly,
    display_name, description, features_list, is_popular, sort_order
) VALUES
-- Trial (Free for 24 hours)
(
    'Trial', 'trial', 'trial',
    0, 0, 0,
    '24-Hour Trial', 
    'Full access for 24 hours. No credit card required.',
    ARRAY[
        'Full access to all features for 24 hours',
        'Generate unlimited notes',
        'Take unlimited quizzes',
        'Access current affairs',
        'Watch 3-hour lectures',
        'No credit card required'
    ],
    FALSE,
    1
),

-- Basic (₹599/month)
(
    'Basic', 'basic', 'basic',
    599, 1697, 6469, -- Quarterly: 33% off, Yearly: 10% off
    'Basic Plan',
    'Perfect for beginners starting their UPSC journey',
    ARRAY[
        '20 notes per day',
        '10 quizzes per day',
        'Daily current affairs',
        '2 three-hour lectures per month',
        'Basic study planner',
        'Email support'
    ],
    FALSE,
    2
),

-- Premium (₹1199/month) - Most Popular
(
    'Premium', 'premium', 'premium',
    1199, 3357, 12949,
    'Premium Plan',
    'Most popular choice for serious aspirants',
    ARRAY[
        'Unlimited notes generation',
        'Unlimited quizzes',
        'Daily current affairs with analysis',
        '10 three-hour lectures per month',
        'Mock interviews (2/month)',
        'Essay evaluation (5/month)',
        'Advanced study planner',
        'Priority support'
    ],
    TRUE,
    3
),

-- Premium Plus (₹2399/month)
(
    'Premium Plus', 'premium-plus', 'premium_plus',
    2399, 6717, 25909,
    'Premium Plus',
    'Complete UPSC preparation package',
    ARRAY[
        'Everything in Premium',
        'Unlimited three-hour lectures',
        'Unlimited mock interviews',
        'Unlimited essay evaluation',
        'One-on-one mentorship (2 hours/month)',
        'Custom study plans',
        'Previous year papers with solutions',
        'Answer writing practice with evaluation',
        '24/7 dedicated support'
    ],
    FALSE,
    4
);

-- ═══════════════════════════════════════════════════════════════
-- USER SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    
    -- Subscription Info
    tier VARCHAR(20) NOT NULL,
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    
    -- Pricing (what they actually paid)
    base_price INTEGER NOT NULL, -- Excluding GST
    gst_amount INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    
    -- Dates
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    
    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT TRUE,
    next_billing_date TIMESTAMPTZ,
    
    -- Payment
    payment_method VARCHAR(50), -- razorpay, stripe, upi
    payment_id VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_end_date ON user_subscriptions(current_period_end);

-- ═══════════════════════════════════════════════════════════════
-- PAYMENT TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    subscription_id UUID REFERENCES user_subscriptions(id),
    
    -- Transaction Info
    payment_gateway VARCHAR(50) NOT NULL, -- razorpay, stripe
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    order_id VARCHAR(255),
    
    -- Amount
    base_amount INTEGER NOT NULL,
    gst_amount INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    
    -- Payment Details
    payment_method VARCHAR(50), -- card, upi, netbanking, wallet
    card_last4 VARCHAR(4),
    
    -- Gateway Response
    gateway_response JSONB,
    
    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);

-- ═══════════════════════════════════════════════════════════════
-- INVOICES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    
    user_id UUID REFERENCES users(id),
    subscription_id UUID REFERENCES user_subscriptions(id),
    transaction_id UUID REFERENCES payment_transactions(id),
    
    -- Amounts
    base_amount INTEGER NOT NULL,
    gst_amount INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    
    -- Billing Info
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address TEXT,
    gstin VARCHAR(20), -- For businesses
    
    -- Invoice Status
    status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('draft', 'paid', 'cancelled', 'refunded')),
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_date DATE,
    
    -- PDF
    pdf_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Calculate GST
CREATE OR REPLACE FUNCTION calculate_gst(base_amount INTEGER, gst_percent DECIMAL DEFAULT 18.00)
RETURNS INTEGER AS $$
BEGIN
    RETURN ROUND(base_amount * gst_percent / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get plan price with GST
CREATE OR REPLACE FUNCTION get_plan_price_with_gst(
    p_tier VARCHAR(20),
    p_billing_cycle VARCHAR(20)
)
RETURNS TABLE(
    base_price INTEGER,
    gst_amount INTEGER,
    total_price INTEGER
) AS $$
DECLARE
    v_plan RECORD;
    v_base INTEGER;
    v_gst INTEGER;
BEGIN
    SELECT * INTO v_plan FROM subscription_plans WHERE tier = p_tier;
    
    -- Get base price based on billing cycle
    v_base := CASE p_billing_cycle
        WHEN 'monthly' THEN v_plan.price_monthly
        WHEN 'quarterly' THEN v_plan.price_quarterly
        WHEN 'yearly' THEN v_plan.price_yearly
    END;
    
    v_gst := calculate_gst(v_base, v_plan.gst_percent);
    
    RETURN QUERY SELECT v_base, v_gst, v_base + v_gst;
END;
$$ LANGUAGE plpgsql;

-- Create subscription
CREATE OR REPLACE FUNCTION create_subscription(
    p_user_id UUID,
    p_tier VARCHAR(20),
    p_billing_cycle VARCHAR(20),
    p_payment_id VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
    v_plan_id UUID;
    v_prices RECORD;
    v_subscription_id UUID;
    v_period_end TIMESTAMPTZ;
BEGIN
    -- Get plan
    SELECT id INTO v_plan_id FROM subscription_plans WHERE tier = p_tier;
    
    -- Get pricing
    SELECT * INTO v_prices FROM get_plan_price_with_gst(p_tier, p_billing_cycle);
    
    -- Calculate period end
    v_period_end := CASE p_billing_cycle
        WHEN 'monthly' THEN NOW() + INTERVAL '1 month'
        WHEN 'quarterly' THEN NOW() + INTERVAL '3 months'
        WHEN 'yearly' THEN NOW() + INTERVAL '1 year'
    END;
    
    -- Create subscription
    INSERT INTO user_subscriptions (
        user_id, plan_id, tier, billing_cycle,
        base_price, gst_amount, total_price,
        current_period_start, current_period_end,
        next_billing_date, payment_id
    ) VALUES (
        p_user_id, v_plan_id, p_tier, p_billing_cycle,
        v_prices.base_price, v_prices.gst_amount, v_prices.total_price,
        NOW(), v_period_end,
        v_period_end, p_payment_id
    )
    RETURNING id INTO v_subscription_id;
    
    -- Update user
    UPDATE users
    SET 
        subscription_tier = p_tier,
        subscription_status = 'active',
        subscription_ends_at = v_period_end
    WHERE id = p_user_id;
    
    -- Mark trial as converted
    UPDATE trial_sessions
    SET 
        converted_to_paid = TRUE,
        converted_at = NOW(),
        converted_to_plan = p_tier
    WHERE user_id = p_user_id;
    
    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- AUTO-GENERATE INVOICE NUMBERS
-- ═══════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_number INTEGER;
    v_year VARCHAR(4);
    v_month VARCHAR(2);
BEGIN
    v_number := nextval('invoice_number_seq');
    v_year := TO_CHAR(NOW(), 'YYYY');
    v_month := TO_CHAR(NOW(), 'MM');
    
    RETURN 'INV-' || v_year || v_month || '-' || LPAD(v_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 004
-- ═══════════════════════════════════════════════════════════════
