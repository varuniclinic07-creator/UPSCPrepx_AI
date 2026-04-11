// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION STATUS API
// /api/subscription/status
// Get current user's subscription status
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subscription/status
 * Get current user's subscription details
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireSession();
        const userId = (session as any).user.id;

        const supabase = await createClient();

        // Get subscription using RPC
        let subscription = null;
        try {
            const { data: rpcData } = await (supabase.rpc as any)('get_user_subscription_tier', {
                p_user_id: userId
            });

            if (rpcData) {
                subscription = { tier: rpcData };
            }
        } catch {
            // RPC not available, use direct query
        }

        // Direct query fallback
        if (!subscription) {
            const now = new Date().toISOString();

            const { data: userSub } = await (supabase
                .from('user_subscriptions') as any)
                .select(`
                    *,
                    subscription_plans (
                        name,
                        tier,
                        features,
                        limits
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'active')
                .gte('ends_at', now)
                .order('ends_at', { ascending: false })
                .single();

            if (userSub) {
                subscription = {
                    id: userSub.id,
                    tier: userSub.tier,
                    status: userSub.status,
                    endsAt: userSub.ends_at,
                    startsAt: userSub.starts_at,
                    billingCycle: userSub.billing_cycle,
                    plan: userSub.subscription_plans
                };
            }
        }

        // Get user's subscription tier from users table
        const { data: userData } = await (supabase
            .from('users') as any)
            .select('subscription_tier, subscription_status, subscription_ends_at, trial_started_at, trial_ends_at, post_trial')
            .eq('id', userId)
            .single();

        const now = new Date();
        const isTrialActive = userData?.trial_ends_at &&
                              new Date(userData.trial_ends_at) > now &&
                              userData.subscription_status === 'trial';

        const isPostTrial = userData?.post_trial === true;

        return NextResponse.json({
            success: true,
            subscription: subscription || null,
            user: {
                tier: userData?.subscription_tier || 'free',
                status: userData?.subscription_status || 'free',
                endsAt: userData?.subscription_ends_at,
                trial: {
                    isActive: isTrialActive,
                    endsAt: userData?.trial_ends_at,
                    isPostTrial: isPostTrial
                }
            },
            features: {
                hasFullAccess: !!(subscription || isTrialActive),
                isFree: !subscription && !isTrialActive
            }
        });

    } catch (error) {
        console.error('Subscription status error:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch subscription status' },
            { status: 500 }
        );
    }
}
