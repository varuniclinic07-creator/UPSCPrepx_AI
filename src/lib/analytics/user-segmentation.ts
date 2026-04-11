/**
 * Phase 16: User Segmentation Engine
 * Segment users based on usage patterns, spending, engagement, and behavior
 */

import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserSegment =
  | 'champion'        // High value, high engagement
  | 'loyal'          // Steady usage, good retention
  | 'potential'      // Growing usage, could convert
  | 'at_risk'        // Declining usage, may churn
  | 'dormant'        // No recent activity
  | 'free_tier'      // Free users with low engagement
  | 'heavy_user'     // High usage, any plan
  | 'price_sensitive' // Low spending, cost-conscious
  | 'power_user'     // Advanced features, high tokens
  | 'casual'         // Occasional usage;

export interface UserMetrics {
  userId: string;
  plan: string;
  totalSpent: number;
  totalTokens: number;
  totalRequests: number;
  avgDailyTokens: number;
  avgDailyRequests: number;
  daysSinceLastActive: number;
  daysSinceSignup: number;
  featureUsageCount: number;
  overageCharges: number;
  paymentCount: number;
  churnScore: number; // 0-1, higher = more likely to churn
  engagementScore: number; // 0-1, higher = more engaged
  valueScore: number; // 0-1, higher = more valuable
}

export interface SegmentDefinition {
  segment: UserSegment;
  description: string;
  criteria: string[];
  recommendedActions: string[];
  estimatedSize: number;
  avgValue: number;
}

export type AdoptionStage =
  | 'new_user'    // Signed up within last 7 days
  | 'onboarding'  // 7-30 days, still exploring
  | 'active'      // 30-90 days, regular usage
  | 'mature'      // 90+ days, established patterns
  | 'at_risk'     // Declining activity
  | 'churned';    // No activity 90+ days

export interface SegmentationResult {
  userId: string;
  primarySegment: UserSegment;
  secondarySegments: UserSegment[];
  adoptionStage: AdoptionStage;
  scores: {
    engagement: number;
    value: number;
    churn: number;
  };
  metrics: UserMetrics;
  recommendedActions: string[];
}

export interface BulkSegmentEntry {
  segment: UserSegment;
  adoptionStage: AdoptionStage;
  engagementScore: number;
  valueScore: number;
  churnScore: number;
}

export interface TargetingStrategy {
  userId: string;
  segment: UserSegment;
  adoptionStage: AdoptionStage;
  recommendedActions: string[];
  priority: 'high' | 'medium' | 'low';
  nextBestAction: string;
  messagingTone: 'retention' | 'upsell' | 'education' | 'winback' | 'celebration';
}

