/**
 * Phase 16: Usage Analytics Pipeline
 * Analyze usage patterns, trends, and predictions
 */

import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UsagePattern {
  userId: string;
  pattern: 'morning_person' | 'night_owl' | 'steady' | 'burst' | 'weekend_warrior';
  confidence: number;
  peakHours: number[];
  avgSessionLength: number;
  sessionsPerWeek: number;
}

export interface UsageTrend {
  period: string;
  tokensUsed: number;
  requestsMade: number;
  cost: number;
  growthRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface UsagePrediction {
  userId: string;
  predictedTokens: number;
  predictedCost: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
  predictionDate: string;
  factors: string[];
}

export interface CohortData {
  cohort: string;
  period: string;
  userCount: number;
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  avgUsage: {
    tokens: number;
    requests: number;
    cost: number;
  };
}

export interface UsageAnalytics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  totalUsage: {
    tokens: number;
    requests: number;
    cost: number;
  };
  avgPerUser: {
    tokens: number;
    requests: number;
    cost: number;
  };
  trends: {
    tokensGrowth: number;
    usersGrowth: number;
    revenueGrowth: number;
  };
  peakUsage: {
    hour: number;
    dayOfWeek: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class UsageAnalyticsService {
  // ═══════════════════════════════════════════════════════════════════════════
  // OVERALL ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get comprehensive usage analytics
   */
  async getUsageAnalytics(periodDays: number = 30): Promise<UsageAnalytics> {
    const supabase = createClient();
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get all usage data for period
    const { data: usageData } = await supabase
      .from('ai_usage_logs')
      .select('user_id, total_tokens, cost_usd, created_at')
      .gte('created_at', periodStart.toISOString());

    // Get unique users
    const uniqueUsers = new Set(usageData?.map((u) => u.user_id) || []);

    // Calculate totals
    const totalTokens = usageData?.reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0;
    const totalRequests = usageData?.length || 0;
    const totalCost = usageData?.reduce((sum, u) => sum + (u.cost_usd || 0), 0) || 0;

    // Calculate active users (DAU, WAU, MAU)
    const nowTs = now.getTime();
    const dayAgo = nowTs - 24 * 60 * 60 * 1000;
    const weekAgo = nowTs - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = nowTs - 30 * 24 * 60 * 60 * 1000;

    const dailyActiveUsers = new Set(
      usageData
        ?.filter((u) => new Date(u.created_at).getTime() > dayAgo)
        .map((u) => u.user_id) || []
    );

    const weeklyActiveUsers = new Set(
      usageData
        ?.filter((u) => new Date(u.created_at).getTime() > weekAgo)
        .map((u) => u.user_id) || []
    );

    const monthlyActiveUsers = uniqueUsers;

    // Calculate peak usage hour
    const hourCounts: Record<number, number> = {};
    usageData?.forEach((u) => {
      const hour = new Date(u.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).reduce(
      (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
      { hour: 0, count: 0 }
    ).hour;

    // Calculate peak day of week
    const dayCounts: Record<number, number> = {};
    usageData?.forEach((u) => {
      const day = new Date(u.created_at).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const peakDay = Object.entries(dayCounts).reduce(
      (max, [day, count]) => (count > max.count ? { day: parseInt(day), count } : max),
      { day: 0, count: 0 }
    ).day;

    // Calculate growth rates (compare to previous period)
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const { data: previousData } = await supabase
      .from('ai_usage_logs')
      .select('total_tokens, cost_usd')
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', periodStart.toISOString());

    const prevTokens = previousData?.reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 1;
    const prevCost = previousData?.reduce((sum, u) => sum + (u.cost_usd || 0), 0) || 1;

    const tokensGrowth = ((totalTokens - prevTokens) / prevTokens) * 100;
    const revenueGrowth = ((totalCost - prevCost) / prevCost) * 100;

    const userCount = uniqueUsers.size || 1;

    return {
      totalUsers: userCount,
      activeUsers: {
        daily: dailyActiveUsers.size,
        weekly: weeklyActiveUsers.size,
        monthly: monthlyActiveUsers.size,
      },
      totalUsage: {
        tokens: totalTokens,
        requests: totalRequests,
        cost: totalCost,
      },
      avgPerUser: {
        tokens: totalTokens / userCount,
        requests: totalRequests / userCount,
        cost: totalCost / userCount,
      },
      trends: {
        tokensGrowth: Math.round(tokensGrowth * 100) / 100,
        usersGrowth: 0, // Would need historical user counts
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      peakUsage: {
        hour: peakHour,
        dayOfWeek: peakDay,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze usage pattern for a user
   */
  async analyzeUsagePattern(userId: string): Promise<UsagePattern> {
    const supabase = createClient();

    // Get user's usage data (last 30 days)
    const now = new Date();
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: usageData } = await supabase
      .from('ai_usage_logs')
      .select('created_at, total_tokens')
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString())
      .order('created_at', { ascending: true });

    if (!usageData || usageData.length === 0) {
      return {
        userId,
        pattern: 'steady',
        confidence: 0,
        peakHours: [],
        avgSessionLength: 0,
        sessionsPerWeek: 0,
      };
    }

    // Analyze hour distribution
    const hourUsage: Record<number, number> = {};
    const dayUsage: Record<number, number> = {};
    const sessions: { start: number; tokens: number }[] = [];

    let lastRequest: number | null = null;
    const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

    for (const usage of usageData) {
      const date = new Date(usage.created_at);
      const hour = date.getHours();
      const day = date.getDay();
      const ts = date.getTime();

      hourUsage[hour] = (hourUsage[hour] || 0) + (usage.total_tokens || 0);
      dayUsage[day] = (dayUsage[day] || 0) + (usage.total_tokens || 0);

      // Detect sessions
      if (lastRequest === null || ts - lastRequest > SESSION_GAP_MS) {
        sessions.push({ start: ts, tokens: usage.total_tokens || 0 });
      } else if (sessions.length > 0) {
        sessions[sessions.length - 1].tokens += usage.total_tokens || 0;
      }

      lastRequest = ts;
    }

    // Determine pattern
    const morningTokens = [6, 7, 8, 9, 10, 11].reduce((sum, h) => sum + (hourUsage[h] || 0), 0);
    const nightTokens = [20, 21, 22, 23, 0, 1, 2, 3, 4, 5].reduce((sum, h) => sum + (hourUsage[h] || 0), 0);
    const weekdayTokens = [1, 2, 3, 4, 5].reduce((sum, d) => sum + (dayUsage[d] || 0), 0);
    const weekendTokens = [0, 6].reduce((sum, d) => sum + (dayUsage[d] || 0), 0);

    let pattern: UsagePattern['pattern'] = 'steady';
    let confidence = 0;

    const totalTokens = Object.values(hourUsage).reduce((sum, t) => sum + t, 0);

    if (totalTokens === 0) {
      return {
        userId,
        pattern: 'steady',
        confidence: 0,
        peakHours: [],
        avgSessionLength: 0,
        sessionsPerWeek: 0,
      };
    }

    // Determine primary pattern
    const morningRatio = morningTokens / totalTokens;
    const nightRatio = nightTokens / totalTokens;
    const weekdayRatio = weekdayTokens / totalTokens;

    if (morningRatio > 0.6) {
      pattern = 'morning_person';
      confidence = morningRatio;
    } else if (nightRatio > 0.6) {
      pattern = 'night_owl';
      confidence = nightRatio;
    } else if (weekdayRatio > 0.8) {
      pattern = 'steady';
      confidence = weekdayRatio;
    } else if (weekendTokens > weekdayTokens) {
      pattern = 'weekend_warrior';
      confidence = weekendTokens / totalTokens;
    }

    // Check for burst pattern (high variance in daily usage)
    const dailyTotals: Record<string, number> = {};
    for (const usage of usageData) {
      const dayKey = new Date(usage.created_at).toISOString().split('T')[0];
      dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + (usage.total_tokens || 0);
    }

    const dailyValues = Object.values(dailyTotals);
    if (dailyValues.length > 1) {
      const avgDaily = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
      const variance = dailyValues.reduce((sum, v) => sum + Math.pow(v - avgDaily, 2), 0) / dailyValues.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avgDaily; // Coefficient of variation

      if (cv > 1.5) {
        pattern = 'burst';
        confidence = Math.min(1, cv / 2);
      }
    }

    // Find peak hours (top 3)
    const peakHours = Object.entries(hourUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate session metrics
    const avgSessionLength = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.tokens, 0) / sessions.length
      : 0;

    const daysTracked = 30;
    const sessionsPerWeek = (sessions.length / daysTracked) * 7;

    return {
      userId,
      pattern,
      confidence: Math.round(confidence * 100) / 100,
      peakHours,
      avgSessionLength: Math.round(avgSessionLength),
      sessionsPerWeek: Math.round(sessionsPerWeek * 10) / 10,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE TRENDS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get usage trends for a user
   */
  async getUsageTrends(userId: string, periods: number = 6): Promise<UsageTrend[]> {
    const supabase = createClient();
    const trends: UsageTrend[] = [];

    const now = new Date();
    const periodDays = 7; // Weekly periods

    for (let i = 0; i < periods; i++) {
      const periodEnd = new Date(now.getTime() - i * periodDays * 24 * 60 * 60 * 1000);
      const periodStart = new Date(periodEnd.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const { data: usageData } = await supabase
        .from('ai_usage_logs')
        .select('total_tokens, cost_usd')
        .eq('user_id', userId)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      const tokensUsed = usageData?.reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0;
      const requestsMade = usageData?.length || 0;
      const cost = usageData?.reduce((sum, u) => sum + (u.cost_usd || 0), 0) || 0;

      // Calculate growth rate from previous period
      let growthRate = 0;
      if (i < periods - 1 && trends.length > 0) {
        const prevTokens = trends[trends.length - 1].tokensUsed;
        if (prevTokens > 0) {
          growthRate = ((tokensUsed - prevTokens) / prevTokens) * 100;
        }
      }

      // Determine trend direction
      let trend: UsageTrend['trend'] = 'stable';
      if (growthRate > 10) trend = 'increasing';
      else if (growthRate < -10) trend = 'decreasing';

      trends.push({
        period: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
        tokensUsed,
        requestsMade,
        cost,
        growthRate: Math.round(growthRate * 100) / 100,
        trend,
      });
    }

    return trends.reverse(); // Oldest to newest
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE PREDICTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Predict future usage for a user
   */
  async predictUsage(userId: string, daysAhead: number = 30): Promise<UsagePrediction> {
    const trends = await this.getUsageTrends(userId, 4); // Last 4 weeks

    if (trends.length < 2) {
      return {
        userId,
        predictedTokens: 0,
        predictedCost: 0,
        confidenceInterval: { low: 0, high: 0 },
        predictionDate: new Date().toISOString(),
        factors: ['Insufficient historical data'],
      };
    }

    // Calculate weekly growth rate
    const recentTrends = trends.slice(-3);
    const avgWeeklyGrowth = recentTrends.reduce((sum, t) => sum + t.growthRate, 0) / recentTrends.length;

    // Get current weekly usage
    const currentWeeklyTokens = trends[trends.length - 1]?.tokensUsed || 0;
    const currentWeeklyCost = trends[trends.length - 1]?.cost || 0;

    // Predict future usage (simple linear projection)
    const weeksAhead = daysAhead / 7;
    const projectedGrowth = Math.pow(1 + avgWeeklyGrowth / 100, weeksAhead);

    const predictedTokens = Math.round(currentWeeklyTokens * projectedGrowth * weeksAhead);
    const predictedCost = currentWeeklyCost * projectedGrowth * weeksAhead;

    // Calculate confidence interval based on variance
    const growthVariance = recentTrends.reduce(
      (sum, t) => sum + Math.pow(t.growthRate - avgWeeklyGrowth, 2),
      0
    ) / recentTrends.length;

    const confidenceFactor = Math.min(1, 1 / (1 + growthVariance / 100));
    const margin = 0.2 * (1 - confidenceFactor); // 20% margin reduced by confidence

    const factors: string[] = [];

    if (avgWeeklyGrowth > 10) {
      factors.push('Strong upward trend');
    } else if (avgWeeklyGrowth < -10) {
      factors.push('Declining usage trend');
    } else {
      factors.push('Stable usage pattern');
    }

    if (confidenceFactor > 0.8) {
      factors.push('Consistent historical data');
    } else {
      factors.push('Variable historical data');
    }

    return {
      userId,
      predictedTokens,
      predictedCost: Math.round(predictedCost * 100) / 100,
      confidenceInterval: {
        low: Math.round(predictedTokens * (1 - margin)),
        high: Math.round(predictedTokens * (1 + margin)),
      },
      predictionDate: new Date().toISOString(),
      factors,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COHORT ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Perform cohort analysis
   */
  async getCohortAnalysis(cohortType: 'signup_month' | 'plan_upgrade'): Promise<CohortData[]> {
    const supabase = createClient();
    const cohorts: CohortData[] = [];

    if (cohortType === 'signup_month') {
      // Get users grouped by signup month
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, created_at, plan_type')
        .order('created_at', { ascending: false });

      if (!subscriptions) return [];

      // Group by month
      const cohortMap: Record<string, string[]> = {};
      for (const sub of subscriptions) {
        const monthKey = new Date(sub.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!cohortMap[monthKey]) {
          cohortMap[monthKey] = [];
        }
        cohortMap[monthKey].push(sub.user_id);
      }

      // Analyze each cohort
      for (const [cohort, userIds] of Object.entries(cohortMap)) {
        const cohortDate = new Date(cohort + '-01');
        const now = new Date();
        const monthsSinceCohort = Math.floor(
          (now.getTime() - cohortDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
        );

        // Calculate retention
        const { data: usageData } = await supabase
          .from('ai_usage_logs')
          .select('user_id, created_at, total_tokens, cost_usd')
          .in('user_id', userIds);

        const activeUsers: { day1: Set<string>; day7: Set<string>; day30: Set<string> } = {
          day1: new Set(),
          day7: new Set(),
          day30: new Set(),
        };

        const day1Ago = cohortDate.getTime() + 24 * 60 * 60 * 1000;
        const day7Ago = cohortDate.getTime() + 7 * 24 * 60 * 60 * 1000;
        const day30Ago = cohortDate.getTime() + 30 * 24 * 60 * 60 * 1000;

        for (const usage of usageData || []) {
          const usageTs = new Date(usage.created_at).getTime();
          if (usageTs <= day1Ago) activeUsers.day1.add(usage.user_id);
          if (usageTs <= day7Ago) activeUsers.day7.add(usage.user_id);
          if (usageTs <= day30Ago) activeUsers.day30.add(usage.user_id);
        }

        const totalUsage = usageData?.reduce(
          (acc, u) => ({
            tokens: acc.tokens + (u.total_tokens || 0),
            requests: acc.requests + 1,
            cost: acc.cost + (u.cost_usd || 0),
          }),
          { tokens: 0, requests: 0, cost: 0 }
        ) || { tokens: 0, requests: 0, cost: 0 };

        cohorts.push({
          cohort,
          period: 'monthly',
          userCount: userIds.length,
          retention: {
            day1: userIds.length > 0 ? activeUsers.day1.size / userIds.length : 0,
            day7: userIds.length > 0 ? activeUsers.day7.size / userIds.length : 0,
            day30: userIds.length > 0 ? activeUsers.day30.size / userIds.length : 0,
          },
          avgUsage: {
            tokens: Math.round(totalUsage.tokens / userIds.length),
            requests: Math.round(totalUsage.requests / userIds.length),
            cost: Math.round((totalUsage.cost / userIds.length) * 100) / 100,
          },
        });
      }
    }

    return cohorts.sort((a, b) => b.cohort.localeCompare(a.cohort));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let usageAnalyticsInstance: UsageAnalyticsService | null = null;

export function getUsageAnalyticsService(): UsageAnalyticsService {
  if (!usageAnalyticsInstance) {
    usageAnalyticsInstance = new UsageAnalyticsService();
  }
  return usageAnalyticsInstance;
}
