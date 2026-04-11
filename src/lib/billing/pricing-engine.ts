/**
 * Phase 15: Dynamic Pricing Engine
 * Plan-based pricing, usage tiers, margin calculation, and surge pricing
 */

import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export interface PlanPricing {
  plan: UserPlan;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  aiAllowance: {
    tokensPerMonth: number;
    requestsPerDay: number;
    maxTokensPerRequest: number;
    includedCost: number;
  };
  overage: {
    costPer1KTokens: number;
    costPerRequest: number;
  };
}

export interface UsageTier {
  from: number;
  to: number | null; // null = unlimited
  pricePer1KTokens: number;
  discountPercent: number;
}

export interface SurgePricingConfig {
  enabled: boolean;
  demandThreshold: number; // 0-1, e.g., 0.8 = 80% capacity
  surgeMultiplier: number; // e.g., 1.5 = 50% increase
  maxSurgeMultiplier: number; // e.g., 3.0 = max 3x
  cooldownMinutes: number;
}

export interface MarginConfig {
  targetMarginPercent: number; // e.g., 95 = 95% margin
  minMarginPercent: number; // e.g., 70 = 70% minimum
  costPlusMarkup: number; // e.g., 20 = 20% markup on cost
}

export interface PricingDecision {
  basePrice: number;
  usagePrice: number;
  surgeMultiplier: number;
  surgeReason: string;
  discount: number;
  discountReason: string;
  finalPrice: number;
  margin: number;
  breakdown: {
    planComponent: number;
    usageComponent: number;
    surgeComponent: number;
    discountComponent: number;
  };
}

