# Phase 2: Subscription + Payments Implementation Report

**Date:** 2026-04-11  
**Status:** ✅ COMPLETE

---

## Executive Summary

Phase 2 has been successfully completed, implementing a production-ready subscription and payment system for the UPSC CSE Master platform. The system includes:

- Unified database schema for payments and subscriptions
- Complete Razorpay integration (checkout, webhooks, verification)
- Subscription lifecycle management (activation, renewal, expiry)
- Free tier with usage limits enforcement
- Usage tracking and analytics

---

## 1. Database Schema Changes

### New Migration: `038_phase2_payments_fix.sql`

**New Tables Created:**

| Table | Purpose |
|-------|---------|
| `payments` | Unified payment tracking (replaces fragmented payment tables) |
| `usage_limits` | Per-user feature limits (daily/total) |
| `usage_tracking` | Detailed usage logs for analytics |

**Key Columns Added to `user_subscriptions`:**
- `payment_id` - Reference to payments table
- `tier` - Quick lookup without joins
- `billing_cycle` - monthly/quarterly/yearly
- `starts_at`, `ends_at` - Clear date aliases
- `last_renewed_at` - Renewal tracking

**Key Columns Added to `subscription_plans`:**
- `duration_months` - Plan duration
- `gst_percentage` - Tax rate (default 18%)

**New RPC Functions:**
```sql
has_active_subscription(user_id)     -- Check active subscription
get_user_subscription_tier(user_id)  -- Get user's tier
check_usage_limit(user_id, feature, limit_type)  -- Check limits
record_usage(user_id, feature, ...)  -- Track usage
setup_user_usage_limits()            -- Auto-setup on signup
```

**RLS Policies:**
- Users can only view their own payments, usage limits, and usage tracking
- Service role has full access for system operations

---

## 2. API Routes

### Payment Flow APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/initiate` | POST | Create payment order |
| `/api/payments/verify` | POST | Verify payment signature |
| `/api/webhooks/razorpay` | POST | Handle webhook events |
| `/api/subscription/status` | GET | Get user subscription |
| `/api/usage` | GET/POST | Track and report usage |
| `/api/cron/subscriptions` | POST | Run maintenance jobs |
| `/api/plans` | GET | List subscription plans |

### Payment Initiate (`/api/payments/initiate`)

**Request:**
```json
{
  "planSlug": "premium",
  "billingCycle": "monthly"  // optional: monthly|quarterly|yearly
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "uuid",
  "orderId": "order_xxx",
  "amount": 1179,
  "currency": "INR",
  "key": "rzp_test_xxx",
  "plan": { "name": "Premium", "duration": 1, "features": [...], "tier": "premium" },
  "breakdown": {
    "baseAmount": 999,
    "gstAmount": 180,
    "gstPercentage": 18,
    "totalAmount": 1179,
    "billingCycle": "monthly"
  }
}
```

### Payment Verify (`/api/payments/verify`)

**Request:**
```json
{
  "paymentId": "uuid",
  "orderId": "order_xxx",
  "signature": "razorpay_signature",
  "razorpayPaymentId": "pay_xxx"
}
```

**Features:**
- Timing-safe signature verification
- Amount mismatch detection
- Automatic subscription creation
- Invoice generation

### Webhook Handler (`/api/webhooks/razorpay`)

**Events Handled:**
- `payment.captured` - Auto-create subscription
- `payment.failed` - Mark payment as failed
- `refund.created` - Cancel subscription

**Security Features:**
- HMAC signature verification (timing-safe)
- Idempotency check (prevents duplicate processing)
- Server-side payment verification (never trust webhook payload)
- 10-second timeout
- 1MB payload limit

---

## 3. Service Layer

### `subscription-service.ts`

**Functions:**
- `createSubscription(userId, planId, paymentId)` - Create/extend subscription
- `renewSubscription(subscriptionId, paymentId)` - Renew expired subscription
- `cancelSubscription(subscriptionId)` - Cancel subscription

**Features:**
- Auto-detects existing subscriptions and extends them
- Updates user table with tier/status
- Marks trial as converted
- Handles RPC unavailability gracefully

### `subscription-cron.ts`

**Functions:**
- `expireSubscriptions()` - Mark expired subscriptions
- `sendRenewalReminders()` - Log reminders (7 days before expiry)
- `resetDailyUsageLimits()` - Reset daily counters
- `runSubscriptionMaintenance()` - Run all tasks

**Cron Integration:**
- Triggered via `/api/cron/subscriptions`
- Protected by `CRON_SECRET`
- Designed for external cron services (GitHub Actions, Vercel Cron, etc.)

---

## 4. Usage Tracking System

### `usage-tracker.ts`

**Functions:**
- `recordUsage(userId, feature, options)` - Track feature usage
- `checkUsageLimit(userId, feature, limitType)` - Check remaining quota
- `getUserTier(userId)` - Get subscription tier
- `hasActiveSubscription(userId)` - Check subscription status
- `getUserUsageStats(userId, days)` - Get usage statistics

### Free Tier Limits (Spec v8.0)

| Feature | Daily Limit | Total Limit |
|---------|-------------|-------------|
| MCQ | 3 | - |
| Mains Evaluation | 1 | - |
| Custom Notes | - | 2 |
| Doubts | 3 | - |
| Mentor Chat | 1 | - |
| AI Chat | 5 | - |
| Notes Generation | 5 | - |
| Mind Maps | 2 | - |

### `check-access.ts` (Updated)

