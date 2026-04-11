// ═══════════════════════════════════════════════════════════════
// PAYMENT VERIFICATION API
// /api/payments/verify
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/payments/razorpay';
import { createSubscription } from '@/lib/payments/subscription-service';
import { generateInvoice } from '@/lib/invoices/invoice-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const { paymentId, orderId, signature, razorpayPaymentId } = await request.json();

        if (!paymentId || !orderId || !signature || !razorpayPaymentId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get payment record with plan details
        const { data: payment, error: paymentError } = await (supabase.from('payments') as any)
            .select(`
                *,
                subscription_plans (
                    id,
                    name,
                    tier,
                    duration_months,
                    features
                )
            `)
            .eq('id', paymentId)
            .single();

        if (paymentError || !payment) {
            console.error('Payment fetch error:', paymentError);
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (payment.user_id !== (session as any).user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Verify signature (timing-safe)
        const isValid = verifyPaymentSignature(orderId, razorpayPaymentId, signature);

        if (!isValid) {
            await (supabase.from('payments') as any)
                .update({ status: 'failed', error_message: 'Invalid signature' })
                .eq('id', paymentId);

            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            );
        }

        // Get payment details from Razorpay for verification
        const paymentDetails = await getPaymentDetails(razorpayPaymentId);

        // Verify amount matches
        const expectedAmount = (payment as any).total_amount;
        const actualAmount = paymentDetails.amount;

        if (actualAmount !== expectedAmount) {
            await (supabase.from('payments') as any)
                .update({
                    status: 'failed',
                    error_message: `Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`
                })
                .eq('id', paymentId);

            return NextResponse.json(
                { error: 'Payment amount mismatch' },
                { status: 400 }
            );
        }

        // Update payment record
        await (supabase.from('payments') as any)
            .update({
                status: 'completed',
                razorpay_payment_id: razorpayPaymentId,
                razorpay_signature: signature,
                payment_method: paymentDetails.method,
                completed_at: new Date().toISOString()
            })
            .eq('id', paymentId);

        // Create subscription
        const subscription = await createSubscription(
            (session as any).user.id,
            payment.plan_id,
            paymentId
        );

        // Generate invoice
        let invoiceUrl = '';
        try {
            invoiceUrl = await generateInvoice(paymentId);
        } catch (invoiceError) {
            console.error('Invoice generation error:', invoiceError);
            // Continue without invoice - not critical
        }

        // Update payment with invoice URL if generated
        if (invoiceUrl) {
            await (supabase.from('payments') as any)
                .update({ invoice_url: invoiceUrl })
                .eq('id', paymentId);
        }

        return NextResponse.json({
            success: true,
            payment: {
                id: paymentId,
                status: 'completed',
                amount: (payment as any).total_amount,
                method: paymentDetails.method
            },
            subscription: {
                id: subscription.id,
                tier: subscription.tier,
                endsAt: subscription.endsAt
            },
            invoiceUrl
        });

    } catch (error: any) {
        console.error('Payment verification error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Payment verification failed', details: error.message },
            { status: 500 }
        );
    }
}
