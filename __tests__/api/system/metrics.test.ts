/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/metrics/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/observability/metrics', () => ({
  getMetrics: (...args: any[]) => mockGetMetrics(...args),
}));

const mockGetMetrics = jest.fn();

// withSecurity: execute the handler directly for unit tests
jest.mock('@/lib/security/security-middleware', () => ({
  withSecurity: jest.fn(
    (_req: unknown, handler: () => Promise<Response>, _opts: unknown) => handler()
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(url = '/api/metrics'): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/metrics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns metrics in Prometheus text format', async () => {
    const prometheusText =
      '# HELP http_requests_total Total HTTP requests\nhttp_requests_total 42\n';
    mockGetMetrics.mockResolvedValue(prometheusText);

    const res = await GET(buildRequest());

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');

    const body = await res.text();
    expect(body).toBe(prometheusText);
  });

  it('returns 500 when metrics collection fails', async () => {
    mockGetMetrics.mockRejectedValue(new Error('metrics unavailable'));

    const res = await GET(buildRequest());
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to collect metrics');
  });

  it('sets cache-control to no-cache', async () => {
    mockGetMetrics.mockResolvedValue('');

    const res = await GET(buildRequest());

    expect(res.headers.get('Cache-Control')).toBe(
      'no-cache, no-store, must-revalidate'
    );
  });
});
