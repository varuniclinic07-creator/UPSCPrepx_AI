// Mock Supabase before importing
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(function(this: any) { return this; }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        single: jest.fn().mockResolvedValue({ data: { id: 'test-node-id' }, error: null }),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { id: 'test-node-id' }, error: null }),
        })),
      })),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
}));

import { NormalizerAgent, normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

describe('NormalizerAgent', () => {
  const agent = new NormalizerAgent();

  it('resolves well-known topics via fuzzy match', async () => {
    const result = await agent.normalize('fundamental rights');
    expect(result.subject).toBe('GS2');
    expect(result.topic).toBe('Indian Polity');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(['exact', 'fuzzy']).toContain(result.method);
  });

  it('resolves economy topics', async () => {
    const result = await agent.normalize('inflation and monetary policy');
    expect(result.subject).toBe('GS3');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('handles empty input gracefully', async () => {
    const result = await agent.normalize('');
    expect(result.subject).toBe('General');
    expect(result.confidence).toBe(0);
    expect(result.method).toBe('none');
  });

  it('returns a nodeId field', async () => {
    const result = await agent.normalize('preamble of constitution');
    expect(result).toHaveProperty('nodeId');
  });

  it('uses MD5 hash for cache key', async () => {
    const result = await agent.normalize('Article 21 Right to Life');
    expect(result).toHaveProperty('cacheKey');
    expect(result.cacheKey).toMatch(/^[a-f0-9]{32}$/);
  });

  it('normalizeUPSCInput convenience function works', async () => {
    const result = await normalizeUPSCInput('climate change global warming');
    expect(result.subject).toBe('GS3');
    expect(result.topic).toBe('Environment');
  });

  it('resolves ethics topics', async () => {
    const result = await agent.normalize('ethical dilemma case study');
    expect(result.subject).toBe('GS4');
  });

  it('resolves history topics', async () => {
    const result = await agent.normalize('mughal empire');
    expect(result.subject).toBe('GS1');
    expect(result.topic).toBe('History');
  });
});
