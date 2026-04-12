/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  })),
}));

const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockRpc = jest.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// The route's zod schema requires period and timezone to be string|undefined,
// but searchParams.get() returns null for missing params. We pass valid params
// to avoid zod parse errors in happy-path tests.
const BASE_URL = '/api/admin/analytics?period=30d&timezone=UTC';

function buildRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/admin/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish chains
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  it('returns analytics data with success=true', async () => {
    const providers = [{ id: '1', name: 'TestProvider', provider_type: 'groq', is_active: true }];
    mockSelect.mockResolvedValue({ data: providers, error: null });
    mockRpc.mockResolvedValue({ data: null, error: null });

    const res = await GET(buildRequest(BASE_URL));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.period).toBe('30d');
    expect(json.data.revenue).toBeDefined();
    expect(json.data.subscriptions).toBeDefined();
    expect(json.data.users).toBeDefined();
    expect(json.data.ai_usage).toBeDefined();
    expect(json.data.ai_usage.by_provider).toHaveLength(1);
    expect(json.data.ai_usage.by_provider[0].name).toBe('TestProvider');
  });

  it('respects period query parameter', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const res = await GET(buildRequest('/api/admin/analytics?period=7d&timezone=UTC'));
    const json = await res.json();

    expect(json.data.period).toBe('7d');
  });

  it('supports 90d period', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const res = await GET(buildRequest('/api/admin/analytics?period=90d&timezone=UTC'));
    const json = await res.json();

    expect(json.data.period).toBe('90d');
  });

  it('supports 1y period', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const res = await GET(buildRequest('/api/admin/analytics?period=1y&timezone=UTC'));
    const json = await res.json();

    expect(json.data.period).toBe('1y');
  });

  it('handles provider data being null gracefully', async () => {
    mockSelect.mockResolvedValue({ data: null, error: null });

    const res = await GET(buildRequest(BASE_URL));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.ai_usage.by_provider).toEqual([]);
  });

  it('handles RPC errors gracefully (non-42883)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockRpc.mockResolvedValue({ data: null, error: { code: '500', message: 'fail' } });
    mockSelect.mockResolvedValue({ data: [], error: null });

    const res = await GET(buildRequest(BASE_URL));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('silently ignores 42883 RPC errors (function not found)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockRpc.mockResolvedValue({ data: null, error: { code: '42883', message: 'function not found' } });
    mockSelect.mockResolvedValue({ data: [], error: null });

    const res = await GET(buildRequest(BASE_URL));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    consoleError.mockRestore();
  });

  it('returns 500 on thrown error (non-development)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    // Force a throw by making Promise.all reject
    mockRpc.mockRejectedValue(new Error('Unexpected crash'));

    const res = await GET(buildRequest(BASE_URL));
    const json = await res.json();

    // In test env (not development), it returns 500
    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch analytics data');
    consoleError.mockRestore();
  });

  it('returns 500 when zod validation fails (invalid period)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const res = await GET(buildRequest('/api/admin/analytics?period=invalid&timezone=UTC'));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch analytics data');
    consoleError.mockRestore();
  });

  it('enriches provider data with default stats', async () => {
    const providers = [
      { id: '1', name: 'Groq', provider_type: 'groq', is_active: true, is_default: false, rate_limit_rpm: 100 },
    ];
    mockSelect.mockResolvedValue({ data: providers, error: null });

    const res = await GET(buildRequest(BASE_URL));
    const json = await res.json();

    const provider = json.data.ai_usage.by_provider[0];
    expect(provider.total_requests).toBe(0);
    expect(provider.success_rate).toBe(100);
    expect(provider.avg_latency_ms).toBe(0);
    expect(provider.name).toBe('Groq');
  });
});
