// ═══════════════════════════════════════════════════════════════
// PAYMENT SERVICE
// Business logic for payment processing
// ═══════════════════════════════════════════════════════════════

import { BaseService, ServiceResult } from './base.service';
import { createClient } from '@/lib/supabase/server';
import { createOrder, verifyPaymentSignature, getPaymentDetails } from '@/lib/payments/razorpay';
import { createSubscription } from '@/lib/payments/subscription-service';
import { generateInvoice } from '@/lib/invoices/invoice-generator';
import { v4 as uuidv4 } from 'uuid';
import {
    createPaymentError,
    createValidationError,
    createSubscriptionError,
} from '@/lib/errors/app-error';
import { paymentInitiateSchema, paymentVerifySchema } from '@/lib/validation/schemas';

export interface PaymentInitiateRequest {
    userId: string;
    planSlug: string;
    billingCycle?: 'monthly' | 'quarterly' | 'yearly';
}

export interface PaymentInitiateResponse {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
    plan: {
        name: string;
        duration: number;
        features: string[];
        tier: string;
    };
    breakdown: {
        baseAmount: number;
        gstAmount: number;
        gstPercentage: number;
        totalAmount: number;
        billingCycle: string;
    };
}

export interface PaymentVerifyRequest {
    userId: string;
    paymentId: string;
    orderId: string;
    signature: string;
    razorpayPaymentId: string;
}

export interface PaymentVerifyResponse {
    paymentId: string;
    status: 'completed' | 'failed';
    amount: number;
    method?: string;
    subscription?: {
        id: string;
        tier: string;
        endsAt: Date;
    };
    invoiceUrl?: string;
}

export interface PaymentWebhookEvent {
    event: string;
    payload: {
        payment?: {
            entity?: {
                id: string;
                order_id: string;
                status: string;
                amount: number;
            };
        };
        refund?: {
            entity?: {
                id: string;
                payment_id: string;
                amount: number;
            };
        };
    };
    signature: string;
}

export class PaymentService extends BaseService {
    constructor() {
        super({
            serviceName: 'payment',
            timeoutMs: 15000,
            maxRetries: 2,
        });
    }

    /**
     * Initiate a new payment
     */
    async initiatePayment(request: PaymentInitiateRequest): Promise<ServiceResult<PaymentInitiateResponse>> {
        return this.safeExecute('initiatePayment', async () => {
            const { userId, planSlug, billingCycle = 'monthly' } = request;

            // Validate input
            const validatedData = this.validate(paymentInitiateSchema, { planSlug, billingCycle });

            const supabase = await createClient();

            // Get plan details
            const { data: plan, error: planError } = await this.execute('getPlan', async () => {
                return (supabase.from('subscription_plans') as any)
                    .select('*')
                    .eq('slug', validatedData.planSlug)
                    .single();
            });

            if (planError || !plan || !plan.is_active) {
                throw createValidationError('Invalid plan', [
                    { field: 'planSlug', message: 'Plan not found or inactive' },
                ]);
            }

            const planData = plan as any;

            // Calculate price based on billing cycle
            let baseAmount: number;
            switch (billingCycle) {
                case 'yearly':
                    baseAmount = planData.price_yearly || planData.price_monthly * 10;
                    break;
                case 'quarterly':
                    baseAmount = planData.price_quarterly || planData.price_monthly * 3;
                    break;
                default:
                    baseAmount = planData.price_monthly;
            }

            // Calculate GST
            const gstPercentage = planData.gst_percentage || 18.0;
            const gstAmount = Math.round((baseAmount * gstPercentage) / 100);
            const totalAmount = baseAmount + gstAmount;

            // Generate IDs
            const paymentId = uuidv4();
            const receiptId = `RCP_${Date.now()}_${userId.substring(0, 8)}`;

            // Create payment record
            await this.execute('createPaymentRecord', async () => {
                const { error } = await (supabase.from('payments') as any).insert({
                    id: paymentId,
                    user_id: userId,
                    plan_id: planData.id,
                    base_amount: baseAmount,
                    gst_percentage: gstPercentage,
                    gst_amount: gstAmount,
                    total_amount: totalAmount,
                    currency: 'INR',
                    status: 'pending',
                    receipt_id: receiptId,
                    billing_cycle: billingCycle,
                });

                if (error) {
                    throw createPaymentError('Failed to create payment record', { databaseError: error });
                }
            });

            // Create Razorpay order
            const order = await this.execute('createRazorpayOrder', async () => {
                return createOrder(totalAmount, 'INR', receiptId, {
                    user_id: userId,
                    plan_slug: planSlug,
                    payment_id: paymentId,
                    billing_cycle: billingCycle,
                });
            });

            // Update payment with order ID
            await (supabase.from('payments') as any)
                .update({ razorpay_order_id: order.id })
                .eq('id', paymentId);

            this.logger.info('Payment initiated', {
                paymentId,
                orderId: order.id,
                amount: totalAmount,
                userId,
            });

            return {
                paymentId,
                orderId: order.id,
                amount: totalAmount,
                currency: order.currency || 'INR',
                razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                plan: {
                    name: planData.name,
                    duration: planData.duration_months || 1,
                    features: planData.features || [],
                    tier: planData.tier,
                },
                breakdown: {
                    baseAmount,
                    gstAmount,
                    gstPercentage,
                    totalAmount,
                    billingCycle,
                },
            };
        });
    }

