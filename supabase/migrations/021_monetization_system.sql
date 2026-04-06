-- BMAD Phase 4: Feature 28 - Advanced User Monetisation System
-- Migration: 021_monetization_system.sql
-- Date: 2026-04-06
-- Description: Complete revenue infrastructure with subscriptions, payments, coupons
-- Payment Gateway: Razorpay (UPI, Cards, Netbanking, Wallets)

-- ============ SUBSCRIPTION PLANS ============

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200),
  description TEXT,
  price_monthly INTEGER NOT NULL, -- in paise (₹499 = 49900)
  price_3monthly INTEGER, -- in paise (₹999 = 99900) - 3 months special pricing
  price_yearly INTEGER, -- in paise (₹4599 = 459900)
  currency VARCHAR(10) DEFAULT 'INR',
  features JSONB DEFAULT '[]', -- ["Unlimited video shorts", "Download access", etc]
  limits JSONB DEFAULT '{}', -- {video_shorts: -1, downloads: -1, ai_queries: 100}
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  razorpay_plan_id TEXT, -- Razorpay plan ID for recurring payments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ USER SUBSCRIPTIONS ============

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing', 'pending')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Change History (upgrades/downgrades)
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  change_type VARCHAR(50) CHECK (change_type IN ('upgrade', 'downgrade', 'new', 'cancel', 'reactivate')),
  price_difference INTEGER, -- in paise (positive for upgrade, negative for downgrade)
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ PAYMENT ORDERS ============

-- Payment Orders (Razorpay)
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE, -- Razorpay order ID
  amount INTEGER NOT NULL, -- in paise
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method VARCHAR(100), -- card, upi, netbanking, wallet
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  items JSONB DEFAULT '[]', -- [{type: 'subscription', plan_id: '...', plan_name: 'Premium', price: 99900}]
  coupon_id UUID REFERENCES coupons(id),
  discount_amount INTEGER DEFAULT 0,
  final_amount INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0, -- GST 18%
  metadata JSONB DEFAULT '{}', -- Additional metadata
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- ============ COUPONS & PROMO CODES ============

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(50) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL, -- percentage (10-90) or fixed amount in paise
  min_purchase_amount INTEGER DEFAULT 0, -- minimum purchase in paise
  max_discount_amount INTEGER, -- for percentage discounts (cap in paise)
  usage_limit INTEGER, -- total times coupon can be used (NULL = unlimited)
  usage_count INTEGER DEFAULT 0,
  usage_per_user INTEGER DEFAULT 1, -- times a single user can use
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_plans TEXT[], -- plan IDs, NULL for all plans
  applicable_products TEXT[], -- product types, NULL for all
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon Usage Tracking
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_order_id UUID REFERENCES payment_orders(id),
  discount_amount INTEGER NOT NULL, -- actual discount applied in paise
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

