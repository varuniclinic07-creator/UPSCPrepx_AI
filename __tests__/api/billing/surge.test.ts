/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/billing/surge/route';

// --- Mocks ---

const mockGetAnalytics = jest.fn();
const mockGetDemandMetrics = jest.fn();
const mockGetCurrentState = jest.fn();

jest.mock('@/lib/security/security-middleware', () => ({
  withSecurity: jest.fn(
    (_req: unknown, handler: () => Promise<Response>, _config?: unknown) => handler()
  ),
}));

jest.mock('@/lib/billing/surge-pricing', () => ({
  getSurgePricingManager: jest.fn(() => ({
    getAnalytics: (...args: any[]) => mockGetAnalytics(...args),
    getDemandMetrics: (...args: any[]) => mockGetDemandMetrics(...args),
    getCurrentState: (...args: any[]) => mockGetCurrentState(...args),
  })),
}));

// --- Helpers ---

function buildRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

// --- Tests ---

describe('GET /api/billing/surge', () => {
  const defaultAnalytics = {
    isActive: false,
    currentMultiplier: 1.0,
    demandLevel: 'normal',
    config: { enabled: true, cooldownMinutes: 15 },
  };

  const defaultDemandMetrics = {
    utilizationPercent: 45,
    providerHealth: [
      { name: 'openai', healthy: true },
      { name: 'anthropic', healthy: true },
    ],
    avgLatencyMs: 320,
    errorRate: 0.02,
  };

  const defaultState = {
    reason: null,
    estimatedEnd: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAnalytics.mockReturnValue(defaultAnalytics);
    mockGetDemandMetrics.mockResolvedValue(defaultDemandMetrics);
    mockGetCurrentState.mockReturnValue(defaultState);
  });

  it('returns surge status with metrics when no surge is active', async () => {
    const res = await GET(buildRequest('/api/billing/surge'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.surge.active).toBe(false);
    expect(body.data.surge.multiplier).toBe(1.0);
    expect(body.data.metrics.utilizationPercent).toBe(45);
    expect(body.data.metrics.healthyProviders).toBe(2);
    expect(body.data.metrics.totalProviders).toBe(2);
    expect(body.data.config.enabled).toBe(true);
  });

  it('returns active surge status when surge is happening', async () => {
    mockGetAnalytics.mockReturnValue({
      ...defaultAnalytics,
      isActive: true,
      currentMultiplier: 1.5,
      demandLevel: 'high',
    });
    mockGetCurrentState.mockReturnValue({
      reason: 'High demand detected',
      estimatedEnd: '2026-04-12T14:00:00Z',
    });

    const res = await GET(buildRequest('/api/billing/surge'));
    const body = await res.json();

    expect(body.data.surge.active).toBe(true);
    expect(body.data.surge.multiplier).toBe(1.5);
    expect(body.data.surge.reason).toBe('High demand detected');
    expect(body.data.surge.estimatedEnd).toBe('2026-04-12T14:00:00Z');
  });

  it('reports unhealthy providers correctly', async () => {
    mockGetDemandMetrics.mockResolvedValue({
      ...defaultDemandMetrics,
      providerHealth: [
        { name: 'openai', healthy: false },
        { name: 'anthropic', healthy: true },
        { name: 'gemini', healthy: false },
      ],
    });

    const res = await GET(buildRequest('/api/billing/surge'));
    const body = await res.json();

    expect(body.data.metrics.healthyProviders).toBe(1);
    expect(body.data.metrics.totalProviders).toBe(3);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetAnalytics.mockImplementation(() => {
      throw new Error('Surge service down');
    });

    const res = await GET(buildRequest('/api/billing/surge'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch surge status');
  });
});
