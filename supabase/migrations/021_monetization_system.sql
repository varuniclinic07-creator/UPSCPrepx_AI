-- BMAD Phase 4: Feature 28 - Advanced User Monetisation System
-- Migration: 021_monetization_system.sql
-- Description: Idempotent revenue infrastructure setup (Safe for re-runs & Schema Upgrades)

-- ==========================================
-- STEP 1: CREATE TABLES (Safe for first runs)
-- ==========================================

-- 1. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
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

-- 2. User Subscriptions (External references removed for now)
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

-- 3. Subscription History
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

-- 4. Coupons
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

-- 5. Payment Orders
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

-- 6. Coupon Usage
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID,
  user_id UUID,
  payment_order_id UUID,
  discount_amount INTEGER NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

-- 7. Invoices
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

-- 8. Analytics
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
-- STEP 2: SCHEMA UPGRADES (Idempotent Fixes)
-- ==========================================
-- These commands ensure that if tables were created by older migrations 
-- without these columns, they are added now (Safe to run multiple times)

-- Upgrade subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_3monthly INTEGER;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_yearly INTEGER;

-- Upgrade payment_orders
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS coupon_id UUID;

-- ==========================================
-- STEP 3: SEED DATA (Safe Inserts)
-- ==========================================

INSERT INTO subscription_plans (name, display_name, price_monthly, price_3monthly, price_yearly, features, trial_days)
VALUES
  ('basic', 'Basic Plan', 49900, 99900, NULL, '["Access to Notes", "Daily Quizzes", "Basic AI Chat", "Standard Video Quality"]'::JSONB, 7),
  ('premium', 'Premium Plan', 99900, 199900, NULL, '["All Basic Features", "Unlimited Video Shorts", "AI Mains Evaluator", "Priority Support", "Download Access"]'::JSONB, 14),
  ('premium_plus', 'Premium Plus', 139900, 259900, 459900, '["All Premium Features", "Personalized Study Plan", "Advanced Analytics", "Mock Interviews", "Early Access to Features"]'::JSONB, 14)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- STEP 4: FOREIGN KEY CONSTRAINTS (Safe)
-- ==========================================
-- We use DO blocks to prevent errors if constraints already exist

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_us_user') THEN
    ALTER TABLE user_subscriptions ADD CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_us_plan') THEN
    ALTER TABLE user_subscriptions ADD CONSTRAINT fk_us_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_po_coupon') THEN
    ALTER TABLE payment_orders ADD CONSTRAINT fk_po_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id);
  END IF;
END $$;

-- Other simple foreign keys
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