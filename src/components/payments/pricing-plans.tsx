'use client';

// ═══════════════════════════════════════════════════════════════
// PRICING PLANS COMPONENT
// Display subscription plans with features
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { RazorpayCheckout } from './razorpay-checkout';
import { useRouter } from 'next/navigation';

interface Plan {
    id: string;
    slug: string;
    name: string;
    price: number;
    duration_months: number;
    gst_percentage: number;
    features: string[];
    tier: string;
    popular?: boolean;
}

export function PricingPlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await fetch('/api/plans');
            const data = await response.json();
            setPlans(data.plans || []);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (response: any) => {
        router.push('/dashboard?payment=success');
    };

    const handlePaymentFailure = (error: any) => {
        alert('Payment failed. Please try again.');
    };

    if (loading) {
        return <div className="text-center py-12">Loading plans...</div>;
    }

    return (
        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto p-6">
            {plans.map((plan) => {
                const totalAmount = plan.price + (plan.price * plan.gst_percentage / 100);

                return (
                    <div
                        key={plan.id}
                        className={`border rounded-xl p-6 ${plan.popular ? 'border-primary shadow-lg' : 'border-gray-200'}`}
                    >
                        {plan.popular && (
                            <div className="bg-primary text-white text-sm font-semibold py-1 px-3 rounded-full inline-block mb-4">
                                Most Popular
                            </div>
                        )}

                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <div className="mb-4">
                            <span className="text-4xl font-bold">₹{plan.price}</span>
                            <span className="text-gray-500">/{plan.duration_months}mo</span>
                        </div>

                        <div className="text-sm text-gray-600 mb-4">
                            + ₹{(plan.price * plan.gst_percentage / 100).toFixed(2)} GST = ₹{totalAmount.toFixed(2)}
                        </div>

                        <ul className="space-y-2 mb-6">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {selectedPlan === plan.slug ? (
                            <RazorpayCheckout
                                planSlug={plan.slug}
                                onSuccess={handlePaymentSuccess}
                                onFailure={handlePaymentFailure}
                            />
                        ) : (
                            <button
                                onClick={() => setSelectedPlan(plan.slug)}
                                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90"
                            >
                                Subscribe
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
