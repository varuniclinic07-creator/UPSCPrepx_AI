/**
 * AI Cost Tracking System
 * Token tracking, cost calculation, and budget enforcement
 * Enterprise-grade cost management for UPSC PrepX-AI
 */

import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════
// PRICING CONFIGURATION
// ═══════════════════════════════════════════════════════════

export interface ProviderPricing {
  promptCostPer1K: number;
  completionCostPer1K: number;
  currency: string;
}

export const PROVIDER_PRICING: Record<string, ProviderPricing> = {
  // Anthropic Claude models
  'claude-3-opus': { promptCostPer1K: 0.015, completionCostPer1K: 0.075, currency: 'USD' },
  'claude-3-sonnet': { promptCostPer1K: 0.003, completionCostPer1K: 0.015, currency: 'USD' },
  'claude-3-haiku': { promptCostPer1K: 0.00025, completionCostPer1K: 0.00125, currency: 'USD' },
  'claude-3.5-sonnet': { promptCostPer1K: 0.003, completionCostPer1K: 0.015, currency: 'USD' },

  // OpenAI GPT models
  'gpt-4-turbo': { promptCostPer1K: 0.01, completionCostPer1K: 0.03, currency: 'USD' },
  'gpt-4': { promptCostPer1K: 0.03, completionCostPer1K: 0.06, currency: 'USD' },
  'gpt-4o': { promptCostPer1K: 0.005, completionCostPer1K: 0.015, currency: 'USD' },
  'gpt-3.5-turbo': { promptCostPer1K: 0.0005, completionCostPer1K: 0.0015, currency: 'USD' },

  // Groq models
  'groq-llama-70b': { promptCostPer1K: 0.00064, completionCostPer1K: 0.00064, currency: 'USD' },
  'groq-llama-8b': { promptCostPer1K: 0.00005, completionCostPer1K: 0.00005, currency: 'USD' },
  'groq-mixtral': { promptCostPer1K: 0.00024, completionCostPer1K: 0.00024, currency: 'USD' },
  'groq-gemma': { promptCostPer1K: 0.0001, completionCostPer1K: 0.0001, currency: 'USD' },

  // Local models (Ollama)
  'ollama-local': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },

  // Vision models (Ollama — free local inference)
  'gemma4:31b-cloud': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },
  'qwen3-vl:235b-instruct-cloud': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },

  // Kilo AI models (free tier)
  'bytedance-seed/dola-seed-2.0-pro:free': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },
  'nvidia/nemotron-3-super-120b-a12b:free': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },
  'x-ai/grok-code-fast-1:optimized:free': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },
  'kilo-auto/free': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },
  'openrouter/free': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },

  // OpenCode models (self-hosted — free)
  'opencode zen/Big Pickle': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },
  'go/MiniMax M2.7': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },
  'Nemotron 3 Super Free': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },
  'MiniMax M2.5 Free': { promptCostPer1K: 0, completionCostPer1K: 0, currency: 'USD' },

  // NVIDIA NIM models
  'nvidia-nemotron': { promptCostPer1K: 0.0003, completionCostPer1K: 0.0006, currency: 'USD' },
  'nvidia-llama-70b': { promptCostPer1K: 0.00056, completionCostPer1K: 0.00077, currency: 'USD' },

  // Google Gemini models
  'gemini-1.5-pro': { promptCostPer1K: 0.00125, completionCostPer1K: 0.005, currency: 'USD' },
  'gemini-1.5-flash': { promptCostPer1K: 0.000075, completionCostPer1K: 0.0003, currency: 'USD' },

  // 9Router (aggregated pricing)
  '9router': { promptCostPer1K: 0.001, completionCostPer1K: 0.003, currency: 'USD' },
};

// ═══════════════════════════════════════════════════════════
// USAGE LIMITS BY PLAN
// ═══════════════════════════════════════════════════════════

