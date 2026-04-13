'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Crown, AlertCircle, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface SubscriptionStatus {
  success: boolean;
  subscription: {
    id: string;
    tier: string;
    status: string;
    endsAt: string;
    startsAt: string;
    billingCycle: string;
    plan?: {
      name: string;
      tier: string;
      features: string[];
      limits: Record<string, unknown>;
    };
  } | null;
  user: {
    tier: string;
    status: string;
    endsAt: string | null;
    trial: {
      isActive: boolean;
      endsAt: string | null;
      isPostTrial: boolean;
    };
  };
  features: {
    hasFullAccess: boolean;
    isFree: boolean;
  };
}

/* ------------------------------------------------------------------ */
/*  Fallback plans (used when /api/plans is unavailable)               */
/* ------------------------------------------------------------------ */

const FALLBACK_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    slug: 'free',
    description: 'Get started with basic features',
    price: 0,
    currency: 'INR',
    duration_days: 0,
    features: ['Basic notes', 'Daily current affairs', '5 AI queries/day'],
    is_active: true,
    sort_order: 0,
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    description: 'Unlock full potential',
    price: 499,
    currency: 'INR',
    duration_days: 30,
    features: [
      'Unlimited notes',
      'All current affairs',
      'Unlimited AI queries',
      'Mains answer evaluation',
      'PDF library',
    ],
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    slug: 'ultimate',
    description: 'Everything you need to crack UPSC',
    price: 999,
    currency: 'INR',
    duration_days: 30,
    features: [
      'Everything in Pro',
      'Mentor chat',
      'Personalized study plan',
      'Priority support',
      'Lecture access',
    ],
    is_active: true,
    sort_order: 2,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(price: number, currency = 'INR') {
  if (price === 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getPeriod(durationDays: number) {
  if (durationDays === 0) return '/month';
  if (durationDays <= 31) return '/month';
  if (durationDays <= 93) return '/quarter';
  return '/year';
}

/** Check if the user's current tier matches a plan */
function isCurrentPlan(plan: Plan, userTier: string): boolean {
  const tierLower = userTier.toLowerCase();
  const slugLower = plan.slug.toLowerCase();
  const nameLower = plan.name.toLowerCase();
  return slugLower === tierLower || nameLower === tierLower;
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function PlanSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-20 bg-white/[0.06] rounded" />
      </div>
      <div className="mb-4">
        <div className="h-9 w-24 bg-white/[0.06] rounded" />
      </div>
      <ul className="space-y-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="h-4 w-4 bg-white/[0.06] rounded mt-0.5 shrink-0" />
            <div className="h-4 w-full bg-white/[0.06] rounded" />
          </li>
        ))}
      </ul>
      <div className="h-10 w-full bg-white/[0.06] rounded-xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [statusRes, plansRes] = await Promise.allSettled([
          fetch('/api/subscription/status'),
          fetch('/api/plans'),
        ]);

        // --- Subscription status ---
        if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
          const statusData = await statusRes.value.json();
          if (statusData.success) {
            setStatus(statusData);
          }
        }
        // A 401 is expected for unauthenticated visitors — not a hard error

        // --- Plans ---
        let fetchedPlans: Plan[] = [];
        if (plansRes.status === 'fulfilled' && plansRes.value.ok) {
          const plansData = await plansRes.value.json();
          if (plansData.plans && Array.isArray(plansData.plans) && plansData.plans.length > 0) {
            fetchedPlans = plansData.plans.map((p: any) => ({
              ...p,
              features: Array.isArray(p.features) ? p.features : [],
            }));
          }
        }

        setPlans(fetchedPlans.length > 0 ? fetchedPlans : FALLBACK_PLANS);
      } catch (err) {
        console.error('Failed to load subscription data:', err);
        setError('Unable to load subscription information. Please try again.');
        setPlans(FALLBACK_PLANS);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const userTier = status?.user?.tier || 'free';
  const userStatusLabel = status?.user?.status || 'free';
  const trialActive = status?.user?.trial?.isActive ?? false;
  const subscriptionEnd = status?.subscription?.endsAt || status?.user?.endsAt;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-display font-bold mb-2">Subscription</h1>
      <p className="text-muted-foreground mb-8">Manage your plan and billing.</p>

      {/* Current subscription banner */}
      {!loading && status && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 mb-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>
              <span className="text-muted-foreground">Current plan:</span>{' '}
              <strong className="capitalize">{userTier}</strong>
            </span>

            {trialActive && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Trial active
                {status.user.trial.endsAt && (
                  <> &mdash; ends {formatDate(status.user.trial.endsAt)}</>
                )}
              </span>
            )}

            {status.user.trial.isPostTrial && !trialActive && (
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Trial ended
              </span>
            )}

            {userStatusLabel === 'active' && subscriptionEnd && (
              <span>
                <span className="text-muted-foreground">Renews:</span>{' '}
                {formatDate(subscriptionEnd)}
              </span>
            )}

            {status.features.hasFullAccess && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                Full access
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-1 text-xs underline text-destructive hover:text-destructive/80"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading
          ? [1, 2, 3].map((i) => <PlanSkeleton key={i} />)
          : plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan, userTier);
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl bg-white/[0.03] border p-6 transition-all ${
                    isCurrent ? 'border-primary/40 ring-2 ring-primary/20' : 'border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {plan.price > 0 && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    <h3 className="text-lg font-display font-semibold">{plan.name}</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getPeriod(plan.duration_days)}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                  )}
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      isCurrent
                        ? 'bg-white/[0.05] text-muted-foreground cursor-default'
                        : 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110'
                    }`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
      </div>
    </div>
  );
}
