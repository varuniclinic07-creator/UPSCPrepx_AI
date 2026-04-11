-- ==========================================
-- MIGRATION 021: MONETIZATION SYSTEM (COMPLETE FIX)
-- ==========================================

-- 1. CREATE TABLES (Safe: Does nothing if they exist)

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE,
  display_name VARCHAR(200),
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_3monthly INTEGER,
  price_yearly INTEGER,
  currency VARCHAR(10) DEFAULT 'INR',
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  razorpay_plan_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  plan_id UUID,
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

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  old_plan_id UUID,
  new_plan_id UUID,
  change_type VARCHAR(50) CHECK (change_type IN ('upgrade', 'downgrade', 'new', 'cancel', 'reactivate')),
  price_difference INTEGER,
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(50) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  min_purchase_amount INTEGER DEFAULT 0,
  max_discount_amount INTEGER,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  usage_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_plans TEXT[],
  applicable_products TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  order_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method VARCHAR(100),
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  items JSONB DEFAULT '[]',
  coupon_id UUID,
  discount_amount INTEGER DEFAULT 0,
  final_amount INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID,
  user_id UUID,
  payment_order_id UUID,
  discount_amount INTEGER NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  payment_order_id UUID,
  subscription_id UUID,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type VARCHAR(50) DEFAULT 'subscription' CHECK (invoice_type IN ('subscription', 'one_time', 'refund')),
  amount INTEGER NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  tax_amount INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  pdf_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  billing_address JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revenue_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  mrr INTEGER DEFAULT 0,
  arr INTEGER DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  refunds INTEGER DEFAULT 0,
  active_subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. SCHEMA UPGRADES (Fix Missing Columns on pre-existing tables)
-- ==========================================

-- subscription_plans legacy gaps (ALL columns)
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS tier VARCHAR(100);
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS display_name VARCHAR(200);
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_monthly INTEGER;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_3monthly INTEGER;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_yearly INTEGER;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS razorpay_plan_id TEXT;
DO $$ BEGIN ALTER TABLE subscription_plans ALTER COLUMN tier DROP NOT NULL; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TABLE subscription_plans ALTER COLUMN price_monthly DROP NOT NULL; EXCEPTION WHEN others THEN null; END $$;

-- payment_orders legacy gaps (ALL columns)
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'created';
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS final_amount INTEGER;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- user_subscriptions legacy gaps (ALL columns)
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- subscription_history legacy gaps (ALL columns)
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS old_plan_id UUID;
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS new_plan_id UUID;
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS change_type VARCHAR(50);
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS price_difference INTEGER;
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- coupons legacy gaps (ALL columns)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_value INTEGER;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_purchase_amount INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount_amount INTEGER;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_per_user INTEGER DEFAULT 1;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_plans TEXT[];
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_products TEXT[];
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS created_by UUID;

-- coupon_usages legacy gaps (ALL columns)
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS payment_order_id UUID;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS discount_amount INTEGER;

-- invoices legacy gaps (ALL columns)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_order_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subscription_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50) DEFAULT 'subscription';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 18.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}';

-- revenue_analytics_daily legacy gaps (ALL columns)
ALTER TABLE revenue_analytics_daily ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE revenue_analytics_daily ADD COLUMN IF NOT EXISTS mrr INTEGER DEFAULT 0;
ALTER TABLE revenue_analytics_daily ADD COLUMN IF NOT EXISTS arr INTEGER DEFAULT 0;
ALTER TABLE revenue_analytics_daily ADD COLUMN IF NOT EXISTS new_subscriptions INTEGER DEFAULT 0;
ALTER TABLE revenue_analytics_daily ADD COLUMN IF NOT EXISTS total_revenue INTEGER DEFAULT 0;
ALTER TABLE revenue_analytics_daily ADD COLUMN IF NOT EXISTS refunds INTEGER DEFAULT 0;
ALTER TABLE revenue_analytics_daily ADD COLUMN IF NOT EXISTS active_subscribers INTEGER DEFAULT 0;

-- Backfill slugs/tiers for pre-existing rows
UPDATE subscription_plans SET slug = name WHERE slug IS NULL;
UPDATE subscription_plans SET tier = name WHERE tier IS NULL;

-- coupon_usages legacy gaps
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS payment_order_id UUID;

-- invoices legacy gaps
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_order_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subscription_id UUID;

-- Backfill legacy NOT NULL columns for any existing rows
UPDATE subscription_plans SET slug = name WHERE slug IS NULL;
UPDATE subscription_plans SET tier = name WHERE tier IS NULL;

-- Relax legacy NOT NULL on tier so inserts without it still work going forward
DO $$ BEGIN
  ALTER TABLE subscription_plans ALTER COLUMN tier DROP NOT NULL;
EXCEPTION WHEN others THEN null; END $$;

-- Ensure slug uniqueness (ignore if already present)
DO $$ BEGIN
  ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;

-- ==========================================
-- 3. SEED DATA (Safe Inserts)
-- ==========================================

INSERT INTO subscription_plans (name, slug, tier, display_name, price_monthly, price_3monthly, price_yearly, features, trial_days)
VALUES
  ('basic',        'basic',        'basic',        'Basic Plan',   49900,  99900,  NULL,   '["Access to Notes", "Daily Quizzes", "Basic AI Chat", "Standard Video Quality"]'::JSONB, 7),
  ('premium',      'premium',      'premium',      'Premium Plan', 99900,  199900, NULL,   '["All Basic Features", "Unlimited Video Shorts", "AI Mains Evaluator", "Priority Support", "Download Access"]'::JSONB, 14),
  ('premium_plus', 'premium_plus', 'premium_plus', 'Premium Plus', 139900, 259900, 459900, '["All Premium Features", "Personalized Study Plan", "Advanced Analytics", "Mock Interviews", "Early Access to Features"]'::JSONB, 14)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. FOREIGN KEYS (Safe Execution)
-- ==========================================

DO $$ BEGIN
  ALTER TABLE user_subscriptions ADD CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE user_subscriptions ADD CONSTRAINT fk_us_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE payment_orders ADD CONSTRAINT fk_po_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE subscription_history ADD CONSTRAINT fk_sh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE subscription_history ADD CONSTRAINT fk_sh_old FOREIGN KEY (old_plan_id) REFERENCES subscription_plans(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE subscription_history ADD CONSTRAINT fk_sh_new FOREIGN KEY (new_plan_id) REFERENCES subscription_plans(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE coupons ADD CONSTRAINT fk_c_created_by FOREIGN KEY (created_by) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE payment_orders ADD CONSTRAINT fk_po_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE coupon_usages ADD CONSTRAINT fk_cu_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE coupon_usages ADD CONSTRAINT fk_cu_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE coupon_usages ADD CONSTRAINT fk_cu_order FOREIGN KEY (payment_order_id) REFERENCES payment_orders(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT fk_inv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT fk_inv_po FOREIGN KEY (payment_order_id) REFERENCES payment_orders(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT fk_inv_sub FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
