/**
 * Admin Dashboard - Main Overview
 * Enterprise-grade dashboard with real-time analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Video, CreditCard, TrendingUp, AlertCircle, ShieldCheck,
  Search, BarChart3, Activity, Cpu, Clock, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, DollarSign, Eye, Zap
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface AnalyticsData {
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

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

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
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-saffron-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">System Overview & Key Metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
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
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Find User
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={data.users.total.toLocaleString()}
          icon={Users}
          color="text-blue-600"
          trend={`${data.users.growth_rate}%`}
          trendUp={data.users.growth_rate > 0}
          subValue={`${data.users.active_today.toLocaleString()} active today`}
        />
        <StatCard
          title="MRR"
          value={`₹${data.revenue.mrr.toLocaleString()}`}
          icon={DollarSign}
          color="text-green-600"
          trend={`${data.revenue.growth_rate}%`}
          trendUp={data.revenue.growth_rate > 0}
          subValue={`₹${(data.revenue.arr / 12).toLocaleString()} avg monthly`}
        />
        <StatCard
          title="Subscriptions"
          value={data.subscriptions.total.toLocaleString()}
          icon={CreditCard}
          color="text-purple-600"
          trend={`${data.subscriptions.conversion_rate}% conv`}
          trendUp={true}
          subValue={`${data.subscriptions.active.toLocaleString()} active`}
        />
        <StatCard
          title="AI Requests"
          value={`${(data.ai_usage.total_requests / 1000000).toFixed(2)}M`}
          icon={Cpu}
          color="text-orange-600"
          trend={`${data.ai_usage.avg_latency_ms}ms avg`}
          trendUp={false}
          subValue={`₹${data.ai_usage.total_cost.toFixed(2)} total cost`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
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
                formatter={((value: number) => [`₹${value.toLocaleString()}`, 'Revenue']) as any}
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

        {/* Subscription Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Subscription Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.subscriptions.by_plan}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ plan, percentage }: any) => `${plan}: ${percentage}%`}
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

      {/* AI Usage Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-orange-600" />
          AI Provider Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.ai_usage.by_provider.map((provider, index) => (
            <div
              key={provider.name}
              className="p-4 rounded-lg border border-gray-200 hover:border-saffron-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                {provider.success_rate >= 99 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : provider.success_rate >= 95 ? (
                  <Activity className="w-4 h-4 text-yellow-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Requests</span>
                  <span className="font-medium text-gray-900">
                    {(provider.total_requests / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Success Rate</span>
                  <span className={`font-medium ${provider.success_rate >= 99 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {provider.success_rate}%
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

      {/* Action Items & Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Required */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Action Required
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Inappropriate Comment on "Fundamental Rights"</p>
                  <p className="text-xs text-gray-500 mt-0.5">User: @rahul_123 • Reported 2h ago</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded">
                  Ban
                </button>
                <button className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded">
                  Dismiss
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Video className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Video Generation Failed #8921</p>
                  <p className="text-xs text-gray-500 mt-0.5">Topic: Indian Geography</p>
                </div>
              </div>
              <button className="px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded">
                Retry
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Payment Verification Pending</p>
                  <p className="text-xs text-gray-500 mt-0.5">5 transactions awaiting review</p>
                </div>
              </div>
              <button className="px-3 py-1.5 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded">
                Review
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Tools</h2>
          <div className="space-y-3">
            <Link
              href="/admin/ai-videos"
              className="w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 border border-gray-200"
            >
              <span className="p-1.5 bg-white rounded shadow-sm">
                <Video className="w-4 h-4 text-gray-600" />
              </span>
              Manage AI Videos
            </Link>
            <Link
              href="/admin/queue"
              className="w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 border border-gray-200"
            >
              <span className="p-1.5 bg-white rounded shadow-sm">
                <Activity className="w-4 h-4 text-gray-600" />
              </span>
              Queue Status
            </Link>
            <Link
              href="/admin/features"
              className="w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 border border-gray-200"
            >
              <span className="p-1.5 bg-white rounded shadow-sm">
                <ShieldCheck className="w-4 h-4 text-gray-600" />
              </span>
              Feature Flags
            </Link>
            <Link
              href="/admin/system"
              className="w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-3 border border-gray-200"
            >
              <span className="p-1.5 bg-white rounded shadow-sm">
                <BarChart3 className="w-4 h-4 text-gray-600" />
              </span>
              System Health
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
  subValue,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend: string;
  trendUp: boolean;
  subValue: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gray-50`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {trend}
        </span>
        <span className="text-xs text-gray-400">vs last period</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{subValue}</p>
    </div>
  );
}
