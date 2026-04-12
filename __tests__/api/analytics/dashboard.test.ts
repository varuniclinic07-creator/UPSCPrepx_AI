/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/ml/dashboard/route';

// --- Mocks ---

const mockGetBulkSegmentation = jest.fn();
const mockGetUsageAnalytics = jest.fn();
const mockAnalyzeProviderCosts = jest.fn();
const mockGetFeatureMetrics = jest.fn();
const mockGetCohortAnalysis = jest.fn();

jest.mock('@/lib/analytics/user-segmentation', () => ({
  getUserSegmentationService: jest.fn().mockResolvedValue({
    getBulkSegmentation: (...args: any[]) => mockGetBulkSegmentation(...args),
  }),
}));

jest.mock('@/lib/analytics/usage-analytics', () => ({
  getUsageAnalyticsService: jest.fn().mockResolvedValue({
    getUsageAnalytics: (...args: any[]) => mockGetUsageAnalytics(...args),
    getCohortAnalysis: (...args: any[]) => mockGetCohortAnalysis(...args),
  }),
}));

jest.mock('@/lib/analytics/cost-optimization', () => ({
  getCostOptimizationService: jest.fn().mockResolvedValue({
    analyzeProviderCosts: (...args: any[]) => mockAnalyzeProviderCosts(...args),
  }),
}));

jest.mock('@/lib/analytics/feature-usage', () => ({
  getFeatureUsageService: jest.fn().mockResolvedValue({
    getFeatureMetrics: (...args: any[]) => mockGetFeatureMetrics(...args),
  }),
}));

// --- Helpers ---

function buildRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

// --- Tests ---

describe('GET /api/analytics/ml/dashboard', () => {
  const defaultBulkSegments = {
    'user-1': { segment: 'champion', adoptionStage: 'mature' },
    'user-2': { segment: 'loyal', adoptionStage: 'growing' },
    'user-3': { segment: 'at_risk', adoptionStage: 'declining' },
  };

  const defaultUsageAnalytics = {
    totalUsage: { tokens: 500000, cost: 125.5 },
    avgPerUser: { tokens: 166666 },
    activeUsers: 3,
    trends: { tokensGrowth: 15, usersGrowth: 10, revenueGrowth: 12 },
    peakUsage: { hour: 14, day: 'Monday' },
  };

  const defaultProviderCosts = [
    { provider: 'openai', totalCost: 80 },
    { provider: 'anthropic', totalCost: 45.5 },
  ];

  const defaultFeatureMetrics = {
    activeFeatures: 12,
    avgFeaturesPerUser: 5.2,
  };

  const defaultCohorts = [
    { month: '2026-01', retention: 0.85 },
    { month: '2026-02', retention: 0.78 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBulkSegmentation.mockResolvedValue(defaultBulkSegments);
    mockGetUsageAnalytics.mockResolvedValue(defaultUsageAnalytics);
    mockAnalyzeProviderCosts.mockResolvedValue(defaultProviderCosts);
    mockGetFeatureMetrics.mockResolvedValue(defaultFeatureMetrics);
    mockGetCohortAnalysis.mockResolvedValue(defaultCohorts);
  });

  it('returns full dashboard data with correct structure', async () => {
    const res = await GET(buildRequest('/api/analytics/ml/dashboard'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Summary
    expect(body.data.summary.totalUsers).toBe(3);
    expect(body.data.summary.totalTokens).toBe(500000);
    expect(body.data.summary.totalRevenue).toBe(125.5);
    expect(body.data.summary.activeUsers).toBe(3);

    // Segmentation
    expect(body.data.segmentation.championCount).toBe(1);
    expect(body.data.segmentation.atRiskCount).toBe(1);
    expect(body.data.segmentation.distribution).toHaveProperty('champion', 1);

    // Usage
    expect(body.data.usage.growthRates.tokens).toBe(15);

    // Costs
    expect(body.data.costs.providers).toHaveLength(2);
    expect(body.data.costs.totalProviderCost).toBe(125.5);

    // Features
    expect(body.data.features.activeFeatures).toBe(12);

    // Cohorts
    expect(body.data.cohorts).toHaveLength(2);

    // Timestamp
    expect(body.data.generatedAt).toBeDefined();
  });

  it('respects custom period parameter', async () => {
    await GET(buildRequest('/api/analytics/ml/dashboard?period=7'));

    expect(mockGetUsageAnalytics).toHaveBeenCalledWith(7);
    expect(mockAnalyzeProviderCosts).toHaveBeenCalledWith(7);
    expect(mockGetFeatureMetrics).toHaveBeenCalledWith(7);
  });

  it('defaults to 30-day period', async () => {
    await GET(buildRequest('/api/analytics/ml/dashboard'));

    expect(mockGetUsageAnalytics).toHaveBeenCalledWith(30);
  });

  it('calculates health score correctly', async () => {
    // 1 champion (100) + 1 loyal (80) + 1 at_risk (0) = 180 / 3 = 60
    const res = await GET(buildRequest('/api/analytics/ml/dashboard'));
    const body = await res.json();

    expect(body.data.summary.healthScore).toBeGreaterThanOrEqual(0);
    expect(typeof body.data.summary.healthScore).toBe('number');
  });

  it('handles empty segmentation data', async () => {
    mockGetBulkSegmentation.mockResolvedValue({});

    const res = await GET(buildRequest('/api/analytics/ml/dashboard'));
    const body = await res.json();

    expect(body.data.summary.totalUsers).toBe(0);
    expect(body.data.summary.healthScore).toBe(0);
    expect(body.data.segmentation.championCount).toBe(0);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetBulkSegmentation.mockRejectedValue(new Error('Analytics service down'));

    const res = await GET(buildRequest('/api/analytics/ml/dashboard'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch ML analytics dashboard');
  });
});
