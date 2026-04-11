/**
 * Phase 15: Invoices API
 * Get invoice history and details
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';
import { getUsageBillingService } from '@/lib/billing/usage-billing';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/invoices
 * Get invoice history for authenticated user
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

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '12');
        const invoiceNumber = searchParams.get('invoice');

        const billingService = getUsageBillingService();

        if (invoiceNumber) {
          // Get specific invoice
          const invoice = await billingService.getInvoice(user.id, invoiceNumber);

          if (!invoice) {
            return NextResponse.json(
              { error: 'Invoice not found' },
              { status: 404 }
            );
          }

          return NextResponse.json({
            success: true,
            data: { invoice },
          });
        }

        // Get invoice history
        const invoices = await billingService.getInvoiceHistory(user.id, limit);

        return NextResponse.json({
          success: true,
          data: { invoices },
        });
      } catch (error) {
        console.error('[Invoices API] Error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch invoices' },
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
