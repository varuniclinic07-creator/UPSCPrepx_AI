'use client';

/**
 * My Usage Dashboard
 * Personal AI usage tracking for users
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
  Activity,
  Cpu,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Wallet,
} from 'lucide-react';

interface UsageData {
  budgetStatus: {
    userId: string;
    plan: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    tokensUsed: number;
    tokensRemaining: number;
    tokensLimit: number;
    costUsed: number;
    costRemaining: number;
    costLimit: number;
    requestsToday: number;
    requestsLimit: number;
    percentageUsed: number;
    isOverLimit: boolean;
    warnings: string[];
  };
  usageSummary: {
    totalTokens: number;
    totalCost: number;
    totalRequests: number;
    byProvider: Record<string, { tokens: number; cost: number; requests: number }>;
    byEndpoint: Record<string, { tokens: number; cost: number; requests: number }>;
  };
  dailyBreakdown: Array<{ date: string; tokens: number; cost: number }>;
  endpointUsage: Array<{ endpoint: string; tokens: number; cost: number; count: number }>;
  timestamp: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function MyUsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/admin/metrics/my-usage');
      const data = await res.json();
      setUsage(data.data);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading your usage...</p>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
          <p>Failed to load usage data</p>
        </div>
      </div>
    );
  }

  const { budgetStatus, usageSummary, dailyBreakdown, endpointUsage } = usage;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My AI Usage</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track your AI consumption and budget
              </p>
            </div>
            <button
              onClick={fetchUsage}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Budget Status Banner */}
        <div
          className={`rounded-xl p-6 mb-8 ${
            budgetStatus.isOverLimit
              ? 'bg-red-50 border-2 border-red-200'
              : budgetStatus.percentageUsed >= 90
              ? 'bg-red-50 border border-red-200'
              : budgetStatus.percentageUsed >= 75
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {budgetStatus.isOverLimit ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : budgetStatus.percentageUsed >= 75 ? (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {budgetStatus.isOverLimit
                    ? 'Budget Exceeded'
                    : budgetStatus.percentageUsed >= 90
                    ? 'Critical: Nearly Over Budget'
                    : budgetStatus.percentageUsed >= 75
                    ? 'Warning: High Usage'
                    : 'Usage on Track'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {budgetStatus.plan.charAt(0).toUpperCase() + budgetStatus.plan.slice(1)} Plan
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {budgetStatus.percentageUsed.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">of monthly budget used</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                budgetStatus.percentageUsed >= 90
                  ? 'bg-red-500'
                  : budgetStatus.percentageUsed >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetStatus.percentageUsed, 100)}%` }}
            />
          </div>

          {/* Warnings */}
          {budgetStatus.warnings.length > 0 && (
            <div className="mt-4 space-y-2">
              {budgetStatus.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget Used</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${budgetStatus.costUsed.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of ${budgetStatus.costLimit} monthly limit
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
                <p className="text-sm font-medium text-gray-600">Budget Remaining</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${budgetStatus.costRemaining.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((budgetStatus.costRemaining / budgetStatus.costLimit) * 100).toFixed(1)}% left
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tokens Used</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(budgetStatus.tokensUsed / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {(budgetStatus.tokensLimit / 1000).toFixed(0)}K monthly limit
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requests Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {budgetStatus.requestsToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {budgetStatus.requestsLimit} daily limit
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Usage Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Usage This Month</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyBreakdown}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
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
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="tokens"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  name="Tokens"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Cost ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Usage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Provider */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <Cpu className="w-5 h-5 inline mr-2" />
              Usage by Provider
            </h2>
            <div className="space-y-4">
              {Object.entries(usageSummary.byProvider).map(([provider, data], index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{provider}</p>
                    <p className="text-sm text-gray-500">
                      {(data.tokens / 1000).toFixed(0)}K tokens • {data.requests} requests
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${data.cost.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Endpoint */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <Activity className="w-5 h-5 inline mr-2" />
              Usage by Feature
            </h2>
            <div className="space-y-4">
              {endpointUsage.slice(0, 5).map((endpoint, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">
                      {endpoint.endpoint.replace('/api/', '')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(endpoint.tokens / 1000).toFixed(0)}K tokens • {endpoint.count} requests
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${endpoint.cost.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Period Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Period</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Period</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(budgetStatus.currentPeriodStart).toLocaleDateString()} -{' '}
                {new Date(budgetStatus.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-lg font-medium text-gray-900 capitalize">
                {budgetStatus.plan}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
