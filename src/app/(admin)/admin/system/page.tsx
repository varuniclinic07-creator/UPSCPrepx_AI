/**
 * Admin System Health Page
 * Monitor deployment health, feature flags, and system status
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Database, Activity, CheckCircle, XCircle, AlertCircle, Server,
  Shield, ToggleLeft, ToggleRight, RefreshCcw, Zap, Clock, Cloud
} from 'lucide-react';

interface Service {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency_ms: number;
}

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

interface Deployment {
  id: string;
  version: string;
  status: 'healthy' | 'deploying' | 'failed';
  deployed_at: string;
  deployed_by: string;
}

interface SystemData {
  services: {
    supabase: Service;
    redis: Service;
    ai_providers: Service & { active_count: number; total_count: number };
    razorpay: Service;
    sendgrid: Service;
  };
  featureFlags: FeatureFlag[];
  deployments: Deployment[];
  kubernetes: {
    pods: {
      total: number;
      running: number;
      pending: number;
      failed: number;
    };
    hpa: {
      web: { current: number; min: number; max: number };
      api: { current: number; min: number; max: number };
      worker: { current: number; min: number; max: number };
    };
  };
}

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/system');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setFeatureFlags(result.data.featureFlags || []);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFeature = async (flagId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_feature',
          flagId,
          enabled: !enabled,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setFeatureFlags((prev) =>
          prev.map((f) => (f.id === flagId ? { ...f, enabled: !f.enabled } : f))
        );
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the application cache?')) return;
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Cache cleared successfully');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };

  const handleRestartWorkers = async () => {
    if (!confirm('Are you sure you want to restart all workers?')) return;
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart_workers' }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Worker restart signal sent');
      }
    } catch (error) {
      console.error('Failed to restart workers:', error);
      alert('Failed to restart workers');
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
          <p className="text-gray-600">Failed to load system status</p>
          <button
            onClick={fetchSystemStatus}
            className="mt-4 px-4 py-2 bg-saffron-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const allHealthy = Object.values(data.services).every(
    (s) => s.status === 'healthy'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-saffron-600" />
            System Health
          </h1>
          <p className="text-gray-500">Monitor services, deployments, and feature flags</p>
        </div>
        <button
          onClick={fetchSystemStatus}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Overall Status */}
      <div className={`rounded-xl p-6 flex items-center gap-4 ${
        allHealthy ? 'bg-green-50' : 'bg-red-50'
      }`}>
        {allHealthy ? (
          <CheckCircle className="w-12 h-12 text-green-600" />
        ) : (
          <AlertCircle className="w-12 h-12 text-red-600" />
        )}
        <div>
          <h2 className={`text-lg font-bold ${
            allHealthy ? 'text-green-800' : 'text-red-800'
          }`}>
            {allHealthy ? 'All Systems Operational' : 'System Issues Detected'}
          </h2>
          <p className={`text-sm ${
            allHealthy ? 'text-green-600' : 'text-red-600'
          }`}>
            {allHealthy
              ? 'All services are running normally'
              : 'One or more services require attention'}
          </p>
        </div>
      </div>

      {/* Services Status */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ServiceCard
            name="Supabase"
            icon={Database}
            status={data.services.supabase.status}
            latency={data.services.supabase.latency_ms}
          />
          <ServiceCard
            name="Redis"
            icon={Zap}
            status={data.services.redis.status}
            latency={data.services.redis.latency_ms}
          />
          <ServiceCard
            name="AI Providers"
            icon={Activity}
            status={data.services.ai_providers.status}
            latency={0}
            extra={`${data.services.ai_providers.active_count}/${data.services.ai_providers.total_count} active`}
          />
          <ServiceCard
            name="Razorpay"
            icon={Cloud}
            status={data.services.razorpay.status}
            latency={0}
          />
          <ServiceCard
            name="SendGrid"
            icon={Server}
            status={data.services.sendgrid.status}
            latency={0}
          />
        </div>
      </div>

      {/* Kubernetes Status */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Kubernetes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pod Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-md font-bold text-gray-900 mb-4">Pod Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Pods</span>
                <span className="text-lg font-bold text-gray-900">
                  {data.kubernetes.pods.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Running</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="font-medium text-green-600">
                    {data.kubernetes.pods.running}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="font-medium text-yellow-600">
                    {data.kubernetes.pods.pending}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Failed</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="font-medium text-red-600">
                    {data.kubernetes.pods.failed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* HPA Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-md font-bold text-gray-900 mb-4">Horizontal Pod Autoscaler</h3>
            <div className="space-y-4">
              <HPACard
                name="Web"
                current={data.kubernetes.hpa.web.current}
                min={data.kubernetes.hpa.web.min}
                max={data.kubernetes.hpa.web.max}
              />
              <HPACard
                name="API"
                current={data.kubernetes.hpa.api.current}
                min={data.kubernetes.hpa.api.min}
                max={data.kubernetes.hpa.api.max}
              />
              <HPACard
                name="Worker"
                current={data.kubernetes.hpa.worker.current}
                min={data.kubernetes.hpa.worker.min}
                max={data.kubernetes.hpa.worker.max}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deployments */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Deployments</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Version</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Deployed At</th>
                <th className="text-left p-4 font-semibold text-gray-700">Deployed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.deployments.map((deployment) => (
                <tr key={deployment.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm">{deployment.version}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      deployment.status === 'healthy'
                        ? 'bg-green-100 text-green-700'
                        : deployment.status === 'deploying'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {deployment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(deployment.deployed_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-500">{deployment.deployed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Flags */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Feature Flags</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Feature</th>
                <th className="text-left p-4 font-semibold text-gray-700">Description</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {featureFlags.map((flag) => (
                <tr key={flag.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{flag.name}</td>
                  <td className="p-4 text-gray-600">{flag.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      flag.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleFeature(flag.id, flag.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        flag.enabled
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {flag.enabled ? (
                        <>
                          <ToggleRight className="w-5 h-5" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5" />
                          Disabled
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">System Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleClearCache}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <RefreshCcw className="w-5 h-5 text-saffron-600" />
              <span className="font-medium text-gray-900">Clear Cache</span>
            </div>
            <p className="text-sm text-gray-500">
              Clear Redis application cache
            </p>
          </button>
          <button
            onClick={handleRestartWorkers}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Restart Workers</span>
            </div>
            <p className="text-sm text-gray-500">
              Signal all workers to restart
            </p>
          </button>
          <button className="p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Regenerate Tokens</span>
            </div>
            <p className="text-sm text-gray-500">
              Rotate API keys and secrets
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  name,
  icon: Icon,
  status,
  latency,
  extra,
}: {
  name: string;
  icon: React.ElementType;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  extra?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            status === 'healthy' ? 'bg-green-50' : status === 'degraded' ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <Icon className={`w-5 h-5 ${
              status === 'healthy' ? 'text-green-600' : status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
          <span className="font-medium text-gray-900">{name}</span>
        </div>
        {status === 'healthy' ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : status === 'degraded' ? (
          <AlertCircle className="w-5 h-5 text-yellow-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>
      {extra && <p className="text-sm text-gray-600 mb-2">{extra}</p>}
      {latency > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{latency}ms</span>
        </div>
      )}
    </div>
  );
}

function HPACard({
  name,
  current,
  min,
  max,
}: {
  name: string;
  current: number;
  min: number;
  max: number;
}) {
  const percentage = ((current - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className="text-sm text-gray-500">
          {current} / {min}-{max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
