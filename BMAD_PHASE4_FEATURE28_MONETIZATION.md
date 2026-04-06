# BMAD Phase 4: Feature 28 - Advanced User Monetisation System
## Complete Revenue Infrastructure for UPSCPrepX AI

**Version**: 1.0  
**Date**: 2026-04-06  
**Status**: 🟢 IMPLEMENTATION  
**Goal**: Full monetization infrastructure with subscriptions, payments, coupons, and licensing

---

## 📋 ORIGINAL SPECIFICATION (Unchanged)

```
Feature 28: Advanced User Monetisation System

What it does
* Ownership of all monetization flows: subscriptions, per-video purchases, coupons, affiliate offers, institutional licensing.

Sub-features
* Promo codes, A/B price testing, in-app purchases.

Inputs / Outputs
* Input: user actions, payments.
* Output: invoices, entitlements, revenue dashboard.

Revideo / Manim
* Not required.

Monetization
* N/A (this is monetization infra).

Complexity
* Medium–High
```

---

## 🏗️ TECHNICAL ARCHITECTURE

### Payment Flow
```
User Selects Plan/Product
    ↓
Razorpay Checkout (UPI, Cards, Netbanking, Wallets)
    ↓
Payment Success/Failure Webhook
    ↓
Update Subscription & Entitlements
    ↓
Generate Invoice
    ↓
Grant Access to Features
```

### Revenue Streams
1. **Subscriptions** (Recurring)
   - Free: ₹0/month
   - Basic: ₹499/month
   - Premium: ₹999/month
   - Premium Plus: ₹1999/month

2. **Per-Video Purchases** (One-time)
   - Video Shorts: ₹29/video (Free: 3/month, Premium: unlimited)
   - Documentary Lectures: ₹199/video
   - Interview Prep: ₹499/session

3. **Test Series** (Course-based)
   - Prelims Mock Tests: ₹999
   - Mains Answer Writing: ₹1499
   - Interview Prep: ₹2999

4. **Institutional Licensing** (B2B)
   - Per student pricing
   - Custom branding
   - Admin dashboard

5. **Affiliate Revenue**
   - Book recommendations
   - Course referrals
   - Study material partnerships

---

## 📁 FILES TO CREATE

### Database Migration
- [ ] `supabase/migrations/021_monetization_system.sql`

### Payment Services
- [ ] `src/lib/payments/razorpay-service.ts`
- [ ] `src/lib/payments/subscription-manager.ts`
- [ ] `src/lib/payments/coupon-engine.ts`

### API Endpoints
- [ ] `src/app/api/payments/create-order/route.ts`
- [ ] `src/app/api/payments/verify/route.ts`
- [ ] `src/app/api/payments/webhook/route.ts`
- [ ] `src/app/api/subscriptions/current/route.ts`
- [ ] `src/app/api/subscriptions/upgrade/route.ts`
- [ ] `src/app/api/subscriptions/cancel/route.ts`
- [ ] `src/app/api/coupons/validate/route.ts`

### UI Components
- [ ] `src/components/payments/checkout-form.tsx`
- [ ] `src/components/payments/plan-comparison.tsx`
- [ ] `src/components/payments/subscription-status.tsx`
- [ ] `src/components/payments/coupon-input.tsx`
- [ ] `src/components/upgrade/upgrade-modal.tsx`

### Pages
- [ ] `src/app/(dashboard)/pricing/page.tsx`
- [ ] `src/app/(dashboard)/subscription/page.tsx`
- [ ] `src/app/(dashboard)/billing/page.tsx`

---

## 🗄️ DATABASE SCHEMA