-- ============ INVOICES ============

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_order_id UUID REFERENCES payment_orders(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type VARCHAR(50) DEFAULT 'subscription' CHECK (invoice_type IN ('subscription', 'one_time', 'refund')),
  amount INTEGER NOT NULL, -- subtotal
  tax_rate DECIMAL(5,2) DEFAULT 18.00, -- GST 18%
  tax_amount INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled', 'refunded')),
  pdf_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE,
  due_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  billing_address JSONB DEFAULT '{}',
  gst_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ REVENUE ANALYTICS ============

-- Revenue Analytics (Daily)
CREATE TABLE IF NOT EXISTS revenue_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  mrr INTEGER DEFAULT 0, -- Monthly Recurring Revenue (in paise)
  arr INTEGER DEFAULT 0, -- Annual Recurring Revenue (in paise)
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  upgraded_subscriptions INTEGER DEFAULT 0,
  downgraded_subscriptions INTEGER DEFAULT 0,
  reactivated_subscriptions INTEGER DEFAULT 0,
  one_time_revenue INTEGER DEFAULT 0, -- per-video, test series, etc
  subscription_revenue INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  refunds INTEGER DEFAULT 0,
  refund_count INTEGER DEFAULT 0,
  net_revenue INTEGER DEFAULT 0,
  active_subscribers INTEGER DEFAULT 0,
  trial_conversions INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  avg_revenue_per_user INTEGER DEFAULT 0, -- ARPU in paise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Analytics (Monthly Summary)
CREATE TABLE IF NOT EXISTS revenue_analytics_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  mrr_start INTEGER DEFAULT 0, -- MRR at start of month
  mrr_end INTEGER DEFAULT 0, -- MRR at end of month
  new_mrr INTEGER DEFAULT 0, -- MRR from new subscriptions
  expansion_mrr INTEGER DEFAULT 0, -- MRR from upgrades
  contraction_mrr INTEGER DEFAULT 0, -- MRR lost from downgrades
  churn_mrr INTEGER DEFAULT 0, -- MRR lost from cancellations
  total_revenue INTEGER DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  upgraded_subscriptions INTEGER DEFAULT 0,
  downgraded_subscriptions INTEGER DEFAULT 0,
  active_subscribers_start INTEGER DEFAULT 0,
  active_subscribers_end INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- ============ AFFILIATE SYSTEM ============

-- Affiliate Links & Tracking
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  partner_name VARCHAR(200), -- Amazon, Unacademy, PW, etc.
  product_name VARCHAR(500),
  product_url TEXT NOT NULL,
  product_category VARCHAR(100), -- books, courses, materials
  commission_rate DECIMAL(5,2), -- percentage
  commission_type VARCHAR(50) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_amount INTEGER, -- fixed amount in paise
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  earnings INTEGER DEFAULT 0, -- in paise
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate Clicks Tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- Affiliate Conversions
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES payment_orders(id),
  commission_earned INTEGER NOT NULL, -- in paise
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ INSTITUTIONAL LICENSING ============

-- Institutional Licenses (B2B)
CREATE TABLE IF NOT EXISTS institutional_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name VARCHAR(500) NOT NULL,
  institution_type VARCHAR(100), -- school, college, coaching, corporate
  contact_name VARCHAR(200),
  contact_email VARCHAR(500),
  contact_phone VARCHAR(50),
  license_type VARCHAR(50) CHECK (license_type IN ('per_student', 'flat', 'custom')),
  student_count INTEGER,
  price_per_student INTEGER, -- in paise
  total_amount INTEGER NOT NULL, -- in paise
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'trial')),
  admin_user_id UUID REFERENCES users(id),
  features JSONB DEFAULT '[]', -- custom features for institution
  custom_limits JSONB DEFAULT '{}',
  billing_address JSONB DEFAULT '{}',
  gst_number VARCHAR(50),
  payment_terms TEXT, -- net-30, net-60, upfront
  notes TEXT,
  contract_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Institutional License Students (access tracking)
CREATE TABLE IF NOT EXISTS institutional_license_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES institutional_licenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_name VARCHAR(200),
  student_email VARCHAR(500),
  student_id VARCHAR(100), -- institution's student ID
  access_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(license_id, user_id)
);

-- ============ A/B PRICING EXPERIMENTS ============

-- A/B Pricing Experiments
CREATE TABLE IF NOT EXISTS pricing_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name VARCHAR(200) NOT NULL,
  description TEXT,
  variant_a JSONB NOT NULL, -- {price: 49900, features: [...], display_name: '...'}
  variant_b JSONB NOT NULL,
  traffic_split INTEGER DEFAULT 50, -- percentage for variant A (0-100)
  target_metric VARCHAR(100) DEFAULT 'conversion_rate', -- conversion_rate, revenue, etc
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_variant VARCHAR(10), -- 'A' or 'B'
  winner_reason TEXT,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  variant_a_revenue INTEGER DEFAULT 0,
  variant_b_revenue INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Experiment Assignment
CREATE TABLE IF NOT EXISTS user_experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES pricing_experiments(id) ON DELETE CASCADE,
  assigned_variant VARCHAR(10) NOT NULL, -- 'A' or 'B'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  conversion_value INTEGER DEFAULT 0, -- in paise
  converted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, experiment_id)
);

-- ============ INDEXES ============

-- Subscription indexes
CREATE INDEX IF NOT EXISTS user_subscriptions_user_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS user_subscriptions_plan_idx ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_period_idx ON user_subscriptions(current_period_end);

-- Payment order indexes
CREATE INDEX IF NOT EXISTS payment_orders_user_idx ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS payment_orders_status_idx ON payment_orders(status);
CREATE INDEX IF NOT EXISTS payment_orders_order_id_idx ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS payment_orders_created_idx ON payment_orders(created_at DESC);

-- Coupon indexes
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS coupons_valid_until_idx ON coupons(valid_until);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS invoices_user_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_number_idx ON invoices(invoice_number);

-- Revenue analytics indexes
CREATE INDEX IF NOT EXISTS revenue_analytics_daily_date_idx ON revenue_analytics_daily(date DESC);
CREATE INDEX IF NOT EXISTS revenue_analytics_monthly_idx ON revenue_analytics_monthly(year, month);

