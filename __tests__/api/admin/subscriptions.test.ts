/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/subscriptions/route';

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

const mockGetCurrentUser = jest.fn();

const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockRange = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  range: mockRange,
  order: mockOrder,
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
    eq: mockEq,
    range: mockRange,
    order: mockOrder,
    update: mockUpdate,
  });
  mockSelect.mockReturnValue({ eq: mockEq, range: mockRange, order: mockOrder });
  mockEq.mockReturnValue({ eq: mockEq, range: mockRange, order: mockOrder });
  mockRange.mockReturnValue({ order: mockOrder });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

// ---------------------------------------------------------------------------
// Tests - GET
// ---------------------------------------------------------------------------

describe('GET /api/admin/subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupChains();
  });

  it('returns 401 when not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET(buildRequest('/api/admin/subscriptions'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns subscriptions with pagination', async () => {
    mockAdmin();
    const subs = [{ id: 's1', plan_type: 'premium', status: 'active' }];
    // The final .order() call resolves the promise
    mockOrder.mockResolvedValueOnce({ data: subs, error: null, count: 1 });

    const res = await GET(buildRequest('/api/admin/subscriptions?page=1&limit=10'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.subscriptions).toEqual(subs);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(10);
    expect(json.data.pagination.total).toBe(1);
  });

  it('applies status and plan filters', async () => {
    mockAdmin();
    mockOrder.mockResolvedValueOnce({ data: [], error: null, count: 0 });

    await GET(buildRequest('/api/admin/subscriptions?status=active&plan=premium'));

    expect(mockEq).toHaveBeenCalledWith('status', 'active');
    expect(mockEq).toHaveBeenCalledWith('plan_type', 'premium');
  });

  it('returns 500 on database error', async () => {
    mockAdmin();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockOrder.mockResolvedValueOnce({ data: null, error: new Error('DB fail'), count: 0 });

    const res = await GET(buildRequest('/api/admin/subscriptions'));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch subscriptions');
    consoleError.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Tests - POST
// ---------------------------------------------------------------------------

describe('POST /api/admin/subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupChains();
    mockEq.mockResolvedValue({ data: null, error: null });
  });

  it('returns 401 when not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(buildRequest('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', subscriptionId: 's1' }),
    }));

    expect(res.status).toBe(401);
  });

  it('cancels a subscription', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', subscriptionId: 's1' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Subscription canceld successfully');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
  });

  it('reactivates a subscription', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reactivate', subscriptionId: 's1' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('refunds a subscription', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refund', subscriptionId: 's1', data: { amount: 500 } }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'refunded',
      refund_amount: 500,
    }));
  });

  it('extends a subscription', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'extend',
        subscriptionId: 's1',
        data: { current_end: '2026-04-01T00:00:00Z', days: '30' },
      }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      ends_at: expect.any(String),
    }));
  });

  it('returns 400 for invalid action', async () => {
    mockAdmin();

    const res = await POST(buildRequest('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid', subscriptionId: 's1' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid action');
  });

  it('returns 500 on unexpected error', async () => {
    mockAdmin();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockUpdate.mockImplementation(() => { throw new Error('DB crash'); });

    const res = await POST(buildRequest('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', subscriptionId: 's1' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to perform action');
    consoleError.mockRestore();
  });
});
