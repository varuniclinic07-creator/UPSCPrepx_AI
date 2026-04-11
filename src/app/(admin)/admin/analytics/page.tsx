/**
 * Admin Analytics Page
 * Comprehensive revenue, user, and AI usage analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, Cpu, ArrowUpRight, ArrowDownRight,
  Download, Calendar, RefreshCcw
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  revenue: {
    mrr: number;
    arr: number;
    total: number;
    growth_rate: number;
    daily: Array<{ date: string; value: number }>;
    by_plan: Array<{ plan: string; amount: number; users: number }>;
  };
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    cancelled: number;
    churn_rate: number;
    conversion_rate: number;
    by_plan: Array<{ plan: string; count: number; percentage: number }>;
  };
  users: {
    total: number;
    active_today: number;
    active_week: number;
    new_this_period: number;
    growth_rate: number;
  };
  ai_usage: {
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    avg_latency_ms: number;
    by_provider: Array<{
      name: string;
      total_requests: number;
      success_rate: number;
      avg_latency_ms: number;
    }>;
    daily: Array<{ date: string; requests: number; tokens: number }>;
  };
}

const COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'revenue' | 'users' | 'ai'>('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600">Failed to load analytics data</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-saffron-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Comprehensive platform insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === p
                    ? 'bg-saffron-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button className="px-4 py-2 bg-saffron-600 text-white rounded-lg text-sm font-medium hover:bg-saffron-700 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['revenue', 'users', 'ai'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-saffron-600 text-saffron-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KpiCard
              title="MRR"
              value={`₹${data.revenue.mrr.toLocaleString()}`}
              trend={`${data.revenue.growth_rate}%`}
              trendUp={data.revenue.growth_rate > 0}
              icon={DollarSign}
            />
            <KpiCard
              title="ARR"
              value={`₹${(data.revenue.arr / 100000).toFixed(1)}L`}
              trend="12.5%"
              trendUp={true}
              icon={TrendingUp}
            />
            <KpiCard
              title="Total Revenue"
              value={`₹${(data.revenue.total / 100000).toFixed(1)}L`}
              trend="8.2%"
              trendUp={true}
              icon={DollarSign}
            />
            <KpiCard
              title="Avg per User"
              value={`₹${(data.revenue.mrr / data.subscriptions.active).toFixed(0)}`}
              trend="3.1%"
              trendUp={true}
              icon={Users}
            />
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.revenue.daily}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#F97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Plan</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.revenue.by_plan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="plan" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Users by Plan</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.subscriptions.by_plan}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ plan, percentage }) => `${plan}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="plan"
                  >
                    {data.subscriptions.by_plan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KpiCard
              title="Total Users"
              value={data.users.total.toLocaleString()}
              trend={`${data.users.growth_rate}%`}
              trendUp={data.users.growth_rate > 0}
              icon={Users}
            />
            <KpiCard
              title="Active Today"
              value={data.users.active_today.toLocaleString()}
              trend={`${((data.users.active_today / data.users.total) * 100).toFixed(1)}%`}
              trendUp={true}
              icon={TrendingUp}
            />
            <KpiCard
              title="Active This Week"
              value={data.users.active_week.toLocaleString()}
              trend={`${((data.users.active_week / data.users.total) * 100).toFixed(1)}%`}
              trendUp={true}
              icon={Calendar}
            />
            <KpiCard
              title="New This Period"
              value={data.users.new_this_period.toLocaleString()}
              trend="15.3%"
              trendUp={true}
              icon={Users}
            />
          </div>
        </div>
      )}

      {/* AI Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KpiCard
              title="Total Requests"
              value={`${(data.ai_usage.total_requests / 1000000).toFixed(2)}M`}
              trend="22.5%"
              trendUp={true}
              icon={Cpu}
            />
            <KpiCard
              title="Total Tokens"
              value={`${(data.ai_usage.total_tokens / 1000000000).toFixed(2)}B`}
              trend="18.2%"
              trendUp={true}
              icon={Cpu}
            />
            <KpiCard
              title="Total Cost"
              value={`₹${data.ai_usage.total_cost.toFixed(2)}`}
              trend="5.1%"
              trendUp={false}
              icon={DollarSign}
            />
            <KpiCard
              title="Avg Latency"
              value={`${data.ai_usage.avg_latency_ms}ms`}
              trend="-12%"
              trendUp={true}
              icon={TrendingUp}
            />
          </div>

          {/* AI Requests Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">AI Requests & Tokens</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data.ai_usage.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="requests" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Requests" />
                <Line yAxisId="right" type="monotone" dataKey="tokens" stroke="#8B5CF6" strokeWidth={2} name="Tokens" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Provider Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Provider Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.ai_usage.by_provider.map((provider) => (
                <div
                  key={provider.name}
                  className="p-4 rounded-lg border border-gray-200 hover:border-saffron-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      provider.success_rate >= 99
                        ? 'bg-green-100 text-green-700'
                        : provider.success_rate >= 95
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {provider.success_rate}%
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Requests</span>
                      <span className="font-medium text-gray-900">
                        {(provider.total_requests / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Latency</span>
                      <span className="font-medium text-gray-900">{provider.avg_latency_ms}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-saffron-50">
          <Icon className="w-6 h-6 text-saffron-600" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {trend}
        </span>
        <span className="text-xs text-gray-400">vs last period</span>
      </div>
    </div>
  );
}
