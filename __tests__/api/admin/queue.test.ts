/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/queue/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/auth-config', () => ({
  getCurrentUser: (req: any) => mockGetCurrentUser(req),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (table: any) => mockFrom(table),
    rpc: (name: any, params: any) => mockRpc(name, params),
  })) as any,
}));

const mockGetCurrentUser = jest.fn();
const mockRpc = jest.fn();

const mockSelect = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  order: mockOrder,
  limit: mockLimit,
  eq: mockEq,
  update: mockUpdate,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any);
}

function mockAdmin() {
  mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'admin' });
}

function setupChains() {
  mockFrom.mockReturnValue({
    select: mockSelect,
    order: mockOrder,
    limit: mockLimit,
    eq: mockEq,
    update: mockUpdate,
  });
  mockSelect.mockReturnValue({ order: mockOrder, limit: mockLimit });
  mockOrder.mockReturnValue({ limit: mockLimit, data: [], error: null });
  mockLimit.mockResolvedValue({ data: [], error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  // eq must be chainable (return object with eq) AND thenable
  const eqResult = {
    eq: mockEq,
    then: (resolve: (v: any) => void) => resolve({ data: null, error: null }),
  };
  mockEq.mockReturnValue(eqResult);
  mockRpc.mockResolvedValue({ data: null, error: null });
}

// ---------------------------------------------------------------------------
// Tests - GET
// ---------------------------------------------------------------------------

describe('GET /api/admin/queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupChains();
  });

  it('returns 401 when not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET(buildRequest('/api/admin/queue'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns queue status with summary', async () => {
    mockAdmin();
    // RPC: job stats
    mockRpc.mockResolvedValueOnce({
      data: [
        { queue_name: 'email', status: 'waiting', count: 5 },
        { queue_name: 'email', status: 'active', count: 2 },
        { queue_name: 'email', status: 'completed', count: 100 },
        { queue_name: 'email', status: 'failed', count: 1 },
      ],
      error: null,
    });
    // Worker health
    mockOrder.mockResolvedValueOnce({
      data: [{ id: 'w1', worker_id: 'worker-1', status: 'active' }],
      error: null,
    });
    // Recent jobs
    mockLimit.mockResolvedValueOnce({
      data: [{ id: 'j1', status: 'completed' }],
      error: null,
    });

    const res = await GET(buildRequest('/api/admin/queue'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.queues).toBeDefined();
    expect(json.data.queues).toHaveLength(1);
    expect(json.data.queues[0].name).toBe('email');
    expect(json.data.queues[0].waiting).toBe(5);
    expect(json.data.workers).toHaveLength(1);
    expect(json.data.recentJobs).toHaveLength(1);
    expect(json.data.summary).toBeDefined();
    expect(json.data.summary.totalWaiting).toBe(5);
    expect(json.data.summary.activeWorkers).toBe(1);
  });

  it('uses fallback mock data when RPC returns null', async () => {
    mockAdmin();
    // All return null data
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '42883' } });
    mockOrder.mockResolvedValueOnce({ data: null, error: null });
    mockLimit.mockResolvedValueOnce({ data: null, error: null });

    const res = await GET(buildRequest('/api/admin/queue'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // Falls back to mock data with 4 queues
    expect(json.data.queues.length).toBeGreaterThan(0);
    expect(json.data.workers.length).toBeGreaterThan(0);
  });

  it('returns 500 on unexpected error', async () => {
    mockAdmin();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockRpc.mockRejectedValue(new Error('RPC crash'));

    const res = await GET(buildRequest('/api/admin/queue'));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch queue status');
    consoleError.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Tests - POST
// ---------------------------------------------------------------------------

describe('POST /api/admin/queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupChains();
  });

  it('returns 401 when not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(buildRequest('/api/admin/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'retry_failed', queueName: 'email' }),
    }));

    expect(res.status).toBe(401);
  });

  it('retries failed jobs in a queue via RPC', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'retry_failed', queueName: 'email' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Queue action retry_failed completed');
    expect(mockRpc).toHaveBeenCalledWith('retry_failed_jobs', { queue_name: 'email' });
  });

  it('retries a specific job', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'retry_job', jobId: 'j1' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'waiting',
      attempts: 0,
      error: null,
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'j1');
  });

  it('cancels a pending job', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel_job', jobId: 'j2' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(mockEq).toHaveBeenCalledWith('id', 'j2');
  });

  it('clears all waiting jobs in a queue', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_queue', queueName: 'video' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(mockEq).toHaveBeenCalledWith('queue_name', 'video');
    expect(mockEq).toHaveBeenCalledWith('status', 'waiting');
  });

  it('returns 400 for invalid action', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'noop' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid action');
  });

  it('returns 500 on unexpected error', async () => {
    mockAdmin();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockRpc.mockRejectedValue(new Error('RPC crash'));

    const res = await POST(buildRequest('/api/admin/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'retry_failed', queueName: 'email' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to perform queue action');
    consoleError.mockRestore();
  });
});
