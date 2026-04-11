/**
 * ML Analytics API - Usage Analytics
 * Get usage patterns, trends, and predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUsageAnalyticsService } from '@/lib/analytics/usage-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'overall';

    const service = getUsageAnalyticsService();

    if (userId) {
      // User-specific analytics
      if (type === 'pattern') {
        const pattern = await service.analyzeUsagePattern(userId);
        return NextResponse.json({
          success: true,
          data: pattern,
        });
      }

      if (type === 'trends') {
        const periods = parseInt(searchParams.get('periods') || '6');
        const trends = await service.getUsageTrends(userId, periods);
        return NextResponse.json({
          success: true,
          data: trends,
        });
      }

      if (type === 'prediction') {
        const daysAhead = parseInt(searchParams.get('days') || '30');
        const prediction = await service.predictUsage(userId, daysAhead);
        return NextResponse.json({
          success: true,
          data: prediction,
        });
      }

      // Default: return all user analytics
      const [pattern, trends, prediction] = await Promise.all([
        service.analyzeUsagePattern(userId),
        service.getUsageTrends(userId, 6),
        service.predictUsage(userId, 30),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          pattern,
          trends,
          prediction,
        },
      });
    }

    // Overall analytics
    if (type === 'cohort') {
      const cohortType = searchParams.get('cohortType') || 'signup_month';
      const cohorts = await service.getCohortAnalysis(cohortType as any);
      return NextResponse.json({
        success: true,
        data: cohorts,
      });
    }

    const periodDays = parseInt(searchParams.get('period') || '30');
    const analytics = await service.getUsageAnalytics(periodDays);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error in usage analytics API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage analytics' },
      { status: 500 }
    );
  }
}
