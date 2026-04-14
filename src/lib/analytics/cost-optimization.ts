/**
 * Phase 16: Cost Optimization Insights
 * Analyze AI costs, provider efficiency, and optimization recommendations
 */

import { createClient } from '@/lib/supabase/server';
import { PLAN_PRICING } from '@/lib/billing/pricing-engine';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ProviderCostAnalysis {
  provider: string;
  totalTokens: number;
  totalCost: number;
  avgCostPer1KTokens: number;
  avgLatencyMs: number;
  successRate: number;
  requestCount: number;
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CostOptimizationRecommendation {
  type: 'provider_switch' | 'plan_upgrade' | 'usage_pattern' | 'budget_alert' | 'caching';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  actionRequired: string;
}

export interface UserCostAnalysis {
  userId: string;
  currentPlan: string;
  monthlyUsage: {
    tokens: number;
    cost: number;
  };
  planCost: number;
  overageCost: number;
  totalCost: number;
  effectiveCostPer1KTokens: number;
  recommendedPlan: string;
  potentialSavings: number;
  insights: string[];
}

export interface BudgetOptimization {
  userId: string;
  currentMonthlySpend: number;
  projectedMonthlySpend: number;
  budgetUtilization: number;
  recommendations: CostOptimizationRecommendation[];
  optimalPlan: string;
  optimalProviderMix: Record<string, number>;
}

export interface ProviderEfficiencyReport {
  provider: string;
  costScore: number;
  latencyScore: number;
  reliabilityScore: number;
  overallScore: number;
  ranking: number;
  recommendation: 'primary' | 'secondary' | 'fallback' | 'avoid';
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COST ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

export class CostOptimizationService {
  // Provider cost benchmarks (per 1K tokens)
  private readonly PROVIDER_BENCHMARKS: Record<string, { costPer1K: number; latencyMs: number }> = {
    'opencode': { costPer1K: 0.002, latencyMs: 500 },
    'kilo': { costPer1K: 0.0015, latencyMs: 800 },
    'groq': { costPer1K: 0.0005, latencyMs: 200 },
    'ollama': { costPer1K: 0.0001, latencyMs: 1000 },
    'default': { costPer1K: 0.002, latencyMs: 500 },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVIDER ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze costs by AI provider
   */
  async analyzeProviderCosts(periodDays: number = 30): Promise<ProviderCostAnalysis[]> {
    const supabase = await createClient();
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get usage grouped by provider
    const { data: usageData } = await supabase
      .from('ai_usage_logs')
      .select('provider, total_tokens, cost_usd, latency_ms, success')
      .gte('created_at', periodStart.toISOString());

    if (!usageData || usageData.length === 0) {
      return [];
    }

    // Group by provider
    const providerMap: Record<string, {
      tokens: number;
      cost: number;
      latencies: number[];
      successes: number;
      total: number;
    }> = {};

    for (const usage of usageData) {
      const provider = usage.provider || 'default';
      if (!providerMap[provider]) {
        providerMap[provider] = { tokens: 0, cost: 0, latencies: [], successes: 0, total: 0 };
      }

      providerMap[provider].tokens += usage.total_tokens || 0;
      providerMap[provider].cost += usage.cost_usd || 0;
      if (usage.latency_ms) providerMap[provider].latencies.push(usage.latency_ms);
      if (usage.success !== false) providerMap[provider].successes++;
      providerMap[provider].total++;
    }

    // Calculate analysis for each provider
    const analyses: ProviderCostAnalysis[] = [];

    for (const [provider, data] of Object.entries(providerMap)) {
      const avgLatency = data.latencies.length > 0
        ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length
        : 0;

      const costPer1K = data.tokens > 0 ? (data.cost / (data.tokens / 1000)) : 0;
      const successRate = data.total > 0 ? (data.successes / data.total) * 100 : 0;

      // Calculate efficiency rating
      const benchmark = this.PROVIDER_BENCHMARKS[provider] || this.PROVIDER_BENCHMARKS.default;
      const costRatio = benchmark.costPer1K > 0 ? costPer1K / benchmark.costPer1K : 1;
      const latencyRatio = benchmark.latencyMs > 0 ? avgLatency / benchmark.latencyMs : 1;

      let efficiency: ProviderCostAnalysis['efficiency'] = 'good';
      if (costRatio <= 1 && latencyRatio <= 1.5) {
        efficiency = 'excellent';
      } else if (costRatio <= 1.5 && latencyRatio <= 2) {
        efficiency = 'good';
      } else if (costRatio <= 2 && latencyRatio <= 3) {
        efficiency = 'fair';
      } else {
        efficiency = 'poor';
      }

      analyses.push({
        provider,
        totalTokens: data.tokens,
        totalCost: Math.round(data.cost * 100) / 100,
        avgCostPer1KTokens: Math.round(costPer1K * 10000) / 10000,
        avgLatencyMs: Math.round(avgLatency),
        successRate: Math.round(successRate * 10) / 10,
        requestCount: data.total,
        efficiency,
      });
    }

    return analyses.sort((a, b) => a.totalCost - b.totalCost);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVIDER EFFICIENCY SCORING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate provider efficiency scores and rankings
   */
  async getProviderEfficiencyReport(periodDays: number = 30): Promise<ProviderEfficiencyReport[]> {
    const analyses = await this.analyzeProviderCosts(periodDays);

    if (analyses.length === 0) {
      return [];
    }

    // Calculate scores for each provider
    const scores: ProviderEfficiencyReport[] = [];

    // Find min/max for normalization
    const minCost = Math.min(...analyses.map(a => a.avgCostPer1KTokens));
    const maxCost = Math.max(...analyses.map(a => a.avgCostPer1KTokens));
    const minLatency = Math.min(...analyses.map(a => a.avgLatencyMs));
    const maxLatency = Math.max(...analyses.map(a => a.avgLatencyMs));

    for (const analysis of analyses) {
      // Cost score (lower is better) - 40% weight
      const costRange = maxCost - minCost || 1;
      const costScore = 100 * (1 - (analysis.avgCostPer1KTokens - minCost) / costRange);

      // Latency score (lower is better) - 30% weight
      const latencyRange = maxLatency - minLatency || 1;
      const latencyScore = 100 * (1 - (analysis.avgLatencyMs - minLatency) / latencyRange);

      // Reliability score (higher is better) - 30% weight
      const reliabilityScore = analysis.successRate;

      // Overall weighted score
      const overallScore = (costScore * 0.4) + (latencyScore * 0.3) + (reliabilityScore * 0.3);

      scores.push({
        provider: analysis.provider,
        costScore: Math.round(costScore * 10) / 10,
        latencyScore: Math.round(latencyScore * 10) / 10,
        reliabilityScore: Math.round(reliabilityScore * 10) / 10,
        overallScore: Math.round(overallScore * 10) / 10,
        ranking: 0, // Will be set after sorting
        recommendation: 'secondary',
      });
    }

    // Sort by overall score and assign rankings
    scores.sort((a, b) => b.overallScore - a.overallScore);
    scores.forEach((score, index) => {
      score.ranking = index + 1;

      // Assign recommendation based on ranking
      if (index === 0) {
        score.recommendation = 'primary';
      } else if (index === 1) {
        score.recommendation = 'secondary';
      } else if (index < scores.length - 1) {
        score.recommendation = 'fallback';
      } else {
        score.recommendation = 'avoid';
      }
    });

    return scores;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER COST ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze costs for a specific user
   */
  async analyzeUserCost(userId: string): Promise<UserCostAnalysis> {
    const supabase = await createClient();
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Current month

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const currentPlan = subscription?.plan_type || 'free';
    const planPricing = PLAN_PRICING[currentPlan as keyof typeof PLAN_PRICING];

    // Get user's usage for current month
    const { data: usageData } = await supabase
      .from('ai_usage_logs')
      .select('total_tokens, cost_usd')
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString());

    const totalTokens = usageData?.reduce((sum: number, u: { total_tokens?: number }) => sum + (u.total_tokens || 0), 0) || 0;
    const actualAiCost = usageData?.reduce((sum: number, u: { cost_usd?: number }) => sum + (u.cost_usd || 0), 0) || 0;

    // Calculate costs
    const planCost = planPricing.monthlyPrice;
    const includedTokens = planPricing.aiAllowance.tokensPerMonth;
    const overageTokens = Math.max(0, totalTokens - includedTokens);

    // Calculate overage cost (using base rate of $0.10 per 1K tokens)
    const overageCost = (overageTokens / 1000) * 0.10;
    const totalCost = planCost + overageCost;

    const effectiveCostPer1K = totalTokens > 0 ? (totalCost / (totalTokens / 1000)) : 0;

    // Find optimal plan
    const { recommendedPlan, potentialSavings } = this.findOptimalPlan(
      currentPlan,
      totalTokens,
      actualAiCost
    );

    // Generate insights
    const insights: string[] = [];

    if (overageTokens > 0) {
      insights.push(`You exceeded your plan's included tokens by ${overageTokens.toLocaleString()} tokens`);
      insights.push(`Overage charges: $${overageCost.toFixed(2)} this month`);
    }

    if (totalTokens < includedTokens * 0.5) {
      insights.push(`You're using less than 50% of your included tokens - consider downgrading`);
    }

    if (currentPlan === 'free' && totalTokens > 50000) {
      insights.push(`Heavy usage detected - a paid plan could save you money`);
    }

    if (recommendedPlan !== currentPlan && potentialSavings > 0) {
      insights.push(`Switching to ${recommendedPlan} could save you $${potentialSavings.toFixed(2)}/month`);
    }

    return {
      userId,
      currentPlan,
      monthlyUsage: {
        tokens: totalTokens,
        cost: Math.round(actualAiCost * 100) / 100,
      },
      planCost,
      overageCost: Math.round(overageCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      effectiveCostPer1KTokens: Math.round(effectiveCostPer1K * 10000) / 10000,
      recommendedPlan,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      insights,
    };
  }

  /**
   * Find optimal plan based on usage
   */
  private findOptimalPlan(
    currentPlan: string,
    totalTokens: number,
    actualAiCost: number
  ): { recommendedPlan: string; potentialSavings: number } {
    const plans = Object.entries(PLAN_PRICING);
    let recommendedPlan = currentPlan;
    let minCost = this.calculatePlanCost(currentPlan, totalTokens);
    let potentialSavings = 0;

    for (const [plan, pricing] of plans) {
      const planCost = pricing.monthlyPrice;
      const includedTokens = pricing.aiAllowance.tokensPerMonth;
      const overageTokens = Math.max(0, totalTokens - includedTokens);
      const overageCost = (overageTokens / 1000) * 0.10;
      const totalCost = planCost + overageCost;

      if (totalCost < minCost) {
        minCost = totalCost;
        recommendedPlan = plan;
        potentialSavings = this.calculatePlanCost(currentPlan, totalTokens) - totalCost;
      }
    }

    return { recommendedPlan, potentialSavings };
  }

  private calculatePlanCost(plan: string, tokens: number): number {
    const pricing = PLAN_PRICING[plan as keyof typeof PLAN_PRICING];
    if (!pricing) return 0;

    const includedTokens = pricing.aiAllowance.tokensPerMonth;
    const overageTokens = Math.max(0, tokens - includedTokens);
    const overageCost = (overageTokens / 1000) * 0.10;

    return pricing.monthlyPrice + overageCost;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUDGET OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get budget optimization recommendations for a user
   */
  async getBudgetOptimization(userId: string): Promise<BudgetOptimization> {
    const userCost = await this.analyzeUserCost(userId);
    const recommendations: CostOptimizationRecommendation[] = [];

    // Plan upgrade recommendation
    if (userCost.recommendedPlan !== userCost.currentPlan && userCost.potentialSavings > 0) {
      recommendations.push({
        type: 'plan_upgrade',
        priority: 'high',
        title: `Upgrade to ${userCost.recommendedPlan} plan`,
        description: `Based on your usage of ${userCost.monthlyUsage.tokens.toLocaleString()} tokens, the ${userCost.recommendedPlan} plan would be more cost-effective`,
        estimatedSavings: userCost.potentialSavings,
        actionRequired: `Navigate to billing settings and upgrade to ${userCost.recommendedPlan}`,
      });
    }

    // Usage pattern recommendation
    if (userCost.overageCost > 10) {
      recommendations.push({
        type: 'usage_pattern',
        priority: 'medium',
        title: 'Reduce overage charges',
        description: `You're paying $${userCost.overageCost.toFixed(2)} in overage charges. Consider batching requests or upgrading your plan.`,
        estimatedSavings: userCost.overageCost * 0.5,
        actionRequired: 'Batch multiple queries into single requests where possible',
      });
    }

    // Budget alert recommendation
    const projectedSpend = userCost.totalCost;
    if (projectedSpend > 100) {
      recommendations.push({
        type: 'budget_alert',
        priority: 'low',
        title: 'Set up budget alerts',
        description: `Your monthly spend is $${projectedSpend.toFixed(2)}. Set up alerts to track usage and avoid surprises.`,
        estimatedSavings: 0,
        actionRequired: 'Configure budget alerts in billing settings',
      });
    }

    // Caching recommendation for high-volume users
    if (userCost.monthlyUsage.tokens > 1000000) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        title: 'Enable response caching',
        description: 'High-volume users can save up to 30% by caching similar responses',
        estimatedSavings: userCost.monthlyUsage.cost * 0.3,
        actionRequired: 'Enable caching in API settings or implement client-side caching',
      });
    }

    // Calculate optimal provider mix
    const optimalProviderMix = this.calculateOptimalProviderMix(userCost.monthlyUsage.tokens);

    return {
      userId,
      currentMonthlySpend: userCost.totalCost,
      projectedMonthlySpend: projectedSpend,
      budgetUtilization: 100, // Would need user-set budget for real calculation
      recommendations,
      optimalPlan: userCost.recommendedPlan,
      optimalProviderMix,
    };
  }

  /**
   * Calculate optimal provider mix based on usage volume
   */
  private calculateOptimalProviderMix(totalTokens: number): Record<string, number> {
    // Simple heuristic: distribute based on cost-effectiveness
    // Higher volume = more weight on cheaper providers

    if (totalTokens < 100000) {
      // Low volume: prioritize quality
      return {
        'opencode': 60,
        'kilo': 30,
        'groq': 10,
      };
    } else if (totalTokens < 1000000) {
      // Medium volume: balanced approach
      return {
        'opencode': 40,
        'kilo': 30,
        'groq': 20,
        'ollama': 10,
      };
    } else {
      // High volume: prioritize cost
      return {
        'opencode': 20,
        'kilo': 30,
        'groq': 30,
        'ollama': 20,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COST OPTIMIZATION RECOMMENDATIONS (GLOBAL)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get global cost optimization recommendations
   */
  async getGlobalRecommendations(periodDays: number = 30): Promise<CostOptimizationRecommendation[]> {
    const providerReport = await this.getProviderEfficiencyReport(periodDays);
    const recommendations: CostOptimizationRecommendation[] = [];

    // Find providers with poor efficiency
    const poorProviders = providerReport.filter(p => p.recommendation === 'avoid');
    if (poorProviders.length > 0) {
      recommendations.push({
        type: 'provider_switch',
        priority: 'high',
        title: 'Reduce usage of inefficient providers',
        description: `The following providers have poor cost efficiency: ${poorProviders.map(p => p.provider).join(', ')}. Consider switching to ${providerReport[0]?.provider || 'a more efficient provider'}.`,
        estimatedSavings: 0, // Would need actual usage data to calculate
        actionRequired: 'Update AI routing configuration to deprioritize inefficient providers',
      });
    }

    // Recommend primary provider
    const primaryProvider = providerReport.find(p => p.recommendation === 'primary');
    if (primaryProvider) {
      recommendations.push({
        type: 'provider_switch',
        priority: 'medium',
        title: `Increase usage of ${primaryProvider.provider}`,
        description: `${primaryProvider.provider} has the best overall efficiency score (${primaryProvider.overallScore}/100) with excellent cost and latency performance.`,
        estimatedSavings: 0,
        actionRequired: `Configure ${primaryProvider.provider} as primary provider in AI routing`,
      });
    }

    // Caching recommendation for the platform
    recommendations.push({
      type: 'caching',
      priority: 'medium',
      title: 'Implement platform-wide caching',
      description: 'Implementing a Redis cache for common queries could reduce AI costs by 20-40%',
      estimatedSavings: 0,
      actionRequired: 'Deploy Redis and implement response caching layer',
    });

    return recommendations;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let costOptimizationInstance: CostOptimizationService | null = null;

export function getCostOptimizationService(): CostOptimizationService {
  if (!costOptimizationInstance) {
    costOptimizationInstance = new CostOptimizationService();
  }
  return costOptimizationInstance;
}
