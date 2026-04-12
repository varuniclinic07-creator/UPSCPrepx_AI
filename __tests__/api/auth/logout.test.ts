/**
 * Tests for POST /api/auth/logout
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/logout/route';

// Mock Supabase server client
const mockSignOut = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    auth: { signOut: () => mockSignOut() },
  }),
}));

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success after signing out', async () => {
    mockSignOut.mockResolvedValue({});

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('should return success even if signOut throws', async () => {
    mockSignOut.mockRejectedValue(new Error('Session expired'));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
