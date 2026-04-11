'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Crown } from 'lucide-react';

const plans = [
  { name: 'Free', price: '₹0', period: '/month', features: ['Basic notes', 'Daily current affairs', '5 AI queries/day'], current: true },
  { name: 'Pro', price: '₹499', period: '/month', features: ['Unlimited notes', 'All current affairs', 'Unlimited AI queries', 'Mains answer evaluation', 'PDF library'], current: false },
  { name: 'Ultimate', price: '₹999', period: '/month', features: ['Everything in Pro', 'Mentor chat', 'Personalized study plan', 'Priority support', 'Lecture access'], current: false },
];

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Subscription</h1>
      <p className="text-muted-foreground mb-8">Manage your plan and billing.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className={`rounded-lg border p-6 ${plan.current ? 'border-primary ring-2 ring-primary/20' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              {plan.name !== 'Free' && <Crown className="h-4 w-4 text-yellow-500" />}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full rounded-lg px-4 py-2 text-sm font-medium ${plan.current ? 'bg-muted text-muted-foreground cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
              disabled={plan.current}
            >
              {plan.current ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
