/**
 * ML Analytics API - Unified Dashboard
 * Aggregated ML analytics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSegmentationService } from '@/lib/analytics/user-segmentation';
import { getUsageAnalyticsService } from '@/lib/analytics/usage-analytics';
import { getCostOptimizationService } from '@/lib/analytics/cost-optimization';
import { getFeatureUsageService } from '@/lib/analytics/feature-usage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodDays = parseInt(searchParams.get('period') || '30');

    const [
      segmentationService,
      usageService,
      costService,
      featureService,
    ] = await Promise.all([
      getUserSegmentationService(),
      getUsageAnalyticsService(),
      getCostOptimizationService(),
      getFeatureUsageService(),
    ]);

    // Fetch all dashboard data in parallel
    const [
      bulkSegments,
      overallUsage,
      providerCosts,
      featureMetrics,
      cohortData,
    ] = await Promise.all([
      segmentationService.getBulkSegmentation(),
      usageService.getUsageAnalytics(periodDays),
      costService.analyzeProviderCosts(periodDays),
      featureService.getFeatureMetrics(periodDays),
      usageService.getCohortAnalysis('signup_month'),
    ]);

    // Calculate segment distribution
    const segmentDistribution: Record<string, number> = {};
    for (const data of Object.values(bulkSegments)) {
      segmentDistribution[data.segment] = (segmentDistribution[data.segment] || 0) + 1;
    }

    // Calculate adoption stage distribution
    const adoptionStageDistribution: Record<string, number> = {};
    for (const data of Object.values(bulkSegments)) {
      adoptionStageDistribution[data.adoptionStage] = (adoptionStageDistribution[data.adoptionStage] || 0) + 1;
    }

    // Get top providers by cost
    const topProviders = providerCosts.slice(0, 5);

    // Calculate summary stats
    const totalUsers = Object.keys(bulkSegments).length;
    const championUsers = segmentDistribution['champion'] || 0;
    const atRiskUsers = segmentDistribution['at_risk'] || 0;
    const dormantUsers = segmentDistribution['dormant'] || 0;

    // Calculate health score
    const healthScore = totalUsers > 0
      ? ((championUsers * 100 + (segmentDistribution['loyal'] || 0) * 80 + (segmentDistribution['power_user'] || 0) * 70) / totalUsers)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          healthScore: Math.round(healthScore * 10) / 10,
          totalTokens: overallUsage.totalUsage.tokens,
          totalRevenue: overallUsage.totalUsage.cost,
          avgTokensPerUser: Math.round(overallUsage.avgPerUser.tokens),
          activeUsers: overallUsage.activeUsers,
        },
        segmentation: {
          distribution: segmentDistribution,
          championCount: championUsers,
          atRiskCount: atRiskUsers,
          dormantCount: dormantUsers,
          adoptionStages: adoptionStageDistribution,
        },
        usage: {
          trends: overallUsage.trends,
          peakUsage: overallUsage.peakUsage,
          growthRates: {
            tokens: overallUsage.trends.tokensGrowth,
            users: overallUsage.trends.usersGrowth,
            revenue: overallUsage.trends.revenueGrowth,
          },
        },
        costs: {
          providers: topProviders,
          totalProviderCost: topProviders.reduce((sum, p) => sum + p.totalCost, 0),
        },
        features: {
          metrics: featureMetrics,
          activeFeatures: featureMetrics.activeFeatures,
          avgFeaturesPerUser: featureMetrics.avgFeaturesPerUser,
        },
        cohorts: cohortData.slice(0, 6), // Last 6 months
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in ML dashboard API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ML analytics dashboard' },
      { status: 500 }
    );
  }
}
