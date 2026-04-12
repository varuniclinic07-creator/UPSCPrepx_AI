/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/billing/usage/route';

// --- Mocks ---

const mockGetUser = jest.fn();
const mockGetUsageSummary = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
  })),
}));

jest.mock('@/lib/security/security-middleware', () => ({
  withSecurity: jest.fn(
    (_req: unknown, handler: () => Promise<Response>, _config?: unknown) => handler()
  ),
}));

jest.mock('@/lib/billing/usage-billing', () => ({
  getUsageBillingService: jest.fn(() => ({
    getUsageSummary: (...args: any[]) => mockGetUsageSummary(...args),
  })),
}));

// --- Helpers ---

function buildRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

// --- Tests ---

describe('GET /api/billing/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('returns usage summary for authenticated user', async () => {
    const usageSummary = {
      tokensUsed: 15000,
      tokensLimit: 100000,
      costSoFar: 2.5,
      billingPeriod: '2026-04',
    };
    mockGetUsageSummary.mockResolvedValue(usageSummary);

    const res = await GET(buildRequest('/api/billing/usage'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(usageSummary);
    expect(mockGetUsageSummary).toHaveBeenCalledWith('user-1');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(buildRequest('/api/billing/usage'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Authentication required');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUsageSummary.mockRejectedValue(new Error('Service unavailable'));

    const res = await GET(buildRequest('/api/billing/usage'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch usage summary');
  });
});
