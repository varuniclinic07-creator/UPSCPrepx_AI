/**
 * @jest-environment node
 */
// tests/navigation/middleware.test.ts
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      next: jest.fn(() => ({ type: 'next' } as any)),
      redirect: jest.fn((url: URL) => ({ type: 'redirect', url } as any)),
    },
  };
});

const mockUpdateSession = jest.fn();
jest.mock('@/lib/supabase/middleware', () => ({
  updateSession: (...args: any[]) => mockUpdateSession(...args),
}));

const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));

const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockAdminUser = { id: 'admin-123', email: 'admin@example.com' };

function makeRequest(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

function setupAuth(user: any | null) {
  mockUpdateSession.mockResolvedValue({
    response: { type: 'next-session' },
    user,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (NextResponse.next as jest.Mock).mockReturnValue({ type: 'next' });
  (NextResponse.redirect as jest.Mock).mockImplementation((url: URL) => ({ type: 'redirect', url }));
});

describe('middleware', () => {
  describe('public routes', () => {
    it.each(['/privacy', '/terms', '/api/health'])(
      'allows %s without auth',
      async (path) => {
        const result = await middleware(makeRequest(path));
        expect(result).toEqual({ type: 'next' });
        expect(mockUpdateSession).not.toHaveBeenCalled();
      }
    );
  });

  it('allows /auth/callback without auth', async () => {
    const result = await middleware(makeRequest('/auth/callback'));
    expect(result).toEqual({ type: 'next' });
    expect(mockUpdateSession).not.toHaveBeenCalled();
  });

  it('skips API routes except /api/user', async () => {
    const result = await middleware(makeRequest('/api/some-endpoint'));
    expect(result).toEqual({ type: 'next' });
    expect(mockUpdateSession).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated user from /dashboard to /login', async () => {
    setupAuth(null);
    await middleware(makeRequest('/dashboard'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' })
    );
    const redirectUrl: URL = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.searchParams.get('redirect')).toBe('/dashboard');
  });

  it('redirects unauthenticated user from /admin to /login', async () => {
    setupAuth(null);
    await middleware(makeRequest('/admin'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' })
    );
    const redirectUrl: URL = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.searchParams.get('redirect')).toBe('/admin');
  });

  it('redirects authenticated user from /login to /dashboard', async () => {
    setupAuth(mockUser);
    await middleware(makeRequest('/login'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    );
  });

  it('allows admin user to access /admin', async () => {
    setupAuth(mockAdminUser);
    mockSingle.mockResolvedValue({ data: { role: 'admin' } });
    const result = await middleware(makeRequest('/admin'));
    expect(NextResponse.redirect).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    );
    expect(result).toEqual({ type: 'next-session' });
  });

  it('blocks non-admin user from /admin with redirect to /dashboard?error=unauthorized', async () => {
    setupAuth(mockUser);
    mockSingle.mockResolvedValue({ data: { role: 'user' } });
    await middleware(makeRequest('/admin'));
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl: URL = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/dashboard');
    expect(redirectUrl.searchParams.get('error')).toBe('unauthorized');
  });

  it('passes redirect param in login redirect', async () => {
    setupAuth(null);
    await middleware(makeRequest('/dashboard/settings'));
    const redirectUrl: URL = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/login');
    expect(redirectUrl.searchParams.get('redirect')).toBe('/dashboard/settings');
  });
});
