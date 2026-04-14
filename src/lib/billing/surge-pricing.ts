/**
 * Phase 15: Surge Pricing System
 * Dynamic pricing based on demand, provider costs, and capacity
 */

// Router removed — per-agent provider preferences now handle routing via callAI()

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SurgeState {
  isActive: boolean;
  multiplier: number;
  reason: string;
  triggeredAt: number;
  estimatedEnd?: number;
  demandLevel: 'low' | 'normal' | 'high' | 'very_high' | 'extreme';
}

export interface SurgeConfig {
  enabled: boolean;
  thresholds: {
    high: number; // 0.7 = 70% capacity
    veryHigh: number; // 0.85 = 85% capacity
    extreme: number; // 0.95 = 95% capacity
  };
  multipliers: {
    high: number; // 1.25 = 25% increase
    veryHigh: number; // 1.5 = 50% increase
    extreme: number; // 2.0 = 100% increase
  };
  cooldownMinutes: number;
  providerCostPassthrough: boolean; // Pass provider cost increases to users
}

export interface DemandMetrics {
  totalCapacity: number;
  currentDemand: number;
  utilizationPercent: number;
  providerHealth: {
    provider: string;
    healthy: boolean;
    utilization: number;
  }[];
  avgLatencyMs: number;
  errorRate: number;
}

