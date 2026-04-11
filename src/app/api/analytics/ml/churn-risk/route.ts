/**
 * Phase 16: Churn Risk Analysis API
 * Returns at-risk users ranked by churn probability with recommended interventions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSegmentationService } from '@/lib/analytics/user-segmentation';
import { getCurrentUser } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const threshold = parseFloat(searchParams.get('threshold') || '0.5');
    const limit = parseInt(searchParams.get('limit') || '50');

    const service = getUserSegmentationService();
    const { segmentations } = await service.segmentAllUsers();

    // Filter and rank at-risk users by churn score
    const atRiskUsers = segmentations
      .filter((s) => s.scores.churn >= threshold)
      .sort((a, b) => b.scores.churn - a.scores.churn)
      .slice(0, limit)
      .map((s) => ({
        userId: s.userId,
        segment: s.primarySegment,
        adoptionStage: s.adoptionStage,
        churnScore: Math.round(s.scores.churn * 100) / 100,
        engagementScore: Math.round(s.scores.engagement * 100) / 100,
        valueScore: Math.round(s.scores.value * 100) / 100,
        daysSinceLastActive: s.metrics.daysSinceLastActive,
        totalSpent: s.metrics.totalSpent,
        plan: s.metrics.plan,
        recommendedActions: s.recommendedActions.slice(0, 3),
        riskLevel:
          s.scores.churn >= 0.8 ? 'critical' :
          s.scores.churn >= 0.6 ? 'high' :
          s.scores.churn >= 0.4 ? 'medium' : 'low',
      }));

    const total = segmentations.length;
    const criticalCount = atRiskUsers.filter((u) => u.riskLevel === 'critical').length;
    const highCount = atRiskUsers.filter((u) => u.riskLevel === 'high').length;
    const mediumCount = atRiskUsers.filter((u) => u.riskLevel === 'medium').length;
    const potentialRevenueLoss = atRiskUsers.reduce((sum, u) => sum + u.totalSpent, 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers: total,
          atRiskCount: atRiskUsers.length,
          atRiskPercent: total > 0 ? Math.round((atRiskUsers.length / total) * 100 * 10) / 10 : 0,
          criticalCount,
          highCount,
          mediumCount,
          potentialRevenueLoss: Math.round(potentialRevenueLoss * 100) / 100,
          avgChurnScore:
            atRiskUsers.length > 0
              ? Math.round(
                  (atRiskUsers.reduce((s, u) => s + u.churnScore, 0) / atRiskUsers.length) * 100
                ) / 100
              : 0,
        },
        users: atRiskUsers,
        threshold,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Churn risk API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute churn risk analysis' },
      { status: 500 }
    );
  }
}