**Features:**
- Checks subscription status first (full access for paid users)
- Falls back to free tier limits
- Uses RPC functions when available
- Direct query fallback
- Feature-specific filtering

---

## 5. Frontend Components

### `pricing-plans.tsx`

**Features:**
- Fetches plans from `/api/plans`
- Dynamic GST calculation display
- Integrated Razorpay checkout
- Plan selection flow

### `razorpay-checkout.tsx`

**Features:**
- Client-side Razorpay integration
- Automatic payment flow
- Success/failure callbacks
- Script loading detection

---

## 6. Configuration

### Environment Variables

```bash
# Razorpay
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_xxx

# Cron Jobs
CRON_SECRET=xxx  # Generate: openssl rand -base64 32
```

### Webhook Configuration

**Razorpay Dashboard Setup:**
1. Go to Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/razorpay`
3. Set secret: Match `RAZORPAY_WEBHOOK_SECRET`
4. Select events: `payment.captured`, `payment.failed`, `refund.created`

---

## 7. Testing

### Updated Tests

**`tests/api/payments-initiate.test.ts`:**
- Missing plan slug validation
- Plan not found/inactive handling
- Success with payment details (monthly/quarterly)
- Payment record creation failure

**Run Tests:**
```bash
npm test -- tests/api/payments-initiate.test.ts
npm test -- tests/api/payments-verify.test.ts
```

---

## 8. Security Features

| Feature | Implementation |
|---------|----------------|
| Signature Verification | Timing-safe HMAC comparison |
| Idempotency | Webhook event deduplication |
| Amount Validation | Server-side amount matching |
| RLS Policies | Row-level security on all tables |
| Auth Required | All payment APIs require session |
| Ownership Check | Users can only access their own data |
| Input Validation | Plan slug, billing cycle validation |

---

## 9. Deployment Checklist

### Database
- [ ] Apply migration `038_phase2_payments_fix.sql`
- [ ] Verify RLS policies are enabled
- [ ] Test RPC functions

### Environment
- [ ] Set all Razorpay keys
- [ ] Set `CRON_SECRET`
- [ ] Configure webhook endpoint

### Razorpay
- [ ] Configure webhook in dashboard
- [ ] Test with test mode keys first
- [ ] Verify webhook signature

### Cron Jobs
- [ ] Set up external cron (GitHub Actions/Vercel)
- [ ] Schedule daily at 00:00 UTC
- [ ] Monitor logs for failures

---

## 10. Files Changed/Created

### New Files
```
supabase/migrations/038_phase2_payments_fix.sql
src/lib/usage/usage-tracker.ts
src/app/api/cron/subscriptions/route.ts
src/app/api/subscription/status/route.ts
src/app/api/usage/route.ts
_bmad-output/phase2-subscription-payments-report.md
```

### Modified Files
```
src/lib/payments/subscription-service.ts
src/lib/payments/subscription-cron.ts
src/app/api/payments/initiate/route.ts
src/app/api/payments/verify/route.ts
src/app/api/webhooks/razorpay/route.ts
src/lib/auth/check-access.ts
tests/api/payments-initiate.test.ts
.env.example
```

---

## 11. Next Steps (Phase 3)

Phase 3 (Production Hardening) will add:
- Rate limiting (Redis/Upstash)
- Input validation (Zod schemas)
- Centralized error handling
- Structured logging (Pino)
- Timeout + retry logic
- API security headers

---

## 12. API Integration Example

### Frontend Payment Flow

```typescript
// 1. Initiate payment
const response = await fetch('/api/payments/initiate', {
  method: 'POST',
  body: JSON.stringify({ planSlug: 'premium', billingCycle: 'monthly' })
});
const { orderId, paymentId, amount, key } = await response.json();

// 2. Open Razorpay checkout
const options = {
  key,
  amount: amount * 100,
  currency: 'INR',
  order_id: orderId,
  handler: async (resp: any) => {
    // 3. Verify payment
    await fetch('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        paymentId,
        orderId,
        signature: resp.razorpay_signature,
        razorpayPaymentId: resp.razorpay_payment_id
      })
    });
  }
};
new window.Razorpay(options).open();
```

### Check Access in API Routes

```typescript
import { checkAccess } from '@/lib/auth/check-access';

export async function POST(req: Request) {
  const session = await requireSession();
  const userId = session.user.id;

  // Check if user can access this feature
  const access = await checkAccess(userId, 'notes_generate');
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }

  // Record usage
  await recordUsage(userId, 'notes_generate', {
    resourceId: noteId,
    resourceType: 'note',
    tokensUsed: tokenCount
  });

  // ... continue with feature logic
}
```

---

## 13. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Webhook 401 | Verify `RAZORPAY_WEBHOOK_SECRET` matches dashboard |
| Signature invalid | Ensure using `razorpay_signature` from handler |
| Subscription not created | Check RPC `create_subscription` exists |
| Usage limits not enforced | Verify migration 038 applied |

### Debug Queries

```sql
-- Check user's subscription
SELECT * FROM user_subscriptions WHERE user_id = 'xxx';

-- Check usage limits
SELECT * FROM usage_limits WHERE user_id = 'xxx';

-- Check recent usage
SELECT * FROM usage_tracking WHERE user_id = 'xxx' ORDER BY used_at DESC LIMIT 10;

-- Test RPC
SELECT has_active_subscription('user-uuid');
SELECT get_user_subscription_tier('user-uuid');
```

---

**Phase 2 Complete ✅**

Ready to proceed to Phase 3: Production Hardening.
