// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(function(this: any) { return this; }),
        lt: jest.fn(function(this: any) { return this; }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
        })),
      })),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
}));

// Mock callAI to return quality scoring JSON
jest.mock('@/lib/ai/ai-provider-client', () => ({
  callAI: jest.fn().mockResolvedValue(JSON.stringify({
    accuracy: 0.85,
    completeness: 0.8,
    clarity: 0.9,
    examRelevance: 0.75,
    feedback: 'Good coverage of fundamental rights with accurate citations.',
  })),
  getAIProviderClient: jest.fn(() => ({})),
}));

describe('QualityAgent', () => {
  it('exports qualityAgent singleton', async () => {
    const { qualityAgent } = await import('@/lib/agents/quality-agent');
    expect(qualityAgent).toBeDefined();
    expect(typeof qualityAgent.scoreContent).toBe('function');
  });

  it('scoreContent returns a quality score', async () => {
    const { qualityAgent } = await import('@/lib/agents/quality-agent');
    const result = await qualityAgent.scoreContent({
      contentId: 'test-content-id',
      content: 'Fundamental Rights are guaranteed by Part III of the Indian Constitution.',
      contentType: 'note',
      topic: 'Fundamental Rights',
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(['approved', 'needs_revision', 'rejected']).toContain(result.verdict);
    expect(result.criteria).toHaveProperty('accuracy');
    expect(result.criteria).toHaveProperty('completeness');
    expect(result.criteria).toHaveProperty('clarity');
    expect(result.criteria).toHaveProperty('examRelevance');
  });

  it('verdict is approved for high scores', async () => {
    const { qualityAgent } = await import('@/lib/agents/quality-agent');
    const result = await qualityAgent.scoreContent({
      contentId: 'test-id',
      content: 'High quality UPSC content about Indian Polity.',
      contentType: 'note',
    });

    // Mock returns all scores > 0.7, so average should be > 0.7 → approved
    expect(result.verdict).toBe('approved');
  });
});
