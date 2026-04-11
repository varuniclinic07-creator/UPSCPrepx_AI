/**
 * Unified entitlement checking for premium features.
 * Spec v8.0: Free-tier limits enforced per feature.
 *
 * Usage in API routes:
 *   const access = await checkAccess(userId, 'doubt');
 *   if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

export type FeatureKey =
  | 'mcq'
  | 'mains_eval'
  | 'custom_notes'
  | 'doubt'
  | 'mentor'
  | 'ai_chat'
  | 'notes_generate'
  | 'mind_maps';

interface FeatureLimit {
  daily?: number;
  total?: number;
}

/**
 * Free-tier limits per spec v8.0 Section 11:
 * Free: 3 MCQs/day, 1 mains eval/day, 2 custom notes total,
 *       3 doubts/day, 5 notes (summary only)
 */
const FREE_LIMITS: Record<FeatureKey, FeatureLimit> = {
  mcq: { daily: 3 },
  mains_eval: { daily: 1 },
  custom_notes: { total: 2 },
  doubt: { daily: 3 },
  mentor: { daily: 1 },
  ai_chat: { daily: 5 },
  notes_generate: { daily: 5 },
  mind_maps: { daily: 2 },
};

/**
 * Maps feature keys to the DB table and column used for counting usage.
 * Uses the new usage_tracking table from migration 038.
 */
const USAGE_TABLE_MAP: Record<FeatureKey, { table: string; userColumn: string; dateColumn?: string }> = {
  mcq: { table: 'usage_tracking', userColumn: 'user_id', dateColumn: 'used_at' },
  mains_eval: { table: 'usage_tracking', userColumn: 'user_id', dateColumn: 'used_at' },
  custom_notes: { table: 'usage_tracking', userColumn: 'user_id' },
  doubt: { table: 'usage_tracking', userColumn: 'user_id', dateColumn: 'used_at' },
  mentor: { table: 'usage_tracking', userColumn: 'user_id', dateColumn: 'used_at' },
  ai_chat: { table: 'usage_tracking', userColumn: 'user_id', dateColumn: 'used_at' },
  notes_generate: { table: 'usage_tracking', userColumn: 'user_id', dateColumn: 'used_at' },
  mind_maps: { table: 'usage_tracking', userColumn: 'user_id', dateColumn: 'used_at' },
};

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
}

export async function checkAccess(
  userId: string,
  feature: FeatureKey
): Promise<AccessResult> {
  const supabase = await createServerSupabaseClient();

  // 1. Check subscription status using RPC function
  try {
    const { data: hasActive } = await (supabase.rpc as any)('has_active_subscription', {
      p_user_id: userId
    });

    if (hasActive) {
      return { allowed: true };
    }
  } catch (rpcError) {
    console.log('RPC not available, falling back to direct query');
  }

  // Fallback: Direct query to user_subscriptions
  const { data: subscription } = await (supabase
    .from('user_subscriptions') as any)
    .select('status, ends_at, tier')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (subscription) {
    const now = new Date();
    const endsAt = subscription.ends_at || subscription.current_period_end;

    if (endsAt && new Date(endsAt) > now) {
      return { allowed: true };
    }
  }

  // 2. Check if user is on trial
  const { data: user } = await (supabase
    .from('users') as any)
    .select('subscription_status, trial_ends_at')
    .eq('id', userId)
    .single();

  if (user && user.subscription_status === 'trial' && user.trial_ends_at) {
    if (new Date(user.trial_ends_at) > now) {
      return { allowed: true };
    }
  }

  // 3. Free tier — enforce limits using check_usage_limit RPC
  const limit = FREE_LIMITS[feature];
  if (!limit) {
    return { allowed: true };
  }

  try {
    const limitType = limit.daily ? 'daily' : 'total';

    // Try RPC first
    const { data: usageData, error: rpcError } = await (supabase.rpc as any)('check_usage_limit', {
      p_user_id: userId,
      p_feature: feature,
      p_limit_type: limitType
    });

    if (!rpcError && usageData && usageData.length > 0) {
      const { allowed, current_count, limit_value, remaining } = usageData[0];

      if (!allowed) {
        return {
          allowed: false,
          reason: `Free plan limit reached: ${limit_value} ${feature.replace('_', ' ')} per ${limitType === 'daily' ? 'day' : 'account'}. Upgrade for unlimited access.`,
          remaining: 0,
        };
      }

      return { allowed: true, remaining };
    }

    // Fallback: Direct query to usage_tracking
    const mapping = USAGE_TABLE_MAP[feature];
    if (!mapping) {
      return { allowed: true };
    }

    let query = (supabase.from(mapping.table) as any)
      .select('id', { count: 'exact', head: true })
      .eq(mapping.userColumn, userId);

    if (limit.daily && mapping.dateColumn) {
      // Count today's usage only (UTC)
      const todayStart = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
      query = query.gte(mapping.dateColumn, todayStart.toISOString());
    }

    // Filter by feature_name for usage_tracking
    if (mapping.table === 'usage_tracking') {
      query = query.eq('feature_name', feature);
    }

    const { count, error } = await query;

    if (error) {
      console.error(`checkAccess: Error counting usage for ${feature}:`, error);
      return { allowed: false, reason: 'Service temporarily unavailable' };
    }

    const usageCount = count || 0;
    const maxAllowed = limit.daily || limit.total || Infinity;
    const remaining = Math.max(0, maxAllowed - usageCount);

    if (usageCount >= maxAllowed) {
      const limitType = limit.daily ? 'daily' : 'total';
      return {
        allowed: false,
        reason: `Free plan limit reached: ${maxAllowed} ${feature.replace('_', ' ')} per ${limitType === 'daily' ? 'day' : 'account'}. Upgrade for unlimited access.`,
        remaining: 0,
      };
    }

    return { allowed: true, remaining };
  } catch (error) {
    console.error(`checkAccess: Unexpected error for ${feature}:`, error);
    return { allowed: false, reason: 'Service temporarily unavailable' };
  }
}
