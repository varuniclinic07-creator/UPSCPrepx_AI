/**
 * Phase 16: Feature Usage Tracking
 * Track and analyze feature adoption, engagement, and usage patterns
 */

import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FeatureUsage {
  featureId: string;
  featureName: string;
  category: FeatureCategory;
  totalUses: number;
  uniqueUsers: number;
  avgUsesPerUser: number;
  growthRate: number;
  adoptionRate: number;
  avgSessionDuration: number;
  successRate: number;
}

export interface FeatureAdoption {
  userId: string;
  adoptedFeatures: string[];
  adoptionRate: number;
  powerFeatures: string[];
  unusedFeatures: string[];
  adoptionStage: 'new' | 'exploring' | 'adopting' | 'power_user' | 'champion';
}

export interface FeatureTrend {
  featureId: string;
  period: string;
  uses: number;
  uniqueUsers: number;
  growthRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface UserJourney {
  userId: string;
  firstFeature: string;
  featuresUsed: string[];
  journeyPath: string[];
  timeToFirstValue: number; // seconds
  timeToActivation: number; // seconds to use 3+ features
  depthScore: number;
}

export interface FeatureCorrelation {
  featureA: string;
  featureB: string;
  correlationScore: number;
  usersUsingBoth: number;
  sequentialUsage: number;
  relationship: 'strong' | 'moderate' | 'weak' | 'none';
}

export type FeatureCategory =
  | 'ai_assistant'
  | 'content_creation'
  | 'learning_tools'
  | 'practice'
  | 'analytics'
  | 'social'
  | 'administration';

export interface FeatureMetrics {
  totalFeatures: number;
  activeFeatures: number;
  avgFeaturesPerUser: number;
  mostPopularFeature: string;
  fastestGrowingFeature: string;
  highestRetentionFeature: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const FEATURE_DEFINITIONS: Record<string, { name: string; category: FeatureCategory }> = {
  // AI Assistant features
  'ai_chat': { name: 'AI Chat', category: 'ai_assistant' },
  'ai_doubt_solver': { name: 'Doubt Solver', category: 'ai_assistant' },
  'ai_explanation': { name: 'AI Explanation', category: 'ai_assistant' },
  'ai_summary': { name: 'AI Summary', category: 'ai_assistant' },

  // Content creation features
  'note_generation': { name: 'Note Generation', category: 'content_creation' },
  'mind_map': { name: 'Mind Map', category: 'content_creation' },
  'flashcard_creation': { name: 'Flashcard Creation', category: 'content_creation' },
  'pdf_annotation': { name: 'PDF Annotation', category: 'content_creation' },

  // Learning tools
  'study_planner': { name: 'Study Planner', category: 'learning_tools' },
  'spaced_repetition': { name: 'Spaced Repetition', category: 'learning_tools' },
  'progress_tracking': { name: 'Progress Tracking', category: 'learning_tools' },
  'goal_setting': { name: 'Goal Setting', category: 'learning_tools' },

  // Practice features
  'mcq_practice': { name: 'MCQ Practice', category: 'practice' },
  'answer_writing': { name: 'Answer Writing', category: 'practice' },
  'mock_tests': { name: 'Mock Tests', category: 'practice' },
  'previous_papers': { name: 'Previous Papers', category: 'practice' },

  // Analytics features
  'performance_analytics': { name: 'Performance Analytics', category: 'analytics' },
  'weak_area_detection': { name: 'Weak Area Detection', category: 'analytics' },
  'time_analysis': { name: 'Time Analysis', category: 'analytics' },

  // Social features
  'discussion_forums': { name: 'Discussion Forums', category: 'social' },
  'peer_learning': { name: 'Peer Learning', category: 'social' },
  'mentor_chat': { name: 'Mentor Chat', category: 'social' },

  // Administration
  'subscription_management': { name: 'Subscription Management', category: 'administration' },
  'profile_settings': { name: 'Profile Settings', category: 'administration' },
  'notification_settings': { name: 'Notification Settings', category: 'administration' },
};

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE USAGE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class FeatureUsageService {
  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE USAGE ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get usage analytics for all features
   */
  async getFeatureUsage(periodDays: number = 30): Promise<FeatureUsage[]> {
    const supabase = createClient();
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get current period usage
    const { data: currentUsage } = await supabase
      .from('feature_usage')
      .select('feature_id, user_id, session_duration_ms, success, created_at')
      .gte('created_at', periodStart.toISOString());

    // Get previous period usage for growth calculation
    const { data: previousUsage } = await supabase
      .from('feature_usage')
      .select('feature_id')
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', periodStart.toISOString());

    // Get total active users
    const { data: activeUsersData } = await supabase
      .from('ai_usage_logs')
      .select('user_id', { distinct: true })
      .gte('created_at', periodStart.toISOString());

    const totalActiveUsers = new Set(activeUsersData?.map(u => u.user_id) || []).size || 1;

    // Aggregate by feature
    const featureMap: Record<string, {
      uses: number;
      users: Set<string>;
      sessions: number[];
      successes: number;
      total: number;
    }> = {};

    for (const usage of currentUsage || []) {
      if (!featureMap[usage.feature_id]) {
        featureMap[usage.feature_id] = {
          uses: 0,
          users: new Set(),
          sessions: [],
          successes: 0,
          total: 0,
        };
      }

      featureMap[usage.feature_id].uses++;
      featureMap[usage.feature_id].users.add(usage.user_id);
      if (usage.session_duration_ms) {
        featureMap[usage.feature_id].sessions.push(usage.session_duration_ms);
      }
      if (usage.success !== false) {
        featureMap[usage.feature_id].successes++;
      }
      featureMap[usage.feature_id].total++;
    }

    // Calculate previous period counts for growth
    const previousCounts: Record<string, number> = {};
    for (const usage of previousUsage || []) {
      previousCounts[usage.feature_id] = (previousCounts[usage.feature_id] || 0) + 1;
    }

    // Build feature usage analytics
    const featureUsage: FeatureUsage[] = [];

    for (const [featureId, data] of Object.entries(featureMap)) {
      const definition = FEATURE_DEFINITIONS[featureId] || { name: featureId, category: 'ai_assistant' as FeatureCategory };
      const uniqueUsers = data.users.size;
      const avgUsesPerUser = uniqueUsers > 0 ? data.uses / uniqueUsers : 0;

      const prevCount = previousCounts[featureId] || 0;
      const growthRate = prevCount > 0 ? ((data.uses - prevCount) / prevCount) * 100 : 100;
      const adoptionRate = (uniqueUsers / totalActiveUsers) * 100;

      const avgSessionDuration = data.sessions.length > 0
        ? data.sessions.reduce((a, b) => a + b, 0) / data.sessions.length / 1000
        : 0;

      const successRate = data.total > 0 ? (data.successes / data.total) * 100 : 0;

      featureUsage.push({
        featureId,
        featureName: definition.name,
        category: definition.category,
        totalUses: data.uses,
        uniqueUsers,
        avgUsesPerUser: Math.round(avgUsesPerUser * 10) / 10,
        growthRate: Math.round(growthRate * 10) / 10,
        adoptionRate: Math.round(adoptionRate * 10) / 10,
        avgSessionDuration: Math.round(avgSessionDuration * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
      });
    }

    return featureUsage.sort((a, b) => b.totalUses - a.totalUses);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE ADOPTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get feature adoption status for a user
   */
  async getFeatureAdoption(userId: string): Promise<FeatureAdoption> {
    const supabase = createClient();

    // Get all features used by user
    const { data: userFeatures } = await supabase
      .from('feature_usage')
      .select('feature_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const usedFeatures = new Set(userFeatures?.map(f => f.feature_id) || []);
    const allFeatures = Object.keys(FEATURE_DEFINITIONS);

    // Define power features (advanced features that indicate power usage)
    const powerFeatureIds = [
      'ai_doubt_solver',
      'mind_map',
      'spaced_repetition',
      'answer_writing',
      'performance_analytics',
      'weak_area_detection',
    ];

    const adoptedFeatures = Array.from(usedFeatures);
    const powerFeatures = adoptedFeatures.filter(f => powerFeatureIds.includes(f));
    const unusedFeatures = allFeatures.filter(f => !usedFeatures.has(f));

    const adoptionRate = allFeatures.length > 0
      ? (adoptedFeatures.length / allFeatures.length) * 100
      : 0;

    // Determine adoption stage
    let adoptionStage: FeatureAdoption['adoptionStage'] = 'new';
    if (adoptedFeatures.length >= 10 && powerFeatures.length >= 4) {
      adoptionStage = 'champion';
    } else if (adoptedFeatures.length >= 6 && powerFeatures.length >= 2) {
      adoptionStage = 'power_user';
    } else if (adoptedFeatures.length >= 3) {
      adoptionStage = 'adopting';
    } else if (adoptedFeatures.length >= 1) {
      adoptionStage = 'exploring';
    }

    return {
      userId,
      adoptedFeatures,
      adoptionRate: Math.round(adoptionRate * 10) / 10,
      powerFeatures,
      unusedFeatures,
      adoptionStage,
    };
  }

  /**
   * Get bulk feature adoption for all users
   */
  async getBulkFeatureAdoption(): Promise<Record<string, FeatureAdoption>> {
    const supabase = createClient();

    // Get all users with feature usage
    const { data: featureData } = await supabase
      .from('feature_usage')
      .select('user_id, feature_id');

    if (!featureData) {
      return {};
    }

    // Group by user
    const userFeatures: Record<string, Set<string>> = {};
    for (const item of featureData) {
      if (!userFeatures[item.user_id]) {
        userFeatures[item.user_id] = new Set();
      }
      userFeatures[item.user_id].add(item.feature_id);
    }

    // Build adoption data for each user
    const allFeatures = Object.keys(FEATURE_DEFINITIONS);
    const powerFeatureIds = [
      'ai_doubt_solver',
      'mind_map',
      'spaced_repetition',
      'answer_writing',
      'performance_analytics',
      'weak_area_detection',
    ];

    const result: Record<string, FeatureAdoption> = {};

    for (const [userId, features] of Object.entries(userFeatures)) {
      const adoptedFeatures = Array.from(features);
      const powerFeatures = adoptedFeatures.filter(f => powerFeatureIds.includes(f));
      const unusedFeatures = allFeatures.filter(f => !features.has(f));

      const adoptionRate = allFeatures.length > 0
        ? (adoptedFeatures.length / allFeatures.length) * 100
        : 0;

      let adoptionStage: FeatureAdoption['adoptionStage'] = 'new';
      if (adoptedFeatures.length >= 10 && powerFeatures.length >= 4) {
        adoptionStage = 'champion';
      } else if (adoptedFeatures.length >= 6 && powerFeatures.length >= 2) {
        adoptionStage = 'power_user';
      } else if (adoptedFeatures.length >= 3) {
        adoptionStage = 'adopting';
      } else if (adoptedFeatures.length >= 1) {
        adoptionStage = 'exploring';
      }

      result[userId] = {
        userId,
        adoptedFeatures,
        adoptionRate: Math.round(adoptionRate * 10) / 10,
        powerFeatures,
        unusedFeatures,
        adoptionStage,
      };
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE TRENDS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get usage trends for features
   */
  async getFeatureTrends(periods: number = 6, periodDays: number = 7): Promise<FeatureTrend[]> {
    const supabase = createClient();
    const trends: FeatureTrend[] = [];

    const now = new Date();

    for (let i = 0; i < periods; i++) {
      const periodEnd = new Date(now.getTime() - i * periodDays * 24 * 60 * 60 * 1000);
      const periodStart = new Date(periodEnd.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const { data: usageData } = await supabase
        .from('feature_usage')
        .select('feature_id, user_id')
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      if (!usageData) continue;

      // Aggregate by feature
      const featureCounts: Record<string, { uses: number; users: Set<string> }> = {};
      for (const usage of usageData) {
        if (!featureCounts[usage.feature_id]) {
          featureCounts[usage.feature_id] = { uses: 0, users: new Set() };
        }
        featureCounts[usage.feature_id].uses++;
        featureCounts[usage.feature_id].users.add(usage.user_id);
      }

      // Get previous period for growth calculation
      const prevPeriodEnd = periodStart;
      const prevPeriodStart = new Date(prevPeriodEnd.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const { data: prevUsageData } = await supabase
        .from('feature_usage')
        .select('feature_id')
        .gte('created_at', prevPeriodStart.toISOString())
        .lte('created_at', prevPeriodEnd.toISOString());

      const prevCounts: Record<string, number> = {};
      for (const usage of prevUsageData || []) {
        prevCounts[usage.feature_id] = (prevCounts[usage.feature_id] || 0) + 1;
      }

      // Create trend entries for each feature
      for (const [featureId, data] of Object.entries(featureCounts)) {
        const prevCount = prevCounts[featureId] || 0;
        const growthRate = prevCount > 0 ? ((data.uses - prevCount) / prevCount) * 100 : 100;

        let trend: FeatureTrend['trend'] = 'stable';
        if (growthRate > 10) trend = 'increasing';
        else if (growthRate < -10) trend = 'decreasing';

        trends.push({
          featureId,
          period: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
          uses: data.uses,
          uniqueUsers: data.users.size,
          growthRate: Math.round(growthRate * 10) / 10,
          trend,
        });
      }
    }

    return trends.reverse();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER JOURNEY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze user's feature journey
   */
  async analyzeUserJourney(userId: string): Promise<UserJourney> {
    const supabase = createClient();

    // Get user's feature usage in chronological order
    const { data: featureUsage } = await supabase
      .from('feature_usage')
      .select('feature_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!featureUsage || featureUsage.length === 0) {
      return {
        userId,
        firstFeature: '',
        featuresUsed: [],
        journeyPath: [],
        timeToFirstValue: 0,
        timeToActivation: 0,
        depthScore: 0,
      };
    }

    // Extract journey
    const uniqueFeatures = new Set<string>();
    const journeyPath: string[] = [];
    let firstFeature = featureUsage[0].feature_id;
    const firstUsedAt = new Date(featureUsage[0].created_at).getTime();

    for (const usage of featureUsage) {
      if (!uniqueFeatures.has(usage.feature_id)) {
        uniqueFeatures.add(usage.feature_id);
        journeyPath.push(usage.feature_id);
      }
    }

    // Calculate time to first value (first feature use)
    const timeToFirstValue = 0; // Would need user signup time for accurate calculation

    // Calculate time to activation (using 3+ features)
    let timeToActivation = 0;
    let activationReached = false;
    for (let i = 0; i < featureUsage.length; i++) {
      const featuresSoFar = new Set(featureUsage.slice(0, i + 1).map(f => f.feature_id));
      if (featuresSoFar.size >= 3 && !activationReached) {
        timeToActivation = new Date(featureUsage[i].created_at).getTime() - firstUsedAt;
        activationReached = true;
        break;
      }
    }

    // Calculate depth score (based on number and diversity of features used)
    const categoriesUsed = new Set(
      journeyPath.map(f => FEATURE_DEFINITIONS[f]?.category || 'unknown')
    );
    const depthScore = (uniqueFeatures.size * 10) + (categoriesUsed.size * 20);

    return {
      userId,
      firstFeature,
      featuresUsed: Array.from(uniqueFeatures),
      journeyPath,
      timeToFirstValue: Math.round(timeToFirstValue / 1000),
      timeToActivation: Math.round(timeToActivation / 1000),
      depthScore: Math.round(depthScore * 10) / 10,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE CORRELATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Find correlations between features
   */
  async getFeatureCorrelations(): Promise<FeatureCorrelation[]> {
    const supabase = createClient();
    const correlations: FeatureCorrelation[] = [];

    // Get all feature usage
    const { data: usageData } = await supabase
      .from('feature_usage')
      .select('user_id, feature_id, created_at')
      .order('created_at', { ascending: true });

    if (!usageData) return [];

    // Group features by user
    const userFeatures: Record<string, Set<string>> = {};
    const userFeatureSequence: Record<string, string[]> = {};

    for (const usage of usageData) {
      if (!userFeatures[usage.user_id]) {
        userFeatures[usage.user_id] = new Set();
        userFeatureSequence[usage.user_id] = [];
      }
      userFeatures[usage.user_id].add(usage.feature_id);
      userFeatureSequence[usage.user_id].push(usage.feature_id);
    }

    // Calculate correlations between feature pairs
    const featurePairs: Record<string, { both: number; totalA: number; totalB: number; sequential: number }> = {};

    const features = Object.keys(FEATURE_DEFINITIONS);

    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const featureA = features[i];
        const featureB = features[j];
        const pairKey = `${featureA}_${featureB}`;

        let both = 0;
        let sequential = 0;

        for (const [userId, featuresSet] of Object.entries(userFeatures)) {
          const hasA = featuresSet.has(featureA);
          const hasB = featuresSet.has(featureB);

          if (hasA && hasB) {
            both++;
            // Check for sequential usage (A then B within same session)
            const sequence = userFeatureSequence[userId];
            for (let k = 0; k < sequence.length - 1; k++) {
              if (sequence[k] === featureA && sequence[k + 1] === featureB) {
                sequential++;
                break;
              }
            }
          }
        }

        const totalA = Object.values(userFeatures).filter(f => f.has(featureA)).length;
        const totalB = Object.values(userFeatures).filter(f => f.has(featureB)).length;

        featurePairs[pairKey] = { both, totalA, totalB, sequential };
      }
    }

    // Build correlation results
    for (const [pairKey, data] of Object.entries(featurePairs)) {
      if (data.both === 0) continue;

      const [featureA, featureB] = pairKey.split('_');

      // Calculate correlation score using Jaccard similarity
      const union = data.totalA + data.totalB - data.both;
      const correlationScore = union > 0 ? (data.both / union) * 100 : 0;

      // Determine relationship strength
      let relationship: FeatureCorrelation['relationship'] = 'none';
      if (correlationScore >= 50) relationship = 'strong';
      else if (correlationScore >= 25) relationship = 'moderate';
      else if (correlationScore >= 10) relationship = 'weak';

      correlations.push({
        featureA,
        featureB,
        correlationScore: Math.round(correlationScore * 10) / 10,
        usersUsingBoth: data.both,
        sequentialUsage: data.sequential,
        relationship,
      });
    }

    return correlations.sort((a, b) => b.correlationScore - a.correlationScore);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERALL FEATURE METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get overall feature metrics
   */
  async getFeatureMetrics(periodDays: number = 30): Promise<FeatureMetrics> {
    const usage = await this.getFeatureUsage(periodDays);
    const trends = await this.getFeatureTrends(2, periodDays);

    const totalFeatures = Object.keys(FEATURE_DEFINITIONS).length;
    const activeFeatures = usage.length;

    const avgFeaturesPerUser = usage.length > 0
      ? usage.reduce((sum, f) => sum + f.avgUsesPerUser, 0) / usage.length
      : 0;

    const mostPopularFeature = usage.length > 0 ? usage[0].featureId : '';

    // Find fastest growing feature
    const sortedByGrowth = [...usage].sort((a, b) => b.growthRate - a.growthRate);
    const fastestGrowingFeature = sortedByGrowth.length > 0 ? sortedByGrowth[0].featureId : '';

    // Find highest retention feature (using success rate as proxy)
    const sortedByRetention = [...usage].sort((a, b) => b.successRate - a.successRate);
    const highestRetentionFeature = sortedByRetention.length > 0 ? sortedByRetention[0].featureId : '';

    return {
      totalFeatures,
      activeFeatures,
      avgFeaturesPerUser: Math.round(avgFeaturesPerUser * 10) / 10,
      mostPopularFeature,
      fastestGrowingFeature,
      highestRetentionFeature,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let featureUsageInstance: FeatureUsageService | null = null;

export function getFeatureUsageService(): FeatureUsageService {
  if (!featureUsageInstance) {
    featureUsageInstance = new FeatureUsageService();
  }
  return featureUsageInstance;
}