export interface PlanLimits {
  maxTokensPerMonth: number;
  maxCostPerMonth: number;
  maxRequestsPerDay: number;
  maxTokensPerRequest: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxTokensPerMonth: 100000,
    maxCostPerMonth: 5,
    maxRequestsPerDay: 20,
    maxTokensPerRequest: 4096,
  },
  basic: {
    maxTokensPerMonth: 500000,
    maxCostPerMonth: 25,
    maxRequestsPerDay: 100,
    maxTokensPerRequest: 8192,
  },
  premium: {
    maxTokensPerMonth: 2000000,
    maxCostPerMonth: 100,
    maxRequestsPerDay: 500,
    maxTokensPerRequest: 32768,
  },
  enterprise: {
    maxTokensPerMonth: 10000000,
    maxCostPerMonth: 500,
    maxRequestsPerDay: 2000,
    maxTokensPerRequest: 128000,
  },
};

// ═══════════════════════════════════════════════════════════
// TOKEN TRACKING TYPES
// ═══════════════════════════════════════════════════════════

export interface TokenUsage {
  id?: string;
  userId: string;
  provider: string;
  model: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  sessionId?: string;
  createdAt?: string;
}

export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  byProvider: Record<string, { tokens: number; cost: number; requests: number }>;
  byEndpoint: Record<string, { tokens: number; cost: number; requests: number }>;
}

export interface BudgetStatus {
  userId: string;
  plan: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  tokensUsed: number;
  tokensRemaining: number;
  tokensLimit: number;
  costUsed: number;
  costRemaining: number;
  costLimit: number;
  requestsToday: number;
  requestsLimit: number;
  percentageUsed: number;
  isOverLimit: boolean;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════
// TOKEN COUNTING UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Estimate token count from text
 * Uses ~4 characters per token heuristic
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // More accurate estimation: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Count tokens more accurately using message structure
 */
export function countMessageTokens(messages: Array<{ role: string; content: string }>): number {
  let totalTokens = 0;

  for (const message of messages) {
    // Base tokens for message structure
    totalTokens += 4; // role + formatting

    // Count tokens in content
    totalTokens += estimateTokens(message.content);
  }

  // Add tokens for system prompt if present
  totalTokens += 10;

  return totalTokens;
}

// ═══════════════════════════════════════════════════════════
// COST CALCULATION
// ═══════════════════════════════════════════════════════════

/**
 * Calculate cost for a given token usage
 */
export function calculateCost(
  provider: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = PROVIDER_PRICING[provider] || PROVIDER_PRICING['9router'];

  const promptCost = (promptTokens / 1000) * pricing.promptCostPer1K;
  const completionCost = (completionTokens / 1000) * pricing.completionCostPer1K;

  return promptCost + completionCost;
}

/**
 * Calculate cost from estimated tokens
 */
export function calculateCostFromEstimate(
  provider: string,
  totalTokens: number
): number {
  const pricing = PROVIDER_PRICING[provider] || PROVIDER_PRICING['9router'];

  // Assume 60% prompt, 40% completion for estimation
  const promptTokens = totalTokens * 0.6;
  const completionTokens = totalTokens * 0.4;

  return calculateCost(provider, promptTokens, completionTokens);
}

// ═══════════════════════════════════════════════════════════
// DATABASE TRACKING
// ═══════════════════════════════════════════════════════════

/**
 * Record AI usage in database
 */
export async function recordUsage(usage: TokenUsage): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('ai_usage_logs').insert({
    user_id: usage.userId,
    provider: usage.provider,
    model: usage.model,
    endpoint: usage.endpoint,
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.totalTokens,
    cost_usd: usage.cost,
    latency_ms: usage.latencyMs,
    session_id: usage.sessionId,
    created_at: usage.createdAt || new Date().toISOString(),
  });

  if (error) {
    console.error('[CostTracker] Failed to record usage:', error);
    throw error;
  }
}

/**
 * Get user's usage summary for current period
 */
