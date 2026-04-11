/**
 * Entitlement Check — checkAccess()
 * v8 Spec: EVERY premium feature checks entitlement
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type PlanTier = 'free' | 'trial' | 'basic' | 'pro' | 'ultimate';

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

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_tier, status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!sub) {
    return { allowed: false, reason: 'No active subscription', tier: 'free' };
  }

  const tier = (sub.plan_tier || 'free') as PlanTier;

  // Free tier: limited features
  const freeFeatures = ['daily_digest', 'mcq_practice_basic', 'notes_read'];
  if (tier === 'free' && !freeFeatures.includes(feature)) {
    return { allowed: false, reason: 'Upgrade to access this feature', tier };
  }

  // Check expiration
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
    return { allowed: false, reason: 'Subscription expired', tier };
  }

  return { allowed: true, tier };
}