export interface SegmentAnalytics {
  segment: UserSegment;
  userCount: number;
  percentage: number;
  avgMonthlyRevenue: number;
  avgMonthlyTokens: number;
  avgEngagementScore: number;
  avgChurnScore: number;
  conversionRate: number;
  retentionRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEGMENTATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SEGMENT_CRITERIA: Record<UserSegment, {
  minEngagement?: number;
  maxEngagement?: number;
  minValue?: number;
  maxValue?: number;
  maxChurn?: number;
  minChurn?: number;
  minDaysSinceActive?: number;
  maxDaysSinceActive?: number;
  minSpent?: number;
  maxSpent?: number;
  minTokens?: number;
  maxTokens?: number;
  plan?: string[];
  minGrowth?: number;
  minFeatureUsageCount?: number;
}> = {
  champion: {
    minEngagement: 0.8,
    minValue: 0.8,
    maxChurn: 0.3,
    minSpent: 100,
    maxDaysSinceActive: 3,
  },
  loyal: {
    minEngagement: 0.5,
    minValue: 0.5,
    maxChurn: 0.5,
    minSpent: 29,
    maxDaysSinceActive: 7,
  },
  potential: {
    minEngagement: 0.3,
    maxEngagement: 0.7,
    minGrowth: 0.1,
    maxDaysSinceActive: 5,
  },
  at_risk: {
    maxEngagement: 0.4,
    minChurn: 0.5,
    minDaysSinceActive: 7,
    maxDaysSinceActive: 30,
  },
  dormant: {
    maxDaysSinceActive: 90,
    minDaysSinceActive: 30,
  },
  free_tier: {
    plan: ['free'],
    maxSpent: 0,
    maxEngagement: 0.5,
  },
  heavy_user: {
    minTokens: 1000000, // 1M+ tokens
  },
  price_sensitive: {
    maxSpent: 30,
    maxEngagement: 0.6,
  },
  power_user: {
    minTokens: 500000,
    minFeatureUsageCount: 5,
  },
  casual: {
    maxEngagement: 0.3,
    maxDaysSinceActive: 14,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// USER SEGMENTATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class UserSegmentationService {
  // ═══════════════════════════════════════════════════════════════════════════
  // METRICS CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate comprehensive metrics for a user
   */
  async calculateUserMetrics(userId: string): Promise<UserMetrics> {
    const supabase = await createClient();

    // Get user's subscription
    const { data: subscription } = await (supabase as any)
      .from('user_subscriptions')
      .select('plan_type, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const plan = (subscription as any)?.plan_type || 'free';
    const signupDate = new Date((subscription as any)?.created_at || Date.now());

    // Get usage data from ai_usage_logs
    const { data: usageData } = await (supabase as any)
      .from('ai_usage_logs')
      .select('total_tokens, cost_usd, created_at, endpoint')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Calculate metrics
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const usageRows = (usageData as any[]) || [];
    const recentUsage = usageRows.filter((u: any) => new Date(u.created_at).getTime() > thirtyDaysAgo);

    const totalTokens = usageRows.reduce((sum: number, u: any) => sum + (u.total_tokens || 0), 0);
    const totalRequests = usageRows.length;
    const totalSpent = usageRows.reduce((sum: number, u: any) => sum + (u.cost_usd || 0), 0);

    // Calculate overage charges (simplified - would need invoice data)
    const overageCharges = 0; // Would calculate from invoices

    // Calculate payment count (simplified)
    const paymentCount = 0; // Would get from payment records

    // Calculate average daily usage
    const daysSinceSignup = Math.max(1, Math.floor((now - signupDate.getTime()) / (24 * 60 * 60 * 1000)));
    const avgDailyTokens = totalTokens / daysSinceSignup;
    const avgDailyRequests = totalRequests / daysSinceSignup;

    // Calculate days since last active
    const lastActiveDate = recentUsage.length > 0
      ? new Date(recentUsage[0].created_at)
      : signupDate;
    const daysSinceLastActive = Math.floor((now - lastActiveDate.getTime()) / (24 * 60 * 60 * 1000));

    // Count unique features/endpoints used
    const uniqueEndpoints = new Set(recentUsage.map((u: any) => u.endpoint));
    const featureUsageCount = uniqueEndpoints.size;

    // Calculate scores
    const engagementScore = this.calculateEngagementScore({
      daysSinceLastActive,
      avgDailyRequests,
      featureUsageCount,
      plan,
    });

    const valueScore = this.calculateValueScore({
      totalSpent,
      plan,
      overageCharges,
    });

    const churnScore = this.calculateChurnScore({
      daysSinceLastActive,
      engagementScore,
      plan,
      totalSpent,
    });

    return {
      userId,
      plan,
      totalSpent,
      totalTokens,
      totalRequests,
      avgDailyTokens,
      avgDailyRequests,
      daysSinceLastActive,
      daysSinceSignup,
      featureUsageCount,
      overageCharges,
      paymentCount,
      churnScore,
      engagementScore,
      valueScore,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORE CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate engagement score (0-1)
   */
  private calculateEngagementScore(metrics: {
    daysSinceLastActive: number;
    avgDailyRequests: number;
    featureUsageCount: number;
    plan: string;
  }): number {
    let score = 0;

    // Recency score (40% weight)
    const recencyScore = Math.max(0, 1 - metrics.daysSinceLastActive / 30);
    score += recencyScore * 0.4;

    // Frequency score (30% weight)
    const frequencyScore = Math.min(1, metrics.avgDailyRequests / 10);
    score += frequencyScore * 0.3;

    // Feature diversity score (20% weight)
    const featureScore = Math.min(1, metrics.featureUsageCount / 5);
    score += featureScore * 0.2;

    // Plan engagement bonus (10% weight)
    const planBonus = metrics.plan === 'free' ? 0 : metrics.plan === 'enterprise' ? 0.3 : 0.1;
    score += planBonus;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate value score (0-1)
   */
  private calculateValueScore(metrics: {
    totalSpent: number;
    plan: string;
    overageCharges: number;
  }): number {
    let score = 0;

    // Base plan value (50% weight)
    const planValues: Record<string, number> = {
      free: 0,
      basic: 0.3,
      premium: 0.6,
      enterprise: 1.0,
    };
    score += (planValues[metrics.plan] || 0) * 0.5;

    // Spending score (30% weight)
    const spendingScore = Math.min(1, metrics.totalSpent / 500);
    score += spendingScore * 0.3;

    // Overage indicator (20% weight) - shows high usage
    const overageScore = metrics.overageCharges > 0 ? 0.5 : 0;
    score += overageScore * 0.2;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate churn score (0-1, higher = more likely to churn)
   */
  private calculateChurnScore(metrics: {
    daysSinceLastActive: number;
    engagementScore: number;
    plan: string;
    totalSpent: number;
  }): number {
    let score = 0;

    // Inactivity score (40% weight)
    const inactivityScore = Math.min(1, metrics.daysSinceLastActive / 30);
    score += inactivityScore * 0.4;

    // Low engagement score (30% weight)
    const lowEngagementScore = 1 - metrics.engagementScore;
    score += lowEngagementScore * 0.3;

    // Free plan risk (20% weight)
    const freePlanRisk = metrics.plan === 'free' ? 0.3 : 0;
    score += freePlanRisk;

    // Low spending risk (10% weight)
    const lowSpendingRisk = metrics.totalSpent < 50 ? 0.2 : 0;
    score += lowSpendingRisk;

    return Math.min(1, Math.max(0, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEGMENT ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Assign primary and secondary segments to a user
   */
  assignSegments(metrics: UserMetrics): {
    primarySegment: UserSegment;
    secondarySegments: UserSegment[];
  } {
    const scores = {
      engagement: metrics.engagementScore,
      value: metrics.valueScore,
      churn: metrics.churnScore,
    };

    const segmentScores: Record<UserSegment, number> = {
      champion: 0,
      loyal: 0,
      potential: 0,
      at_risk: 0,
      dormant: 0,
      free_tier: 0,
      heavy_user: 0,
      price_sensitive: 0,
      power_user: 0,
      casual: 0,
    };

    // Calculate fit score for each segment
    for (const [segment, criteria] of Object.entries(SEGMENT_CRITERIA)) {
      const seg = segment as UserSegment;
      let fitScore = 0;
      let criteriaCount = 0;

      // Check each criterion
      if (criteria.minEngagement !== undefined) {
        criteriaCount++;
        if (scores.engagement >= criteria.minEngagement) fitScore++;
      }
      if (criteria.maxEngagement !== undefined) {
        criteriaCount++;
        if (scores.engagement <= criteria.maxEngagement) fitScore++;
      }
      if (criteria.minValue !== undefined) {
        criteriaCount++;
        if (scores.value >= criteria.minValue) fitScore++;
      }
      if (criteria.maxValue !== undefined) {
        criteriaCount++;
        if (scores.value <= criteria.maxValue) fitScore++;
      }
      if (criteria.minChurn !== undefined) {
        criteriaCount++;
        if (scores.churn >= criteria.minChurn) fitScore++;
      }
      if (criteria.maxChurn !== undefined) {
        criteriaCount++;
        if (scores.churn <= criteria.maxChurn) fitScore++;
      }
      if (criteria.minDaysSinceActive !== undefined) {
        criteriaCount++;
        if (metrics.daysSinceLastActive >= criteria.minDaysSinceActive) fitScore++;
      }
      if (criteria.maxDaysSinceActive !== undefined) {
        criteriaCount++;
        if (metrics.daysSinceLastActive <= criteria.maxDaysSinceActive) fitScore++;
      }
      if (criteria.minSpent !== undefined) {
        criteriaCount++;
        if (metrics.totalSpent >= criteria.minSpent) fitScore++;
      }
      if (criteria.maxSpent !== undefined) {
        criteriaCount++;
        if (metrics.totalSpent <= criteria.maxSpent) fitScore++;
      }
      if (criteria.minTokens !== undefined) {
        criteriaCount++;
        if (metrics.totalTokens >= criteria.minTokens) fitScore++;
      }
      if (criteria.plan !== undefined) {
        criteriaCount++;
        if (criteria.plan.includes(metrics.plan)) fitScore++;
      }

      segmentScores[seg] = criteriaCount > 0 ? fitScore / criteriaCount : 0;
    }

    // Sort segments by fit score
    const sortedSegments = (Object.keys(segmentScores) as UserSegment[]).sort(
      (a, b) => segmentScores[b] - segmentScores[a]
    );

    // Primary segment is the best fit
    const primarySegment = sortedSegments[0];

    // Secondary segments are those with fit score > 0.5
    const secondarySegments = sortedSegments
      .slice(1)
      .filter((s) => segmentScores[s] >= 0.5);

    return {
      primarySegment,
      secondarySegments,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDED ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get recommended actions for a segment
   */
  getRecommendedActions(segment: UserSegment): string[] {
    const actions: Record<UserSegment, string[]> = {
      champion: [
        'Offer loyalty rewards or referral bonuses',
        'Request testimonials and case studies',
        'Invite to beta programs and new features',
        'Provide dedicated support channel',
      ],
      loyal: [
        'Offer upgrade incentives to premium tiers',
        'Share advanced feature tutorials',
        'Send usage insights and tips',
        'Consider for upsell campaigns',
      ],
      potential: [
        'Send educational content about advanced features',
        'Offer limited-time upgrade discounts',
        'Highlight success stories from similar users',
        'Provide personalized onboarding',
      ],
      at_risk: [
        'Send re-engagement email campaign',
        'Offer win-back discount',
        'Request feedback on pain points',
        'Schedule check-in call for high-value users',
      ],
      dormant: [
        'Send "We miss you" campaign',
        'Offer significant reactivation discount',
        'Survey to understand why they left',
        'Consider removing from active marketing',
      ],
      'free_tier': [
        'Show value of paid features',
        'Offer free trial of premium',
        'Highlight usage limits approaching',
        'Share success stories from paid users',
      ],
      heavy_user: [
        'Proactively check for issues',
        'Offer enterprise plan if on lower tier',
        'Provide usage optimization tips',
        'Consider custom pricing discussion',
      ],
      price_sensitive: [
        'Highlight cost-effective features',
        'Offer yearly plan discount',
        'Show ROI calculations',
        'Provide budget-friendly tips',
      ],
      power_user: [
        'Offer early access to new features',
        'Request product feedback',
        'Provide advanced documentation',
        'Consider for advisory board',
      ],
      casual: [
        'Send onboarding refresher',
        'Highlight quick-win features',
        'Offer usage tips and templates',
        'Consider re-engagement campaign',
      ],
    };

    return actions[segment] || [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL SEGMENTATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get complete segmentation for a user
   */
  private getAdoptionStage(metrics: UserMetrics): AdoptionStage {
    if (metrics.daysSinceLastActive >= 90) return 'churned';
    if (metrics.daysSinceLastActive >= 14 && metrics.churnScore > 0.5) return 'at_risk';
    if (metrics.daysSinceSignup <= 7) return 'new_user';
    if (metrics.daysSinceSignup <= 30) return 'onboarding';
    if (metrics.daysSinceSignup <= 90) return 'active';
    return 'mature';
  }

  async segmentUser(userId: string): Promise<SegmentationResult> {
    const metrics = await this.calculateUserMetrics(userId);
    const { primarySegment, secondarySegments } = this.assignSegments(metrics);
    const adoptionStage = this.getAdoptionStage(metrics);

    return {
      userId,
      primarySegment,
      secondarySegments,
      adoptionStage,
      scores: {
        engagement: metrics.engagementScore,
        value: metrics.valueScore,
        churn: metrics.churnScore,
      },
      metrics,
      recommendedActions: [
        ...this.getRecommendedActions(primarySegment),
        ...secondarySegments.flatMap((s) => this.getRecommendedActions(s)),
      ].slice(0, 5), // Top 5 actions
    };
  }

  /**
   * Get segmentation for a single user (simplified result)
   */
  async getUserSegment(userId: string): Promise<{
    segment: UserSegment;
    adoptionStage: AdoptionStage;
    engagementScore: number;
    valueScore: number;
    churnScore: number;
  }> {
    const result = await this.segmentUser(userId);
    return {
      segment: result.primarySegment,
      adoptionStage: result.adoptionStage,
      engagementScore: result.scores.engagement,
      valueScore: result.scores.value,
      churnScore: result.scores.churn,
    };
  }

  /**
   * Get targeting strategy for a user
   */
  async getTargetingStrategy(userId: string): Promise<TargetingStrategy> {
    const result = await this.segmentUser(userId);
    const seg = result.primarySegment;

    const TONE_MAP: Record<UserSegment, TargetingStrategy['messagingTone']> = {
      champion: 'celebration',
      loyal: 'upsell',
      potential: 'upsell',
      at_risk: 'retention',
      dormant: 'winback',
      free_tier: 'education',
      heavy_user: 'upsell',
      price_sensitive: 'education',
      power_user: 'celebration',
      casual: 'education',
    };

    const PRIORITY_MAP: Record<UserSegment, TargetingStrategy['priority']> = {
      champion: 'high',
      loyal: 'medium',
      potential: 'high',
      at_risk: 'high',
      dormant: 'medium',
      free_tier: 'low',
      heavy_user: 'high',
      price_sensitive: 'low',
      power_user: 'medium',
      casual: 'low',
    };

    const actions = result.recommendedActions;
    return {
      userId,
      segment: seg,
      adoptionStage: result.adoptionStage,
      recommendedActions: actions,
      priority: PRIORITY_MAP[seg] ?? 'low',
      nextBestAction: actions[0] ?? 'Monitor engagement',
      messagingTone: TONE_MAP[seg] ?? 'education',
    };
  }

  /**
   * Get bulk segmentation map: userId → BulkSegmentEntry
   * Used by dashboard and admin analytics routes
   */
  async getBulkSegmentation(): Promise<Record<string, BulkSegmentEntry>> {
    const supabase = await createClient();

    const { data: subscriptions } = await (supabase as any)
      .from('user_subscriptions')
      .select('user_id')
      .eq('status', 'active');

    if (!subscriptions || subscriptions.length === 0) return {};

    const result: Record<string, BulkSegmentEntry> = {};

    for (const sub of subscriptions as { user_id: string }[]) {
      try {
        const seg = await this.segmentUser(sub.user_id);
        result[sub.user_id] = {
          segment: seg.primarySegment,
          adoptionStage: seg.adoptionStage,
          engagementScore: seg.scores.engagement,
          valueScore: seg.scores.value,
          churnScore: seg.scores.churn,
        };
      } catch {
        // Skip users that fail
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK SEGMENTATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Segment all users and return analytics
   */
  async segmentAllUsers(): Promise<{
    segmentations: SegmentationResult[];
    analytics: SegmentAnalytics[];
  }> {
    const supabase = await createClient();

    // Get all users with subscriptions
    const { data: subscriptions } = await (supabase as any)
      .from('user_subscriptions')
      .select('user_id')
      .eq('status', 'active');

    if (!subscriptions || subscriptions.length === 0) {
      return { segmentations: [], analytics: [] };
    }

    // Segment each user
    const segmentations: SegmentationResult[] = [];

    for (const sub of subscriptions) {
      try {
        const segmentation = await this.segmentUser(sub.user_id);
        segmentations.push(segmentation);
      } catch (error) {
        console.error(`Failed to segment user ${sub.user_id}:`, error);
      }
    }

    // Calculate segment analytics
    const segmentCounts: Record<string, number> = {};
    const segmentMetrics: Record<string, {
      revenue: number;
      tokens: number;
      engagement: number;
      churn: number;
    }> = {};

    for (const seg of segmentations) {
      const primary = seg.primarySegment;

      if (!segmentCounts[primary]) {
        segmentCounts[primary] = 0;
        segmentMetrics[primary] = { revenue: 0, tokens: 0, engagement: 0, churn: 0 };
      }

      segmentCounts[primary]++;
      segmentMetrics[primary].revenue += seg.metrics.totalSpent;
      segmentMetrics[primary].tokens += seg.metrics.totalTokens;
      segmentMetrics[primary].engagement += seg.scores.engagement;
      segmentMetrics[primary].churn += seg.scores.churn;
    }

    const totalUsers = segmentations.length;

    const analytics: SegmentAnalytics[] = (Object.keys(segmentCounts) as UserSegment[]).map(
      (segment) => {
        const count = segmentCounts[segment];
        const metrics = segmentMetrics[segment];

        return {
          segment,
          userCount: count,
          percentage: (count / totalUsers) * 100,
          avgMonthlyRevenue: metrics.revenue / count,
          avgMonthlyTokens: metrics.tokens / count,
          avgEngagementScore: metrics.engagement / count,
          avgChurnScore: metrics.churn / count,
          conversionRate: 0, // Would calculate from historical data
          retentionRate: 1 - metrics.churn / count,
        };
      }
    );

    return {
      segmentations,
      analytics: analytics.sort((a, b) => b.userCount - a.userCount),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEGMENT DEFINITIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all segment definitions with descriptions
   */
  getSegmentDefinitions(): SegmentDefinition[] {
    return [
      {
        segment: 'champion',
        description: 'High-value users with strong engagement and low churn risk',
        criteria: ['Engagement > 0.8', 'Value > 0.8', 'Churn < 0.3', 'Spent > $100'],
        recommendedActions: ['Loyalty rewards', 'Referral programs', 'Beta access'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'loyal',
        description: 'Steady users with good retention and consistent usage',
        criteria: ['Engagement > 0.5', 'Value > 0.5', 'Active within 7 days'],
        recommendedActions: ['Upsell campaigns', 'Advanced tutorials'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'potential',
        description: 'Growing users who could convert to paid or higher tiers',
        criteria: ['Engagement 0.3-0.7', 'Active within 5 days'],
        recommendedActions: ['Educational content', 'Upgrade incentives'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'at_risk',
        description: 'Users showing signs of disengagement, may churn soon',
        criteria: ['Engagement < 0.4', 'Churn > 0.5', 'Inactive 7-30 days'],
        recommendedActions: ['Re-engagement emails', 'Win-back offers'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'dormant',
        description: 'Users who have not been active for extended period',
        criteria: ['Inactive 30-90 days'],
        recommendedActions: ['Reactivation campaign', 'Survey'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'free_tier',
        description: 'Free plan users with limited engagement',
        criteria: ['Free plan', 'Spent = $0', 'Engagement < 0.5'],
        recommendedActions: ['Free trial offers', 'Value demonstration'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'heavy_user',
        description: 'Users with very high token consumption',
        criteria: ['Tokens > 1M'],
        recommendedActions: ['Enterprise outreach', 'Usage optimization'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'price_sensitive',
        description: 'Users focused on cost, low spending',
        criteria: ['Spent < $30', 'Engagement < 0.6'],
        recommendedActions: ['Yearly discounts', 'ROI demonstrations'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'power_user',
        description: 'Advanced users utilizing multiple features',
        criteria: ['Tokens > 500K', 'Features > 5'],
        recommendedActions: ['Beta access', 'Feedback requests'],
        estimatedSize: 0,
        avgValue: 0,
      },
      {
        segment: 'casual',
        description: 'Occasional users with low engagement',
        criteria: ['Engagement < 0.3', 'Active within 14 days'],
        recommendedActions: ['Onboarding refresh', 'Quick-win features'],
        estimatedSize: 0,
        avgValue: 0,
      },
    ];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let segmentationServiceInstance: UserSegmentationService | null = null;

export function getUserSegmentationService(): UserSegmentationService {
  if (!segmentationServiceInstance) {
    segmentationServiceInstance = new UserSegmentationService();
  }
  return segmentationServiceInstance;
}
