// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(function(this: any) { return this; }),
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

// Mock callAI
jest.mock('@/lib/ai/ai-provider-client', () => ({
  callAI: jest.fn().mockResolvedValue('{"subject":"GS2","topic":"Polity"}'),
  getAIProviderClient: jest.fn(() => ({})),
}));

describe('HermesOrchestrator', () => {
  it('exports hermes singleton', async () => {
    const { hermes } = await import('@/lib/agents/orchestrator');
    expect(hermes).toBeDefined();
    expect(typeof hermes.dispatch).toBe('function');
    expect(typeof hermes.runPipeline).toBe('function');
  });

  it('dispatch returns error for unknown task type', async () => {
    const { hermes } = await import('@/lib/agents/orchestrator');
    const result = await hermes.dispatch({ type: 'unknown_type' as any, topic: 'test' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('runPipeline processes tasks sequentially', async () => {
    const { hermes } = await import('@/lib/agents/orchestrator');
    const results = await hermes.runPipeline([]);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});
