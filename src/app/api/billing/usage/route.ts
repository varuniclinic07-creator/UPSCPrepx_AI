/**
 * Phase 15: Usage API
 * Get current usage summary and billing information
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';
import { getUsageBillingService } from '@/lib/billing/usage-billing';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/usage
 * Get current usage summary for authenticated user
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

        const billingService = getUsageBillingService();
        const usageSummary = await billingService.getUsageSummary(user.id);

        return NextResponse.json({
          success: true,
          data: usageSummary,
        });
      } catch (error) {
        console.error('[Usage API] Error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch usage summary' },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      rateLimit: 'api',
    }
  );
}
