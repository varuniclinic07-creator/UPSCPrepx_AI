// ═══════════════════════════════════════════════════════════════
// USAGE API
// /api/usage
// Track and report feature usage
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/usage
 * Get current user's usage statistics
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireSession();
        const userId = (session as any).user.id;

        const supabase = await createClient();

        // Get usage stats for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: usageData } = await (supabase.from('usage_tracking') as any)
            .select('feature_name, tokens_used, used_at')
            .eq('user_id', userId)
            .gte('used_at', sevenDaysAgo.toISOString());

        // Aggregate by feature
        const stats: Record<string, { count: number; tokensUsed: number; lastUsed: string }> = {};

        if (usageData) {
            for (const record of usageData) {
                const feature = record.feature_name;
                if (!stats[feature]) {
                    stats[feature] = { count: 0, tokensUsed: 0, lastUsed: '' };
                }
                stats[feature].count++;
                stats[feature].tokensUsed += record.tokens_used || 0;
                if (!stats[feature].lastUsed || record.used_at > stats[feature].lastUsed) {
                    stats[feature].lastUsed = record.used_at;
                }
            }
        }

        // Get current limits
        const { data: limitsData } = await (supabase.from('usage_limits') as any)
            .select('feature_name, limit_type, limit_value, current_count, reset_at')
            .eq('user_id', userId);

        const limits: Record<string, { limit: number; current: number; type: string; resetAt?: string }> = {};

        if (limitsData) {
            for (const limit of limitsData) {
                limits[limit.feature_name] = {
                    limit: limit.limit_value,
                    current: limit.current_count,
                    type: limit.limit_type,
                    resetAt: limit.reset_at || undefined
                };
            }
        }

        return NextResponse.json({
            success: true,
            usage: stats,
            limits,
            period: {
                start: sevenDaysAgo.toISOString(),
                end: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Usage fetch error:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch usage' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/usage
 * Record usage of a feature
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const userId = (session as any).user.id;

        const body = await request.json();
        const { feature, resourceId, resourceType, tokensUsed = 0, metadata = {} } = body;

        if (!feature) {
            return NextResponse.json(
                { error: 'Feature is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Record usage
        await (supabase.from('usage_tracking') as any).insert({
            user_id: userId,
            feature_name: feature,
            resource_id: resourceId,
            resource_type: resourceType,
            tokens_used: tokensUsed,
            credits_consumed: 1,
            metadata
        });

        // Update daily counter
        const now = new Date();
        const resetAt = new Date(now);
        resetAt.setDate(resetAt.getDate() + 1);
        resetAt.setHours(0, 0, 0, 0);

        await (supabase.from('usage_limits') as any)
            .upsert({
                user_id: userId,
                feature_name: feature,
                limit_type: 'daily',
                limit_value: 0, // No limit enforced by default
                current_count: 1,
                reset_at: resetAt.toISOString()
            }, {
                onConflict: 'user_id,feature_name,limit_type'
            });

        return NextResponse.json({
            success: true,
            message: 'Usage recorded'
        });

    } catch (error) {
        console.error('Usage record error:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to record usage' },
            { status: 500 }
        );
    }
}
