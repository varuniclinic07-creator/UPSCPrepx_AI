/**
 * Phase 15: Usage-Based Billing System
 * Tiered pricing, overage calculation, and invoice generation
 */

import { createClient } from '@/lib/supabase/server';
import { PricingEngine, UserPlan, PLAN_PRICING } from './pricing-engine';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UsageRecord {
  id?: string;
  user_id: string;
  period_start: string;
  period_end: string;
  tokens_used: number;
  requests_made: number;
  provider_cost: number;
  overage_tokens: number;
  overage_requests: number;
  overage_charge: number;
  total_charge: number;
  status: 'pending' | 'invoiced' | 'paid' | 'cancelled';
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id?: string;
  user_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  plan_charge: number;
  overage_charge: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_due: number;
  amount_paid: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface BillingPeriod {
  start: Date;
  end: Date;
  daysRemaining: number;
  percentComplete: number;
}

export interface UsageSummary {
  userId: string;
  plan: UserPlan;
  period: BillingPeriod;
  tokensUsed: number;
  tokensLimit: number;
  tokensRemaining: number;
  requestsMade: number;
  requestsLimit: number;
  requestsRemaining: number;
  providerCost: number;
  overageCharge: number;
  projectedOverage: number;
  estimatedTotal: number;
}

export interface InvoiceGenerationResult {
  invoice: Invoice;
  usageRecord: UsageRecord;
  breakdown: {
    planCharge: number;
    overageTokens: number;
    overageTokenCharge: number;
    overageRequests: number;
    overageRequestCharge: number;
    discount: number;
    tax: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE BILLING SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class UsageBillingService {
  private pricingEngine: PricingEngine;

  constructor(pricingEngine?: PricingEngine) {
    this.pricingEngine = pricingEngine ?? new PricingEngine();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BILLING PERIOD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current billing period for a user
   */
  getCurrentBillingPeriod(userId: string): BillingPeriod {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Billing period: 1st to end of month
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const daysRemaining = daysInMonth - currentDay + 1;
    const percentComplete = ((currentDay - 1) / daysInMonth) * 100;

    return {
      start: periodStart,
      end: periodEnd,
      daysRemaining,
      percentComplete,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get user's current usage summary
   */
  async getUsageSummary(userId: string): Promise<UsageSummary> {
    const supabase = createClient();

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status, current_period_start, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const plan: UserPlan = subscription?.plan_type ? subscription.plan_type as UserPlan : 'free';
    const planPricing = PLAN_PRICING[plan];

    // Get current period usage
    const period = this.getCurrentBillingPeriod(userId);

    const { data: usageData } = await supabase
      .from('ai_usage_logs')
      .select('total_tokens, cost_usd')
      .eq('user_id', userId)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    const tokensUsed = usageData?.reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0;
    const providerCost = usageData?.reduce((sum, u) => sum + (u.cost_usd || 0), 0) || 0;

    // Calculate requests (count records)
    const requestsMade = usageData?.length || 0;
    const requestsLimit = planPricing.aiAllowance.requestsPerDay * 30;

    // Calculate overage
    const overage = this.pricingEngine.calculateOverage(tokensUsed, requestsMade, plan);

    // Project end-of-month overage
    const dailyTokens = tokensUsed / (period.percentComplete / 100 || 1);
    const projectedMonthlyTokens = dailyTokens * 30;
    const projectedOverage = this.pricingEngine.calculateUsagePrice(projectedMonthlyTokens, plan);

    return {
      userId,
      plan,
      period,
      tokensUsed,
      tokensLimit: planPricing.aiAllowance.tokensPerMonth,
      tokensRemaining: Math.max(0, planPricing.aiAllowance.tokensPerMonth - tokensUsed),
      requestsMade,
      requestsLimit,
      requestsRemaining: Math.max(0, requestsLimit - requestsMade),
      providerCost,
      overageCharge: overage.total,
      projectedOverage,
      estimatedTotal: planPricing.monthlyPrice + projectedOverage,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate invoice for billing period
   */
  async generateInvoice(
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<InvoiceGenerationResult> {
    const supabase = createClient();

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const plan: UserPlan = subscription?.plan_type ? subscription.plan_type as UserPlan : 'free';
    const planPricing = PLAN_PRICING[plan];

    // Get usage for period
    const { data: usageData } = await supabase
      .from('ai_usage_logs')
      .select('total_tokens, cost_usd')
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    const tokensUsed = usageData?.reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0;
    const providerCost = usageData?.reduce((sum, u) => sum + (u.cost_usd || 0), 0) || 0;
    const requestsMade = usageData?.length || 0;

    // Calculate overage
    const overage = this.pricingEngine.calculateOverage(tokensUsed, requestsMade, plan);

    // Calculate charges
    const planCharge = planPricing.monthlyPrice;
    const overageTokenCharge = overage.tokensOverage;
    const overageRequestCharge = overage.requestsOverage;
    const overageCharge = overageTokenCharge + overageRequestCharge;

    // Apply volume discount
    let discount = 0;
    if (overageCharge > 100) {
      discount = overageCharge * 0.1; // 10% discount on overage > $100
    }

    // Calculate tax (configurable, default 0% for digital services in many regions)
    const taxRate = parseFloat(process.env.BILLING_TAX_RATE || '0');
    const subtotal = planCharge + overageCharge - discount;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceNumber = this.generateInvoiceNumber(userId, periodEnd);

    // Create invoice
    const invoice: Invoice = {
      user_id: userId,
      invoice_number: invoiceNumber,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      plan_charge: planCharge,
      overage_charge: overageCharge,
      subtotal,
      discount,
      tax,
      total,
      amount_due: total,
      amount_paid: 0,
      status: 'pending',
      due_date: new Date(periodEnd.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    };

    // Create usage record
    const usageRecord: UsageRecord = {
      user_id: userId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      tokens_used: tokensUsed,
      requests_made: requestsMade,
      provider_cost: providerCost,
      overage_tokens: tokensUsed - planPricing.aiAllowance.tokensPerMonth,
      overage_requests: Math.max(0, requestsMade - planPricing.aiAllowance.requestsPerDay * 30),
      overage_charge: overageCharge,
      total_charge: total,
      status: 'invoiced',
      invoice_id: invoice.invoice_number,
    };

    return {
      invoice,
      usageRecord,
      breakdown: {
        planCharge,
        overageTokens: Math.max(0, tokensUsed - planPricing.aiAllowance.tokensPerMonth),
        overageTokenCharge: overageTokenCharge,
        overageRequests: Math.max(0, requestsMade - planPricing.aiAllowance.requestsPerDay * 30),
        overageRequestCharge: overageRequestCharge,
        discount,
        tax,
      },
    };
  }

  /**
   * Generate unique invoice number
   */
  private generateInvoiceNumber(userId: string, periodEnd: Date): string {
    const year = periodEnd.getFullYear();
    const month = String(periodEnd.getMonth() + 1).padStart(2, '0');
    const hash = userId.slice(0, 8).toUpperCase();
    return `INV-${year}${month}-${hash}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Save invoice to database
   */
  async saveInvoice(invoice: Invoice): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('invoices')
      .insert({
        user_id: invoice.user_id,
        invoice_number: invoice.invoice_number,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        plan_charge: invoice.plan_charge,
        overage_charge: invoice.overage_charge,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        tax: invoice.tax,
        total: invoice.total,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        status: invoice.status,
        due_date: invoice.due_date,
        metadata: invoice.metadata,
      });

    if (error) {
      throw new Error(`Failed to save invoice: ${error.message}`);
    }
  }

  /**
   * Save usage record to database
   */
  async saveUsageRecord(usageRecord: UsageRecord): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('usage_records')
      .insert({
        user_id: usageRecord.user_id,
        period_start: usageRecord.period_start,
        period_end: usageRecord.period_end,
        tokens_used: usageRecord.tokens_used,
        requests_made: usageRecord.requests_made,
        provider_cost: usageRecord.provider_cost,
        overage_tokens: usageRecord.overage_tokens,
        overage_requests: usageRecord.overage_requests,
        overage_charge: usageRecord.overage_charge,
        total_charge: usageRecord.total_charge,
        status: usageRecord.status,
        invoice_id: usageRecord.invoice_id,
      });

    if (error) {
      throw new Error(`Failed to save usage record: ${error.message}`);
    }
  }

  /**
   * Get user's invoice history
   */
  async getInvoiceHistory(userId: string, limit: number = 12): Promise<Invoice[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return data as Invoice[];
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(userId: string, invoiceNumber: string): Promise<Invoice | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Invoice;
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceNumber: string, paymentId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: 'amount_due', // Full payment
        paid_at: new Date().toISOString(),
        metadata: { payment_id: paymentId },
      })
      .eq('invoice_number', invoiceNumber);

    if (error) {
      throw new Error(`Failed to mark invoice paid: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOMATED BILLING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Process end-of-month billing for all active subscriptions
   */
  async processMonthlyBilling(): Promise<{
    processed: number;
    totalAmount: number;
    errors: string[];
  }> {
    const supabase = createClient();
    const errors: string[] = [];
    let processed = 0;
    let totalAmount = 0;

    // Get all active subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, current_period_end')
      .eq('status', 'active');

    if (!subscriptions) {
      return { processed: 0, totalAmount: 0, errors: ['Failed to fetch subscriptions'] };
    }

    // Process each subscription
    for (const sub of subscriptions) {
      try {
        const periodEnd = new Date(sub.current_period_end);
        const periodStart = new Date(periodEnd);
        periodStart.setMonth(periodStart.getMonth() - 1);

        // Generate invoice
        const result = await this.generateInvoice(sub.user_id, periodStart, periodEnd);

        // Save records
        await this.saveInvoice(result.invoice);
        await this.saveUsageRecord(result.usageRecord);

        processed++;
        totalAmount += result.invoice.total;
      } catch (error) {
        const errorMessage = `Failed to process billing for ${sub.user_id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    return { processed, totalAmount, errors };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get billing analytics for admin dashboard
   */
  async getBillingAnalytics(periodStart?: Date, periodEnd?: Date): Promise<{
    totalRevenue: number;
    totalOverage: number;
    averageRevenuePerUser: number;
    invoicesCount: number;
    paidInvoices: number;
    overdueInvoices: number;
    topSpenders: Array<{ user_id: string; total: number }>;
  }> {
    const supabase = createClient();

    const now = new Date();
    const start = periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const end = periodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get invoices for period
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .gte('period_start', start.toISOString())
      .lte('period_end', end.toISOString());

    if (!invoices || invoices.length === 0) {
      return {
        totalRevenue: 0,
        totalOverage: 0,
        averageRevenuePerUser: 0,
        invoicesCount: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        topSpenders: [],
      };
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const totalOverage = invoices.reduce((sum, inv) => sum + (inv.overage_charge || 0), 0);
    const uniqueUsers = new Set(invoices.map((inv) => inv.user_id)).size;
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue').length;

    // Top spenders
    const userSpending: Record<string, number> = {};
    for (const inv of invoices) {
      userSpending[inv.user_id] = (userSpending[inv.user_id] || 0) + (inv.total || 0);
    }

    const topSpenders = Object.entries(userSpending)
      .map(([user_id, total]) => ({ user_id, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      totalRevenue,
      totalOverage,
      averageRevenuePerUser: totalRevenue / (uniqueUsers || 1),
      invoicesCount: invoices.length,
      paidInvoices,
      overdueInvoices,
      topSpenders,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let usageBillingInstance: UsageBillingService | null = null;

export function getUsageBillingService(pricingEngine?: PricingEngine): UsageBillingService {
  if (!usageBillingInstance) {
    usageBillingInstance = new UsageBillingService(pricingEngine);
  }
  return usageBillingInstance;
}
