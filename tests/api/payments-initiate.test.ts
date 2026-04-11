/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/initiate/route';

const mockSession = { user: { id: 'user-123' } };
jest.mock('@/lib/auth/session', () => ({
  requireSession: jest.fn(() => Promise.resolve(mockSession)),
}));

jest.mock('uuid', () => ({ v4: jest.fn(() => 'pay-uuid-1234') }));

const mockCreateOrder = jest.fn();
jest.mock('@/lib/payments/razorpay', () => ({
  createOrder: (...args: any[]) => mockCreateOrder(...args),
}));

const mockSingle = jest.fn();
const mockSelectSingle = jest.fn(() => ({ single: mockSingle }));
const mockEqSelect = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEqSelect }));
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn((table: string) => {
      if (table === 'subscription_plans') return { select: mockSelect };
      if (table === 'payments') return { insert: mockInsert, update: mockUpdate };
      return {};
    }),
  })),
}));

function makeRequest(body: any) {
  return new NextRequest('http://localhost/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_key';
});

describe('POST /api/payments/initiate', () => {
  it('returns 400 if planSlug missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 if plan not found or inactive', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });
    const res = await POST(makeRequest({ planSlug: 'nonexistent' }));
    expect(res.status).toBe(400);
  });

  it('returns success with payment details for monthly billing', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'plan-1',
        name: 'Premium',
        tier: 'premium',
        price_monthly: 999,
        price_quarterly: 2697,
        price_yearly: 9990,
        gst_percentage: 18,
        is_active: true,
        duration_months: 1,
        features: ['all']
      },
      error: null
    });
    mockInsert.mockResolvedValue({ error: null });
    mockCreateOrder.mockResolvedValue({ id: 'order_123', currency: 'INR' });
    mockUpdateEq.mockResolvedValue({ error: null });

    const res = await POST(makeRequest({ planSlug: 'premium' }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.orderId).toBe('order_123');
    expect(data.breakdown.baseAmount).toBe(999);
    expect(data.breakdown.gstAmount).toBe(180); // Rounded
    expect(data.breakdown.totalAmount).toBe(1179);
    expect(data.key).toBe('rzp_test_key');
  });

  it('supports quarterly billing cycle', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'plan-1',
        name: 'Premium',
        tier: 'premium',
        price_monthly: 999,
        price_quarterly: 2697,
        gst_percentage: 18,
        is_active: true,
        duration_months: 1,
        features: []
      },
      error: null
    });
    mockInsert.mockResolvedValue({ error: null });
    mockCreateOrder.mockResolvedValue({ id: 'order_456', currency: 'INR' });
    mockUpdateEq.mockResolvedValue({ error: null });

    const res = await POST(makeRequest({ planSlug: 'premium', billingCycle: 'quarterly' }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.breakdown.baseAmount).toBe(2697);
    expect(data.breakdown.billingCycle).toBe('quarterly');
  });

  it('returns 500 if payment record creation fails', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'plan-1', name: 'Premium', tier: 'premium', price_monthly: 999, gst_percentage: 18, is_active: true, features: [] },
      error: null
    });
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    const res = await POST(makeRequest({ planSlug: 'premium' }));
    expect(res.status).toBe(500);
  });
});
