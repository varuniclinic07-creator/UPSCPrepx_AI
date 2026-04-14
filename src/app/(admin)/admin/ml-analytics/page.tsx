'use client';

/**
 * Phase 16: ML Analytics Dashboard
 * Advanced analytics with user segmentation, usage patterns, and cost optimization
 */

import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Brain,
  Target,
  Zap,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Layers,
} from 'lucide-react';

interface MLDashboardData {
  summary: {
    totalUsers: number;
    healthScore: number;
    totalTokens: number;
    totalRevenue: number;
    avgTokensPerUser: number;
    activeUsers: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  segmentation: {
    distribution: Record<string, number>;
    championCount: number;
    atRiskCount: number;
    dormantCount: number;
    adoptionStages: Record<string, number>;
  };
  usage: {
    trends: {
      tokensGrowth: number;
      usersGrowth: number;
      revenueGrowth: number;
    };
    peakUsage: {
      hour: number;
      dayOfWeek: number;
    };
    growthRates: {
      tokens: number;
      users: number;
      revenue: number;
    };
  };
  costs: {
    providers: Array<{
      provider: string;
      totalCost: number;
      totalTokens: number;
      efficiency: string;
    }>;
    totalProviderCost: number;
  };
  features: {
    metrics: {
      totalFeatures: number;
      activeFeatures: number;
      avgFeaturesPerUser: number;
      mostPopularFeature: string;
      fastestGrowingFeature: string;
    };
    activeFeatures: number;
    avgFeaturesPerUser: number;
  };
  cohorts: Array<{
    cohort: string;
    userCount: number;
    retention: {
      day1: number;
      day7: number;
      day30: number;
    };
  }>;
}

const SEGMENT_COLORS: Record<string, string> = {
  champion: 'bg-yellow-500',
  loyal: 'bg-blue-500',
  potential: 'bg-green-500',
  at_risk: 'bg-orange-500',
  dormant: 'bg-gray-500',
  free_tier: 'bg-purple-500',
  heavy_user: 'bg-red-500',
  price_sensitive: 'bg-indigo-500',
  power_user: 'bg-pink-500',
  casual: 'bg-teal-500',
};

const ADOPTION_STAGE_COLORS: Record<string, string> = {
  champion: 'bg-yellow-500',
  power_user: 'bg-purple-500',
  adopting: 'bg-blue-500',
  exploring: 'bg-green-500',
  new: 'bg-gray-500',
};

export default function AdminMLAnalyticsPage() {
  const [data, setData] = useState<MLDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [period, setPeriod] = useState(30);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/analytics/ml/dashboard?period=${period}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch ML dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboard, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-pulse text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading ML Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">ML Analytics</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                AI-powered insights, user segmentation, and predictive analytics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
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
                onClick={fetchDashboard}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Health</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.summary.healthScore.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on user engagement & retention
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.summary.totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    DAU: {data?.summary.activeUsers.daily.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Tokens Used</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {(data?.summary.totalTokens || 0) / 1000000 >= 1
                    ? `${((data?.summary.totalTokens || 0) / 1000000).toFixed(1)}M`
                    : `${((data?.summary.totalTokens || 0) / 1000).toFixed(0)}K`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {data?.summary.avgTokensPerUser.toLocaleString()}/user
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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${data?.summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Period revenue
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Segmentation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">User Segmentation</h2>
              <Target className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {data?.segmentation && Object.entries(data.segmentation.distribution).map(([segment, count]) => (
                <div key={segment} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${SEGMENT_COLORS[segment] || 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700 capitalize flex-1">
                    {segment.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{count.toLocaleString()}</span>
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${SEGMENT_COLORS[segment] || 'bg-gray-400'}`}
                      style={{ width: `${(count / (data.segmentation.championCount + data.segmentation.atRiskCount + data.segmentation.dormantCount || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adoption Stages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Feature Adoption</h2>
              <Layers className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {data?.segmentation && Object.entries(data.segmentation.adoptionStages).map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${ADOPTION_STAGE_COLORS[stage] || 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700 capitalize flex-1">
                    {stage.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Growth Trends</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Token Usage</p>
                {(data?.usage.growthRates.tokens ?? 0) >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(data?.usage.growthRates.tokens ?? 0) >= 0 ? '+' : ''}{(data?.usage.growthRates.tokens ?? 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">vs previous period</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">User Growth</p>
                {(data?.usage.growthRates.users ?? 0) >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(data?.usage.growthRates.users ?? 0) >= 0 ? '+' : ''}{(data?.usage.growthRates.users ?? 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">vs previous period</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                {(data?.usage.growthRates.revenue ?? 0) >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(data?.usage.growthRates.revenue ?? 0) >= 0 ? '+' : ''}{(data?.usage.growthRates.revenue ?? 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">vs previous period</p>
            </div>
          </div>
        </div>

        {/* Provider Costs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">AI Provider Costs</h2>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Provider</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Tokens</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {data?.costs.providers.map((provider, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 capitalize">
                      {provider.provider}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {(provider.totalTokens / 1000).toFixed(0)}K
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      ${provider.totalCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        provider.efficiency === 'excellent' ? 'bg-green-100 text-green-800' :
                        provider.efficiency === 'good' ? 'bg-blue-100 text-blue-800' :
                        provider.efficiency === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {provider.efficiency}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Feature Analytics</h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{data?.features.metrics.activeFeatures || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Active Features</p>
              <p className="text-xs text-gray-400 mt-1">of {data?.features.metrics.totalFeatures || 0} total</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{data?.features.avgFeaturesPerUser.toFixed(1)}</p>
              <p className="text-sm text-gray-500 mt-1">Avg Features/User</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900 truncate">{data?.features.metrics.mostPopularFeature || '-'}</p>
              <p className="text-sm text-gray-500 mt-1">Most Popular</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-green-600 truncate">{data?.features.metrics.fastestGrowingFeature || '-'}</p>
              <p className="text-sm text-gray-500 mt-1">Fastest Growing</p>
            </div>
          </div>
        </div>

        {/* Cohort Retention */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Cohort Retention</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cohort</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Users</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Day 1</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Day 7</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Day 30</th>
                </tr>
              </thead>
              <tbody>
                {data?.cohorts.map((cohort, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {cohort.cohort}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {cohort.userCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${
                        cohort.retention.day1 >= 0.6 ? 'text-green-600' :
                        cohort.retention.day1 >= 0.4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(cohort.retention.day1 * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${
                        cohort.retention.day7 >= 0.4 ? 'text-green-600' :
                        cohort.retention.day7 >= 0.2 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(cohort.retention.day7 * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${
                        cohort.retention.day30 >= 0.2 ? 'text-green-600' :
                        cohort.retention.day30 >= 0.1 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(cohort.retention.day30 * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
