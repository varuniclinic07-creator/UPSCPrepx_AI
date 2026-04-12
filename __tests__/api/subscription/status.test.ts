/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/subscription/status/route';

// --- Mocks ---

const mockRequireSession = jest.fn();
const mockRpc = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/auth/session', () => ({
  requireSession: (...args: any[]) => mockRequireSession(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

// --- Helpers ---

function buildRequest(): NextRequest {
  return new NextRequest(new URL('/api/subscription/status', 'http://localhost:3000'));
}

// --- Tests ---

describe('GET /api/subscription/status', () => {
  const mockSubSelect = jest.fn();
  const mockSubEq = jest.fn();
  const mockSubEq2 = jest.fn();
  const mockSubGte = jest.fn();
  const mockSubOrder = jest.fn();
  const mockSubSingle = jest.fn();

  const mockUserSelect = jest.fn();
  const mockUserEq = jest.fn();
  const mockUserSingle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });

    // RPC returns null by default (falls through to direct query)
    mockRpc.mockResolvedValue({ data: null });

    // user_subscriptions chain
    mockSubSingle.mockResolvedValue({ data: null });
    mockSubOrder.mockReturnValue({ single: mockSubSingle });
    mockSubGte.mockReturnValue({ order: mockSubOrder });
    mockSubEq2.mockReturnValue({ gte: mockSubGte });
    mockSubEq.mockReturnValue({ eq: mockSubEq2 });
    mockSubSelect.mockReturnValue({ eq: mockSubEq });

    // users chain
    mockUserSingle.mockResolvedValue({
      data: {
        subscription_tier: 'free',
        subscription_status: 'free',
        subscription_ends_at: null,
        trial_started_at: null,
        trial_ends_at: null,
        post_trial: false,
      },
    });
    mockUserEq.mockReturnValue({ single: mockUserSingle });
    mockUserSelect.mockReturnValue({ eq: mockUserEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_subscriptions') {
        return { select: mockSubSelect };
      }
      return { select: mockUserSelect };
    });
  });

  it('returns free user status when no subscription exists', async () => {
    const res = await GET(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.subscription).toBeNull();
    expect(body.user.tier).toBe('free');
    expect(body.user.status).toBe('free');
    expect(body.features.isFree).toBe(true);
    expect(body.features.hasFullAccess).toBe(false);
  });

  it('returns subscription from RPC when available', async () => {
    mockRpc.mockResolvedValue({ data: 'pro' });

    const res = await GET(buildRequest());
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.subscription).toEqual({ tier: 'pro' });
    expect(body.features.hasFullAccess).toBe(true);
  });

  it('falls back to direct query when RPC returns null', async () => {
    mockSubSingle.mockResolvedValue({
      data: {
        id: 'sub-1',
        tier: 'premium',
        status: 'active',
        ends_at: '2026-12-31',
        starts_at: '2026-01-01',
        billing_cycle: 'yearly',
        subscription_plans: { name: 'Premium', tier: 'premium', features: [], limits: {} },
      },
    });

    const res = await GET(buildRequest());
    const body = await res.json();

    expect(body.subscription.tier).toBe('premium');
    expect(body.subscription.status).toBe('active');
    expect(body.features.hasFullAccess).toBe(true);
  });

  it('detects active trial correctly', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 7).toISOString(); // 7 days ahead
    mockUserSingle.mockResolvedValue({
      data: {
        subscription_tier: 'pro',
        subscription_status: 'trial',
        subscription_ends_at: null,
        trial_started_at: '2026-04-01',
        trial_ends_at: futureDate,
        post_trial: false,
      },
    });

    const res = await GET(buildRequest());
    const body = await res.json();

    expect(body.user.trial.isActive).toBe(true);
    expect(body.user.trial.isPostTrial).toBe(false);
    expect(body.features.hasFullAccess).toBe(true);
  });

  it('detects post-trial user', async () => {
    mockUserSingle.mockResolvedValue({
      data: {
        subscription_tier: 'free',
        subscription_status: 'expired',
        subscription_ends_at: null,
        trial_started_at: '2026-01-01',
        trial_ends_at: '2026-01-14',
        post_trial: true,
      },
    });

    const res = await GET(buildRequest());
    const body = await res.json();

    expect(body.user.trial.isPostTrial).toBe(true);
    expect(body.user.trial.isActive).toBeFalsy();
  });

  it('returns 401 when authentication fails', async () => {
    mockRequireSession.mockRejectedValue(new Error('Authentication required'));

    const res = await GET(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Please sign in');
  });

  it('returns 500 on unexpected error', async () => {
    mockRequireSession.mockRejectedValue(new Error('Something broke'));

    const res = await GET(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch subscription status');
  });
});
