/** @jest-environment node */

import { GET } from '@/app/api/plans/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockOrder = jest.fn();
const mockFrom = jest.fn(() => ({ select: mockSelect, eq: mockEq, order: mockOrder }));
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ order: mockOrder });

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/plans', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns active plans sorted by price', async () => {
    const plans = [
      { id: '1', name: 'Free', price: 0, is_active: true },
      { id: '2', name: 'Pro', price: 499, is_active: true },
    ];
    mockOrder.mockResolvedValue({ data: plans, error: null });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.plans).toEqual(plans);
    expect(mockFrom).toHaveBeenCalledWith('subscription_plans');
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(mockOrder).toHaveBeenCalledWith('price', { ascending: true });
  });

  it('returns 500 on database error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch plans');
  });

  it('returns empty plans array when none exist', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.plans).toEqual([]);
  });
});
