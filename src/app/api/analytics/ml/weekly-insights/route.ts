/**
 * Phase 16: Auto-Generated Weekly Operator Insights
 * Produces a narrative summary of the platform's health for the past 7 days
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { getUserSegmentationService } from '@/lib/analytics/user-segmentation';
import { getUsageAnalyticsService } from '@/lib/analytics/usage-analytics';
import { getCostOptimizationService } from '@/lib/analytics/cost-optimization';
import { getFeatureUsageService } from '@/lib/analytics/feature-usage';

export const dynamic = 'force-dynamic';

interface Insight {
  category: 'growth' | 'retention' | 'cost' | 'features' | 'risk';
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  title: string;
  detail: string;
  action?: string;
}

function generateInsights(params: {
  usersGrowth: number;
  tokensGrowth: number;
  revenueGrowth: number;
  atRiskCount: number;
  totalUsers: number;
  criticalChurnUsers: number;
  totalCost: number;
  avgCostPerUser: number;
  topFeature: string;
  dormantCount: number;
  healthScore: number;
}): Insight[] {
  const insights: Insight[] = [];
  const {
    usersGrowth,
    tokensGrowth,
    revenueGrowth,
    atRiskCount,
    totalUsers,
    criticalChurnUsers,
    totalCost,
    avgCostPerUser,
    topFeature,
    dormantCount,
    healthScore,
  } = params;

  // Growth insights
  if (usersGrowth > 10) {
    insights.push({
      category: 'growth',
      severity: 'positive',
      title: 'Strong user growth',
      detail: `Active users grew ${usersGrowth.toFixed(1)}% this week. Momentum is strong.`,
    });
  } else if (usersGrowth < -5) {
    insights.push({
      category: 'growth',
      severity: 'warning',
      title: 'User growth declined',
      detail: `Active users dropped ${Math.abs(usersGrowth).toFixed(1)}% this week.`,
      action: 'Review recent product changes and check user-reported issues.',
    });
  }

  // Revenue insights
  if (revenueGrowth > 5) {
    insights.push({
      category: 'growth',
      severity: 'positive',
      title: 'Revenue trending up',
      detail: `Revenue grew ${revenueGrowth.toFixed(1)}% vs last period.`,
    });
  } else if (revenueGrowth < -10) {
    insights.push({
      category: 'retention',
      severity: 'critical',
      title: 'Revenue decline detected',
      detail: `Revenue dropped ${Math.abs(revenueGrowth).toFixed(1)}%. Investigate churn and downgrade activity.`,
      action: 'Run churn risk analysis immediately and activate re-engagement campaigns.',
    });
  }

  // Retention / churn
  const churnRate = totalUsers > 0 ? (atRiskCount / totalUsers) * 100 : 0;
  if (churnRate > 20) {
    insights.push({
      category: 'retention',
      severity: 'critical',
      title: `${churnRate.toFixed(0)}% of users at churn risk`,
      detail: `${atRiskCount} users show declining engagement. ${criticalChurnUsers} are in critical state.`,
      action: 'Trigger automated re-engagement campaign for at-risk segment.',
    });
  } else if (churnRate > 10) {
    insights.push({
      category: 'retention',
      severity: 'warning',
      title: 'Elevated churn risk',
      detail: `${atRiskCount} users (${churnRate.toFixed(1)}%) are at risk.`,
      action: 'Review at-risk user list and prioritize high-value accounts.',
    });
  }

  // Dormant users
  if (dormantCount > 0 && totalUsers > 0) {
    const dormantPct = (dormantCount / totalUsers) * 100;
    if (dormantPct > 15) {
      insights.push({
        category: 'retention',
        severity: 'warning',
        title: `${dormantPct.toFixed(0)}% dormant users`,
        detail: `${dormantCount} users have not been active recently.`,
        action: 'Schedule a win-back email sequence for dormant accounts.',
      });
    }
  }

  // Cost insights
  if (tokensGrowth > 30) {
    insights.push({
      category: 'cost',
      severity: 'warning',
      title: 'Token usage spike',
      detail: `AI token consumption increased ${tokensGrowth.toFixed(1)}% this week. Monitor costs.`,
      action: 'Review token budget per user and check for unusual activity.',
    });
  }

  if (avgCostPerUser > 5) {
    insights.push({
      category: 'cost',
      severity: 'warning',
      title: 'High per-user cost',
      detail: `Average AI cost per user is $${avgCostPerUser.toFixed(2)}. Review pricing margins.`,
      action: 'Run cost optimization analysis and consider routing cheaper tasks to Groq/Ollama.',
    });
  }

  // Feature insights
  if (topFeature) {
    insights.push({
      category: 'features',
      severity: 'positive',
      title: `Top feature: ${topFeature}`,
      detail: `"${topFeature}" is the most-used feature this week. Consider investment here.`,
    });
  }

  // Health score
  if (healthScore >= 70) {
    insights.push({
      category: 'growth',
      severity: 'positive',
      title: 'Platform health is strong',
      detail: `Overall health score: ${healthScore.toFixed(0)}/100. Champions and loyal users dominate.`,
    });
  } else if (healthScore < 40) {
    insights.push({
      category: 'risk',
      severity: 'critical',
      title: 'Low platform health score',
      detail: `Health score is ${healthScore.toFixed(0)}/100. Too many at-risk or dormant users.`,
      action: 'Prioritize retention and re-engagement above acquisition this week.',
    });
  }

  return insights;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return null;
  return user;
}

export async function GET(_request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const segService = getUserSegmentationService();
    const usageService = getUsageAnalyticsService();
    const costService = getCostOptimizationService();
    const featureService = getFeatureUsageService();

    const [bulkSegments, usage7d, providerCosts, featureMetrics] = await Promise.all([
      segService.getBulkSegmentation(),
      usageService.getUsageAnalytics(7),
      costService.analyzeProviderCosts(7),
      featureService.getFeatureMetrics(7),
    ]);

    const totalUsers = Object.keys(bulkSegments).length;

    // Segment counts
    let atRiskCount = 0;
    let dormantCount = 0;
    let criticalChurnCount = 0;
    let championCount = 0;

    for (const entry of Object.values(bulkSegments)) {
      if (entry.segment === 'at_risk') atRiskCount++;
      if (entry.segment === 'dormant') dormantCount++;
      if (entry.churnScore >= 0.8) criticalChurnCount++;
      if (entry.segment === 'champion') championCount++;
    }

    const healthScore = totalUsers > 0
      ? Math.min(100, (championCount * 100 + (totalUsers - atRiskCount - dormantCount) * 60) / totalUsers)
      : 0;

    const totalCost = providerCosts.reduce((s, p) => s + p.totalCost, 0);
    const avgCostPerUser = totalUsers > 0 ? totalCost / totalUsers : 0;

    const topFeature = featureMetrics.mostPopularFeature ?? '';

    const insights = generateInsights({
      usersGrowth: usage7d.trends?.usersGrowth ?? 0,
      tokensGrowth: usage7d.trends?.tokensGrowth ?? 0,
      revenueGrowth: usage7d.trends?.revenueGrowth ?? 0,
      atRiskCount,
      totalUsers,
      criticalChurnUsers: criticalChurnCount,
      totalCost,
      avgCostPerUser,
      topFeature,
      dormantCount,
      healthScore,
    });

    // Sort: critical first, then warning, then positive
    const SEVERITY_ORDER = { critical: 0, warning: 1, neutral: 2, positive: 3 };
    insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

    return NextResponse.json({
      success: true,
      data: {
        weekEnding: new Date().toISOString(),
        periodDays: 7,
        summary: {
          totalUsers,
          healthScore: Math.round(healthScore * 10) / 10,
          atRiskCount,
          dormantCount,
          criticalChurnCount,
          championCount,
          totalCost: Math.round(totalCost * 100) / 100,
          avgCostPerUser: Math.round(avgCostPerUser * 100) / 100,
          tokensTrend: usage7d.trends?.tokensGrowth ?? 0,
          revenueTrend: usage7d.trends?.revenueGrowth ?? 0,
          usersTrend: usage7d.trends?.usersGrowth ?? 0,
        },
        insights,
        insightCount: insights.length,
        criticalCount: insights.filter((i) => i.severity === 'critical').length,
        warningCount: insights.filter((i) => i.severity === 'warning').length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Weekly insights API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate weekly insights' },
      { status: 500 }
    );
  }
}