-- Affiliate indexes
CREATE INDEX IF NOT EXISTS affiliate_links_user_idx ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS affiliate_links_active_idx ON affiliate_links(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS affiliate_clicks_link_idx ON affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_link_idx ON affiliate_conversions(affiliate_link_id);

-- Institutional license indexes
CREATE INDEX IF NOT EXISTS institutional_licenses_status_idx ON institutional_licenses(status);
CREATE INDEX IF NOT EXISTS institutional_licenses_valid_idx ON institutional_licenses(valid_from, valid_until);

-- Experiment indexes
CREATE INDEX IF NOT EXISTS pricing_experiments_active_idx ON pricing_experiments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS user_experiment_assignments_user_idx ON user_experiment_assignments(user_id);

-- ============ ROW LEVEL SECURITY (RLS) ============

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutional_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutional_license_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiment_assignments ENABLE ROW LEVEL SECURITY;

-- Subscription plans: Public read
CREATE POLICY "subscription_plans_public_read" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- User subscriptions: Users can read their own
CREATE POLICY "user_subscriptions_user_read" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- User subscriptions: Only admins can insert/update
CREATE POLICY "user_subscriptions_admin_write" ON user_subscriptions
  FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Payment orders: Users can read their own
CREATE POLICY "payment_orders_user_read" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Payment orders: Users can insert their own
CREATE POLICY "payment_orders_user_insert" ON payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coupons: Public read for active coupons
CREATE POLICY "coupons_public_read" ON coupons
  FOR SELECT USING (is_active = true);

-- Coupon usages: Users can read their own
CREATE POLICY "coupon_usages_user_read" ON coupon_usages
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Invoices: Users can read their own
CREATE POLICY "invoices_user_read" ON invoices
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Revenue analytics: Only admins can read
CREATE POLICY "revenue_analytics_admin_read" ON revenue_analytics_daily
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "revenue_analytics_monthly_admin_read" ON revenue_analytics_monthly
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

-- Affiliate links: Users can read their own
CREATE POLICY "affiliate_links_user_read" ON affiliate_links
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Affiliate links: Users can insert their own
CREATE POLICY "affiliate_links_user_insert" ON affiliate_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Institutional licenses: Only admins can manage
CREATE POLICY "institutional_licenses_admin" ON institutional_licenses
  FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Pricing experiments: Public read for active
CREATE POLICY "pricing_experiments_public_read" ON pricing_experiments
  FOR SELECT USING (is_active = true);

-- User experiment assignments: Users can read their own
CREATE POLICY "user_experiment_assignments_user_read" ON user_experiment_assignments
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- ============ FUNCTIONS ============

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_analytics_daily_updated_at
  BEFORE UPDATE ON revenue_analytics_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_analytics_monthly_updated_at
  BEFORE UPDATE ON revenue_analytics_monthly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's current subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID)
RETURNS TABLE (
  plan_name VARCHAR,
  status VARCHAR,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_premium BOOLEAN,
  limits JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name,
    us.status,
    us.current_period_end,
    (sp.name NOT IN ('free')) AS is_premium,
    sp.limits
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = get_user_subscription_status.user_id
    AND us.status IN ('active', 'trialing')
    AND (us.current_period_end IS NULL OR us.current_period_end > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  coupon_code VARCHAR,
  user_id UUID,
  purchase_amount INTEGER,
  plan_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_amount INTEGER,
  error_message TEXT
) AS $$
DECLARE
  coupon_record RECORD;
  user_usage_count INTEGER;
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record
  FROM coupons
  WHERE code = coupon_code
    AND is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until >= NOW());

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Invalid or expired coupon';
    RETURN;
  END IF;

  -- Check usage limit
  IF coupon_record.usage_limit IS NOT NULL THEN
    IF coupon_record.usage_count >= coupon_record.usage_limit THEN
      RETURN QUERY SELECT false, 0, 'Coupon usage limit reached';
      RETURN;
    END IF;
  END IF;

  -- Check minimum purchase
  IF purchase_amount < coupon_record.min_purchase_amount THEN
    RETURN QUERY SELECT false, 0, 'Minimum purchase amount not met';
    RETURN;
  END IF;

  -- Check applicable plans
  IF coupon_record.applicable_plans IS NOT NULL AND plan_id IS NOT NULL THEN
    IF NOT (plan_id::TEXT = ANY(coupon_record.applicable_plans)) THEN
      RETURN QUERY SELECT false, 0, 'Coupon not applicable for this plan';
      RETURN;
    END IF;
  END IF;

  -- Check user usage count
  SELECT COUNT(*) INTO user_usage_count
  FROM coupon_usages
  WHERE coupon_id = coupon_record.id AND user_id = validate_coupon.user_id;

  IF user_usage_count >= coupon_record.usage_per_user THEN
    RETURN QUERY SELECT false, 0, 'Coupon usage limit per user reached';
    RETURN;
  END IF;

  -- Calculate discount
  IF coupon_record.discount_type = 'percentage' THEN
    discount_amount := (purchase_amount * coupon_record.discount_value) / 100;
    IF coupon_record.max_discount_amount IS NOT NULL THEN
      discount_amount := LEAST(discount_amount, coupon_record.max_discount_amount);
    END IF;
  ELSE
    discount_amount := coupon_record.discount_value;
  END IF;

  RETURN QUERY SELECT true, discount_amount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ SEED DATA: SUBSCRIPTION PLANS ============

INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_3monthly, price_yearly, features, limits, is_popular, display_order, trial_days) VALUES
  ('free', 'Free', 'Basic access with limited features', 0, 0, 0, 
   '["3 video shorts/month", "10 AI queries/day", "Basic notes access", "Community support"]',
   '{"video_shorts": 3, "downloads": 0, "ai_queries_per_day": 10, "notes_access": "basic", "support": "community"}',
   false, 1, 0),
  
  ('basic', 'Basic', 'Essential tools for serious aspirants', 49900, 99900, NULL,
   '["Unlimited notes", "50 video shorts/month", "50 AI queries/day", "Download access", "Email support"]',
   '{"video_shorts": 50, "downloads": 10, "ai_queries_per_day": 50, "notes_access": "full", "support": "email"}',
   false, 2, 7),
  
  ('premium', 'Premium', 'Most popular - Complete preparation suite', 99900, 199900, NULL,
   '["Unlimited video shorts", "Unlimited downloads", "Unlimited AI queries", "Priority rendering", "Priority support", "Test series access"]',
   '{"video_shorts": -1, "downloads": -1, "ai_queries_per_day": -1, "notes_access": "full", "support": "priority", "test_series": true}',
   true, 3, 14),
  
  ('premium_plus', 'Premium Plus', 'Ultimate experience with human mentor', 139900, 259900, 459900,
   '["Everything in Premium", "Monthly mentor session", "Personalized study plan", "Answer review", "Interview prep", "Dedicated support"]',
   '{"video_shorts": -1, "downloads": -1, "ai_queries_per_day": -1, "notes_access": "full", "support": "dedicated", "test_series": true, "mentor_sessions": 1, "answer_review": true}',
   false, 4, 14)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_3monthly = EXCLUDED.price_3monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_popular = EXCLUDED.is_popular,
  display_order = EXCLUDED.display_order,
  trial_days = EXCLUDED.trial_days;

