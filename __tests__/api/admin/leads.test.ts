/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/admin/leads/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/auth-config', () => ({
  getCurrentUser: (req: any) => mockGetCurrentUser(req),
}));

jest.mock('@/lib/admin/admin-service', () => ({
  getLeads: (params: any) => mockGetLeads(params),
  updateLead: (id: any, data: any) => mockUpdateLead(id, data),
}));

const mockGetCurrentUser = jest.fn();
const mockGetLeads = jest.fn();
const mockUpdateLead = jest.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any);
}

function mockAdmin() {
  mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'admin' });
}

// ---------------------------------------------------------------------------
// Tests - GET
// ---------------------------------------------------------------------------

describe('GET /api/admin/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET(buildRequest('/api/admin/leads'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 401 for non-admin role', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'student' });

    const res = await GET(buildRequest('/api/admin/leads'));
    expect(res.status).toBe(401);
  });

  it('returns leads with default pagination', async () => {
    mockAdmin();
    const leadsResult = { leads: [{ id: 'l1', email: 'test@example.com' }], total: 1 };
    mockGetLeads.mockResolvedValue(leadsResult);

    const res = await GET(buildRequest('/api/admin/leads'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(leadsResult);
    expect(mockGetLeads).toHaveBeenCalledWith({ page: 1, limit: 20, status: undefined });
  });

  it('passes query parameters to getLeads', async () => {
    mockAdmin();
    mockGetLeads.mockResolvedValue({ leads: [], total: 0 });

    await GET(buildRequest('/api/admin/leads?page=2&limit=10&status=active'));

    expect(mockGetLeads).toHaveBeenCalledWith({ page: 2, limit: 10, status: 'active' });
  });

  it('returns 500 on unexpected error', async () => {
    mockAdmin();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockGetLeads.mockRejectedValue(new Error('Service error'));

    const res = await GET(buildRequest('/api/admin/leads'));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Internal server error');
    consoleError.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Tests - PATCH
// ---------------------------------------------------------------------------

describe('PATCH /api/admin/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await PATCH(buildRequest('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: 'l1', status: 'contacted' }),
    }));

    expect(res.status).toBe(401);
  });

  it('returns 400 when leadId is missing', async () => {
    mockAdmin();

    const res = await PATCH(buildRequest('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'contacted' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Lead ID is required');
  });

  it('updates a lead successfully', async () => {
    mockAdmin();
    const updatedLead = { id: 'l1', status: 'contacted', notes: 'Called' };
    mockUpdateLead.mockResolvedValue(updatedLead);

    const res = await PATCH(buildRequest('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: 'l1', status: 'contacted', notes: 'Called' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.lead).toEqual(updatedLead);
    expect(mockUpdateLead).toHaveBeenCalledWith('l1', { status: 'contacted', notes: 'Called' });
  });

  it('returns 500 on unexpected error', async () => {
    mockAdmin();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockUpdateLead.mockRejectedValue(new Error('DB error'));

    const res = await PATCH(buildRequest('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: 'l1', status: 'contacted' }),
    }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Internal server error');
    consoleError.mockRestore();
  });
});
