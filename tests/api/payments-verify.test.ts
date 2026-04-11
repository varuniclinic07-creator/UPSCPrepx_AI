/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/verify/route';

const mockSession = { user: { id: 'user-123' } };
jest.mock('@/lib/auth/session', () => ({
  requireSession: jest.fn(() => Promise.resolve(mockSession)),
}));

const mockVerifyPaymentSignature = jest.fn();
const mockGetPaymentDetails = jest.fn();
jest.mock('@/lib/payments/razorpay', () => ({
  verifyPaymentSignature: (...args: any[]) => mockVerifyPaymentSignature(...args),
  getPaymentDetails: (...args: any[]) => mockGetPaymentDetails(...args),
}));

const mockCreateSubscription = jest.fn();
jest.mock('@/lib/payments/subscription-service', () => ({
  createSubscription: (...args: any[]) => mockCreateSubscription(...args),
}));

const mockGenerateInvoice = jest.fn();
jest.mock('@/lib/invoices/invoice-generator', () => ({
  generateInvoice: (...args: any[]) => mockGenerateInvoice(...args),
}));

const mockSingle = jest.fn();
const mockEqSingle = jest.fn(() => ({ single: mockSingle }));
const mockSelectEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockSelectEq }));
const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({ select: mockSelect, update: mockUpdate })),
  })),
}));

function makeRequest(body: any) {
  return new NextRequest('http://localhost/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => jest.clearAllMocks());

const validBody = {
  paymentId: 'pay-1',
  orderId: 'order-1',
  signature: 'sig-123',
  razorpayPaymentId: 'rpay-1',
};

describe('POST /api/payments/verify', () => {
  it('returns 400 if required fields missing', async () => {
    const res = await POST(makeRequest({ paymentId: 'pay-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 if payment not found', async () => {
    mockSingle.mockResolvedValue({ data: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
  });

  it('returns 403 if user does not own payment', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'other-user', plan_id: 'plan-1' } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid signature', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-123', plan_id: 'plan-1' } });
    mockVerifyPaymentSignature.mockReturnValue(false);
    mockUpdateEq.mockResolvedValue({ error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/signature/i);
  });

  it('returns success on valid payment', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-123', plan_id: 'plan-1', amount: 1179 } });
    mockVerifyPaymentSignature.mockReturnValue(true);
    mockGetPaymentDetails.mockResolvedValue({ method: 'upi' });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockCreateSubscription.mockResolvedValue({ id: 'sub-1', tier: 'premium', endsAt: '2027-01-01' });
    mockGenerateInvoice.mockResolvedValue('https://invoice.url/pdf');

    const res = await POST(makeRequest(validBody));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.subscription.tier).toBe('premium');
    expect(data.invoiceUrl).toBe('https://invoice.url/pdf');
  });
});