export interface SurgeDecision {
  shouldApplySurge: boolean;
  multiplier: number;
  reason: string;
  demandLevel: SurgeState['demandLevel'];
  factors: {
    utilizationFactor: number;
    healthFactor: number;
    latencyFactor: number;
    costFactor: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_SURGE_CONFIG: SurgeConfig = {
  enabled: true,
  thresholds: {
    high: 0.70, // 70% capacity
    veryHigh: 0.85, // 85% capacity
    extreme: 0.95, // 95% capacity
  },
  multipliers: {
    high: 1.25, // 25% increase
    veryHigh: 1.50, // 50% increase
    extreme: 2.00, // 100% increase
  },
  cooldownMinutes: 10,
  providerCostPassthrough: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// SURGE PRICING MANAGER
// ═══════════════════════════════════════════════════════════════════════════

export class SurgePricingManager {
  private config: SurgeConfig;
  private currentState: SurgeState;
  private lastAdjustment: number = 0;
  private demandHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;

  constructor(config?: Partial<SurgeConfig>) {
    this.config = { ...DEFAULT_SURGE_CONFIG, ...config };
    this.currentState = {
      isActive: false,
      multiplier: 1.0,
      reason: '',
      triggeredAt: 0,
      demandLevel: 'normal',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEMAND ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current demand metrics.
   * Previously sourced from the legacy AI provider router; now returns
   * neutral defaults because per-agent provider preferences handle routing.
   */
  async getDemandMetrics(): Promise<DemandMetrics> {
    return {
      totalCapacity: 100,
      currentDemand: 0,
      utilizationPercent: 0,
      providerHealth: [],
      avgLatencyMs: 0,
      errorRate: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SURGE DECISION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Determine if surge pricing should be applied
   */
  async assessSurge(): Promise<SurgeDecision> {
    const metrics = await this.getDemandMetrics();

    // Track demand history for trend analysis
    this.demandHistory.push(metrics.utilizationPercent / 100);
    if (this.demandHistory.length > this.HISTORY_SIZE) {
      this.demandHistory.shift();
    }

    // Calculate factors
    const utilizationFactor = this.calculateUtilizationFactor(metrics.utilizationPercent / 100);
    const healthFactor = this.calculateHealthFactor(metrics.providerHealth);
    const latencyFactor = this.calculateLatencyFactor(metrics.avgLatencyMs);
    const costFactor = await this.calculateCostFactor();

    // Determine demand level
    let demandLevel: SurgeState['demandLevel'] = 'normal';
    let multiplier = 1.0;
    let reason = '';

    if (metrics.utilizationPercent >= this.config.thresholds.extreme * 100) {
      demandLevel = 'extreme';
      multiplier = this.config.multipliers.extreme;
      reason = 'Extreme demand - near capacity limits';
    } else if (metrics.utilizationPercent >= this.config.thresholds.veryHigh * 100) {
      demandLevel = 'very_high';
      multiplier = this.config.multipliers.veryHigh;
      reason = 'Very high demand - capacity constrained';
    } else if (metrics.utilizationPercent >= this.config.thresholds.high * 100) {
      demandLevel = 'high';
      multiplier = this.config.multipliers.high;
      reason = 'High demand - moderate capacity constraints';
    }

    // Adjust multiplier based on health
    if (healthFactor < 0.5) {
      // More than half of providers unhealthy - increase surge
      multiplier *= 1.2;
      reason += '; Provider health issues';
    }

    // Adjust multiplier based on latency
    if (latencyFactor < 0.5) {
      // High latency - increase surge
      multiplier *= 1.1;
      reason += '; High latency detected';
    }

    // Check if surge should be applied
    const shouldApplySurge = this.config.enabled && multiplier > 1.0;

    // Check cooldown
    const now = Date.now();
    const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
    if (now - this.lastAdjustment < cooldownMs) {
      // Within cooldown - don't change state, but return current assessment
      return {
        shouldApplySurge: this.currentState.isActive,
        multiplier: this.currentState.multiplier,
        reason: this.currentState.reason,
        demandLevel: this.currentState.demandLevel,
        factors: {
          utilizationFactor,
          healthFactor,
          latencyFactor,
          costFactor,
        },
      };
    }

    this.lastAdjustment = now;

    return {
      shouldApplySurge,
      multiplier,
      reason,
      demandLevel,
      factors: {
        utilizationFactor,
        healthFactor,
        latencyFactor,
        costFactor,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FACTOR CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  private calculateUtilizationFactor(utilization: number): number {
    // 0% = 1.0 (best), 100% = 0 (worst)
    return 1 - utilization;
  }

  private calculateHealthFactor(providers: DemandMetrics['providerHealth']): number {
    if (providers.length === 0) return 0;

    const healthyRatio = providers.filter((p) => p.healthy).length / providers.length;
    const avgUtilization = providers.reduce((sum, p) => sum + p.utilization, 0) / providers.length;

    // Weight: 70% healthy ratio, 30% inverse utilization
    return healthyRatio * 0.7 + (1 - avgUtilization / 100) * 0.3;
  }

  private calculateLatencyFactor(avgLatencyMs: number): number {
    // <500ms = 1.0, >3000ms = 0
    if (avgLatencyMs <= 500) return 1.0;
    if (avgLatencyMs >= 3000) return 0;
    return 1 - (avgLatencyMs - 500) / 2500;
  }

  private async calculateCostFactor(): Promise<number> {
    if (!this.config.providerCostPassthrough) {
      return 1.0; // Don't factor in provider costs
    }

    // This would ideally check current provider costs
    // For now, return neutral factor
    return 1.0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update surge state based on current assessment
   */
  async updateState(): Promise<SurgeState> {
    const decision = await this.assessSurge();

    const previousState = { ...this.currentState };

    if (decision.shouldApplySurge && !this.currentState.isActive) {
      // Activating surge
      this.currentState = {
        isActive: true,
        multiplier: decision.multiplier,
        reason: decision.reason,
        triggeredAt: Date.now(),
        demandLevel: decision.demandLevel,
      };
      console.debug(`[SurgePricing] Surge activated: ${decision.multiplier.toFixed(2)}x - ${decision.reason}`);
    } else if (!decision.shouldApplySurge && this.currentState.isActive) {
      // Deactivating surge
      this.currentState = {
        isActive: false,
        multiplier: 1.0,
        reason: '',
        triggeredAt: 0,
        demandLevel: 'normal',
      };
      console.debug('[SurgePricing] Surge deactivated');
    } else if (decision.shouldApplySurge && decision.multiplier !== this.currentState.multiplier) {
      // Updating existing surge
      const multiplierChange = Math.abs(decision.multiplier - this.currentState.multiplier);
      if (multiplierChange >= 0.1) {
        this.currentState.multiplier = decision.multiplier;
        this.currentState.reason = decision.reason;
        this.currentState.demandLevel = decision.demandLevel;
        console.debug(`[SurgePricing] Surge updated: ${decision.multiplier.toFixed(2)}x`);
      }
    }

    return this.currentState;
  }

  /**
   * Get current surge state
   */
  getCurrentState(): SurgeState {
    return { ...this.currentState };
  }

  /**
   * Get current multiplier
   */
  getCurrentMultiplier(): number {
    return this.currentState.multiplier;
  }

  /**
   * Check if surge is active
   */
  isSurgeActive(): boolean {
    return this.currentState.isActive;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANUAL OVERRIDE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Manually set surge multiplier (for admin override)
   */
  setManualSurge(multiplier: number, reason: string, durationMinutes?: number): void {
    const now = Date.now();

    this.currentState = {
      isActive: multiplier > 1.0,
      multiplier: Math.max(1.0, Math.min(multiplier, 3.0)), // Cap at 3x
      reason: reason || 'Manual override',
      triggeredAt: now,
      estimatedEnd: durationMinutes ? now + durationMinutes * 60 * 1000 : undefined,
      demandLevel: multiplier >= 2.0 ? 'extreme' : multiplier >= 1.5 ? 'very_high' : 'high',
    };

    console.debug(`[SurgePricing] Manual surge set: ${multiplier.toFixed(2)}x - ${reason}`);

    // Auto-clear after duration if specified
    if (durationMinutes) {
      setTimeout(() => {
        this.clearManualSurge();
      }, durationMinutes * 60 * 1000);
    }
  }

  /**
   * Clear manual surge
   */
  clearManualSurge(): void {
    this.currentState = {
      isActive: false,
      multiplier: 1.0,
      reason: '',
      triggeredAt: 0,
      demandLevel: 'normal',
    };
    console.debug('[SurgePricing] Manual surge cleared');
  }

  /**
   * Enable/disable surge pricing
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.currentState = {
        isActive: false,
        multiplier: 1.0,
        reason: '',
        triggeredAt: 0,
        demandLevel: 'normal',
      };
    }
    console.debug(`[SurgePricing] Surge pricing ${enabled ? 'enabled' : 'disabled'}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get surge analytics
   */
  getAnalytics(): {
    isActive: boolean;
    currentMultiplier: number;
    demandLevel: string;
    demandHistory: number[];
    config: SurgeConfig;
    timeInSurge: number; // Minutes in surge today
  } {
    // Calculate time in surge today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let timeInSurge = 0;

    if (this.currentState.isActive && this.currentState.triggeredAt) {
      const surgeStart = new Date(this.currentState.triggeredAt);
      if (surgeStart >= startOfDay) {
        timeInSurge = (now.getTime() - surgeStart.getTime()) / (1000 * 60);
      }
    }

    return {
      isActive: this.currentState.isActive,
      currentMultiplier: this.currentState.multiplier,
      demandLevel: this.currentState.demandLevel,
      demandHistory: [...this.demandHistory],
      config: { ...this.config },
      timeInSurge: Math.round(timeInSurge),
    };
  }

  /**
   * Get surge state for API response
   */
  getAPIResponse(): {
    surge: {
      active: boolean;
      multiplier: number;
      reason: string;
      demandLevel: string;
      estimatedEnd?: number;
    };
    metrics: {
      utilizationPercent: number;
      healthyProviders: number;
      totalProviders: number;
    };
  } {
    const metrics = this.getDemandMetrics();

    return {
      surge: {
        active: this.currentState.isActive,
        multiplier: this.currentState.multiplier,
        reason: this.currentState.reason,
        demandLevel: this.currentState.demandLevel,
        estimatedEnd: this.currentState.estimatedEnd,
      },
      metrics: {
        utilizationPercent: 0, // Will be populated async
        healthyProviders: 0,
        totalProviders: 0,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let surgeManagerInstance: SurgePricingManager | null = null;

export function getSurgePricingManager(config?: Partial<SurgeConfig>): SurgePricingManager {
  if (!surgeManagerInstance) {
    surgeManagerInstance = new SurgePricingManager(config);
  }
  return surgeManagerInstance;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-UPDATE LOOP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start automatic surge state updates
 * Call this once at application startup
 */
export function startSurgeAutoUpdate(intervalMinutes: number = 5): void {
  const manager = getSurgePricingManager();

  const updateLoop = async () => {
    try {
      await manager.updateState();
    } catch (error) {
      console.error('[SurgePricing] Error during auto-update:', error);
    }
  };

  // Initial update
  updateLoop();

  // Periodic updates
  setInterval(updateLoop, intervalMinutes * 60 * 1000);

  console.debug(`[SurgePricing] Auto-update started every ${intervalMinutes} minutes`);
}
