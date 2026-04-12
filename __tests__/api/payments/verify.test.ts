/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/verify/route';

// --- Mocks ---

const mockRequireSession = jest.fn();
const mockFrom = jest.fn();
const mockVerifyPaymentSignature = jest.fn();
const mockGetPaymentDetails = jest.fn();
const mockCreateSubscription = jest.fn();
const mockGenerateInvoice = jest.fn();

jest.mock('@/lib/auth/session', () => ({
  requireSession: (...args: any[]) => mockRequireSession(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

jest.mock('@/lib/payments/razorpay', () => ({
  verifyPaymentSignature: (...args: any[]) => mockVerifyPaymentSignature(...args),
  getPaymentDetails: (...args: any[]) => mockGetPaymentDetails(...args),
}));

jest.mock('@/lib/payments/subscription-service', () => ({
  createSubscription: (...args: any[]) => mockCreateSubscription(...args),
}));

jest.mock('@/lib/invoices/invoice-generator', () => ({
  generateInvoice: (...args: any[]) => mockGenerateInvoice(...args),
}));

// --- Helpers ---

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL('/api/payments/verify', 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  paymentId: 'pay-1',
  orderId: 'order-1',
  signature: 'sig-abc',
  razorpayPaymentId: 'rzp-pay-1',
};

// --- Tests ---

describe('POST /api/payments/verify', () => {
  const mockSelectChain = jest.fn();
  const mockEqChain = jest.fn();
  const mockSingle = jest.fn();
  const mockUpdate = jest.fn();
  const mockUpdateEq = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });

    // from('payments').select(...).eq('id', x).single()
    mockSingle.mockResolvedValue({
      data: {
        id: 'pay-1',
        user_id: 'user-1',
        plan_id: 'plan-1',
        total_amount: 1180,
        subscription_plans: { id: 'plan-1', name: 'Pro', tier: 'pro' },
      },
      error: null,
    });
    mockEqChain.mockReturnValue({ single: mockSingle });
    mockSelectChain.mockReturnValue({ eq: mockEqChain });

    // from('payments').update({...}).eq('id', x)
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });

    mockFrom.mockReturnValue({
      select: mockSelectChain,
      update: mockUpdate,
    });

    mockVerifyPaymentSignature.mockReturnValue(true);
    mockGetPaymentDetails.mockResolvedValue({ amount: 1180, method: 'upi' });
    mockCreateSubscription.mockResolvedValue({
      id: 'sub-1',
      tier: 'pro',
      endsAt: '2026-05-12',
    });
    mockGenerateInvoice.mockResolvedValue('https://invoices.test/inv-1.pdf');
  });

  it('verifies payment and creates subscription successfully', async () => {
    const res = await POST(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.payment.status).toBe('completed');
    expect(body.payment.amount).toBe(1180);
    expect(body.subscription.id).toBe('sub-1');
    expect(body.subscription.tier).toBe('pro');
    expect(body.invoiceUrl).toBe('https://invoices.test/inv-1.pdf');
    expect(mockVerifyPaymentSignature).toHaveBeenCalledWith('order-1', 'rzp-pay-1', 'sig-abc');
    expect(mockCreateSubscription).toHaveBeenCalledWith('user-1', 'plan-1', 'pay-1');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(buildRequest({ paymentId: 'pay-1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Missing required fields');
  });

  it('returns 404 when payment record not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const res = await POST(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Payment not found');
  });

  it('returns 403 when user does not own the payment', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'pay-1', user_id: 'other-user', total_amount: 1180 },
      error: null,
    });

    const res = await POST(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when signature is invalid', async () => {
    mockVerifyPaymentSignature.mockReturnValue(false);

    const res = await POST(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid payment signature');
  });

  it('returns 400 when amount mismatches', async () => {
    mockGetPaymentDetails.mockResolvedValue({ amount: 9999, method: 'upi' });

    const res = await POST(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Payment amount mismatch');
  });

  it('succeeds even when invoice generation fails', async () => {
    mockGenerateInvoice.mockRejectedValue(new Error('PDF service down'));

    const res = await POST(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.invoiceUrl).toBe('');
  });

  it('returns 401 when session is missing', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await POST(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Please sign in');
  });
});
