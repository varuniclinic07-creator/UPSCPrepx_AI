'use client';

/**
 * AI Cost Tracking Dashboard
 * Monitor AI costs, budgets, and profit margins
 */

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Users,
  Cpu,
  Wallet,
  Activity,
} from 'lucide-react';

interface AICostMetrics {
  totalCost: number;
  totalRevenue: number;
  margin: number;
  providerCosts: Record<string, { cost: number; tokens: number }>;
  planCosts: Record<string, { cost: number; users: number }>;
  planMargins: Record<string, { revenue: number; cost: number; margin: number; users: number; costPerUser: number }>;
  dailyCostTrend: Record<string, number>;
  topUsers: Array<{ user_id: string; cost_usd: number; total_tokens: number }>;
  budgetAlerts: Array<{
    userId: string;
    email: string;
    plan: string;
    percentageUsed: number;
    costUsed: number;
    costLimit: number;
  }>;
  averageCostPerUser: number;
  timestamp: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AICostPage() {
  const [metrics, setMetrics] = useState<AICostMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/admin/metrics/ai-cost?period=${selectedPeriod}`);
      const data = await res.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Failed to fetch AI cost metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedPeriod]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading AI cost analytics...</p>
        </div>
      </div>
    );
  }

  // Transform daily cost trend for chart
  const dailyData = metrics
    ? Object.entries(metrics.dailyCostTrend).map(([date, cost]) => ({
        date,
        cost,
      }))
    : [];

  // Transform provider costs for chart
  const providerData = metrics
    ? Object.entries(metrics.providerCosts).map(([provider, data]) => ({
        provider,
        cost: data.cost,
        tokens: data.tokens / 1000000, // Convert to millions
      }))
    : [];

  // Transform plan margins for chart
  const planMarginData = metrics
    ? Object.entries(metrics.planMargins).map(([plan, data]) => ({
        plan,
        revenue: data.revenue,
        cost: data.cost,
        margin: data.margin,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Cost Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track AI costs, budgets, and profit margins
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={fetchMetrics}
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total AI Cost</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${metrics?.totalCost.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${metrics?.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics?.margin.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Cost per User</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${metrics?.averageCostPerUser.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Alerts */}
        {metrics?.budgetAlerts && metrics.budgetAlerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-lg font-semibold text-yellow-900">Budget Alerts</h2>
            </div>
            <div className="space-y-3">
              {metrics.budgetAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    alert.percentageUsed >= 90 ? 'bg-red-50' : 'bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alert.email}</p>
                      <p className="text-sm text-gray-500 capitalize">{alert.plan} plan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {alert.percentageUsed.toFixed(0)}% used
                      </p>
                      <p className="text-sm text-gray-500">
                        ${alert.costUsed.toFixed(2)} / ${alert.costLimit}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        alert.percentageUsed >= 90 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(alert.percentageUsed, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Cost Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily AI Cost Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  name="Daily Cost ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provider Costs & Plan Margins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Provider Costs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <Cpu className="w-5 h-5 inline mr-2" />
              Cost by Provider
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="provider" stroke="#6B7280" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="cost" fill="#EF4444" name="Cost ($)" />
                  <Bar yAxisId="right" dataKey="tokens" fill="#3B82F6" name="Tokens (M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plan Margins */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Plan Profit Margins
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planMarginData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="plan" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margin']}
                  />
                  <Bar dataKey="margin" name="Margin %" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Plan Economics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Economics</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Plan</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Users</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">AI Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Margin</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Cost/User</th>
                </tr>
              </thead>
              <tbody>
                {planMarginData.map((plan, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 capitalize">
                      {plan.plan}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {plan.users.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-green-600">
                      ${plan.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-red-600">
                      ${plan.cost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          plan.margin >= 90
                            ? 'bg-green-100 text-green-800'
                            : plan.margin >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {plan.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      ${plan.costPerUser.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Users by Cost */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Users by AI Cost</h2>
          <div className="space-y-3">
            {metrics?.topUsers.slice(0, 10).map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate">{user.user_id}</p>
                    <p className="text-sm text-gray-500">
                      {(user.total_tokens / 1000).toFixed(0)}K tokens
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">${user.cost_usd.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
