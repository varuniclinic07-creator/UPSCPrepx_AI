'use client';

// ═══════════════════════════════════════════════════════════════
// RAZORPAY CHECKOUT COMPONENT
// Payment UI wrapper for Razorpay
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import Script from 'next/script';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface CheckoutProps {
    planSlug: string;
    onSuccess?: (response: any) => void;
    onFailure?: (error: any) => void;
}

export function RazorpayCheckout({ planSlug, onSuccess, onFailure }: CheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    const initiatePayment = async () => {
        setLoading(true);

        try {
            // 1. Create order
            const response = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planSlug })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment initiation failed');
            }

            // 2. Open Razorpay checkout
            const options = {
                key: data.key,
                amount: data.amount * 100,
                currency: data.currency,
                name: 'UPSC CSE Master',
                description: data.plan.name,
                order_id: data.orderId,
                handler: async function (response: any) {
                    // 3. Verify payment
                    const verifyResponse = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentId: data.paymentId,
                            orderId: data.orderId,
                            signature: response.razorpay_signature,
                            razorpayPaymentId: response.razorpay_payment_id
                        })
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyResponse.ok) {
                        onSuccess?.(verifyData);
                    } else {
                        onFailure?.(verifyData);
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: ''
                },
                theme: {
                    color: '#3B82F6'
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: any) {
            console.error('Payment error:', error);
            onFailure?.(error);
            setLoading(false);
        }
    };

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setRazorpayLoaded(true)}
            />

            <button
                onClick={initiatePayment}
                disabled={loading || !razorpayLoaded}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Pay Now'}
            </button>
        </>
    );
}