-- ============ SEED DATA: FEATURE CONTROLS ============

INSERT INTO admin_feature_controls (feature_name, feature_display_name, is_enabled, is_visible, config) VALUES
  ('subscriptions', 'Subscription Management', true, true, '{"razorpay_enabled": true}'),
  ('coupons', 'Coupon System', true, true, '{"max_discount_percentage": 50}'),
  ('affiliate_program', 'Affiliate Program', true, false, '{"commission_rate": 10}'),
  ('institutional_licensing', 'Institutional Licensing', true, false, '{"min_students": 10}'),
  ('ab_pricing', 'A/B Pricing Experiments', false, false, '{}')
ON CONFLICT (feature_name) DO UPDATE SET
  feature_display_name = EXCLUDED.feature_display_name;

-- ============ COMMENTS ============

COMMENT ON TABLE subscription_plans IS 'Available subscription plans with pricing and features';
COMMENT ON TABLE user_subscriptions IS 'User subscription status and billing periods';
COMMENT ON TABLE payment_orders IS 'Razorpay payment orders and transactions';
COMMENT ON TABLE coupons IS 'Promo codes and discount coupons';
COMMENT ON TABLE invoices IS 'Generated invoices for payments';
COMMENT ON TABLE revenue_analytics_daily IS 'Daily revenue and subscription metrics';
COMMENT ON TABLE affiliate_links IS 'Affiliate marketing links and tracking';
COMMENT ON TABLE institutional_licenses IS 'B2B institutional licensing agreements';
COMMENT ON TABLE pricing_experiments IS 'A/B pricing experiments for optimization';

-- ============ MIGRATION COMPLETE ============

SELECT 'Migration 021: Monetization System completed successfully' as status;
