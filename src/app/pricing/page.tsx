import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: [
      "Daily current affairs digest",
      "Basic AI doubt resolution",
      "Limited notes generation (5/month)",
      "Access to public study materials",
      "Community forum access",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "₹999",
    period: "per month",
    features: [
      "Everything in Free",
      "Unlimited AI-powered notes",
      "Mains answer evaluation with feedback",
      "Personalized study plans",
      "Mind map generation",
      "Mentor AI chat (unlimited)",
      "Prelims mock tests with analytics",
      "Priority support",
    ],
    cta: "Start Premium",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "₹4,999",
    period: "per month",
    features: [
      "Everything in Premium",
      "Coaching institute dashboard",
      "Bulk student management",
      "Custom content pipelines",
      "API access for integrations",
      "Dedicated account manager",
      "White-label options",
      "Advanced analytics & reporting",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Accelerate your UPSC preparation with AI-powered tools tailored to
            your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-blue-600 text-white ring-4 ring-blue-300 scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
              }`}
            >
              <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span
                  className={`ml-2 text-sm ${
                    plan.highlighted
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? "text-blue-200" : "text-green-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      className={`text-sm ${
                        plan.highlighted
                          ? "text-blue-50"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block text-center py-3 px-6 rounded-lg font-medium transition ${
                  plan.highlighted
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
