/**
 * Personal AI Usage API
 * Get current user's AI usage and budget status
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';
import { costTracker } from '@/lib/ai-cost/cost-tracker';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/metrics/my-usage
 * Returns current user's AI usage and budget status
 */
async function getMyUsage(userId: string) {
  const supabase = await createClient();

  // Get budget status
  const budgetStatus = await costTracker.getBudgetStatus(userId);

  // Get detailed usage breakdown
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const usageSummary = await costTracker.getUsageSummary(userId, periodStart, periodEnd);

  // Get daily usage for chart
  const { data: dailyUsage } = await supabase
    .from('ai_usage_logs')
    .select('created_at, total_tokens, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString())
    .order('created_at', { ascending: true });

  // Aggregate by day
  const dailyBreakdown: Record<string, { tokens: number; cost: number }> = {};
  for (const record of dailyUsage || []) {
    const date = record.created_at
      ? new Date(record.created_at).toISOString().split('T')[0]
      : 'unknown';
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = { tokens: 0, cost: 0 };
    }
    dailyBreakdown[date].tokens += record.total_tokens || 0;
    dailyBreakdown[date].cost += record.cost_usd || 0;
  }

  // Get usage by endpoint
  const { data: byEndpoint } = await supabase
    .from('ai_usage_logs')
    .select('endpoint, total_tokens, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  const endpointUsage: Record<string, { tokens: number; cost: number; count: number }> = {};
  for (const record of byEndpoint || []) {
    const ep = record.endpoint ?? 'unknown';
    if (!endpointUsage[ep]) {
      endpointUsage[ep] = { tokens: 0, cost: 0, count: 0 };
    }
    endpointUsage[ep].tokens += record.total_tokens || 0;
    endpointUsage[ep].cost += record.cost_usd || 0;
    endpointUsage[ep].count += 1;
  }

  return {
    budgetStatus,
    usageSummary,
    dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
      date,
      tokens: data.tokens,
      cost: data.cost,
    })),
    endpointUsage: Object.entries(endpointUsage).map(([endpoint, data]) => ({
      endpoint,
      ...data,
    })),
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /api/admin/metrics/my-usage
 */
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        const usage = await getMyUsage(user.id);

        return NextResponse.json({
          success: true,
          data: usage,
        });
      } catch (error) {
        console.error('[My Usage] Error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch usage data' },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      rateLimit: 'api',
      validateOrigin: true,
    }
  );
}
