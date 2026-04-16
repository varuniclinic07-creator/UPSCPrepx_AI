/**
 * Entitlement Check — checkAccess()
 * v8 Spec: EVERY premium feature checks entitlement
 * Queries: user_subscriptions table (tier, status, ends_at)
 * Fallback: users table (subscription_tier, subscription_status, trial_ends_at)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type PlanTier = 'free' | 'trial' | 'basic' | 'premium' | 'premium_plus';

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
  tier: PlanTier;
  remainingQuota?: number;
}

export async function checkAccess(
  userId: string,
  feature: string,
  supabaseUrl?: string,
  serviceKey?: string,
): Promise<EntitlementResult> {
  const url = supabaseUrl || Deno.env.get('SUPABASE_URL')!;
  const key = serviceKey || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(url, key);

  // Primary: check user_subscriptions table
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('tier, status, ends_at, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (sub) {
    const tier = (sub.tier || 'free') as PlanTier;
    const expiresAt = sub.ends_at || sub.current_period_end;

    if (tier === 'free' && !isFreeFeature(feature)) {
      return { allowed: false, reason: 'Upgrade to access this feature', tier };
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return { allowed: false, reason: 'Subscription expired', tier };
    }

    return { allowed: true, tier };
  }

  // Fallback: check users table directly (for admin/manual subscriptions)
  const { data: user } = await supabase
    .from('users')
    .select('subscription_tier, subscription_status, trial_ends_at, role')
    .eq('id', userId)
    .single();

  if (!user) {
    return { allowed: false, reason: 'User not found', tier: 'free' };
  }

  // Admin bypass
  if (user.role === 'admin') {
    const tier = (user.subscription_tier || 'premium_plus') as PlanTier;
    return { allowed: true, tier };
  }

  // Active subscription on users table
  if (user.subscription_status === 'active' && user.subscription_tier) {
    const tier = (user.subscription_tier || 'free') as PlanTier;

    if (user.trial_ends_at && new Date(user.trial_ends_at) < new Date()) {
      return { allowed: false, reason: 'Trial/subscription expired', tier };
    }

    if (tier === 'free' && !isFreeFeature(feature)) {
      return { allowed: false, reason: 'Upgrade to access this feature', tier };
    }

    return { allowed: true, tier };
  }

  return { allowed: false, reason: 'No active subscription', tier: 'free' };
}

function isFreeFeature(feature: string): boolean {
  const freeFeatures = ['daily_digest', 'mcq_practice_basic', 'notes_read'];
  return freeFeatures.includes(feature);
}
