/** @jest-environment node */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireSession = jest.fn();
jest.mock('@/lib/auth/session', () => ({
  requireSession: () => mockRequireSession(),
}));

jest.mock('@/lib/content/topper-strategies', () => {
  const toppers = [
    {
      name: 'Topper A',
      year: 2023,
      rank: 1,
      optional: 'Sociology',
      strategy: 'Focus on answer writing',
    },
    {
      name: 'Topper B',
      year: 2022,
      rank: 5,
      optional: 'Geography',
      strategy: 'Map-based revision',
    },
    {
      name: 'Topper C',
      year: 2023,
      rank: 10,
      optional: 'Geography',
      strategy: 'NCERTs first',
    },
  ];
  return {
    TOPPER_STRATEGIES: toppers,
    getToppersByYear: (year: number) => toppers.filter((t) => t.year === year),
    getToppersByOptional: (opt: string) => toppers.filter((t) => t.optional === opt),
    getAllYears: () => [2022, 2023],
    getAllOptionals: () => ['Sociology', 'Geography'],
  };
});

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/toppers/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), { method: 'GET' });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/toppers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all toppers when no filters applied', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });

    const req = makeRequest('/api/toppers');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.toppers).toHaveLength(3);
    expect(json.total).toBe(3);
  });

  it('filters toppers by year', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });

    const req = makeRequest('/api/toppers?year=2023');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.toppers).toHaveLength(2);
    expect(json.toppers.every((t: any) => t.year === 2023)).toBe(true);
  });

  it('filters toppers by optional subject', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });

    const req = makeRequest('/api/toppers?optional=Geography');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.toppers).toHaveLength(2);
    expect(json.toppers.every((t: any) => t.optional === 'Geography')).toBe(true);
  });

  it('returns metadata when meta=true', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });

    const req = makeRequest('/api/toppers?meta=true');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.years).toEqual([2022, 2023]);
    expect(json.optionals).toEqual(['Sociology', 'Geography']);
    expect(json.total).toBe(3);
  });

  it('returns 401 when unauthenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const req = makeRequest('/api/toppers');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/sign in/i);
  });
});