    /**
     * Verify payment and create subscription
     */
    async verifyPayment(request: PaymentVerifyRequest): Promise<ServiceResult<PaymentVerifyResponse>> {
        return this.safeExecute('verifyPayment', async () => {
            const { userId, paymentId, orderId, signature, razorpayPaymentId } = request;

            // Validate input
            this.validate(paymentVerifySchema, request);

            const supabase = await createClient();

            // Get payment record
            const { data: payment } = await (supabase.from('payments') as any)
                .select('*, subscription_plans(*)')
                .eq('id', paymentId)
                .single();

            if (!payment) {
                throw createPaymentError('Payment not found');
            }

            // Verify ownership
            if (payment.user_id !== userId) {
                throw createPaymentError('Unauthorized', { paymentId });
            }

            // Verify signature (timing-safe)
            const isValid = verifyPaymentSignature(orderId, razorpayPaymentId, signature);
            if (!isValid) {
                await (supabase.from('payments') as any)
                    .update({ status: 'failed', error_message: 'Invalid signature' })
                    .eq('id', paymentId);

                throw createPaymentError('Invalid payment signature');
            }

            // Get payment details from Razorpay
            const paymentDetails = await getPaymentDetails(razorpayPaymentId);

            // Verify amount
            if (paymentDetails.amount !== payment.total_amount) {
                throw createPaymentError('Payment amount mismatch', {
                    expected: payment.total_amount,
                    actual: paymentDetails.amount,
                });
            }

            // Update payment record
            await (supabase.from('payments') as any).update({
                status: 'completed',
                razorpay_payment_id: razorpayPaymentId,
                razorpay_signature: signature,
                payment_method: paymentDetails.method,
                completed_at: new Date().toISOString(),
            }).eq('id', paymentId);

            // Create subscription
            const subscription = await createSubscription(userId, payment.plan_id, paymentId);

            // Generate invoice
            let invoiceUrl: string | undefined;
            try {
                invoiceUrl = await generateInvoice(paymentId);
                await (supabase.from('payments') as any)
                    .update({ invoice_url: invoiceUrl })
                    .eq('id', paymentId);
            } catch (error) {
                this.logger.warn('Invoice generation failed (non-critical)', { paymentId }, error as Error);
            }

            this.logger.info('Payment verified and subscription created', {
                paymentId,
                subscriptionId: subscription.id,
            });

            return {
                paymentId,
                status: 'completed',
                amount: payment.total_amount,
                method: paymentDetails.method,
                subscription: {
                    id: subscription.id,
                    tier: subscription.tier,
                    endsAt: subscription.endsAt,
                },
                invoiceUrl,
            };
        });
    }

    /**
     * Handle webhook events
     */
    async handleWebhook(event: PaymentWebhookEvent): Promise<ServiceResult<void>> {
        return this.safeExecute('handleWebhook', async () => {
            const { event: eventType, payload } = event;

            this.logger.info('Webhook received', { event: eventType });

            switch (eventType) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(payload.payment?.entity);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(payload.payment?.entity);
                    break;
                case 'refund.created':
                    await this.handleRefundCreated(payload.refund?.entity);
                    break;
                default:
                    this.logger.warn('Unhandled webhook event', { event: eventType });
            }
        });
    }

    private async handlePaymentCaptured(paymentEntity?: any) {
        if (!paymentEntity) return;

        const supabase = await createClient();
        const orderId = paymentEntity.order_id;

        // Verify payment status
        const verifiedPayment = await getPaymentDetails(paymentEntity.id);
        if (verifiedPayment.status !== 'captured') return;

        // Find payment record
        const { data: paymentRecord } = await (supabase.from('payments') as any)
            .select('*')
            .eq('razorpay_order_id', orderId)
            .single();

        if (!paymentRecord) return;

        // Idempotency check
        if (paymentRecord.status === 'completed') return;

        // Update payment
        await (supabase.from('payments') as any).update({
            status: 'completed',
            razorpay_payment_id: paymentEntity.id,
            payment_method: verifiedPayment.method,
            completed_at: new Date().toISOString(),
        }).eq('id', paymentRecord.id);

        // Create subscription if not exists
        const { data: existingSub } = await (supabase.from('user_subscriptions') as any)
            .select('id')
            .eq('payment_id', paymentRecord.id)
            .single();

        if (!existingSub) {
            await createSubscription(paymentRecord.user_id, paymentRecord.plan_id, paymentRecord.id);
        }

        this.logger.info('Webhook: Payment captured', { paymentId: paymentRecord.id });
    }

    private async handlePaymentFailed(paymentEntity?: any) {
        if (!paymentEntity) return;

        const supabase = await createClient();
        const orderId = paymentEntity.order_id;

        await (supabase.from('payments') as any)
            .update({
                status: 'failed',
                error_message: paymentEntity.error_description || 'Payment failed',
            })
            .eq('razorpay_order_id', orderId);

        this.logger.info('Webhook: Payment failed', { orderId });
    }

    private async handleRefundCreated(refundEntity?: any) {
        if (!refundEntity) return;

        const supabase = await createClient();
        const paymentId = refundEntity.payment_id;

        await (supabase.from('payments') as any)
            .update({
                status: 'refunded',
                refund_amount: refundEntity.amount / 100,
                refunded_at: new Date().toISOString(),
            })
            .eq('razorpay_payment_id', paymentId);

        // Cancel subscription
        const { data: payment } = await (supabase.from('payments') as any)
            .select('user_subscriptions(*)')
            .eq('razorpay_payment_id', paymentId)
            .single();

        if (payment?.user_subscriptions) {
            await (supabase.from('user_subscriptions') as any)
                .update({ status: 'cancelled' })
                .eq('payment_id', payment.id);
        }

        this.logger.info('Webhook: Refund created', { paymentId });
    }
}

// Singleton instance
let paymentServiceInstance: PaymentService | null = null;

export function getPaymentService(): PaymentService {
    if (!paymentServiceInstance) {
        paymentServiceInstance = new PaymentService();
    }
    return paymentServiceInstance;
}
