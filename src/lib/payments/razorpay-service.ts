/**
 * BMAD Phase 4: Feature 28 - Razorpay Payment Service
 * Complete payment gateway integration for Indian market
 * Supports: UPI, Cards, Netbanking, Wallets, EMI
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export interface CreateOrderOptions {
  amount: number; // in paise
  currency: string;
  userId: string;
  items: Array<{
    type: 'subscription' | 'one_time' | 'test_series';
    plan_id?: string;
    plan_name?: string;
    price: number;
  }>;
  couponCode?: string;
  metadata?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  created_at: number;
}

export interface VerifyPaymentOptions {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  status: 'paid' | 'failed' | 'refunded';
  method?: string;
  error?: string;
}

export class RazorpayService {
  private razorpay: Razorpay;
  private webhookSecret: string;

  constructor(config: RazorpayConfig) {
    this.razorpay = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Create a new payment order
   */
  async createOrder(options: CreateOrderOptions): Promise<RazorpayOrder> {
    try {
      const orderData = {
        amount: Number(options.amount),
        currency: options.currency || 'INR',
        receipt: `receipt_${options.userId}_${Date.now()}`,
        notes: {
          user_id: options.userId,
          items: JSON.stringify(options.items),
          coupon_code: options.couponCode || '',
          ...options.metadata,
        },
      };

      const order = await this.razorpay.orders.create(orderData);

      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        status: order.status as any,
        created_at: order.created_at,
      };
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(options: VerifyPaymentOptions): Promise<PaymentVerificationResult> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = options;

      // Generate expected signature
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(sign.toString())
        .digest('hex');

      // Verify signature
      const isValid = crypto.timingSafeEqual(
        Buffer.from(razorpay_signature),
        Buffer.from(expectedSign)
      );

      if (!isValid) {
        return {
          verified: false,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: 0,
          status: 'failed',
          error: 'Invalid payment signature',
        };
      }

      // Fetch payment details from Razorpay
      const payment = await this.razorpay.payments.fetch(razorpay_payment_id);

      return {
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: Number(payment.amount),
        status: payment.status as any,
        method: payment.method,
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        verified: false,
        paymentId: options.razorpay_payment_id,
        orderId: options.razorpay_order_id,
        amount: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Capture authorized payment (for EMI/Credit cards)
   */
  async capturePayment(paymentId: string, amount: number): Promise<any> {
    try {
      return await this.razorpay.payments.capture(paymentId, amount, 'INR');
    } catch (error) {
      console.error('Payment capture error:', error);
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number, notes?: Record<string, string>): Promise<any> {
    try {
      const refundData: any = {
        payment_id: paymentId,
      };

      if (amount) {
        refundData.amount = amount;
      }

      if (notes) {
        refundData.notes = notes;
      }

      return await this.razorpay.payments.refund(paymentId, refundData);
    } catch (error) {
      console.error('Refund error:', error);
      throw error;
    }
  }

  /**
   * Fetch payment details
   */
  async fetchPayment(paymentId: string): Promise<any> {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Fetch payment error:', error);
      throw error;
    }
  }

  /**
   * Fetch order details
   */
  async fetchOrder(orderId: string): Promise<any> {
    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      console.error('Fetch order error:', error);
      throw error;
    }
  }

  /**
   * Get all payments for a user
   */
  async getPaymentsByUser(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const payments = await this.razorpay.payments.all({
        count: limit,
      } as any);
      return (payments as any).items || [];
    } catch (error) {
      console.error('Get payments error:', error);
      return [];
    }
  }

  /**
   * Create subscription (for recurring payments)
   */
  async createSubscription(planId: string, customerId: string, totalDuration?: number): Promise<any> {
    try {
      const subscriptionData: any = {
        plan_id: planId,
        customer_id: customerId,
        total_count: totalDuration || 12, // Default 12 months
      };

      return await this.razorpay.subscriptions.create(subscriptionData);
    } catch (error) {
      console.error('Subscription creation error:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, notifyCustomer?: boolean): Promise<any> {
    try {
      return await this.razorpay.subscriptions.cancel(subscriptionId, notifyCustomer ? 1 : 0);
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  /**
   * Create customer for recurring payments
   */
  async createCustomer(customerData: {
    name: string;
    email: string;
    phone?: string;
    notes?: Record<string, string>;
  }): Promise<any> {
    try {
      return await this.razorpay.customers.create(customerData);
    } catch (error) {
      console.error('Customer creation error:', error);
      throw error;
    }
  }

  /**
   * Fetch customer details
   */
  async fetchCustomer(customerId: string): Promise<any> {
    try {
      return await this.razorpay.customers.fetch(customerId);
    } catch (error) {
      console.error('Fetch customer error:', error);
      throw error;
    }
  }
}

// Singleton instance
let razorpayServiceInstance: RazorpayService | null = null;

export function getRazorpayService(): RazorpayService {
  if (!razorpayServiceInstance) {
    const config: RazorpayConfig = {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      keySecret: process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    };

    if (!config.keyId || !config.keySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    razorpayServiceInstance = new RazorpayService(config);
  }
  return razorpayServiceInstance;
}

/**
 * Initialize Razorpay service with custom config
 */
export function initializeRazorpayService(config: RazorpayConfig): RazorpayService {
  razorpayServiceInstance = new RazorpayService(config);
  return razorpayServiceInstance;
}
