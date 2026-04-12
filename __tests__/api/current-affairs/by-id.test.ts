/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/current-affairs/[id]/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetCurrentAffairById = jest.fn();
const mockUpdateCurrentAffair = jest.fn();
const mockDeleteCurrentAffair = jest.fn();

jest.mock('@/lib/services/current-affairs-service', () => ({
  getCurrentAffairById: (...args: unknown[]) => mockGetCurrentAffairById(...args),
  updateCurrentAffair: (...args: unknown[]) => mockUpdateCurrentAffair(...args),
  deleteCurrentAffair: (...args: unknown[]) => mockDeleteCurrentAffair(...args),
}));

const mockRequireAdmin = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function getReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/current-affairs/${id}`));
}

function patchReq(id: string, body: Record<string, unknown>) {
  return new NextRequest(new URL(`http://localhost/api/current-affairs/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/current-affairs/${id}`), {
    method: 'DELETE',
  });
}

const fakeAffair = { id: 'ca-1', topic: 'Budget 2024', category: 'Economy', content: 'Details' };

// ---------------------------------------------------------------------------
// Tests — GET
// ---------------------------------------------------------------------------

describe('GET /api/current-affairs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentAffairById.mockResolvedValue(fakeAffair);
  });

  it('returns 404 when affair is not found', async () => {
    mockGetCurrentAffairById.mockResolvedValueOnce(null);

    const res = await GET(getReq('ca-1'), makeParams('ca-1'));
    expect(res.status).toBe(404);
  });

  it('returns affair on success', async () => {
    const res = await GET(getReq('ca-1'), makeParams('ca-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.affair.id).toBe('ca-1');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCurrentAffairById.mockRejectedValueOnce(new Error('crash'));

    const res = await GET(getReq('ca-1'), makeParams('ca-1'));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tests — PATCH
// ---------------------------------------------------------------------------

describe('PATCH /api/current-affairs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(undefined);
    mockUpdateCurrentAffair.mockResolvedValue({ ...fakeAffair, topic: 'Updated' });
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('Authentication required'));

    const res = await PATCH(patchReq('ca-1', { topic: 'Updated' }), makeParams('ca-1'));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('Admin access required'));

    const res = await PATCH(patchReq('ca-1', { topic: 'Updated' }), makeParams('ca-1'));
    expect(res.status).toBe(403);
  });

  it('updates affair on success', async () => {
    const res = await PATCH(patchReq('ca-1', { topic: 'Updated' }), makeParams('ca-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/updated/i);
  });

  it('returns 500 on unexpected error', async () => {
    mockUpdateCurrentAffair.mockRejectedValueOnce(new Error('db error'));

    const res = await PATCH(patchReq('ca-1', { topic: 'Updated' }), makeParams('ca-1'));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tests — DELETE
// ---------------------------------------------------------------------------

describe('DELETE /api/current-affairs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(undefined);
    mockDeleteCurrentAffair.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('Authentication required'));

    const res = await DELETE(deleteReq('ca-1'), makeParams('ca-1'));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('Admin access required'));

    const res = await DELETE(deleteReq('ca-1'), makeParams('ca-1'));
    expect(res.status).toBe(403);
  });

  it('deletes affair on success', async () => {
    const res = await DELETE(deleteReq('ca-1'), makeParams('ca-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/deleted/i);
  });

  it('returns 500 on unexpected error', async () => {
    mockDeleteCurrentAffair.mockRejectedValueOnce(new Error('db error'));

    const res = await DELETE(deleteReq('ca-1'), makeParams('ca-1'));
    expect(res.status).toBe(500);
  });
});
