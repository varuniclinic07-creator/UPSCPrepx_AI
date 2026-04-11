/**
 * Phase 15: Price Quote API
 * Get real-time price quote for AI usage
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';
import { getPricingEngine, UserPlan } from '@/lib/billing/pricing-engine';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/quote
 * Get price quote for estimated usage
 */
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Get user's plan
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_type, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        const plan: UserPlan = subscription?.plan_type ? subscription.plan_type as UserPlan : 'free';

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const estimatedTokens = parseInt(searchParams.get('tokens') || '1000');
        const providerCost = parseFloat(searchParams.get('providerCost') || '0');

        // Generate price quote
        const pricingEngine = getPricingEngine();
        const quote = pricingEngine.generatePriceQuote({
          userId: user.id,
          plan,
          estimatedTokens,
          providerCost,
        });

        return NextResponse.json({
          success: true,
          data: {
            quote,
            breakdown: {
              basePrice: quote.basePrice,
              surgeApplied: quote.surgeApplied,
              finalPrice: quote.finalPrice,
              validUntil: quote.validUntil,
            },
          },
        });
      } catch (error) {
        console.error('[Price Quote] Error:', error);
        return NextResponse.json(
          { error: 'Failed to generate price quote' },
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

/**
 * POST /api/billing/quote
 * Generate quote for custom usage parameters
 */
export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        const body = await request.json();
        const { estimatedTokens, providerCost, plan: overridePlan } = body;

        // Get or override user's plan
        let plan: UserPlan = 'free';

        if (overridePlan) {
          plan = overridePlan as UserPlan;
        } else {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_type, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

          plan = subscription?.plan_type ? subscription.plan_type as UserPlan : 'free';
        }

        // Generate price quote
        const pricingEngine = getPricingEngine();
        const quote = pricingEngine.generatePriceQuote({
          userId: user.id,
          plan,
          estimatedTokens: estimatedTokens || 1000,
          providerCost: providerCost || 0,
        });

        return NextResponse.json({
          success: true,
          data: {
            quote,
            plan,
            breakdown: {
              basePrice: quote.basePrice,
              surgeApplied: quote.surgeApplied,
              finalPrice: quote.finalPrice,
              validUntil: quote.validUntil,
            },
          },
        });
      } catch (error) {
        console.error('[Price Quote POST] Error:', error);
        return NextResponse.json(
          { error: 'Failed to generate price quote' },
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
