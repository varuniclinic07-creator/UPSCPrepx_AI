/**
 * Phase 15: Admin Surge Management API
 * Manual surge pricing control for admins
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';
import { getSurgePricingManager } from '@/lib/billing/surge-pricing';

/**
 * GET /api/admin/billing/surge/manage
 * Get current surge state and configuration
 */
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const surgeManager = getSurgePricingManager();
        const analytics = surgeManager.getAnalytics();
        const currentState = surgeManager.getCurrentState();

        return NextResponse.json({
          success: true,
          data: {
            state: currentState,
            config: analytics.config,
            analytics: {
              isActive: analytics.isActive,
              multiplier: analytics.currentMultiplier,
              demandLevel: analytics.demandLevel,
              timeInSurge: analytics.timeInSurge,
            },
          },
        });
      } catch (error) {
        console.error('[Surge Manage GET] Error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch surge state' },
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

/**
 * POST /api/admin/billing/surge/manage
 * Manually control surge pricing
 */
export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const body = await request.json();
        const { action, multiplier, reason, duration, enabled } = body;

        const surgeManager = getSurgePricingManager();

        switch (action) {
          case 'set':
            // Set manual surge
            surgeManager.setManualSurge(
              multiplier || 1.5,
              reason || 'Manual override',
              duration || 60
            );
            break;

          case 'clear':
            // Clear manual surge
            surgeManager.clearManualSurge();
            break;

          case 'enable':
            // Enable surge pricing
            surgeManager.setEnabled(true);
            break;

          case 'disable':
            // Disable surge pricing
            surgeManager.setEnabled(false);
            break;

          default:
            return NextResponse.json(
              { error: 'Invalid action. Use: set, clear, enable, disable' },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          data: {
            action,
            state: surgeManager.getCurrentState(),
          },
        });
      } catch (error) {
        console.error('[Surge Manage POST] Error:', error);
        return NextResponse.json(
          { error: 'Failed to manage surge pricing' },
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
