/**
 * @jest-environment node
 */

// Mock supabase before importing
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockGte = jest.fn();
const mockIn = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    from: (...args: any[]) => {
      mockFrom(...args);
      return {
        select: (...sArgs: any[]) => {
          mockSelect(...sArgs);
          return {
            eq: (...eArgs: any[]) => {
              mockEq(...eArgs);
              return {
                single: () => mockSingle(),
                gte: (...gArgs: any[]) => {
                  mockGte(...gArgs);
                  return {
                    eq: (...e2Args: any[]) => {
                      mockEq(...e2Args);
                      return Promise.resolve({ count: 0, error: null });
                    },
                    in: (...iArgs: any[]) => {
                      mockIn(...iArgs);
                      return Promise.resolve({ count: 0, error: null });
                    },
                    then: (resolve: any) => resolve({ count: 0, error: null }),
                  };
                },
                then: (resolve: any) => resolve({ count: 0, error: null }),
              };
            },
          };
        },
      };
    },
  }),
}));

import { checkAccess, FeatureKey } from '@/lib/auth/check-access';

describe('checkAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  it('allows access for active paid subscription', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockSingle.mockResolvedValueOnce({
      data: { status: 'active', subscription_expires_at: futureDate, trial_expires_at: null },
      error: null,
    });

    const result = await checkAccess('user-1', 'mcq');
    expect(result.allowed).toBe(true);
  });

  it('allows access for active trial', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockSingle.mockResolvedValueOnce({
      data: { status: 'trial', trial_expires_at: futureDate, subscription_expires_at: null },
      error: null,
    });

    const result = await checkAccess('user-1', 'doubt');
    expect(result.allowed).toBe(true);
  });

  it('denies access when grace period expired', async () => {
    const pastDate = new Date(Date.now() - 86400000 * 10).toISOString();
    mockSingle.mockResolvedValueOnce({
      data: { status: 'grace_period', subscription_expires_at: pastDate, trial_expires_at: null },
      error: null,
    });

    const result = await checkAccess('user-1', 'mcq');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Grace period expired');
  });

  it('enforces free tier limits for known features', async () => {
    // No subscription
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAccess('user-1', 'mcq');
    // With 0 usage, should be allowed
    expect(result.allowed).toBe(true);
  });

  const features: FeatureKey[] = ['mcq', 'mains_eval', 'custom_notes', 'doubt', 'mentor', 'ai_chat', 'notes_generate', 'mind_maps'];

  it.each(features)('handles feature "%s" without crashing', async (feature) => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    const result = await checkAccess('user-1', feature);
    expect(result).toHaveProperty('allowed');
  });
});
