/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/billing/invoices/route';

// --- Mocks ---

const mockGetUser = jest.fn();
const mockGetInvoice = jest.fn();
const mockGetInvoiceHistory = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
  })),
}));

jest.mock('@/lib/security/security-middleware', () => ({
  withSecurity: jest.fn(
    (_req: unknown, handler: () => Promise<Response>, _config?: unknown) => handler()
  ),
}));

jest.mock('@/lib/billing/usage-billing', () => ({
  getUsageBillingService: jest.fn(() => ({
    getInvoice: (...args: any[]) => mockGetInvoice(...args),
    getInvoiceHistory: (...args: any[]) => mockGetInvoiceHistory(...args),
  })),
}));

// --- Helpers ---

function buildRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

// --- Tests ---

describe('GET /api/billing/invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('returns invoice history when no invoice param', async () => {
    const invoices = [
      { id: 'inv-1', amount: 500, date: '2026-01-01' },
      { id: 'inv-2', amount: 300, date: '2026-02-01' },
    ];
    mockGetInvoiceHistory.mockResolvedValue(invoices);

    const res = await GET(buildRequest('/api/billing/invoices'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.invoices).toEqual(invoices);
    expect(mockGetInvoiceHistory).toHaveBeenCalledWith('user-1', 12);
  });

  it('returns a specific invoice when invoice param is provided', async () => {
    const invoice = { id: 'inv-1', number: 'INV-001', amount: 500 };
    mockGetInvoice.mockResolvedValue(invoice);

    const res = await GET(buildRequest('/api/billing/invoices?invoice=INV-001'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.invoice).toEqual(invoice);
    expect(mockGetInvoice).toHaveBeenCalledWith('user-1', 'INV-001');
  });

  it('returns 404 when specific invoice not found', async () => {
    mockGetInvoice.mockResolvedValue(null);

    const res = await GET(buildRequest('/api/billing/invoices?invoice=NOPE'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Invoice not found');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(buildRequest('/api/billing/invoices'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Authentication required');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUser.mockRejectedValue(new Error('DB down'));

    const res = await GET(buildRequest('/api/billing/invoices'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch invoices');
  });

  it('respects custom limit param', async () => {
    mockGetInvoiceHistory.mockResolvedValue([]);

    await GET(buildRequest('/api/billing/invoices?limit=5'));

    expect(mockGetInvoiceHistory).toHaveBeenCalledWith('user-1', 5);
  });
});
