/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/ml/usage/route';

// --- Mocks ---

const mockAnalyzeUsagePattern = jest.fn();
const mockGetUsageTrends = jest.fn();
const mockPredictUsage = jest.fn();
const mockGetCohortAnalysis = jest.fn();
const mockGetUsageAnalytics = jest.fn();

jest.mock('@/lib/analytics/usage-analytics', () => ({
  getUsageAnalyticsService: jest.fn(() => ({
    analyzeUsagePattern: (...args: any[]) => mockAnalyzeUsagePattern(...args),
    getUsageTrends: (...args: any[]) => mockGetUsageTrends(...args),
    predictUsage: (...args: any[]) => mockPredictUsage(...args),
    getCohortAnalysis: (...args: any[]) => mockGetCohortAnalysis(...args),
    getUsageAnalytics: (...args: any[]) => mockGetUsageAnalytics(...args),
  })),
}));

// --- Helpers ---

function buildRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

// --- Tests ---

describe('GET /api/analytics/ml/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzeUsagePattern.mockResolvedValue({ category: 'heavy', sessionsPerWeek: 12 });
    mockGetUsageTrends.mockResolvedValue([{ period: '2026-03', tokens: 5000 }]);
    mockPredictUsage.mockResolvedValue({ predictedTokens: 6000, confidence: 0.85 });
    mockGetCohortAnalysis.mockResolvedValue([{ month: '2026-01', retention: 0.9 }]);
    mockGetUsageAnalytics.mockResolvedValue({ totalUsage: { tokens: 100000 } });
  });

  it('returns overall analytics by default (no userId)', async () => {
    const res = await GET(buildRequest('/api/analytics/ml/usage'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalUsage.tokens).toBe(100000);
    expect(mockGetUsageAnalytics).toHaveBeenCalledWith(30);
  });

  it('respects custom period param for overall analytics', async () => {
    await GET(buildRequest('/api/analytics/ml/usage?period=7'));

    expect(mockGetUsageAnalytics).toHaveBeenCalledWith(7);
  });

  it('returns cohort analysis when type=cohort', async () => {
    const res = await GET(buildRequest('/api/analytics/ml/usage?type=cohort'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual([{ month: '2026-01', retention: 0.9 }]);
    expect(mockGetCohortAnalysis).toHaveBeenCalledWith('signup_month');
  });

  it('passes custom cohortType', async () => {
    await GET(buildRequest('/api/analytics/ml/usage?type=cohort&cohortType=plan_tier'));

    expect(mockGetCohortAnalysis).toHaveBeenCalledWith('plan_tier');
  });

  it('returns user pattern when userId + type=pattern', async () => {
    const res = await GET(buildRequest('/api/analytics/ml/usage?userId=u1&type=pattern'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.category).toBe('heavy');
    expect(mockAnalyzeUsagePattern).toHaveBeenCalledWith('u1');
  });

  it('returns user trends when userId + type=trends', async () => {
    const res = await GET(buildRequest('/api/analytics/ml/usage?userId=u1&type=trends'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockGetUsageTrends).toHaveBeenCalledWith('u1', 6);
  });

  it('respects custom periods param for trends', async () => {
    await GET(buildRequest('/api/analytics/ml/usage?userId=u1&type=trends&periods=12'));

    expect(mockGetUsageTrends).toHaveBeenCalledWith('u1', 12);
  });

  it('returns user prediction when userId + type=prediction', async () => {
    const res = await GET(buildRequest('/api/analytics/ml/usage?userId=u1&type=prediction'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.predictedTokens).toBe(6000);
    expect(mockPredictUsage).toHaveBeenCalledWith('u1', 30);
  });

  it('respects custom days param for prediction', async () => {
    await GET(buildRequest('/api/analytics/ml/usage?userId=u1&type=prediction&days=60'));

    expect(mockPredictUsage).toHaveBeenCalledWith('u1', 60);
  });

  it('returns all user analytics when userId given with no type', async () => {
    const res = await GET(buildRequest('/api/analytics/ml/usage?userId=u1'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.pattern).toBeDefined();
    expect(body.data.trends).toBeDefined();
    expect(body.data.prediction).toBeDefined();
    expect(mockAnalyzeUsagePattern).toHaveBeenCalledWith('u1');
    expect(mockGetUsageTrends).toHaveBeenCalledWith('u1', 6);
    expect(mockPredictUsage).toHaveBeenCalledWith('u1', 30);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUsageAnalytics.mockRejectedValue(new Error('Service unavailable'));

    const res = await GET(buildRequest('/api/analytics/ml/usage'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch usage analytics');
  });
});
