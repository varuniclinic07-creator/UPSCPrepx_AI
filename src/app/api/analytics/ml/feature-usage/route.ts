/**
 * ML Analytics API - Feature Usage Tracking
 * Get feature adoption, usage patterns, and correlation data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeatureUsageService } from '@/lib/analytics/feature-usage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'summary';

    const service = getFeatureUsageService();

    if (userId) {
      // User-specific feature analytics
      if (type === 'adoption') {
        const adoption = await service.getFeatureAdoption(userId);
        return NextResponse.json({
          success: true,
          data: adoption,
        });
      }

      if (type === 'journey') {
        const journey = await service.analyzeUserJourney(userId);
        return NextResponse.json({
          success: true,
          data: journey,
        });
      }

      // Default: return all user feature data
      const [adoption, journey] = await Promise.all([
        service.getFeatureAdoption(userId),
        service.analyzeUserJourney(userId),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          adoption,
          journey,
        },
      });
    }

    // Global/Platform analytics
    if (type === 'trends') {
      const periods = parseInt(searchParams.get('periods') || '6');
      const trends = await service.getFeatureTrends(periods);
      return NextResponse.json({
        success: true,
        data: trends,
      });
    }

    if (type === 'correlations') {
      const correlations = await service.getFeatureCorrelations();
      return NextResponse.json({
        success: true,
        data: correlations.slice(0, 20), // Top 20 correlations
      });
    }

    if (type === 'metrics') {
      const periodDays = parseInt(searchParams.get('period') || '30');
      const metrics = await service.getFeatureMetrics(periodDays);
      return NextResponse.json({
        success: true,
        data: metrics,
      });
    }

    // Default: return comprehensive summary
    const periodDays = parseInt(searchParams.get('period') || '30');
    const [usage, metrics, adoption, correlations] = await Promise.all([
      service.getFeatureUsage(periodDays),
      service.getFeatureMetrics(periodDays),
      service.getBulkFeatureAdoption(),
      service.getFeatureCorrelations(),
    ]);

    // Summarize bulk adoption data
    const adoptionSummary: Record<string, number> = {};
    for (const data of Object.values(adoption)) {
      adoptionSummary[data.adoptionStage] = (adoptionSummary[data.adoptionStage] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        usage: usage.slice(0, 50), // Top 50 features
        metrics,
        adoptionSummary,
        correlations: correlations.slice(0, 10), // Top 10 correlations
      },
    });
  } catch (error) {
    console.error('Error in feature usage API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feature usage data' },
      { status: 500 }
    );
  }
}
