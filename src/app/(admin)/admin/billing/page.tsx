'use client';

/**
 * Phase 15: Admin Billing Dashboard
 * Pricing configuration, revenue analytics, and surge management
 */

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  CreditCard,
  BarChart3,
  Settings,
} from 'lucide-react';

interface BillingAnalytics {
  revenue: {
    total: number;
    plan: number;
    overage: number;
    averagePerUser: number;
  };
  invoices: {
    total: number;
    paid: number;
    overdue: number;
    collectionRate: number;
  };
  plans: {
    distribution: Record<string, number>;
    pricing: Record<string, {
      monthlyPrice: number;
      effectiveYearly: number;
      discount: number;
    }>;
  };
  surge: {
    active: boolean;
    multiplier: number;
    demandLevel: string;
    timeInSurge: number;
  };
  topSpenders: Array<{ user_id: string; total: number }>;
}

interface SurgeState {
  active: boolean;
  multiplier: number;
  demandLevel: string;
  reason: string;
}

export default function AdminBillingPage() {
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [surgeState, setSurgeState] = useState<SurgeState | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/billing/analytics');
      const data = await res.json();
      setAnalytics(data.data);
      setSurgeState(data.data.surge);
    } catch (error) {
      console.error('Failed to fetch billing analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading billing analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing & Pricing</h1>
              <p className="text-sm text-gray-500 mt-1">
                Revenue analytics, pricing configuration, and surge management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={fetchAnalytics}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${analytics?.revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Plan Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${analytics?.revenue.plan.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overage Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${analytics?.revenue.overage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.revenue.total ? ((analytics.revenue.overage / analytics.revenue.total) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Revenue/User</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${analytics?.revenue.averagePerUser.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Stats & Surge Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Invoice Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{analytics?.invoices.total || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Total Invoices</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analytics?.invoices.paid || 0}</p>
                <p className="text-sm text-green-600 mt-1">Paid</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{analytics?.invoices.overdue || 0}</p>
                <p className="text-sm text-red-600 mt-1">Overdue</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Collection Rate</p>
                <p className="text-sm font-bold text-gray-900">
                  {analytics?.invoices.collectionRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${analytics?.invoices.collectionRate || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Surge Pricing Status */}
          <div className={`rounded-xl shadow-sm border p-6 ${
            surgeState?.active
              ? 'bg-orange-50 border-orange-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Surge Pricing</h2>
              {surgeState?.active ? (
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${
                  surgeState?.active ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {surgeState?.active ? 'ACTIVE' : 'NORMAL'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Multiplier</p>
                <p className="text-lg font-bold text-gray-900">
                  {surgeState?.multiplier.toFixed(2)}x
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Demand Level</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {surgeState?.demandLevel || 'normal'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time in Surge</p>
                <p className="text-sm font-medium text-gray-900">
                  {analytics?.surge.timeInSurge || 0} min
                </p>
              </div>
            </div>

            {surgeState?.active && (
              <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                <p className="text-sm text-orange-800">
                  Surge pricing is currently active due to {surgeState.demandLevel} demand.
                  Prices are multiplied by {surgeState.multiplier.toFixed(2)}x.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics?.plans && Object.entries(analytics.plans.distribution).map(([plan, count]) => (
              <div key={plan} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 capitalize">{plan}</p>
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${analytics.plans.pricing[plan]?.monthlyPrice || 0}/month
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Plans Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Plan</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Monthly</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Yearly</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Effective Monthly</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Discount</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.plans && Object.entries(analytics.plans.pricing).map(([plan, data]) => (
                  <tr key={plan} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 capitalize">
                      {plan}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      ${data.monthlyPrice}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      ${data.effectiveYearly}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      ${(data.effectiveYearly).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {data.discount > 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {data.discount}% off
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Spenders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Spenders</h2>
          <div className="space-y-3">
            {analytics?.topSpenders.slice(0, 10).map((spender, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate">{spender.user_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${spender.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
