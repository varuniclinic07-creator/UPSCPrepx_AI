/**
 * Admin Queue Status Page
 * Monitor BullMQ job queues and worker health
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, Clock, AlertCircle, RefreshCcw, Play, Trash2, Settings } from 'lucide-react';

interface Queue {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface Worker {
  id: string;
  worker_id: string;
  status: 'active' | 'idle' | 'unhealthy';
  last_heartbeat: string;
  current_job_id: string | null;
  jobs_processed: number;
  avg_processing_time_ms: number;
}

interface Job {
  id: string;
  queue_name: string;
  status: string;
  created_at: string;
  attempts: number;
  error?: string;
}

interface QueueData {
  queues: Queue[];
  workers: Worker[];
  recentJobs: Job[];
  summary: {
    totalWaiting: number;
    totalActive: number;
    totalFailed: number;
    activeWorkers: number;
  };
}

export default function QueueStatusPage() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('/api/admin/queue');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

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
          <p className="text-gray-600">Failed to load queue status</p>
          <button
            onClick={fetchQueueStatus}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-saffron-600" />
            Queue Status
          </h1>
          <p className="text-gray-500">Monitor job queues and worker health</p>
        </div>
        <button
          onClick={fetchQueueStatus}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Jobs Waiting"
          value={data.summary.totalWaiting}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <SummaryCard
          title="Jobs Active"
          value={data.summary.totalActive}
          icon={Activity}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          title="Jobs Failed"
          value={data.summary.totalFailed}
          icon={XCircle}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <SummaryCard
          title="Active Workers"
          value={data.summary.activeWorkers}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      {/* Queues Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Queues</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.queues.map((queue) => (
            <div
              key={queue.name}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-colors ${
                selectedQueue === queue.name
                  ? 'border-saffron-500'
                  : 'border-gray-200 hover:border-saffron-300'
              }`}
              onClick={() => setSelectedQueue(queue.name === selectedQueue ? null : queue.name)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 capitalize">{queue.name}</h3>
                {queue.failed > 0 ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Waiting</span>
                  <span className={`font-medium ${queue.waiting > 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {queue.waiting}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active</span>
                  <span className="font-medium text-blue-600">{queue.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-medium text-green-600">{queue.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Failed</span>
                  <span className={`font-medium ${queue.failed > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {queue.failed}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                {queue.waiting > 0 && (
                  <div
                    className="bg-yellow-500 h-full"
                    style={{ width: `${(queue.waiting / (queue.waiting + queue.active + queue.completed + queue.failed)) * 100}%` }}
                  />
                )}
                {queue.active > 0 && (
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${(queue.active / (queue.waiting + queue.active + queue.completed + queue.failed)) * 100}%` }}
                  />
                )}
                {queue.completed > 0 && (
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${(queue.completed / (queue.waiting + queue.active + queue.completed + queue.failed)) * 100}%` }}
                  />
                )}
                {queue.failed > 0 && (
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${(queue.failed / (queue.waiting + queue.active + queue.completed + queue.failed)) * 100}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workers */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Workers</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Worker ID</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Current Job</th>
                <th className="text-left p-4 font-semibold text-gray-700">Jobs Processed</th>
                <th className="text-left p-4 font-semibold text-gray-700">Avg Time</th>
                <th className="text-left p-4 font-semibold text-gray-700">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs">{worker.worker_id}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      worker.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : worker.status === 'idle'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {worker.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-500">
                    {worker.current_job_id || '-'}
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    {worker.jobs_processed.toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-600">
                    {worker.avg_processing_time_ms >= 1000
                      ? `${(worker.avg_processing_time_ms / 1000).toFixed(1)}s`
                      : `${worker.avg_processing_time_ms}ms`}
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(worker.last_heartbeat).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Jobs */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Jobs</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Job ID</th>
                <th className="text-left p-4 font-semibold text-gray-700">Queue</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Attempts</th>
                <th className="text-left p-4 font-semibold text-gray-700">Created</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentJobs.slice(0, 10).map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs">{job.id}</td>
                  <td className="p-4 capitalize">{job.queue_name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      job.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : job.status === 'active'
                        ? 'bg-blue-100 text-blue-700'
                        : job.status === 'waiting'
                        ? 'bg-yellow-100 text-yellow-700'
                        : job.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{job.attempts}</td>
                  <td className="p-4 text-gray-500">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {job.status === 'failed' && (
                        <button
                          className="p-1 hover:bg-blue-50 rounded"
                          title="Retry"
                        >
                          <Play className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                      {job.status === 'waiting' && (
                        <button
                          className="p-1 hover:bg-red-50 rounded"
                          title="Cancel"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Details"
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}
