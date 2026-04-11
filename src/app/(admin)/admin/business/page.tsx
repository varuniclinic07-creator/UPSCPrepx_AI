'use client';

/**
 * Business Dashboard - Main Overview
 * Real-time business metrics and KPIs for UPSC PrepX-AI
 */

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
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
} from 'recharts';
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface RealtimeMetrics {
  activeUsers: number;
  newSignupsToday: number;
  revenueToday: number;
  aiRequestsToday: number;
  queueStatus: Array<{ queue_name: string; status: string; count: number }>;
  conversionRate: number;
  timestamp: string;
}

interface RevenueMetrics {
  mrr: number;
  arr: number;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number; count: number }>;
  churnRate: number;
  ltv: number;
  netRevenueRetention: number;
}

interface UserMetrics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  usersByPlan: Array<{ plan: string; count: number; percentage: number }>;
  dailySignups: Array<{ date: string; signups: number }>;
  retentionRate: number;
  stickiness: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function BusinessDashboard() {
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const fetchMetrics = async () => {
    try {
      const [realtimeRes, revenueRes, usersRes] = await Promise.all([
        fetch('/api/admin/metrics/realtime'),
        fetch(`/api/admin/metrics/revenue?period=${selectedPeriod}`),
        fetch(`/api/admin/metrics/users?period=${selectedPeriod}`),
      ]);

      const realtimeData = await realtimeRes.json();
      const revenueData = await revenueRes.json();
      const usersData = await usersRes.json();

      setRealtimeMetrics(realtimeData.data);
      setRevenueMetrics(revenueData.data);
      setUserMetrics(usersData.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    format = 'number',
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    format?: 'number' | 'currency' | 'percent';
  }) => {
    const formattedValue =
      format === 'currency'
        ? `$${value.toLocaleString()}`
        : format === 'percent'
        ? `${(value * 100).toFixed(1)}%`
        : value.toLocaleString();

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formattedValue}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        {change !== undefined && (
          <div className="flex items-center mt-4">
            {change >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ml-1 ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading business metrics...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time metrics and analytics
                {lastUpdated && (
                  <span className="ml-2">
                    (Updated: {lastUpdated.toLocaleTimeString()})
                  </span>
                )}
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
        {/* Real-time KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Users"
            value={realtimeMetrics?.activeUsers || 0}
            change={12.5}
            icon={Users}
          />
          <StatCard
            title="Revenue Today"
            value={realtimeMetrics?.revenueToday || 0}
            change={8.2}
            icon={DollarSign}
            format="currency"
          />
          <StatCard
            title="AI Requests Today"
            value={realtimeMetrics?.aiRequestsToday || 0}
            change={15.3}
            icon={Activity}
          />
          <StatCard
            title="Conversion Rate"
            value={realtimeMetrics?.conversionRate || 0}
            change={-2.1}
            icon={TrendingUp}
            format="percent"
          />
        </div>

        {/* MRR & LTV Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Monthly Recurring Revenue"
            value={revenueMetrics?.mrr || 0}
            change={5.8}
            icon={DollarSign}
            format="currency"
          />
          <StatCard
            title="Annual Recurring Revenue"
            value={revenueMetrics?.arr || 0}
            change={5.8}
            icon={DollarSign}
            format="currency"
          />
          <StatCard
            title="Customer LTV"
            value={revenueMetrics?.ltv || 0}
            change={3.2}
            icon={TrendingUp}
            format="currency"
          />
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueMetrics?.dailyRevenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
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
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Users & Revenue Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Users by Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Plan</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userMetrics?.usersByPlan || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ plan, percentage }) => `${plan}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(userMetrics?.usersByPlan || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueMetrics?.revenueByPlan || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="plan" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {((revenueMetrics?.churnRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {((userMetrics?.retentionRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stickiness (DAU/MAU)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {((userMetrics?.stickiness || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Revenue Retention</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {revenueMetrics?.netRevenueRetention?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {realtimeMetrics?.queueStatus.map((queue, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {queue.queue_name} Queue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {queue.count.toLocaleString()}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    queue.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {queue.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
