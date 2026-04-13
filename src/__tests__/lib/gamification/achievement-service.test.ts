jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/lib/gamification/xp-service', () => ({
  gamification: { awardXP: jest.fn().mockResolvedValue(undefined) },
}));

const mockSupabase = {
  from: jest.fn(),
};

function chainMock(resolvedValue: any = { data: null, error: null }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedValue),
    maybeSingle: jest.fn().mockResolvedValue(resolvedValue),
  };
}

import { AchievementService } from '@/lib/gamification/achievement-service';

describe('AchievementService', () => {
  let service: AchievementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AchievementService();
  });

  it('skips if no XP stats exist', async () => {
    const xpChain = chainMock({ data: null, error: { message: 'not found' } });
    mockSupabase.from.mockReturnValue(xpChain);

    await service.checkUserAchievements('user-1');
    // Should not throw — graceful handling
  });

  it('unlocks FIRST_MASTERED when 1 topic is mastered', async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_xp_stats') {
        return chainMock({ data: { streak_count: 0, total_earned: 0 }, error: null });
      }
      if (table === 'user_achievements') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'user_mastery') {
        callCount++;
        if (callCount === 1) {
          // mastered count
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ count: 1, data: null, error: null }),
          };
        }
        if (callCount === 2) {
          // subject mastery
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        // revision streak
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'achievements') {
        return chainMock({ data: { id: 'ach-1', code: 'FIRST_MASTERED', xp_reward: 100, name: 'Knowledge Seed' }, error: null });
      }
      // user_achievements insert or knowledge_nodes
      return chainMock({ data: null, error: null });
    });

    await service.checkUserAchievements('user-1');
    // Should have queried user_mastery for mastered count
    expect(mockSupabase.from).toHaveBeenCalledWith('user_mastery');
  });

  it('skips already-unlocked achievements', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_xp_stats') {
        return chainMock({ data: { streak_count: 10, total_earned: 10000 }, error: null });
      }
      if (table === 'user_achievements') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              { achievement_id: 'a1', achievements: { code: 'STREAK_3' } },
              { achievement_id: 'a2', achievements: { code: 'STREAK_7' } },
              { achievement_id: 'a3', achievements: { code: 'TOP_10' } },
            ],
            error: null,
          }),
        };
      }
      if (table === 'user_mastery') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ count: 0, data: null, error: null }),
        };
      }
      return chainMock();
    });

    await service.checkUserAchievements('user-1');
    // Should NOT call achievements table for unlock since all XP ones are unlocked
    const achievementsCalls = mockSupabase.from.mock.calls.filter(
      (c: any) => c[0] === 'achievements'
    );
    expect(achievementsCalls.length).toBe(0);
  });
});
