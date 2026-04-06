// ═══════════════════════════════════════════════════════════════
// PAYMENT INITIATION API
// /api/payments/initiate
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/lib/payments/razorpay';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const { planSlug } = await request.json();

        if (!planSlug) {
            return NextResponse.json(
                { error: 'Plan is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get plan details
        const { data: plan } = await (supabase.from('subscription_plans') as any)
            .select('*')
            .eq('slug', planSlug)
            .single();

        if (!plan || !(plan as any).is_active) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        // Calculate total amount (price + GST)
        const baseAmount = (plan as any).price;
        const gstAmount = (baseAmount * (plan as any).gst_percentage) / 100;
        const totalAmount = baseAmount + gstAmount;

        // Create payment record
        const paymentId = uuidv4();
        const userId = (session as any).user.id;
        const receiptId = `RCP_${Date.now()}_${userId.substring(0, 8)}`;

        const { error: paymentError } = await (supabase.from('payments') as any)
            .insert({
                id: paymentId,
                user_id: userId,
                plan_id: (plan as any).id,
                amount: totalAmount,
                currency: 'INR',
                status: 'pending',
                receipt_id: receiptId
            });

        if (paymentError) {
            return NextResponse.json(
                { error: 'Failed to create payment record' },
                { status: 500 }
            );
        }

        // Create Razorpay order
        const order = await createOrder(
            totalAmount,
            'INR',
            receiptId,
            {
                user_id: userId,
                plan_slug: planSlug,
                payment_id: paymentId
            }
        );

        // Update payment with order ID
        await (supabase.from('payments') as any)
            .update({ razorpay_order_id: order.id })
            .eq('id', paymentId);

        return NextResponse.json({
            success: true,
            paymentId,
            orderId: order.id,
            amount: totalAmount,
            currency: order.currency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            plan: {
                name: (plan as any).name,
                duration: (plan as any).duration_months,
                features: (plan as any).features
            },
            breakdown: {
                baseAmount,
                gstAmount,
                gstPercentage: (plan as any).gst_percentage,
                totalAmount
            }
        });

    } catch (error: any) {
        console.error('Payment initiation error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to initiate payment' },
            { status: 500 }
        );
    }
}
