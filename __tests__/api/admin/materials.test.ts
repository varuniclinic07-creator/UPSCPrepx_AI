/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/admin/materials/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: (...args: any[]) => mockFrom(...args),
      auth: { getUser: (...args: any[]) => mockGetUser(...args) },
    })
  ),
}));

jest.mock('@/lib/storage/minio', () => ({
  uploadToMinIO: jest.fn(() => Promise.resolve('https://minio.test/file.pdf')),
}));

jest.mock('@/lib/security', () => ({
  requireAdmin: (...args: any[]) => mockRequireAdmin(...args),
  withRateLimit: jest.fn((_req: unknown, _limits: unknown, handler: () => Promise<Response>) => handler()),
  validateRequest: jest.fn((_schema: unknown, data: unknown) => ({ success: true, data })),
  schemas: { filter: {} },
  RATE_LIMITS: { admin: {} },
}));

const mockSelect = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockSingle = jest.fn();
const mockDelete = jest.fn().mockReturnThis();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  order: mockOrder,
  eq: mockEq,
  insert: mockInsert,
  delete: mockDelete,
  single: mockSingle,
}));

// Chain helpers – allow chaining in any order
mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, single: mockSingle });
mockOrder.mockReturnValue({ eq: mockEq, data: [], error: null });
mockInsert.mockReturnValue({ select: mockSelect });
mockSingle.mockReturnValue({ data: null, error: null });
mockDelete.mockReturnValue({ eq: mockEq });

const mockGetUser = jest.fn();

// Security mock – requireAdmin passes by default
const mockRequireAdmin = jest.fn(() => Promise.resolve({ id: 'admin-1', role: 'admin' }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/admin/materials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish chain after clearAllMocks wipes implementations
    mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, single: mockSingle });
    mockOrder.mockReturnValue({ eq: mockEq, data: [], error: null });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSingle.mockReturnValue({ data: null, error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
  });

  it('returns materials list with total', async () => {
    const materials = [{ id: '1', name: 'Polity Notes' }];
    // The chain is: .from().select().order() then possibly .eq() then await
    // Each chainable must return an object with further chainable methods + be thenable
    const chainable = {
      eq: jest.fn().mockReturnThis(),
      then: (resolve: (v: any) => void) => resolve({ data: materials, error: null }),
    };
    mockOrder.mockReturnValueOnce(chainable);

    const res = await GET(buildRequest('/api/admin/materials'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.materials).toEqual(materials);
    expect(json.total).toBe(1);
  });

  it('returns 401 when admin check fails', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAdmin.mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const res = await GET(buildRequest('/api/admin/materials'));
    expect(res.status).toBe(403);
  });

  it('returns 500 on database error', async () => {
    const chainable = {
      eq: jest.fn().mockReturnThis(),
      then: (resolve: (v: any) => void) => resolve({ data: null, error: new Error('DB down') }),
    };
    mockOrder.mockReturnValueOnce(chainable);

    const res = await GET(buildRequest('/api/admin/materials'));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch materials');
  });
});

describe('POST /api/admin/materials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, single: mockSingle });
    mockOrder.mockReturnValue({ eq: mockEq, data: [], error: null });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSingle.mockReturnValue({ data: null, error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const formData = new FormData();
    formData.append('file', new Blob(['pdf-data'], { type: 'application/pdf' }), 'notes.pdf');
    formData.append('name', 'Test');
    formData.append('subject', 'History');

    const req = new NextRequest('http://localhost:3000/api/admin/materials', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const formData = new FormData();
    // missing file, name, subject
    const req = new NextRequest('http://localhost:3000/api/admin/materials', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing required fields');
  });

  it('returns 201 on successful upload', async () => {
    const material = { id: 'm-1', name: 'Polity Notes' };
    mockSingle.mockResolvedValueOnce({ data: material, error: null });

    const formData = new FormData();
    formData.append('file', new Blob(['pdf'], { type: 'application/pdf' }), 'polity.pdf');
    formData.append('name', 'Polity Notes');
    formData.append('subject', 'Polity');
    formData.append('category', 'notes');
    formData.append('tags', '["gs2"]');
    formData.append('isStandard', 'true');

    const req = new NextRequest('http://localhost:3000/api/admin/materials', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.material).toEqual(material);
    expect(json.message).toBe('Material uploaded successfully');
  });
});

describe('DELETE /api/admin/materials/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, single: mockSingle });
    mockOrder.mockReturnValue({ eq: mockEq, data: [], error: null });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSingle.mockReturnValue({ data: null, error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const req = buildRequest('/api/admin/materials', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: 'm-1' } });

    expect(res.status).toBe(401);
  });

  it('deletes material successfully', async () => {
    mockEq.mockResolvedValueOnce({ error: null });

    const req = buildRequest('/api/admin/materials', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: 'm-1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe('Material deleted successfully');
  });

  it('returns 500 on database error', async () => {
    mockEq.mockResolvedValueOnce({ error: new Error('FK constraint') });

    const req = buildRequest('/api/admin/materials', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: 'm-1' } });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to delete material');
  });
});
