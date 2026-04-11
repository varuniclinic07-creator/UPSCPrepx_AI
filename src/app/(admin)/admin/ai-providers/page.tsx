'use client';

/**
 * Phase 14: AI Provider Management Dashboard
 * Monitor provider health, costs, and configure routing rules
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Cpu,
  Zap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Server,
  Clock,
} from 'lucide-react';

interface ProviderHealth {
  isHealthy: boolean;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  successRate: number;
  avgLatencyMs: number;
  consecutiveFailures: number;
  lastHealthCheck: number;
}

interface ProviderLoad {
  activeRequests: number;
  utilizationPercent: number;
  weight: number;
}

interface ProviderStatus {
  name: string;
  health: ProviderHealth;
  load: ProviderLoad;
  lastCheck: {
    statusCode?: number;
    latencyMs: number;
    error?: string;
    timestamp: number;
  } | null;
}

interface ProviderMetrics {
  providers: ProviderStatus[];
  timestamp: number;
  summary: {
    healthyCount: number;
    totalProviders: number;
    avgLatency: number;
    totalActiveRequests: number;
  };
}

const PROVIDER_INFO: Record<string, { displayName: string; description: string }> = {
  '9router': {
    displayName: '9Router',
    description: 'Primary aggregated provider',
  },
  groq: {
    displayName: 'Groq',
    description: 'Fast inference with LPU',
  },
  ollama: {
    displayName: 'Ollama',
    description: 'Local/self-hosted models',
  },
  anthropic: {
    displayName: 'Anthropic',
    description: 'Claude models (disabled by default)',
  },
  openai: {
    displayName: 'OpenAI',
    description: 'GPT models (disabled by default)',
  },
};

export default function AIProvidersPage() {
  const [metrics, setMetrics] = useState<ProviderMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/ai-providers/status');
      const data = await res.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Failed to fetch provider status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading provider status...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">AI Provider Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor provider health, latency, and routing
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
                <p className="text-sm font-medium text-gray-600">Healthy Providers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics?.summary.healthyCount || 0} / {metrics?.summary.totalProviders || 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(metrics?.summary.avgLatency || 0).toFixed(0)}ms
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics?.summary.totalActiveRequests || 0}
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
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics && metrics.summary.healthyCount === metrics.summary.totalProviders
                    ? 'Operational'
                    : 'Degraded'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Server className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Provider Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {metrics?.providers.map((provider) => {
            const info = PROVIDER_INFO[provider.name] || {
              displayName: provider.name,
              description: '',
            };

            const healthColor = provider.health.isHealthy
              ? provider.health.circuitState === 'HALF_OPEN'
                ? 'yellow'
                : 'green'
              : 'red';

            const healthBg = provider.health.isHealthy
              ? provider.health.circuitState === 'HALF_OPEN'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200';

            const healthIcon = provider.health.isHealthy
              ? provider.health.circuitState === 'HALF_OPEN'
                ? AlertCircle
                : CheckCircle
              : XCircle;

            return (
              <div
                key={provider.name}
                className={`bg-white rounded-xl shadow-sm border p-6 ${healthBg}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      healthColor === 'green'
                        ? 'bg-green-100'
                        : healthColor === 'yellow'
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                    }`}>
                      <Cpu className={`w-6 h-6 text-${healthColor}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {info.displayName}
                      </h3>
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {healthIcon({
                      className: `w-5 h-5 text-${healthColor}-600`,
                    })}
                    <span className={`text-sm font-medium text-${healthColor}-700`}>
                      {provider.health.isHealthy
                        ? provider.health.circuitState === 'HALF_OPEN'
                          ? 'Recovering'
                          : 'Healthy'
                        : 'Unhealthy'}
                    </span>
                  </div>
                </div>

                {/* Health Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Success Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(provider.health.successRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Avg Latency</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {provider.health.avgLatencyMs.toFixed(0)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Circuit State</p>
                    <p className="text-sm font-medium text-gray-900">
                      {provider.health.circuitState}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Failures</p>
                    <p className="text-sm font-medium text-gray-900">
                      {provider.health.consecutiveFailures}
                    </p>
                  </div>
                </div>

                {/* Load Metrics */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Current Load</p>
                    <p className="text-sm text-gray-500">
                      {provider.load.activeRequests} active requests
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        provider.load.utilizationPercent > 80
                          ? 'bg-red-500'
                          : provider.load.utilizationPercent > 50
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${provider.load.utilizationPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {(provider.load.utilizationPercent).toFixed(1)}% utilization
                    </p>
                    <p className="text-xs text-gray-500">
                      Weight: {(provider.load.weight * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Last Check */}
                {provider.lastCheck && (
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          Last check: {new Date(provider.lastCheck.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {provider.lastCheck.statusCode && (
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          provider.lastCheck.statusCode < 400
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          HTTP {provider.lastCheck.statusCode}
                        </span>
                      )}
                    </div>
                    {provider.lastCheck.error && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {provider.lastCheck.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Routing Strategy Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Routing Strategy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Cost-Based</h3>
              </div>
              <p className="text-sm text-blue-700">
                Routes to most cost-effective provider based on token pricing
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">Latency-Based</h3>
              </div>
              <p className="text-sm text-green-700">
                Prefers providers with lowest response times
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <h3 className="font-medium text-purple-900">Health-Based</h3>
              </div>
              <p className="text-sm text-purple-700">
                Avoids providers with high failure rates
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <h3 className="font-medium text-orange-900">Load Balanced</h3>
              </div>
              <p className="text-sm text-orange-700">
                Distributes load based on provider capacity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
