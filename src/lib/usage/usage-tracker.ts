// ═══════════════════════════════════════════════════════════════
// USAGE TRACKER
// Track and enforce feature usage limits
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

export interface UsageRecord {
    feature: string;
    resourceId?: string;
    resourceType?: string;
    tokensUsed?: number;
    metadata?: Record<string, unknown>;
}

/**
 * Record usage of a feature for a user
 */
export async function recordUsage(
    userId: string,
    feature: string,
    options: {
        resourceId?: string;
        resourceType?: string;
        tokensUsed?: number;
        metadata?: Record<string, unknown>;
    } = {}
): Promise<void> {
    const supabase = await createClient();

    try {
        // Insert usage tracking record
        await (supabase.from('usage_tracking') as any).insert({
            user_id: userId,
            feature_name: feature,
            resource_id: options.resourceId,
            resource_type: options.resourceType,
            tokens_used: options.tokensUsed || 0,
            credits_consumed: 1,
            metadata: options.metadata || {}
        });
    } catch (error) {
        console.error(`Usage tracking error for ${feature}:`, error);
        // Don't throw - usage tracking shouldn't block the main operation
    }
}

/**
 * Check if user has remaining quota for a feature
 */
export async function checkUsageLimit(
    userId: string,
    feature: string,
    limitType: 'daily' | 'total' = 'daily'
): Promise<{ allowed: boolean; remaining: number; limit: number; current: number }> {
    const supabase = await createClient();

    try {
        // Try RPC first
        const { data: usageData } = await (supabase.rpc as any)('check_usage_limit', {
            p_user_id: userId,
            p_feature: feature,
            p_limit_type: limitType
        });

        if (usageData && usageData.length > 0) {
            const { allowed, current_count, limit_value, remaining } = usageData[0];
            return {
                allowed,
                remaining,
                limit: limit_value,
                current: current_count
            };
        }
    } catch (error) {
        console.log('RPC not available, using fallback');
    }

    // Fallback: Direct query
    const todayStart = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

    const { count } = await (supabase.from('usage_tracking') as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature_name', feature);

    if (limitType === 'daily') {
        const { count: dailyCount } = await (supabase.from('usage_tracking') as any)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('feature_name', feature)
            .gte('used_at', todayStart.toISOString());

        return {
            allowed: true, // Allow if no limit configured
            remaining: Infinity,
            limit: 0,
            current: dailyCount || 0
        };
    }

    return {
        allowed: true,
        remaining: Infinity,
        limit: 0,
        current: count || 0
    };
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(userId: string): Promise<string> {
    const supabase = await createClient();

    try {
        // Try RPC first
        const { data: tier } = await (supabase.rpc as any)('get_user_subscription_tier', {
            p_user_id: userId
        });

        if (tier) {
            return tier;
        }
    } catch (error) {
        console.log('RPC not available, using fallback');
    }

    // Fallback: Direct query
    const now = new Date().toISOString();

    const { data: subscription } = await (supabase
        .from('user_subscriptions') as any)
        .select('tier')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('ends_at', now)
        .single();

    if (subscription?.tier) {
        return subscription.tier;
    }

    // Check user table
    const { data: user } = await (supabase
        .from('users') as any)
        .select('subscription_tier')
        .eq('id', userId)
        .single();

    return user?.subscription_tier || 'free';
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
    const supabase = await createClient();

    try {
        // Try RPC first
        const { data: hasActive } = await (supabase.rpc as any)('has_active_subscription', {
            p_user_id: userId
        });

        return hasActive || false;
    } catch (error) {
        console.log('RPC not available, using fallback');
    }

    // Fallback: Direct query
    const now = new Date().toISOString();

    const { data: subscription } = await (supabase
        .from('user_subscriptions') as any)
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('ends_at', now)
        .single();

    return !!subscription;
}

/**
 * Get usage stats for a user
 */
export async function getUserUsageStats(
    userId: string,
    days: number = 7
): Promise<Record<string, { count: number; tokensUsed: number }>> {
    const supabase = await createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: usage } = await (supabase.from('usage_tracking') as any)
        .select('feature_name, tokens_used')
        .eq('user_id', userId)
        .gte('used_at', startDate.toISOString());

    if (!usage) {
        return {};
    }

    const stats: Record<string, { count: number; tokensUsed: number }> = {};

    for (const record of usage) {
        const feature = record.feature_name;
        if (!stats[feature]) {
            stats[feature] = { count: 0, tokensUsed: 0 };
        }
        stats[feature].count++;
        stats[feature].tokensUsed += record.tokens_used || 0;
    }

    return stats;
}
