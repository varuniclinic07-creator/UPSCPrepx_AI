// ═══════════════════════════════════════════════════════════════
// RAZORPAY WEBHOOK HANDLER
// /api/webhooks/razorpay
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyWebhookSignature, getPaymentDetails } from '@/lib/payments/razorpay';
import { createSubscription } from '@/lib/payments/subscription-service';

export const dynamic = 'force-dynamic';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit
const WEBHOOK_TIMEOUT = 10000; // 10 seconds

export async function POST(request: NextRequest) {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Webhook timeout')), WEBHOOK_TIMEOUT)
    );

    try {
        const body = await Promise.race([
            request.text(),
            timeoutPromise
        ]) as string;

        // Validate body size
        if (body.length > MAX_BODY_SIZE) {
            return NextResponse.json(
                { error: 'Payload too large' },
                { status: 413 }
            );
        }

        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // Verify webhook signature (timing-safe)
        const isValid = verifyWebhookSignature(body, signature);

        if (!isValid) {
            console.error('[Webhook] Invalid signature detected');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const event = JSON.parse(body);
        const supabase = await createServerSupabaseClient();

        // ═══════════════════════════════════════════════════════════
        // IDEMPOTENCY CHECK - Prevent duplicate processing
        // ═══════════════════════════════════════════════════════════
        const eventId = event.event + '_' + (event.payload?.payment?.entity?.id || event.payload?.refund?.entity?.id || Date.now());

        const { data: existingEvent } = await supabase
            .from('webhook_events')
            .select('id')
            .eq('event_id', eventId)
            .single();

        if (existingEvent) {
            // Already processed, return success (idempotent)
            console.debug('[Webhook] Duplicate event, skipping:', eventId);
            return NextResponse.json({ received: true, duplicate: true });
        }

        // Record event for idempotency
        await (supabase.from('webhook_events') as any)
            .insert({
                event_id: eventId,
                event_type: event.event,
                payload: event,
                processed_at: new Date().toISOString()
            });

        // ═══════════════════════════════════════════════════════════
        // HANDLE EVENTS
        // ═══════════════════════════════════════════════════════════

        // Handle different events
        switch (event.event) {
            case 'payment.captured':
                await handlePaymentCaptured(event.payload.payment.entity, supabase);
                break;

            case 'payment.failed':
                await handlePaymentFailed(event.payload.payment.entity, supabase);
                break;

            case 'refund.created':
                await handleRefundCreated(event.payload.refund.entity, supabase);
                break;

            default:
                console.debug('[Webhook] Unhandled event:', event.event);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('[Webhook] Processing error:', error);

        if (error instanceof Error && error.message === 'Webhook timeout') {
            return NextResponse.json(
                { error: 'Request timeout' },
                { status: 408 }
            );
        }

        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handlePaymentCaptured(payment: any, supabase: any) {
    const orderId = payment.order_id;

    // ═══════════════════════════════════════════════════════════
    // SERVER-SIDE VERIFICATION - Never trust webhook payload alone
    // ═══════════════════════════════════════════════════════════
    const verifiedPayment = await getPaymentDetails(payment.id);

    if (verifiedPayment.status !== 'captured') {
        console.error('[Webhook] Payment not actually captured:', payment.id);
        return;
    }

    // Find payment by order ID
    const { data: paymentRecord, error: fetchError } = await (supabase.from('payments') as any)
        .select('*')
        .eq('razorpay_order_id', orderId)
        .single();

    if (fetchError || !paymentRecord) {
        console.error('[Webhook] Payment record not found for order:', orderId, fetchError);
        return;
    }

    // Idempotency check - skip if already processed
    if (paymentRecord.status === 'completed' && paymentRecord.razorpay_payment_id === payment.id) {
        console.debug('[Webhook] Payment already processed:', paymentRecord.id);
        return;
    }

    // Update payment status
    await (supabase.from('payments') as any)
        .update({
            status: 'completed',
            razorpay_payment_id: payment.id,
            razorpay_signature: payment.signature,
            payment_method: verifiedPayment.method,
            completed_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);

    // Create or update subscription
    const { data: existingSub } = await (supabase.from('user_subscriptions') as any)
        .select('id')
        .eq('payment_id', paymentRecord.id)
        .single();

    if (existingSub) {
        console.debug('[Webhook] Subscription already exists:', existingSub.id);
        return;
    }

    await createSubscription(
        paymentRecord.user_id,
        paymentRecord.plan_id,
        paymentRecord.id
    );

    console.debug('[Webhook] Payment captured and subscription created:', paymentRecord.id);
}

async function handlePaymentFailed(payment: any, supabase: any) {
    const orderId = payment.order_id;

    await (supabase.from('payments') as any)
        .update({
            status: 'failed',
            error_message: payment.error_description || 'Payment failed'
        })
        .eq('razorpay_order_id', orderId);
}

async function handleRefundCreated(refund: any, supabase: any) {
    const paymentId = refund.payment_id;

    await (supabase.from('payments') as any)
        .update({
            status: 'refunded',
            refund_amount: refund.amount / 100,
            refunded_at: new Date().toISOString()
        })
        .eq('razorpay_payment_id', paymentId);

    // Deactivate subscription
    const { data: payment } = await (supabase.from('payments') as any)
        .select('user_subscriptions(*)')
        .eq('razorpay_payment_id', paymentId)
        .single();

    if ((payment as any)?.user_subscriptions) {
        await (supabase.from('user_subscriptions') as any)
            .update({ status: 'cancelled' })
            .eq('payment_id', (payment as any).id);
    }
}
