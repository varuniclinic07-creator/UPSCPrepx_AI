/**
 * Phase 14: Intelligent AI Provider Router
 * Multi-provider routing with cost, latency, availability, and plan-based selection
 */

import { PROVIDER_PRICING, PLAN_LIMITS } from '@/lib/ai-cost/cost-tracker';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ProviderName = 'ollama' | 'groq' | 'anthropic' | 'openai';

export type UserPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export interface ProviderConfig {
  name: ProviderName;
  baseUrl: string;
  apiKeyEnv: string;
  models: string[];
  priority: number;
  rateLimitRPM: number;
  rateLimitConcurrent: number;
  maxTokensPerRequest: number;
  supportsStreaming: boolean;
  isActive: boolean;
}

export interface ProviderHealth {
  isHealthy: boolean;
  lastHealthCheck: number;
  consecutiveFailures: number;
  successRate: number; // Last 100 requests
  avgLatencyMs: number; // Rolling average
  requestsPerMinute: number; // Current load
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface ProviderScore {
  provider: ProviderName;
  totalScore: number;
  costScore: number;
  latencyScore: number;
  healthScore: number;
  loadScore: number;
  planBonus: number;
  breakdown: {
    costWeight: number;
    latencyWeight: number;
    healthWeight: number;
    loadWeight: number;
  };
}

export interface RoutingOptions {
  userId: string;
  userPlan: UserPlan;
  estimatedTokens: number;
  requiresStreaming?: boolean;
  priority?: 'cost' | 'speed' | 'quality' | 'balanced';
  budgetLimit?: number; // Max cost user is willing to pay
  maxLatencyMs?: number; // Max acceptable latency
  allowedProviders?: ProviderName[]; // Restrict to specific providers
}

export interface RoutingDecision {
  selectedProvider: ProviderName;
  selectedModel: string;
  reason: string;
  estimatedCost: number;
  estimatedLatencyMs: number;
  fallbackProviders: ProviderName[];
  scoreBreakdown: ProviderScore[];
}

export interface LoadBalanceState {
  provider: ProviderName;
  activeRequests: number;
  weights: { current: number; target: number };
  lastRebalance: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  ollama: {
    name: 'ollama',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    apiKeyEnv: 'OLLAMA_API_KEY',
    models: [
      process.env.OLLAMA_MODEL || 'qwen3.5:397b-cloud',
      'llama3.1:70b',
      'mixtral:8x7b',
      'gemma2:9b',
    ],
    priority: 1, // Primary
    rateLimitRPM: 20,
    rateLimitConcurrent: 5,
    maxTokensPerRequest: 32000,
    supportsStreaming: true,
    isActive: true,
  },
  groq: {
    name: 'groq',
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    models: [
      process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    priority: 2, // Fallback
    rateLimitRPM: 30,
    rateLimitConcurrent: 10,
    maxTokensPerRequest: 32768,
    supportsStreaming: true,
    isActive: true,
  },
  anthropic: {
    name: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
    ],
    priority: 4,
    rateLimitRPM: 50,
    rateLimitConcurrent: 15,
    maxTokensPerRequest: 128000,
    supportsStreaming: true,
    isActive: false, // Disabled by default, enable via env
  },
  openai: {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    models: [
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ],
    priority: 5,
    rateLimitRPM: 60,
    rateLimitConcurrent: 20,
    maxTokensPerRequest: 128000,
    supportsStreaming: true,
    isActive: false, // Disabled by default, enable via env
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SCORING WEIGHTS (adjustable based on priority)
// ═══════════════════════════════════════════════════════════════════════════

const PRIORITY_WEIGHTS: Record<Required<RoutingOptions>['priority'], {
  cost: number;
  latency: number;
  health: number;
  load: number;
}> = {
  cost: { cost: 0.5, latency: 0.2, health: 0.2, load: 0.1 },
  speed: { cost: 0.1, latency: 0.5, health: 0.2, load: 0.2 },
  quality: { cost: 0.2, latency: 0.2, health: 0.4, load: 0.2 },
  balanced: { cost: 0.3, latency: 0.3, health: 0.25, load: 0.15 },
};

// Plan-based provider preferences (higher = more preferred)
const PLAN_PROVIDER_PREFERENCES: Record<UserPlan, Record<ProviderName, number>> = {
  free: {
    ollama: 1.0,
    groq: 0.9,
    anthropic: 0.3, // Low preference due to cost
    openai: 0.3,
  },
  basic: {
    ollama: 1.0,
    groq: 1.0,
    anthropic: 0.5,
    openai: 0.5,
  },
  premium: {
    ollama: 1.0,
    groq: 1.0,
    anthropic: 0.8,
    openai: 0.8,
  },
  enterprise: {
    ollama: 1.0,
    groq: 1.0,
    anthropic: 1.0,
    openai: 1.0,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH MONITORING
// ═══════════════════════════════════════════════════════════════════════════

class ProviderHealthMonitor {
  private healthStates: Map<ProviderName, ProviderHealth> = new Map();
  private latencyHistory: Map<ProviderName, number[]> = new Map();
  private readonly MAX_HISTORY = 100;

  constructor() {
    // Initialize health states for all providers
    Object.keys(PROVIDER_CONFIGS).forEach((key) => {
      const provider = key as ProviderName;
      this.healthStates.set(provider, {
        isHealthy: true,
        lastHealthCheck: Date.now(),
        consecutiveFailures: 0,
        successRate: 1.0,
        avgLatencyMs: 0,
        requestsPerMinute: 0,
        circuitState: 'CLOSED',
      });
      this.latencyHistory.set(provider, []);
    });
  }

  recordSuccess(provider: ProviderName, latencyMs: number): void {
    const health = this.healthStates.get(provider);
    if (!health) return;

    health.consecutiveFailures = 0;
    health.isHealthy = true;
    health.circuitState = 'CLOSED';

    // Update latency history
    const history = this.latencyHistory.get(provider) || [];
    history.push(latencyMs);
    if (history.length > this.MAX_HISTORY) history.shift();
    this.latencyHistory.set(provider, history);

    // Calculate rolling average
    health.avgLatencyMs = history.reduce((a, b) => a + b, 0) / history.length;

    // Update success rate (exponential moving average)
    health.successRate = health.successRate * 0.95 + 0.05;

    health.lastHealthCheck = Date.now();
  }

  recordFailure(provider: ProviderName, error?: Error): void {
    const health = this.healthStates.get(provider);
    if (!health) return;

    health.consecutiveFailures++;
    health.successRate = health.successRate * 0.95;

    // Open circuit breaker after 5 consecutive failures
    if (health.consecutiveFailures >= 5) {
      health.circuitState = 'OPEN';
      health.isHealthy = false;
      console.warn(`[ProviderRouter] Circuit breaker OPEN for ${provider} after ${health.consecutiveFailures} failures`);
    } else if (health.consecutiveFailures >= 3) {
      health.circuitState = 'HALF_OPEN';
    }

    health.lastHealthCheck = Date.now();
  }

  getHealth(provider: ProviderName): ProviderHealth {
    return (
      this.healthStates.get(provider) || {
        isHealthy: false,
        lastHealthCheck: Date.now(),
        consecutiveFailures: 0,
        successRate: 0,
        avgLatencyMs: 0,
        requestsPerMinute: 0,
        circuitState: 'OPEN',
      }
    );
  }

  getAllHealth(): Record<ProviderName, ProviderHealth> {
    const result: Record<ProviderName, ProviderHealth> = {} as any;
    for (const [provider, health] of this.healthStates.entries()) {
      result[provider] = { ...health };
    }
    return result;
  }

  updateLoad(provider: ProviderName, delta: number): void {
    const health = this.healthStates.get(provider);
    if (!health) return;
    health.requestsPerMinute = Math.max(0, health.requestsPerMinute + delta);
  }

  resetCircuit(provider: ProviderName): void {
    const health = this.healthStates.get(provider);
    if (!health) return;
    health.circuitState = 'CLOSED';
    health.consecutiveFailures = 0;
    health.isHealthy = true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOAD BALANCER
// ═══════════════════════════════════════════════════════════════════════════

class LoadBalancer {
  private state: Map<ProviderName, LoadBalanceState> = new Map();
  private readonly REBALANCE_INTERVAL_MS = 5000;

  constructor() {
    Object.keys(PROVIDER_CONFIGS).forEach((key) => {
      const provider = key as ProviderName;
      const config = PROVIDER_CONFIGS[provider];
      this.state.set(provider, {
        provider,
        activeRequests: 0,
        weights: {
          current: 1.0 / Object.keys(PROVIDER_CONFIGS).length,
          target: 1.0 / Object.keys(PROVIDER_CONFIGS).length,
        },
        lastRebalance: Date.now(),
      });
    });
  }

  startRequest(provider: ProviderName): void {
    const state = this.state.get(provider);
    if (!state) return;
    state.activeRequests++;
  }

  endRequest(provider: ProviderName): void {
    const state = this.state.get(provider);
    if (!state) return;
    state.activeRequests = Math.max(0, state.activeRequests - 1);
  }

  getActiveRequests(provider: ProviderName): number {
    return this.state.get(provider)?.activeRequests || 0;
  }

  shouldRebalance(): boolean {
    const states = Array.from(this.state.values());
    const maxLoad = Math.max(...states.map((s) => s.activeRequests));
    const minLoad = Math.min(...states.map((s) => s.activeRequests));
    return maxLoad - minLoad > 5; // Rebalance if difference > 5 requests
  }

  getWeights(): Record<ProviderName, number> {
    const result: Record<ProviderName, number> = {} as any;
    for (const [provider, state] of this.state.entries()) {
      result[provider] = state.weights.current;
    }
    return result;
  }

  getState(): Record<ProviderName, LoadBalanceState> {
    const result: Record<ProviderName, LoadBalanceState> = {} as any;
    for (const [provider, state] of this.state.entries()) {
      result[provider] = { ...state };
    }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ROUTER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class AIProviderRouter {
  private healthMonitor: ProviderHealthMonitor;
  private loadBalancer: LoadBalancer;

  constructor() {
    this.healthMonitor = new ProviderHealthMonitor();
    this.loadBalancer = new LoadBalancer();
  }

  /**
   * Select the best provider based on routing options
   */
  async selectProvider(options: RoutingOptions): Promise<RoutingDecision> {
    const {
      userPlan,
      estimatedTokens,
      requiresStreaming,
      priority = 'balanced',
      allowedProviders,
    } = options;

    const weights = PRIORITY_WEIGHTS[priority];
    const scores: ProviderScore[] = [];

    // Get active providers
    let activeProviders = Object.values(PROVIDER_CONFIGS)
      .filter((config) => config.isActive)
      .map((config) => config.name);

    // Filter by allowed providers if specified
    if (allowedProviders?.length) {
      activeProviders = activeProviders.filter((p) => allowedProviders.includes(p));
    }

    // Calculate score for each provider
    for (const provider of activeProviders) {
      const config = PROVIDER_CONFIGS[provider];
      const health = this.healthMonitor.getHealth(provider);

      // Skip unhealthy providers (circuit breaker OPEN)
      if (health.circuitState === 'OPEN') {
        continue;
      }

      // Skip if streaming required but not supported
      if (requiresStreaming && !config.supportsStreaming) {
        continue;
      }

      // Skip if tokens exceed provider limit
      if (estimatedTokens > config.maxTokensPerRequest) {
        continue;
      }

      // Calculate cost score (lower cost = higher score)
      const costScore = this.calculateCostScore(provider, estimatedTokens, userPlan);

      // Calculate latency score (lower latency = higher score)
      const latencyScore = this.calculateLatencyScore(provider);

      // Calculate health score
      const healthScore = health.successRate;

      // Calculate load score (lower load = higher score)
      const loadScore = this.calculateLoadScore(provider);

      // Calculate plan bonus
      const planBonus = PLAN_PROVIDER_PREFERENCES[userPlan][provider] || 0.5;

      // Weighted total score
      const totalScore =
        costScore * weights.cost +
        latencyScore * weights.latency +
        healthScore * weights.health +
        loadScore * weights.load +
        planBonus * 0.1; // 10% bonus weight for plan preference

      scores.push({
        provider,
        totalScore,
        costScore,
        latencyScore,
        healthScore,
        loadScore,
        planBonus,
        breakdown: {
          costWeight: weights.cost,
          latencyWeight: weights.latency,
          healthWeight: weights.health,
          loadWeight: weights.load,
        },
      });
    }

    // Sort by score (highest first)
    scores.sort((a, b) => b.totalScore - a.totalScore);

    if (scores.length === 0) {
      // All providers unavailable - return error decision
      return {
        selectedProvider: 'ollama' as ProviderName, // Default fallback
        selectedModel: PROVIDER_CONFIGS['ollama'].models[0],
        reason: 'All providers unavailable - using default',
        estimatedCost: 0,
        estimatedLatencyMs: 0,
        fallbackProviders: [],
        scoreBreakdown: [],
      };
    }

    const selected = scores[0];
    const fallbacks = scores.slice(1).map((s) => s.provider);

    // Calculate estimated cost
    const estimatedCost = this.estimateCost(selected.provider, estimatedTokens);

    // Calculate estimated latency
    const estimatedLatency = this.healthMonitor.getHealth(selected.provider).avgLatencyMs || 1000;

    return {
      selectedProvider: selected.provider,
      selectedModel: PROVIDER_CONFIGS[selected.provider].models[0],
      reason: this.generateSelectionReason(selected, scores),
      estimatedCost,
      estimatedLatencyMs,
      fallbackProviders: fallbacks,
      scoreBreakdown: scores,
    };
  }

  /**
   * Calculate cost score (0-1, higher = cheaper)
   */
  private calculateCostScore(provider: ProviderName, tokens: number, userPlan: UserPlan): number {
    const cost = this.estimateCost(provider, tokens);
    const maxCost = PLAN_LIMITS[userPlan].maxCostPerMonth;

    // Normalize: lower cost = higher score
    if (cost <= 0) return 1.0;
    const relativeCost = Math.min(1, cost / maxCost);
    return 1 - relativeCost;
  }

  /**
   * Calculate latency score (0-1, higher = faster)
   */
  private calculateLatencyScore(provider: ProviderName): number {
    const health = this.healthMonitor.getHealth(provider);
    const avgLatency = health.avgLatencyMs;

    if (avgLatency <= 0) return 0.5; // No data yet

    // Normalize: <500ms = 1.0, >5000ms = 0
    const normalizedLatency = Math.min(1, avgLatency / 5000);
    return 1 - normalizedLatency;
  }

  /**
   * Calculate load score (0-1, higher = less loaded)
   */
  private calculateLoadScore(provider: ProviderName): number {
    const config = PROVIDER_CONFIGS[provider];
    const activeRequests = this.loadBalancer.getActiveRequests(provider);

    // Normalize by rate limit
    const loadRatio = activeRequests / config.rateLimitConcurrent;
    return 1 - Math.min(1, loadRatio);
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(provider: ProviderName, tokens: number): number {
    const pricingKey = this.getProviderPricingKey(provider);
    const pricing = PROVIDER_PRICING[pricingKey] || PROVIDER_PRICING['ollama-local'];

    // Assume 50% prompt / 50% completion for estimation
    const promptTokens = tokens * 0.5;
    const completionTokens = tokens * 0.5;

    const promptCost = (promptTokens / 1000) * pricing.promptCostPer1K;
    const completionCost = (completionTokens / 1000) * pricing.completionCostPer1K;

    return promptCost + completionCost;
  }

  /**
   * Get pricing key for provider
   */
  private getProviderPricingKey(provider: ProviderName): string {
    const mapping: Record<ProviderName, string> = {
      ollama: 'ollama-local',
      groq: 'groq-llama-70b',
      anthropic: 'claude-3-sonnet',
      openai: 'gpt-4o',
    };
    return mapping[provider];
  }

  /**
   * Generate human-readable selection reason
   */
  private generateSelectionReason(selected: ProviderScore, allScores: ProviderScore[]): string {
    const reasons: string[] = [];

    if (selected.costScore >= 0.8) {
      reasons.push('cost-effective');
    }
    if (selected.latencyScore >= 0.8) {
      reasons.push('low latency');
    }
    if (selected.healthScore >= 0.95) {
      reasons.push('high reliability');
    }
    if (selected.loadScore >= 0.8) {
      reasons.push('low load');
    }

    if (reasons.length === 0) {
      reasons.push('best overall score');
    }

    return `Selected ${selected.provider}: ${reasons.join(', ')}`;
  }

  /**
   * Record request success for health monitoring
   */
  recordSuccess(provider: ProviderName, latencyMs: number): void {
    this.healthMonitor.recordSuccess(provider, latencyMs);
    this.loadBalancer.endRequest(provider);
  }

  /**
   * Record request failure for health monitoring
   */
  recordFailure(provider: ProviderName, error?: Error): void {
    this.healthMonitor.recordFailure(provider, error);
    this.loadBalancer.endRequest(provider);
  }

  /**
   * Start tracking a request (for load balancing)
   */
  startRequest(provider: ProviderName): void {
    this.loadBalancer.startRequest(provider);
  }

  /**
   * Get provider health status
   */
  getProviderHealth(provider: ProviderName): ProviderHealth {
    return this.healthMonitor.getHealth(provider);
  }

  /**
   * Get all provider health status
   */
  getAllProviderHealth(): Record<ProviderName, ProviderHealth> {
    return this.healthMonitor.getAllHealth();
  }

  /**
   * Get load balancer state
   */
  getLoadBalancerState(): Record<ProviderName, LoadBalanceState> {
    return this.loadBalancer.getState();
  }

  /**
   * Reset circuit breaker for a provider
   */
  resetCircuit(provider: ProviderName): void {
    this.healthMonitor.resetCircuit(provider);
  }

  /**
   * Get routing metrics for monitoring
   */
  getRoutingMetrics(): {
    providerHealth: Record<ProviderName, ProviderHealth>;
    loadBalance: Record<ProviderName, LoadBalanceState>;
    timestamp: number;
  } {
    return {
      providerHealth: this.getAllProviderHealth(),
      loadBalance: this.getLoadBalancerState(),
      timestamp: Date.now(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let routerInstance: AIProviderRouter | null = null;

export function getAIProviderRouter(): AIProviderRouter {
  if (!routerInstance) {
    routerInstance = new AIProviderRouter();
  }
  return routerInstance;
}
