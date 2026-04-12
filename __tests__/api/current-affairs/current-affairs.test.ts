/** @jest-environment node */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetCurrentAffairs = jest.fn();
const mockSearchCurrentAffairs = jest.fn();
const mockGetCategories = jest.fn().mockReturnValue(['Economy', 'Polity', 'Environment']);
const mockGenerateCurrentAffairs = jest.fn();

jest.mock('@/lib/services/current-affairs-service', () => ({
  getCurrentAffairs: (...args: any[]) => mockGetCurrentAffairs(...args),
  searchCurrentAffairs: (...args: any[]) => mockSearchCurrentAffairs(...args),
  getCurrentAffairsCategories: () => mockGetCategories(),
  generateCurrentAffairs: (...args: any[]) => mockGenerateCurrentAffairs(...args),
}));

const mockRequireAdmin = jest.fn();
jest.mock('@/lib/auth/auth-config', () => ({
  requireAdmin: () => mockRequireAdmin(),
  requireUser: jest.fn(),
  requireSession: jest.fn(),
}));

const mockCheckRateLimit = jest.fn();
const mockGetRateLimitHeaders = jest.fn().mockReturnValue({});
jest.mock('@/lib/ai/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  getRateLimitHeaders: (...args: any[]) => mockGetRateLimitHeaders(...args),
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { GET, POST } from '@/app/api/current-affairs/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(method: string, url: string, body?: any): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/current-affairs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns affairs list with default filters', async () => {
    const affairs = [{ id: '1', title: 'Budget 2025' }];
    mockGetCurrentAffairs.mockResolvedValue(affairs);

    const req = makeRequest('GET', '/api/current-affairs');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.affairs).toEqual(affairs);
    expect(json.count).toBe(1);
    expect(json.categories).toEqual(['Economy', 'Polity', 'Environment']);
  });

  it('uses search when search param is provided', async () => {
    const results = [{ id: '2', title: 'Climate Change' }];
    mockSearchCurrentAffairs.mockResolvedValue(results);

    const req = makeRequest('GET', '/api/current-affairs?search=climate');
    const res = await GET(req);
    const json = await res.json();

    expect(mockSearchCurrentAffairs).toHaveBeenCalledWith('climate');
    expect(json.affairs).toEqual(results);
  });

  it('passes category and pagination filters', async () => {
    mockGetCurrentAffairs.mockResolvedValue([]);

    const req = makeRequest(
      'GET',
      '/api/current-affairs?category=Economy&limit=10&offset=5',
    );
    await GET(req);

    expect(mockGetCurrentAffairs).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Economy',
        limit: 10,
        offset: 5,
      }),
    );
  });

  it('returns 500 when service throws', async () => {
    mockGetCurrentAffairs.mockRejectedValue(new Error('DB down'));

    const req = makeRequest('GET', '/api/current-affairs');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});

describe('POST /api/current-affairs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('generates current affairs content as admin', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1' });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockGenerateCurrentAffairs.mockResolvedValue({ id: 'ca-new', title: 'New CA' });

    const req = makeRequest('POST', '/api/current-affairs', {
      topic: 'India GDP growth',
      category: 'Economy',
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.affair.id).toBe('ca-new');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Authentication required'));

    const req = makeRequest('POST', '/api/current-affairs', {
      topic: 'Test',
      category: 'Economy',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 403 when not admin', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Admin access required'));

    const req = makeRequest('POST', '/api/current-affairs', {
      topic: 'Test',
      category: 'Economy',
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns 429 when rate-limited', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1' });
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 30 });

    const req = makeRequest('POST', '/api/current-affairs', {
      topic: 'Test topic here',
      category: 'Economy',
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it('returns 400 when topic is too short', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1' });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });

    const req = makeRequest('POST', '/api/current-affairs', {
      topic: 'ab',
      category: 'Economy',
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Topic/i);
  });

  it('returns 400 when category is invalid', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1' });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });

    const req = makeRequest('POST', '/api/current-affairs', {
      topic: 'Valid topic text',
      category: 'InvalidCategory',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
