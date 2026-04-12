/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/initiate/route';

// --- Mocks ---

const mockRequireSession = jest.fn();
const mockFrom = jest.fn();
const mockCreateOrder = jest.fn();
const mockValidateBody = jest.fn();

jest.mock('@/lib/auth/session', () => ({
  requireSession: (...args: any[]) => mockRequireSession(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

jest.mock('@/lib/payments/razorpay', () => ({
  createOrder: (...args: any[]) => mockCreateOrder(...args),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

jest.mock('@/lib/validation/schemas', () => {
  class ValidationError extends Error {
    errors: any[];
    constructor(msg: string, errors: any[]) {
      super(msg);
      this.errors = errors;
    }
  }
  return {
    validateBody: (...args: any[]) => mockValidateBody(...args),
    paymentInitiateSchema: {},
    ValidationError,
  };
});

jest.mock('@/lib/logging/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  measure: jest.fn((_name: string, fn: () => Promise<any>) => fn()),
}));

jest.mock('@/lib/errors/app-error', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    constructor(msg: string, code: string, statusCode: number) {
      super(msg);
      this.statusCode = statusCode;
    }
  },
  ErrorCode: { VALIDATION_ERROR: 'VALIDATION_ERROR', PAYMENT_ERROR: 'PAYMENT_ERROR' },
  createPaymentError: jest.fn((msg: string) => {
    const err: any = new Error(msg);
    err.statusCode = 500;
    return err;
  }),
  createValidationError: jest.fn((msg: string) => {
    const err: any = new Error(msg);
    err.statusCode = 400;
    return err;
  }),
  handleError: jest.fn((err: any) => ({ error: err.message })),
}));

// --- Helpers ---

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL('/api/payments/initiate', 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// --- Tests ---

describe('POST /api/payments/initiate', () => {
  const fakePlan = {
    id: 'plan-1',
    slug: 'pro',
    name: 'Pro Plan',
    is_active: true,
    price_monthly: 1000,
    price_yearly: 10000,
    price_quarterly: 2700,
    gst_percentage: 18,
    duration_months: 1,
    features: ['feature1'],
    tier: 'pro',
  };

  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockUpdateEq = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockValidateBody.mockImplementation((_schema: any, data: any) => data);

    // Chain: from('subscription_plans').select('*').eq('slug', x).single()
    mockSingle.mockResolvedValue({ data: fakePlan, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Chain: from('payments').insert({...})
    mockInsert.mockResolvedValue({ error: null });

    // Chain: from('payments').update({...}).eq('id', x)
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'subscription_plans') {
        return { select: mockSelect };
      }
      return { insert: mockInsert, update: mockUpdate };
    });

    mockCreateOrder.mockResolvedValue({
      id: 'order_abc123',
      currency: 'INR',
    });
  });

  it('initiates payment successfully for monthly plan', async () => {
    const res = await POST(buildRequest({ planSlug: 'pro', billingCycle: 'monthly' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.orderId).toBe('order_abc123');
    expect(body.amount).toBe(1180); // 1000 + 18% GST
    expect(body.breakdown.baseAmount).toBe(1000);
    expect(body.breakdown.gstAmount).toBe(180);
    expect(body.plan.name).toBe('Pro Plan');
  });

  it('calculates yearly pricing correctly', async () => {
    const res = await POST(buildRequest({ planSlug: 'pro', billingCycle: 'yearly' }));
    const body = await res.json();

    expect(body.breakdown.baseAmount).toBe(10000);
    expect(body.breakdown.gstAmount).toBe(1800);
    expect(body.amount).toBe(11800);
  });

  it('calculates quarterly pricing correctly', async () => {
    const res = await POST(buildRequest({ planSlug: 'pro', billingCycle: 'quarterly' }));
    const body = await res.json();

    expect(body.breakdown.baseAmount).toBe(2700);
  });

  it('returns error when plan not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    const res = await POST(buildRequest({ planSlug: 'nonexistent' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('returns error when plan is inactive', async () => {
    mockSingle.mockResolvedValue({
      data: { ...fakePlan, is_active: false },
      error: null,
    });

    const res = await POST(buildRequest({ planSlug: 'pro' }));
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  it('returns error when payment record creation fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    const res = await POST(buildRequest({ planSlug: 'pro' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });

  it('returns 401 when session is missing', async () => {
    const authErr: any = new Error('Unauthorized');
    authErr.statusCode = 401;
    mockRequireSession.mockRejectedValue(authErr);

    const res = await POST(buildRequest({ planSlug: 'pro' }));

    expect(res.status).toBe(401);
  });
});