```sql
-- Subscription Plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  price_monthly INTEGER NOT NULL, -- in paise (₹499 = 49900)
  price_yearly INTEGER, -- in paise
  currency VARCHAR(10) DEFAULT 'INR',
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}', -- {video_shorts: 3, downloads: 1, etc}
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  razorpay_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Orders
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL, -- Razorpay order ID
  amount INTEGER NOT NULL, -- in paise
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  payment_method VARCHAR(100),
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  items JSONB DEFAULT '[]', -- [{type: 'subscription', plan_id: '...', price: 49900}]
  coupon_id UUID REFERENCES coupons(id),
  discount_amount INTEGER DEFAULT 0,
  final_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Coupons & Promo Codes
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(50) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL, -- percentage (10-90) or fixed amount in paise
  min_purchase_amount INTEGER DEFAULT 0,
  max_discount_amount INTEGER, -- for percentage discounts
  usage_limit INTEGER, -- total times coupon can be used
  usage_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_plans TEXT[], -- plan IDs, NULL for all plans
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon Usage Tracking
CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_order_id UUID REFERENCES payment_orders(id),
  discount_amount INTEGER NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_order_id UUID REFERENCES payment_orders(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0, -- GST 18%
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
  pdf_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE,
  due_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Analytics (Daily)
CREATE TABLE revenue_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  mrr INTEGER DEFAULT 0, -- Monthly Recurring Revenue
  arr INTEGER DEFAULT 0, -- Annual Recurring Revenue
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  upgraded_subscriptions INTEGER DEFAULT 0,
  downgraded_subscriptions INTEGER DEFAULT 0,
  one_time_revenue INTEGER DEFAULT 0, -- per-video, test series
  subscription_revenue INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  refunds INTEGER DEFAULT 0,
  net_revenue INTEGER DEFAULT 0,
  active_subscribers INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Affiliate Links & Tracking
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  partner_name VARCHAR(200), -- Amazon, Unacademy, etc.
  product_url TEXT NOT NULL,
  commission_rate DECIMAL(5,2), -- percentage
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  earnings INTEGER DEFAULT 0, -- in paise
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Institutional Licenses
CREATE TABLE institutional_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name VARCHAR(500) NOT NULL,
  contact_email VARCHAR(500),
  contact_phone VARCHAR(50),
  license_type VARCHAR(50) CHECK (license_type IN ('per_student', 'flat', 'custom')),
  student_count INTEGER,
  price_per_student INTEGER, -- in paise
  total_amount INTEGER NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  admin_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Test Pricing
CREATE TABLE pricing_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name VARCHAR(200) NOT NULL,
  variant_a JSONB NOT NULL, -- {price: 49900, features: [...]}
  variant_b JSONB NOT NULL,
  traffic_split INTEGER DEFAULT 50, -- percentage for variant A
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_variant VARCHAR(10), -- 'A' or 'B'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX user_subscriptions_user_idx ON user_subscriptions(user_id);
CREATE INDEX user_subscriptions_status_idx ON user_subscriptions(status);
CREATE INDEX payment_orders_user_idx ON payment_orders(user_id);
CREATE INDEX payment_orders_status_idx ON payment_orders(status);
CREATE INDEX coupons_code_idx ON coupons(code);
CREATE INDEX invoices_user_idx ON invoices(user_id);
CREATE INDEX revenue_analytics_daily_date_idx ON revenue_analytics_daily(date DESC);
```

---

## 🚀 IMPLEMENTATION PLAN

### Day 1: Database + Razorpay Integration
- [ ] Create migration 021
- [ ] Setup Razorpay service
- [ ] Configure webhook handling

### Day 2: Subscription Management
- [ ] Create subscription manager
- [ ] Implement plan selection
- [ ] Handle upgrades/downgrades

### Day 3: Coupons & Discounts
- [ ] Create coupon engine
- [ ] Implement validation logic
- [ ] Add usage tracking

### Day 4: UI + Testing
- [ ] Create pricing page
- [ ] Create checkout form
- [ ] Test payment flow end-to-end
- [ ] Deploy and verify

---

## ✅ SUCCESS CRITERIA

- [ ] Razorpay integration working (UPI, Cards, Netbanking)
- [ ] 4 subscription tiers (Free, Basic, Premium, Premium Plus)
- [ ] Coupon system with percentage and fixed discounts
- [ ] Invoice generation (PDF)
- [ ] Revenue analytics dashboard
- [ ] Webhook handling for payment events
- [ ] Subscription management (upgrade, cancel, renew)
- [ ] A/B pricing experiments

---

**Ready to implement!**
