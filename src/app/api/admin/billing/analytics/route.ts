/**
 * Phase 15: Admin Billing Analytics API
 * Comprehensive billing and revenue analytics for admin dashboard
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';
import { getUsageBillingService } from '@/lib/billing/usage-billing';
import { getPricingEngine } from '@/lib/billing/pricing-engine';
import { getSurgePricingManager } from '@/lib/billing/surge-pricing';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/billing/analytics
 * Get comprehensive billing analytics
 */
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const searchParams = request.nextUrl.searchParams;
        const periodStart = searchParams.get('periodStart');
        const periodEnd = searchParams.get('periodEnd');

        const billingService = getUsageBillingService();
        const pricingEngine = getPricingEngine();
        const surgeManager = getSurgePricingManager();

        // Get billing analytics
        const billingAnalytics = await billingService.getBillingAnalytics(
          periodStart ? new Date(periodStart) : undefined,
          periodEnd ? new Date(periodEnd) : undefined
        );

        // Get pricing analytics
        const pricingAnalytics = pricingEngine.getPricingAnalytics();

        // Get surge analytics
        const surgeAnalytics = surgeManager.getAnalytics();

        // Get plan distribution
        const supabase = await createClient();
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('plan_type, status')
          .eq('status', 'active');

        const planDistribution: Record<string, number> = {
          free: 0,
          basic: 0,
          premium: 0,
          enterprise: 0,
        };

        if (subscriptions) {
          for (const sub of subscriptions) {
            planDistribution[sub.plan_type] = (planDistribution[sub.plan_type] || 0) + 1;
          }
        }

        // Get revenue by plan
        const { data: invoices } = await supabase
          .from('invoices')
          .select('plan_charge, overage_charge, total, status')
          .gte('created_at', periodStart ? new Date(periodStart).toISOString() : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lte('created_at', periodEnd ? new Date(periodEnd).toISOString() : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());

        const revenueByPlan: Record<string, { plan: number; overage: number; total: number }> = {
          free: { plan: 0, overage: 0, total: 0 },
          basic: { plan: 0, overage: 0, total: 0 },
          premium: { plan: 0, overage: 0, total: 0 },
          enterprise: { plan: 0, overage: 0, total: 0 },
        };

        // This would need plan_type in invoices table - simplified for now
        const totalPlanRevenue = invoices?.reduce((sum: number, inv: any) => sum + ((inv as any).plan_charge || 0), 0) || 0;
        const totalOverageRevenue = invoices?.reduce((sum: number, inv: any) => sum + ((inv as any).overage_charge || 0), 0) || 0;

        return NextResponse.json({
          success: true,
          data: {
            revenue: {
              total: billingAnalytics.totalRevenue,
              plan: totalPlanRevenue,
              overage: totalOverageRevenue,
              averagePerUser: billingAnalytics.averageRevenuePerUser,
            },
            invoices: {
              total: billingAnalytics.invoicesCount,
              paid: billingAnalytics.paidInvoices,
              overdue: billingAnalytics.overdueInvoices,
              collectionRate: billingAnalytics.invoicesCount > 0
                ? (billingAnalytics.paidInvoices / billingAnalytics.invoicesCount) * 100
                : 0,
            },
            plans: {
              distribution: planDistribution,
              pricing: pricingAnalytics.plans,
            },
            surge: {
              active: surgeAnalytics.isActive,
              multiplier: surgeAnalytics.currentMultiplier,
              demandLevel: surgeAnalytics.demandLevel,
              timeInSurge: surgeAnalytics.timeInSurge,
            },
            topSpenders: billingAnalytics.topSpenders,
          },
        });
      } catch (error) {
        console.error('[Admin Billing Analytics] Error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch billing analytics' },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      requiredRole: 'admin',
      rateLimit: 'api',
    }
  );
}
