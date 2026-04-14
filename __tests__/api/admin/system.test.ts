/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/system/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/auth-config', () => ({
  getCurrentUser: (req: any) => mockGetCurrentUser(req),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (table: any) => mockFrom(table),
  })) as any,
}));

jest.mock('@/lib/redis/client', () => ({
  getRedis: () => mockGetRedis(),
  isRedisAvailable: () => mockIsRedisAvailable(),
}));

const mockGetCurrentUser = jest.fn();
const mockIsRedisAvailable = jest.fn();

const mockRedisKeys = jest.fn();
const mockRedisDel = jest.fn();
const mockRedisPublish = jest.fn();
const mockGetRedis = jest.fn(() => ({
  keys: mockRedisKeys,
  del: mockRedisDel,
  publish: mockRedisPublish,
}));

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
  mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, limit: mockLimit, count: 0 });
  mockOrder.mockReturnValue({ limit: mockLimit, data: [], error: null });
  mockLimit.mockResolvedValue({ data: [], error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ data: null, error: null });
}

// ---------------------------------------------------------------------------
// Tests - GET
// ---------------------------------------------------------------------------

describe('GET /api/admin/system', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupChains();
  });

  it('returns 401 when not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET(buildRequest('/api/admin/system'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns system status with all services', async () => {
    mockAdmin();
    // Supabase health check (head query)
    mockSelect.mockReturnValueOnce({ error: null, count: 10 });
    // Feature flags
    mockOrder.mockResolvedValueOnce({ data: [{ id: '1', name: 'beta', enabled: true }], error: null });
    // Deployments
    mockLimit.mockResolvedValueOnce({ data: [{ id: '1', version: 'v1.0.0' }], error: null });
    // Redis
    mockIsRedisAvailable.mockResolvedValue(true);

    const res = await GET(buildRequest('/api/admin/system'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.services).toBeDefined();
    expect(json.data.services.supabase).toBeDefined();
    expect(json.data.services.redis).toBeDefined();
    expect(json.data.featureFlags).toBeDefined();
    expect(json.data.deployments).toBeDefined();
    expect(json.data.kubernetes).toBeDefined();
  });

  it('reports supabase as unhealthy on error', async () => {
    mockAdmin();
    mockSelect.mockReturnValueOnce({ error: new Error('DB down'), count: null });
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    mockLimit.mockResolvedValueOnce({ data: [], error: null });
    mockIsRedisAvailable.mockResolvedValue(false);

    const res = await GET(buildRequest('/api/admin/system'));
    const json = await res.json();

    expect(json.data.services.supabase.status).toBe('unhealthy');
  });

  it('returns 500 on unexpected error', async () => {
    mockAdmin();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockFrom.mockImplementation(() => { throw new Error('Crash'); });

    const res = await GET(buildRequest('/api/admin/system'));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch system status');
    consoleError.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Tests - POST
// ---------------------------------------------------------------------------

describe('POST /api/admin/system', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupChains();
  });

  it('returns 401 when not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(buildRequest('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_feature', flagId: '1', enabled: true }),
    }));

    expect(res.status).toBe(401);
  });

  it('toggles a feature flag', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_feature', flagId: '1', enabled: false }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('System action toggle_feature completed');
    expect(mockUpdate).toHaveBeenCalledWith({ enabled: false });
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });

  it('clears cache via Redis', async () => {
    mockAdmin();
    mockRedisKeys.mockResolvedValue(['cache:a', 'cache:b']);
    mockRedisDel.mockResolvedValue(2);

    const res = await POST(buildRequest('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_cache' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockRedisKeys).toHaveBeenCalledWith('cache:*');
    expect(mockRedisDel).toHaveBeenCalledWith('cache:a', 'cache:b');
  });

  it('handles clear_cache with no keys gracefully', async () => {
    mockAdmin();
    mockRedisKeys.mockResolvedValue([]);

    const res = await POST(buildRequest('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_cache' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockRedisDel).not.toHaveBeenCalled();
  });

  it('restarts workers via Redis publish', async () => {
    mockAdmin();
    mockRedisPublish.mockResolvedValue(1);

    const res = await POST(buildRequest('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restart_workers' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockRedisPublish).toHaveBeenCalledWith('admin:restart', expect.any(String));
  });

  it('returns 400 for invalid action', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/system', {
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
    mockGetRedis.mockImplementation(() => { throw new Error('Redis crash'); });

    const res = await POST(buildRequest('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_cache' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to perform system action');
    consoleError.mockRestore();
  });
});
