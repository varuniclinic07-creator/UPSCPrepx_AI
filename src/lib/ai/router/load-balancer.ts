/**
 * Phase 14: Advanced Load Balancer
 * Weighted distribution with real-time rebalancing
 */

import { ProviderName, PROVIDER_CONFIGS, ProviderHealth, LoadBalanceState } from './ai-provider-router';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LoadBalancerConfig {
  rebalanceIntervalMs: number;
  weightAdjustmentFactor: number;
  maxWeightChangePerRebalance: number;
  healthWeightFactor: number;
  latencyWeightFactor: number;
}

export interface ProviderCapacity {
  provider: ProviderName;
  maxConcurrent: number;
  currentActive: number;
  availableSlots: number;
  utilizationPercent: number;
  effectiveCapacity: number;
}

export interface WeightedProvider {
  provider: ProviderName;
  weight: number;
  normalizedWeight: number;
  selectionProbability: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: LoadBalancerConfig = {
  rebalanceIntervalMs: 5000,
  weightAdjustmentFactor: 0.2,
  maxWeightChangePerRebalance: 0.15,
  healthWeightFactor: 0.4,
  latencyWeightFactor: 0.3,
};

// ═══════════════════════════════════════════════════════════════════════════
// LOAD BALANCER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class AdvancedLoadBalancer {
  private config: LoadBalancerConfig;
  private activeRequests: Map<ProviderName, number> = new Map();
  private weights: Map<ProviderName, number> = new Map();
  private healthStates: Map<ProviderName, ProviderHealth> = new Map();
  private rebalanceTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize equal weights for all providers
    const providers = Object.keys(PROVIDER_CONFIGS) as ProviderName[];
    const initialWeight = 1 / providers.length;

