// ═══════════════════════════════════════════════════════════════
// PAYMENT INITIATION API
// /api/payments/initiate
// Production hardened with validation, logging, and error handling
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/lib/payments/razorpay';
import { v4 as uuidv4 } from 'uuid';
import { validateBody, paymentInitiateSchema, ValidationError } from '@/lib/validation/schemas';
import { logger } from '@/lib/logging/logger';
import {
    AppError,
    ErrorCode,
    createPaymentError,
    createValidationError,
    handleError,
} from '@/lib/errors/app-error';
import { measure } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    let requestId = request.headers.get('x-request-id') || uuidv4();

    return measure(
        'payment:initiate',
        async () => {
            try {
                // Authenticate user
                const session = await requireSession();
                const userId = (session as any).user.id;

                // Parse and validate request body
                let body: { planSlug: string; billingCycle?: string };
                try {
                    const rawData = await request.json();
                    body = validateBody(paymentInitiateSchema, rawData);
                } catch (error) {
                    if (error instanceof ValidationError) {
                        throw createValidationError('Invalid request', error.errors);
                    }
                    throw error;
                }

                const { planSlug, billingCycle = 'monthly' } = body;

                logger.info('Payment initiation request', {
                    requestId,
                    userId,
                    planSlug,
                    billingCycle,
                });

                const supabase = await createClient();

                // Get plan details
                const { data: plan, error: planError } = await (supabase.from('subscription_plans') as any)
                    .select('*')
                    .eq('slug', planSlug)
                    .single();

                if (planError || !plan || !(plan as any).is_active) {
                    logger.warn('Plan not found or inactive', {
                        requestId,
                        planSlug,
                        error: planError,
                    });
                    throw createValidationError('Invalid plan', [{ field: 'planSlug', message: 'Plan not found or inactive' }]);
                }

                const planData = plan as any;

                // Get price based on billing cycle
                let baseAmount: number;
                switch (billingCycle) {
                    case 'yearly':
                        baseAmount = planData.price_yearly || planData.price_monthly * 10;
                        break;
                    case 'quarterly':
                        baseAmount = planData.price_quarterly || planData.price_monthly * 3;
                        break;
                    case 'monthly':
                    default:
                        baseAmount = planData.price_monthly;
                        break;
                }

                // Calculate GST
                const gstPercentage = planData.gst_percentage || 18.0;
                const gstAmount = Math.round((baseAmount * gstPercentage) / 100);
                const totalAmount = baseAmount + gstAmount;

                // Generate unique IDs
                const paymentId = uuidv4();
                const receiptId = `RCP_${Date.now()}_${userId.substring(0, 8)}`;

                // Create payment record
                const { error: paymentError } = await (supabase.from('payments') as any)
                    .insert({
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

                if (paymentError) {
                    logger.error('Payment record creation failed', {
                        requestId,
                        userId,
                        error: paymentError,
                    });
                    throw createPaymentError('Failed to create payment record', { databaseError: paymentError });
                }

                // Create Razorpay order
                const order = await createOrder(
                    totalAmount,
                    'INR',
                    receiptId,
                    {
                        user_id: userId,
                        plan_slug: planSlug,
                        payment_id: paymentId,
                        billing_cycle: billingCycle,
                    }
                );

                // Update payment with order ID
                const { error: updateError } = await (supabase.from('payments') as any)
                    .update({ razorpay_order_id: order.id })
                    .eq('id', paymentId);

                if (updateError) {
                    logger.warn('Payment update failed (non-critical)', {
                        requestId,
                        paymentId,
                        error: updateError,
                    });
                }

                logger.info('Payment initiated successfully', {
                    requestId,
                    userId,
                    paymentId,
                    orderId: order.id,
                    amount: totalAmount,
                });

                return NextResponse.json({
                    success: true,
                    paymentId,
                    orderId: order.id,
                    amount: totalAmount,
                    currency: order.currency || 'INR',
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
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
                });
            } catch (error) {
                logger.error('Payment initiation failed', { requestId }, error as Error);
                const errorResponse = handleError(error);
                const statusCode = (error as AppError)?.statusCode || 500;
                return NextResponse.json(errorResponse, { status: statusCode });
            }
        },
        { duration: Date.now() - startTime }
    );
}