export async function getUsageSummary(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<UsageSummary> {
  const supabase = await createClient();

  // Get totals
  const { data: totals } = await supabase
    .from('ai_usage_logs')
    .select('total_tokens, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  // Get by provider
  const { data: byProvider } = await supabase
    .from('ai_usage_logs')
    .select('provider, total_tokens, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  // Get by endpoint
  const { data: byEndpoint } = await supabase
    .from('ai_usage_logs')
    .select('endpoint, total_tokens, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  // Aggregate results
  const summary: UsageSummary = {
    totalTokens: totals?.reduce((sum: number, r: { total_tokens?: number }) => sum + (r.total_tokens || 0), 0) || 0,
    totalCost: totals?.reduce((sum: number, r: { cost_usd?: number }) => sum + (r.cost_usd || 0), 0) || 0,
    totalRequests: totals?.length || 0,
    byProvider: {},
    byEndpoint: {},
  };

  // Aggregate by provider
  for (const record of byProvider || []) {
    if (!summary.byProvider[record.provider]) {
      summary.byProvider[record.provider] = { tokens: 0, cost: 0, requests: 0 };
    }
    summary.byProvider[record.provider].tokens += record.total_tokens || 0;
    summary.byProvider[record.provider].cost += record.cost_usd || 0;
    summary.byProvider[record.provider].requests += 1;
  }

  // Aggregate by endpoint
  for (const record of byEndpoint || []) {
    const ep = record.endpoint || 'unknown';
    if (!summary.byEndpoint[ep]) {
      summary.byEndpoint[ep] = { tokens: 0, cost: 0, requests: 0 };
    }
    summary.byEndpoint[ep].tokens += record.total_tokens || 0;
    summary.byEndpoint[ep].cost += record.cost_usd || 0;
    summary.byEndpoint[ep].requests += 1;
  }

  return summary;
}

/**
 * Get user's budget status
 */
export async function getBudgetStatus(userId: string): Promise<BudgetStatus> {
  const supabase = await createClient();

  // Get user's plan
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single() as { data: any };

  const plan = userData?.subscription_plan || userData?.role || 'free';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  // Calculate current period (monthly)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get current usage
  const summary = await getUsageSummary(userId, periodStart, periodEnd);

  // Get today's requests
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: requestsToday } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  // Calculate remaining limits
  const tokensRemaining = Math.max(0, limits.maxTokensPerMonth - summary.totalTokens);
  const costRemaining = Math.max(0, limits.maxCostPerMonth - summary.totalCost);
  const percentageUsed = (summary.totalCost / limits.maxCostPerMonth) * 100;

  // Generate warnings
  const warnings: string[] = [];
  if (percentageUsed >= 90) {
    warnings.push('Critical: You have used 90% or more of your monthly AI budget');
  } else if (percentageUsed >= 75) {
    warnings.push('Warning: You have used 75% or more of your monthly AI budget');
  }
  if (requestsToday && requestsToday >= limits.maxRequestsPerDay * 0.8) {
    warnings.push('Warning: You are approaching your daily request limit');
  }

  return {
    userId,
    plan,
    currentPeriodStart: periodStart.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    tokensUsed: summary.totalTokens,
    tokensRemaining,
    tokensLimit: limits.maxTokensPerMonth,
    costUsed: summary.totalCost,
    costRemaining,
    costLimit: limits.maxCostPerMonth,
    requestsToday: requestsToday || 0,
    requestsLimit: limits.maxRequestsPerDay,
    percentageUsed,
    isOverLimit: summary.totalCost > limits.maxCostPerMonth,
    warnings,
  };
}

/**
 * Check if user is within limits before making AI request
 */
export async function checkUsageLimits(
  userId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; reason?: string; budgetStatus?: BudgetStatus }> {
  const budgetStatus = await getBudgetStatus(userId);

  // Check if over monthly cost limit
  if (budgetStatus.isOverLimit) {
    return {
      allowed: false,
      reason: 'Monthly AI budget exceeded. Please upgrade your plan.',
      budgetStatus,
    };
  }

  // Check if tokens would exceed limit
  if (estimatedTokens > budgetStatus.tokensRemaining) {
    return {
      allowed: false,
      reason: 'Insufficient tokens remaining in monthly allocation',
      budgetStatus,
    };
  }

  // Check daily request limit
  if (budgetStatus.requestsToday >= budgetStatus.requestsLimit) {
    return {
      allowed: false,
      reason: 'Daily request limit reached. Try again tomorrow.',
      budgetStatus,
    };
  }

  return {
    allowed: true,
    budgetStatus,
  };
}

// ═══════════════════════════════════════════════════════════
// COST ANALYTICS
// ═══════════════════════════════════════════════════════════

/**
 * Get cost analytics for admin dashboard
 */
export async function getCostAnalytics(
  startDate: Date,
  endDate: Date
) {
  const supabase = await createClient();

  // Total cost across all users
  const { data: totalCost } = await supabase
    .from('ai_usage_logs')
    .select('cost_usd')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Cost by provider
  const { data: costByProvider } = await supabase
    .from('ai_usage_logs')
    .select('provider, cost_usd, total_tokens')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Cost by user plan
  const { data: costByPlan } = await supabase
    .from('ai_usage_logs')
    .select('cost_usd, user_id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString()) as { data: any[] | null };

  // Daily cost trend
  const { data: dailyCost } = await (supabase
    .from('ai_usage_logs') as any)
    .select('created_at, cost_usd')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true }) as { data: Array<{ created_at: string; cost_usd: number }> | null };

  // Top users by cost
  const { data: topUsers } = await supabase
    .from('ai_usage_logs')
    .select(`
      cost_usd,
      total_tokens,
      user_id
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('cost_usd', { ascending: false })
    .limit(10);

  // Aggregate results
  const totalCostValue = totalCost?.reduce((sum: number, r: { cost_usd?: number }) => sum + (r.cost_usd || 0), 0) || 0;

  const providerCosts: Record<string, { cost: number; tokens: number }> = {};
  for (const record of costByProvider || []) {
    if (!providerCosts[record.provider]) {
      providerCosts[record.provider] = { cost: 0, tokens: 0 };
    }
    providerCosts[record.provider].cost += record.cost_usd || 0;
    providerCosts[record.provider].tokens += record.total_tokens || 0;
  }

  const planCosts: Record<string, { cost: number; users: Set<string> }> = {};
  for (const record of costByPlan || []) {
    const plan = (record.users as any)?.subscription_plan || 'free';
    if (!planCosts[plan]) {
      planCosts[plan] = { cost: 0, users: new Set() };
    }
    planCosts[plan].cost += record.cost_usd || 0;
    planCosts[plan].users.add(record.user_id);
  }

  // Convert daily cost to array
  const dailyCostTrend: Record<string, number> = {};
  for (const record of dailyCost || []) {
    const date = new Date(record.created_at).toISOString().split('T')[0];
    dailyCostTrend[date] = (dailyCostTrend[date] || 0) + (record.cost_usd || 0);
  }

  return {
    totalCost: totalCostValue,
    providerCosts,
    planCosts: Object.fromEntries(
      Object.entries(planCosts).map(([plan, data]) => [
        plan,
        { cost: data.cost, users: data.users.size },
      ])
    ),
    dailyCostTrend,
    topUsers: topUsers?.slice(0, 10) || [],
  };
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export const costTracker = {
  // Pricing
  PROVIDER_PRICING,
  PLAN_LIMITS,
  // Token counting
  estimateTokens,
  countMessageTokens,
  // Cost calculation
  calculateCost,
  calculateCostFromEstimate,
  // Database tracking
  recordUsage,
  getUsageSummary,
  getBudgetStatus,
  checkUsageLimits,
  // Analytics
  getCostAnalytics,
};
