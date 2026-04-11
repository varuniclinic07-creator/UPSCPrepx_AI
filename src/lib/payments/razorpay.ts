// ═══════════════════════════════════════════════════════════════
// RAZORPAY SDK SETUP
// Payment gateway integration
// ═══════════════════════════════════════════════════════════════

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy-initialize Razorpay to avoid errors during Next.js build when env vars are absent
let _razorpay: InstanceType<typeof Razorpay> | null = null;
function getRazorpay(): InstanceType<typeof Razorpay> {
    if (!_razorpay) {
        _razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'placeholder',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
        });
    }
    return _razorpay;
}
/** @deprecated Use getRazorpay() for lazy initialization */
export const razorpay = { orders: { create: (...args: any[]) => getRazorpay().orders.create(...args) } };

export interface PaymentOrder {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
}

/**
 * Create Razorpay order
 */
export async function createOrder(
    amount: number,
    currency: string = 'INR',
    receipt: string,
    notes?: Record<string, string>
): Promise<PaymentOrder> {
    try {
        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert to paise
            currency,
            receipt,
            notes
        });

        return {
            id: order.id,
            amount: Number(order.amount) / 100,
            currency: order.currency,
            receipt: order.receipt || '',
            status: order.status
        };
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        throw new Error('Failed to create payment order');
    }
}

/**
 * Verify Razorpay signature (timing-safe)
 */
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    try {
        const body = orderId + '|' + paymentId;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

/**
 * Verify webhook signature (timing-safe)
 */
export function verifyWebhookSignature(
    webhookBody: string,
    webhookSignature: string
): boolean {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(webhookBody)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const sigBuffer = Buffer.from(webhookSignature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (error) {
        console.error('Webhook verification error:', error);
        return false;
    }
}

/**
 * Fetch payment details
 */
export async function getPaymentDetails(paymentId: string) {
    try {
        const payment = await razorpay.payments.fetch(paymentId);

        return {
            id: payment.id,
            amount: Number(payment.amount) / 100,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
            createdAt: new Date(payment.created_at * 1000)
        };
    } catch (error) {
        console.error('Fetch payment error:', error);
        throw new Error('Failed to fetch payment details');
    }
}

/**
 * Create refund
 */
export async function createRefund(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>
) {
    try {
        const refund = await razorpay.payments.refund(paymentId, {
            amount: amount ? amount * 100 : undefined,
            notes
        });

        return {
            id: refund.id,
            amount: (refund.amount || 0) / 100,
            status: refund.status
        };
    } catch (error) {
        console.error('Refund creation error:', error);
        throw new Error('Failed to create refund');
    }
}