export interface PriceQuote {
  userId: string;
  plan: UserPlan;
  estimatedTokens: number;
  basePrice: number;
  surgeApplied: boolean;
  finalPrice: number;
  validUntil: number;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN PRICING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const PLAN_PRICING: Record<UserPlan, PlanPricing> = {
  free: {
    plan: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'USD',
    features: [
      'Basic AI access',
      '100K tokens/month',
      '20 requests/day',
      'Community support',
      'Standard models only',
    ],
    aiAllowance: {
      tokensPerMonth: 100000,
      requestsPerDay: 20,
      maxTokensPerRequest: 4096,
      includedCost: 5, // $5 worth of AI cost included
    },
    overage: {
      costPer1KTokens: 0.10, // $0.10 per 1K tokens over limit
      costPerRequest: 0.05, // $0.05 per request over limit
    },
  },
  basic: {
    plan: 'basic',
    monthlyPrice: 29,
    yearlyPrice: 290, // ~17% discount
    currency: 'USD',
    features: [
      'Priority AI access',
      '500K tokens/month',
      '100 requests/day',
      'Email support',
      'All standard models',
      'Faster response times',
    ],
    aiAllowance: {
      tokensPerMonth: 500000,
      requestsPerDay: 100,
      maxTokensPerRequest: 8192,
      includedCost: 25, // $25 worth of AI cost included
    },
    overage: {
      costPer1KTokens: 0.08,
      costPerRequest: 0.04,
    },
  },
  premium: {
    plan: 'premium',
    monthlyPrice: 79,
    yearlyPrice: 790, // ~17% discount
    currency: 'USD',
    features: [
      'Unlimited AI access',
      '2M tokens/month',
      '500 requests/day',
      'Priority support',
      'Premium models (Claude, GPT-4)',
      'Advanced features',
      'Custom fine-tuning',
    ],
    aiAllowance: {
      tokensPerMonth: 2000000,
      requestsPerDay: 500,
      maxTokensPerRequest: 32768,
      includedCost: 100, // $100 worth of AI cost included
    },
    overage: {
      costPer1KTokens: 0.06,
      costPerRequest: 0.03,
    },
  },
  enterprise: {
    plan: 'enterprise',
    monthlyPrice: 199,
    yearlyPrice: 1990, // ~17% discount
    currency: 'USD',
    features: [
      'Enterprise AI access',
      '10M tokens/month',
      '2000 requests/day',
      '24/7 dedicated support',
      'All models including custom',
      'SLA guarantee',
      'Custom integrations',
      'Audit logs',
      'Team management',
    ],
    aiAllowance: {
      tokensPerMonth: 10000000,
      requestsPerDay: 2000,
      maxTokensPerRequest: 128000,
      includedCost: 500, // $500 worth of AI cost included
    },
    overage: {
      costPer1KTokens: 0.04,
      costPerRequest: 0.02,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// USAGE TIERS (for pay-as-you-go)
// ═══════════════════════════════════════════════════════════════════════════

export const USAGE_TIERS: UsageTier[] = [
  { from: 0, to: 100000, pricePer1KTokens: 0.10, discountPercent: 0 }, // First 100K
  { from: 100001, to: 500000, pricePer1KTokens: 0.08, discountPercent: 20 }, // 100K-500K
  { from: 500001, to: 1000000, pricePer1KTokens: 0.06, discountPercent: 40 }, // 500K-1M
  { from: 1000001, to: 5000000, pricePer1KTokens: 0.04, discountPercent: 60 }, // 1M-5M
  { from: 5000001, to: null, pricePer1KTokens: 0.02, discountPercent: 80 }, // 5M+
];

// ═══════════════════════════════════════════════════════════════════════════
// SURGE PRICING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_SURGE_CONFIG: SurgePricingConfig = {
  enabled: true,
  demandThreshold: 0.8, // 80% capacity triggers surge
  surgeMultiplier: 1.5, // 50% price increase
  maxSurgeMultiplier: 3.0, // Max 3x pricing
  cooldownMinutes: 15, // 15 minutes between surge adjustments
};

// ═══════════════════════════════════════════════════════════════════════════
// MARGIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_MARGIN_CONFIG: MarginConfig = {
  targetMarginPercent: 95, // Target 95% margin on AI costs
  minMarginPercent: 70, // Never go below 70% margin
  costPlusMarkup: 20, // 20% markup on provider cost
};

// ═══════════════════════════════════════════════════════════════════════════
// PRICING ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class PricingEngine {
  private surgeConfig: SurgePricingConfig;
  private marginConfig: MarginConfig;
  private currentSurgeMultiplier: number = 1.0;
  private lastSurgeAdjustment: number = Date.now();

  constructor(
    surgeConfig?: Partial<SurgePricingConfig>,
    marginConfig?: Partial<MarginConfig>
  ) {
    this.surgeConfig = { ...DEFAULT_SURGE_CONFIG, ...surgeConfig };
    this.marginConfig = { ...DEFAULT_MARGIN_CONFIG, ...marginConfig };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAN PRICING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get plan pricing details
   */
  getPlanPricing(plan: UserPlan): PlanPricing {
    return PLAN_PRICING[plan];
  }

  /**
   * Calculate effective monthly price (yearly divided by 12)
   */
  getEffectiveMonthlyPrice(plan: UserPlan, isYearly: boolean = false): number {
    const pricing = PLAN_PRICING[plan];
    if (isYearly) {
      return pricing.yearlyPrice / 12;
    }
    return pricing.monthlyPrice;
  }

  /**
   * Calculate yearly savings percentage
   */
  getYearlyDiscount(plan: UserPlan): number {
    const pricing = PLAN_PRICING[plan];
    if (pricing.monthlyPrice === 0) return 0;

    const yearlyTotal = pricing.monthlyPrice * 12;
    const savings = yearlyTotal - pricing.yearlyPrice;
    return Math.round((savings / yearlyTotal) * 100);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE-BASED PRICING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate price for token usage based on tiers
   */
  calculateUsagePrice(tokens: number, plan: UserPlan): number {
    const pricing = PLAN_PRICING[plan];
    const allowance = pricing.aiAllowance.tokensPerMonth;

    // If within allowance, no extra charge
    if (tokens <= allowance) {
      return 0;
    }

    // Calculate overage
    const overageTokens = tokens - allowance;
    let price = 0;

    // Apply tiered pricing to overage
    let remainingTokens = overageTokens;
    let currentTierStart = 0;

    for (const tier of USAGE_TIERS) {
      if (remainingTokens <= 0) break;

      const tierEnd = tier.to ?? Infinity;
      const tierSize = tierEnd - tier.from;

      // Calculate how many tokens fall into this tier
      const tokensInTier = Math.min(
        remainingTokens,
        tierSize - currentTierStart
      );

      if (tokensInTier > 0) {
        const tierPrice = (tokensInTier / 1000) * tier.pricePer1KTokens;
        const discount = tierPrice * (tier.discountPercent / 100);
        price += tierPrice - discount;
        remainingTokens -= tokensInTier;
      }

      currentTierStart = tierEnd;
    }

    return price;
  }

  /**
   * Calculate overage charges for a plan
   */
  calculateOverage(
    tokens: number,
    requests: number,
    plan: UserPlan
  ): { tokensOverage: number; requestsOverage: number; total: number } {
    const pricing = PLAN_PRICING[plan];
    const allowance = pricing.aiAllowance;

    const tokensOver = Math.max(0, tokens - allowance.tokensPerMonth);
    const requestsOver = Math.max(0, requests - allowance.requestsPerDay * 30);

    const tokensOverage = tokensOver * pricing.overage.costPer1KTokens / 1000;
    const requestsOverage = requestsOver * pricing.overage.costPerRequest;

    return {
      tokensOverage,
      requestsOverage,
      total: tokensOverage + requestsOverage,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SURGE PRICING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update surge multiplier based on current demand
   */
  updateSurgePricing(currentDemand: number, totalCapacity: number): void {
    if (!this.surgeConfig.enabled) {
      this.currentSurgeMultiplier = 1.0;
      return;
    }

    const demandRatio = currentDemand / totalCapacity;
    const now = Date.now();
    const cooldownMs = this.surgeConfig.cooldownMinutes * 60 * 1000;

    // Only adjust if cooldown has passed
    if (now - this.lastSurgeAdjustment < cooldownMs) {
      return;
    }

    let newMultiplier = 1.0;

    if (demandRatio >= this.surgeConfig.demandThreshold) {
      // Calculate surge multiplier based on demand
      const excessDemand = demandRatio - this.surgeConfig.demandThreshold;
      const maxExcess = 1 - this.surgeConfig.demandThreshold;

      // Linear scaling: higher demand = higher multiplier
      const surgeFactor = excessDemand / maxExcess;
      newMultiplier = 1 + (this.surgeConfig.surgeMultiplier - 1) * surgeFactor;
    }

    // Cap at maximum
    newMultiplier = Math.min(newMultiplier, this.surgeConfig.maxSurgeMultiplier);

    // Only update if changed significantly
    if (Math.abs(newMultiplier - this.currentSurgeMultiplier) > 0.1) {
      this.currentSurgeMultiplier = newMultiplier;
      this.lastSurgeAdjustment = now;

      console.log(`[PricingEngine] Surge multiplier updated to ${newMultiplier.toFixed(2)}x`);
    }
  }

  /**
   * Get current surge multiplier
   */
  getCurrentSurgeMultiplier(): number {
    return this.currentSurgeMultiplier;
  }

  /**
   * Get surge reason for display
   */
  getSurgeReason(): string {
    if (this.currentSurgeMultiplier <= 1.0) {
      return '';
    }

    if (this.currentSurgeMultiplier < 1.5) {
      return 'High demand';
    } else if (this.currentSurgeMultiplier < 2.0) {
      return 'Very high demand';
    } else {
      return 'Extreme demand - consider waiting';
    }
  }

  /**
   * Check if surge pricing is active
   */
  isSurgeActive(): boolean {
    return this.currentSurgeMultiplier > 1.0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARGIN CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate price to achieve target margin
   */
  calculatePriceForMargin(providerCost: number, targetMarginPercent: number): number {
    // Price = Cost / (1 - Margin%)
    // e.g., Cost $0.01, Target 95% margin → Price = $0.01 / 0.05 = $0.20
    const marginDecimal = targetMarginPercent / 100;
    return providerCost / (1 - marginDecimal);
  }

  /**
   * Calculate actual margin achieved
   */
  calculateMargin(revenue: number, cost: number): number {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  }

  /**
   * Get minimum price to maintain minimum margin
   */
  getMinimumPrice(providerCost: number): number {
    return this.calculatePriceForMargin(providerCost, this.marginConfig.minMarginPercent);
  }

  /**
   * Calculate price with cost-plus markup
   */
  calculateCostPlusPrice(providerCost: number): number {
    return providerCost * (1 + this.marginConfig.costPlusMarkup / 100);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINED PRICING DECISION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Make complete pricing decision for a request
   */
  makePricingDecision(options: {
    userId: string;
    plan: UserPlan;
    estimatedTokens: number;
    providerCost: number; // Actual cost from AI provider
    isYearlyPlan?: boolean;
  }): PricingDecision {
    const { plan, estimatedTokens, providerCost, isYearlyPlan = false } = options;
    const planPricing = PLAN_PRICING[plan];

    // 1. Base price from plan (amortized)
    const planComponent = this.getEffectiveMonthlyPrice(plan, isYearlyPlan) / 30; // Daily rate

    // 2. Usage-based price
    const usageComponent = this.calculateUsagePrice(estimatedTokens, plan);

    // 3. Apply surge pricing to usage component
    const surgeComponent = usageComponent * (this.currentSurgeMultiplier - 1);
    const usageWithSurge = usageComponent + surgeComponent;

    // 4. Calculate volume discount
    let discount = 0;
    let discountReason = '';

    if (estimatedTokens >= 1000000) {
      discount = usageWithSurge * 0.1; // 10% discount for 1M+ tokens
      discountReason = 'Volume discount (1M+ tokens)';
    } else if (estimatedTokens >= 500000) {
      discount = usageWithSurge * 0.05; // 5% discount for 500K+ tokens
      discountReason = 'Volume discount (500K+ tokens)';
    }

    // 5. Final price calculation
    const basePrice = planComponent;
    const finalPrice = basePrice + usageWithSurge - discount;

    // 6. Calculate margin
    const margin = this.calculateMargin(finalPrice, providerCost);

    // 7. Ensure minimum margin
    const minimumPrice = this.getMinimumPrice(providerCost);
    const adjustedFinalPrice = Math.max(finalPrice, minimumPrice);

    return {
      basePrice,
      usagePrice: usageComponent,
      surgeMultiplier: this.currentSurgeMultiplier,
      surgeReason: this.getSurgeReason(),
      discount,
      discountReason,
      finalPrice: adjustedFinalPrice,
      margin,
      breakdown: {
        planComponent,
        usageComponent,
        surgeComponent,
        discountComponent: discount,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICE QUOTE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a price quote (valid for 5 minutes)
   */
  generatePriceQuote(options: {
    userId: string;
    plan: UserPlan;
    estimatedTokens: number;
    providerCost: number;
  }): PriceQuote {
    const decision = this.makePricingDecision(options);
    const now = Date.now();

    return {
      userId: options.userId,
      plan: options.plan,
      estimatedTokens: options.estimatedTokens,
      basePrice: decision.basePrice,
      surgeApplied: this.isSurgeActive(),
      finalPrice: decision.finalPrice,
      validUntil: now + 5 * 60 * 1000, // 5 minutes
      timestamp: now,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate projected monthly revenue for a user
   */
  calculateProjectedRevenue(
    plan: UserPlan,
    avgDailyTokens: number,
    avgDailyRequests: number
  ): {
    planRevenue: number;
    projectedOverage: number;
    projectedTotal: number;
  } {
    const pricing = PLAN_PRICING[plan];
    const planRevenue = pricing.monthlyPrice;

    // Project monthly usage
    const monthlyTokens = avgDailyTokens * 30;
    const monthlyRequests = avgDailyRequests * 30;

    // Calculate projected overage
    const overage = this.calculateOverage(monthlyTokens, monthlyRequests, plan);

    return {
      planRevenue,
      projectedOverage: overage.total,
      projectedTotal: planRevenue + overage.total,
    };
  }

  /**
   * Get pricing analytics summary
   */
  getPricingAnalytics(): {
    surgeActive: boolean;
    currentMultiplier: number;
    targetMargin: number;
    minMargin: number;
    plans: Record<UserPlan, {
      monthlyPrice: number;
      effectiveYearly: number;
      discount: number;
    }>;
  } {
    return {
      surgeActive: this.isSurgeActive(),
      currentMultiplier: this.getCurrentSurgeMultiplier(),
      targetMargin: this.marginConfig.targetMarginPercent,
      minMargin: this.marginConfig.minMarginPercent,
      plans: {
        free: {
          monthlyPrice: PLAN_PRICING.free.monthlyPrice,
          effectiveYearly: PLAN_PRICING.free.yearlyPrice,
          discount: 0,
        },
        basic: {
          monthlyPrice: PLAN_PRICING.basic.monthlyPrice,
          effectiveYearly: PLAN_PRICING.basic.yearlyPrice / 12,
          discount: this.getYearlyDiscount('basic'),
        },
        premium: {
          monthlyPrice: PLAN_PRICING.premium.monthlyPrice,
          effectiveYearly: PLAN_PRICING.premium.yearlyPrice / 12,
          discount: this.getYearlyDiscount('premium'),
        },
        enterprise: {
          monthlyPrice: PLAN_PRICING.enterprise.monthlyPrice,
          effectiveYearly: PLAN_PRICING.enterprise.yearlyPrice / 12,
          discount: this.getYearlyDiscount('enterprise'),
        },
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let pricingEngineInstance: PricingEngine | null = null;

export function getPricingEngine(
  surgeConfig?: Partial<SurgePricingConfig>,
  marginConfig?: Partial<MarginConfig>
): PricingEngine {
  if (!pricingEngineInstance) {
    pricingEngineInstance = new PricingEngine(surgeConfig, marginConfig);
  }
  return pricingEngineInstance;
}
