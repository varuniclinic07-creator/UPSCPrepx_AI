/** @jest-environment node */

import { GET } from '@/app/api/lectures/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireSession: jest.fn().mockResolvedValue({ user: { id: 'u1' } }),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn(() => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...a: unknown[]) => {
            mockEq(...a);
            return {
              order: (...o: unknown[]) => {
                mockOrder(...o);
                return Promise.resolve({
                  data: [{ id: 'l1', topic: 'Polity', status: 'completed' }],
                  error: null,
                });
              },
            };
          },
        };
      },
    })),
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/lectures', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns lectures for authenticated user', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.lectures).toHaveLength(1);
    expect(json.lectures[0].topic).toBe('Polity');
  });

  it('returns 401 when session is missing', async () => {
    const { requireSession } = require('@/lib/auth/auth-config');
    requireSession.mockRejectedValueOnce(new Error('Unauthorized'));

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 500 when database query fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: null, error: new Error('db fail') }),
          })),
        })),
      })),
    });

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