    providers.forEach((provider) => {
      this.activeRequests.set(provider, 0);
      this.weights.set(provider, initialWeight);
      this.healthStates.set(provider, {
        isHealthy: true,
        lastHealthCheck: Date.now(),
        consecutiveFailures: 0,
        successRate: 1.0,
        avgLatencyMs: 0,
        requestsPerMinute: 0,
        circuitState: 'CLOSED',
      });
    });
  }

  /**
   * Start automatic rebalancing
   */
  startAutoRebalance(): void {
    if (this.rebalanceTimer) {
      return;
    }

    this.rebalanceTimer = setInterval(() => {
      this.rebalance();
    }, this.config.rebalanceIntervalMs);

    console.log(
      `[LoadBalancer] Auto-rebalance started every ${this.config.rebalanceIntervalMs}ms`
    );
  }

  /**
   * Stop automatic rebalancing
   */
  stopAutoRebalance(): void {
    if (this.rebalanceTimer) {
      clearInterval(this.rebalanceTimer);
      this.rebalanceTimer = null;
      console.log('[LoadBalancer] Auto-rebalance stopped');
    }
  }

  /**
   * Start a request on a provider
   */
  startRequest(provider: ProviderName): void {
    const current = this.activeRequests.get(provider) || 0;
    this.activeRequests.set(provider, current + 1);
  }

  /**
   * End a request on a provider
   */
  endRequest(provider: ProviderName): void {
    const current = this.activeRequests.get(provider) || 0;
    this.activeRequests.set(provider, Math.max(0, current - 1));
  }

  /**
   * Update health state for a provider
   */
  updateHealth(provider: ProviderName, health: ProviderHealth): void {
    this.healthStates.set(provider, health);
    // Trigger immediate rebalance if health changed significantly
    if (health.circuitState === 'OPEN' || health.successRate < 0.5) {
      this.rebalance();
    }
  }

  /**
   * Select provider using weighted random selection
   */
  selectProvider(excludeProviders: ProviderName[] = []): ProviderName {
    const providers = Object.keys(PROVIDER_CONFIGS)
      .filter((key) => {
        const provider = key as ProviderName;
        const config = PROVIDER_CONFIGS[provider];
        return config.isActive && !excludeProviders.includes(provider);
      }) as ProviderName[];

    if (providers.length === 0) {
      throw new Error('No available providers');
    }

    if (providers.length === 1) {
      return providers[0];
    }

    // Get current weights for available providers
    const weightedProviders: WeightedProvider[] = providers.map((provider) => {
      const weight = this.weights.get(provider) || 0;
      const health = this.healthStates.get(provider);
      const capacity = this.getCapacity(provider);

      // Adjust weight based on health and capacity
      let adjustedWeight = weight;

      // Reduce weight for unhealthy providers
      if (health && health.circuitState !== 'CLOSED') {
        adjustedWeight *= health.circuitState === 'HALF_OPEN' ? 0.5 : 0;
      }

      // Reduce weight for high utilization
      if (capacity.utilizationPercent > 80) {
        adjustedWeight *= 0.5;
      } else if (capacity.utilizationPercent > 60) {
        adjustedWeight *= 0.8;
      }

      return {
        provider,
        weight,
        normalizedWeight: 0,
        selectionProbability: 0,
      };
    });

    // Normalize weights
    const totalWeight = weightedProviders.reduce((sum, wp) => sum + wp.weight, 0);
    weightedProviders.forEach((wp) => {
      wp.normalizedWeight = totalWeight > 0 ? wp.weight / totalWeight : 1 / weightedProviders.length;
    });

    // Calculate cumulative probabilities
    let cumulative = 0;
    weightedProviders.forEach((wp, index) => {
      cumulative += wp.normalizedWeight;
      wp.selectionProbability = cumulative;
    });

    // Weighted random selection
    const random = Math.random();
    let selected = weightedProviders[0].provider;

    for (const wp of weightedProviders) {
      if (random <= wp.selectionProbability) {
        selected = wp.provider;
        break;
      }
    }

    return selected;
  }

  /**
   * Select best provider (lowest load + latency)
   */
  selectBestProvider(excludeProviders: ProviderName[] = []): ProviderName {
    const providers = Object.keys(PROVIDER_CONFIGS)
      .filter((key) => {
        const provider = key as ProviderName;
        const config = PROVIDER_CONFIGS[provider];
        return config.isActive && !excludeProviders.includes(provider);
      }) as ProviderName[];

    if (providers.length === 0) {
      throw new Error('No available providers');
    }

    if (providers.length === 1) {
      return providers[0];
    }

    // Score each provider
    let bestProvider = providers[0];
    let bestScore = -Infinity;

    for (const provider of providers) {
      const health = this.healthStates.get(provider);
      const capacity = this.getCapacity(provider);

      // Skip unhealthy providers
      if (health?.circuitState === 'OPEN') {
        continue;
      }

      // Calculate score
      const latencyScore = health && health.avgLatencyMs > 0
        ? 1 - Math.min(1, health.avgLatencyMs / 5000)
        : 0.5;

      const loadScore = 1 - capacity.utilizationPercent / 100;
      const healthScore = health?.successRate || 0.5;

      const score =
        latencyScore * this.config.latencyWeightFactor +
        loadScore * (1 - this.config.latencyWeightFactor) +
        healthScore * this.config.healthWeightFactor;

      if (score > bestScore) {
        bestScore = score;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }

  /**
   * Get provider capacity
   */
  getCapacity(provider: ProviderName): ProviderCapacity {
    const config = PROVIDER_CONFIGS[provider];
    const active = this.activeRequests.get(provider) || 0;

    return {
      provider,
      maxConcurrent: config.rateLimitConcurrent,
      currentActive: active,
      availableSlots: Math.max(0, config.rateLimitConcurrent - active),
      utilizationPercent: (active / config.rateLimitConcurrent) * 100,
      effectiveCapacity: config.rateLimitConcurrent - active,
    };
  }

  /**
   * Get all provider capacities
   */
  getAllCapacities(): Record<ProviderName, ProviderCapacity> {
    const result: Record<ProviderName, ProviderCapacity> = {} as any;

    Object.keys(PROVIDER_CONFIGS).forEach((key) => {
      const provider = key as ProviderName;
      result[provider] = this.getCapacity(provider);
    });

    return result;
  }

  /**
   * Rebalance weights based on current state
   */
  private rebalance(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const providers = Object.keys(PROVIDER_CONFIGS)
        .filter((key) => PROVIDER_CONFIGS[key as ProviderName].isActive) as ProviderName[];

      if (providers.length <= 1) {
        return; // No need to rebalance with 0-1 providers
      }

      // Calculate new weights based on health and capacity
      const newWeights: Map<ProviderName, number> = new Map();
      let totalWeight = 0;

      for (const provider of providers) {
        const health = this.healthStates.get(provider);
        const capacity = this.getCapacity(provider);
        const currentWeight = this.weights.get(provider) || 0;

        // Start with equal base weight
        let newWeight = 1 / providers.length;

        // Adjust for health
        if (health) {
          if (health.circuitState === 'OPEN') {
            newWeight = 0;
          } else if (health.circuitState === 'HALF_OPEN') {
            newWeight *= 0.5;
          }
          newWeight *= health.successRate;
        }

        // Adjust for capacity
        const capacityFactor = 1 - capacity.utilizationPercent / 100;
        newWeight *= capacityFactor;

        // Limit weight change per rebalance
        const maxChange = this.config.maxWeightChangePerRebalance;
        const oldWeight = currentWeight;
        let weightChange = newWeight - oldWeight;

        if (weightChange > maxChange) {
          weightChange = maxChange;
        } else if (weightChange < -maxChange) {
          weightChange = -maxChange;
        }

        newWeight = oldWeight + weightChange;
        newWeights.set(provider, Math.max(0, newWeight));
        totalWeight += newWeight;
      }

      // Normalize weights to sum to 1
      if (totalWeight > 0) {
        for (const [provider, weight] of newWeights.entries()) {
          this.weights.set(provider, weight / totalWeight);
        }
      }

      // Log rebalance
      const weightStr = providers
        .map((p) => `${p}: ${(this.weights.get(p) || 0 * 100).toFixed(1)}%`)
        .join(', ');
      console.log(`[LoadBalancer] Rebalanced: ${weightStr}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get current weights
   */
  getWeights(): Record<ProviderName, number> {
    const result: Record<ProviderName, number> = {} as any;

    Object.keys(PROVIDER_CONFIGS).forEach((key) => {
      const provider = key as ProviderName;
      result[provider] = this.weights.get(provider) || 0;
    });

    return result;
  }

  /**
   * Get active request counts
   */
  getActiveRequests(): Record<ProviderName, number> {
    const result: Record<ProviderName, number> = {} as any;

    Object.keys(PROVIDER_CONFIGS).forEach((key) => {
      const provider = key as ProviderName;
      result[provider] = this.activeRequests.get(provider) || 0;
    });

    return result;
  }

  /**
   * Get load balancer state for monitoring
   */
  getState(): {
    weights: Record<ProviderName, number>;
    activeRequests: Record<ProviderName, number>;
    capacities: Record<ProviderName, ProviderCapacity>;
    timestamp: number;
  } {
    return {
      weights: this.getWeights(),
      activeRequests: this.getActiveRequests(),
      capacities: this.getAllCapacities(),
      timestamp: Date.now(),
    };
  }

  /**
   * Reset all state
   */
  reset(): void {
    const providers = Object.keys(PROVIDER_CONFIGS) as ProviderName[];
    const initialWeight = 1 / providers.length;

    providers.forEach((provider) => {
      this.activeRequests.set(provider, 0);
      this.weights.set(provider, initialWeight);
    });

    console.log('[LoadBalancer] State reset');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let loadBalancerInstance: AdvancedLoadBalancer | null = null;

export function getAdvancedLoadBalancer(config?: Partial<LoadBalancerConfig>): AdvancedLoadBalancer {
  if (!loadBalancerInstance) {
    loadBalancerInstance = new AdvancedLoadBalancer(config);
  }
  return loadBalancerInstance;
}
