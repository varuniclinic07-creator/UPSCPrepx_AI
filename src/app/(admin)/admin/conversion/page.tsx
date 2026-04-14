'use client';

/**
 * Conversion Funnel Dashboard
 * Track user journey from signup to paid conversion
 */

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  Funnel as FunnelIcon,
  Users,
  UserCheck,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react';

interface ConversionMetrics {
  funnel: {
    visitors: number;
    signed_up: number;
    onboarded: number;
    engaged: number;
    trial_started: number;
    paid_users: number;
  };
  conversionRates: {
    signup_to_onboarded: number;
    onboarded_to_engaged: number;
    engaged_to_trial: number;
    trial_to_paid: number;
    overall: number;
  };
  conversionBySource: Array<{ source: string; visitors: number; conversions: number; rate: number }>;
  timeToConvert: Array<{ range: string; count: number; percentage: number }>;
  activationRate: number;
  dropoffPoints: Array<{ stage: string; dropoff: number; rate: number }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ConversionPage() {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/admin/metrics/conversion?period=${selectedPeriod}`);
      const data = await res.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Failed to fetch conversion metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedPeriod]);

  // Transform funnel data for visualization
  const funnelData = metrics
    ? [
        { stage: 'Visitors', value: metrics.funnel.visitors, rate: 100 },
        { stage: 'Signed Up', value: metrics.funnel.signed_up, rate: (metrics.funnel.signed_up / metrics.funnel.visitors) * 100 },
        { stage: 'Onboarded', value: metrics.funnel.onboarded, rate: (metrics.funnel.onboarded / metrics.funnel.visitors) * 100 },
        { stage: 'Engaged', value: metrics.funnel.engaged, rate: (metrics.funnel.engaged / metrics.funnel.visitors) * 100 },
        { stage: 'Trial Started', value: metrics.funnel.trial_started, rate: (metrics.funnel.trial_started / metrics.funnel.visitors) * 100 },
        { stage: 'Paid Users', value: metrics.funnel.paid_users, rate: (metrics.funnel.paid_users / metrics.funnel.visitors) * 100 },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading conversion analytics...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Conversion Funnel</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track user journey from visitor to paid customer
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
                <p className="text-sm font-medium text-gray-600">Overall Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {((metrics?.conversionRates.overall || 0) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activation Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {((metrics?.activationRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trial to Paid</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {((metrics?.conversionRates.trial_to_paid || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics?.funnel.visitors.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Funnel Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis dataKey="stage" type="category" stroke="#6B7280" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  formatter={((value: number, name: string, props: any) => [
                    value.toLocaleString(),
                    name === 'value' ? 'Users' : 'Rate',
                  ]) as any}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="stage" position="top" fill="#6B7280" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Rates by Stage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rates by Stage</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Signup → Onboarded</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {((metrics?.conversionRates.signup_to_onboarded || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Onboarded → Engaged</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {((metrics?.conversionRates.onboarded_to_engaged || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Engaged → Trial</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {((metrics?.conversionRates.engaged_to_trial || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Trial → Paid</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {((metrics?.conversionRates.trial_to_paid || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Conversion by Source & Time to Convert */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Conversion by Source */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion by Source</h2>
            <div className="space-y-4">
              {metrics?.conversionBySource.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{item.source}</p>
                    <p className="text-sm text-gray-500">
                      {item.conversions.toLocaleString()} / {item.visitors.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {(item.rate * 100).toFixed(2)}%
                    </p>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(item.rate * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time to Convert */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <Clock className="w-5 h-5 inline mr-2" />
              Time to Convert
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.timeToConvert || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.range}: ${props.percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(metrics?.timeToConvert || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Drop-off Points */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Drop-off Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {metrics?.dropoffPoints.map((point, index) => (
              <div
                key={index}
                className="p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <p className="text-sm text-gray-600">{point.stage}</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {point.dropoff.toLocaleString()}
                </p>
                <p className="text-sm text-red-500 mt-1">
                  {(point.rate * 100).toFixed(1)}% drop-off rate
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
