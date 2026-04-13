/**
 * Tests for the expanded 4-provider chain:
 * Ollama (1) → Groq (2) → NVIDIA NIM (3) → Gemini (4)
 */

// Reset singleton between tests
beforeEach(() => {
  jest.resetModules();
});

describe('AIProviderClient provider chain', () => {
  it('includes nvidia as priority 3', () => {
    process.env.NVIDIA_API_KEY = 'nvapi-test';
    process.env.GEMINI_API_KEY_1 = 'gem-test';
    const { AIProviderClient } = require('@/lib/ai/ai-provider-client');
    const client = new AIProviderClient();
    const providers = client.getProviderNames();
    expect(providers).toContain('nvidia');
    const nvidiaIndex = providers.indexOf('nvidia');
    const groqIndex = providers.indexOf('groq');
    expect(nvidiaIndex).toBeGreaterThan(groqIndex);
  });

  it('includes gemini as priority 4 (last)', () => {
    process.env.NVIDIA_API_KEY = 'nvapi-test';
    process.env.GEMINI_API_KEY_1 = 'gem-test';
    const { AIProviderClient } = require('@/lib/ai/ai-provider-client');
    const client = new AIProviderClient();
    const providers = client.getProviderNames();
    expect(providers).toContain('gemini');
    expect(providers[providers.length - 1]).toBe('gemini');
  });

  it('gemini uses key rotation across 4 keys', () => {
    process.env.GEMINI_API_KEY_1 = 'key1';
    process.env.GEMINI_API_KEY_2 = 'key2';
    process.env.GEMINI_API_KEY_3 = 'key3';
    process.env.GEMINI_API_KEY_4 = 'key4';
    const { AIProviderClient } = require('@/lib/ai/ai-provider-client');
    const client = new AIProviderClient();
    const geminiKey = client.getProviderKey('gemini');
    expect(['key1', 'key2', 'key3', 'key4']).toContain(geminiKey);
  });

  it('nvidia uses NVIDIA_API_KEY env var', () => {
    process.env.NVIDIA_API_KEY = 'nvapi-test';
    const { AIProviderClient } = require('@/lib/ai/ai-provider-client');
    const client = new AIProviderClient();
    const nvidiaKey = client.getProviderKey('nvidia');
    expect(nvidiaKey).toBe('nvapi-test');
  });

  it('maintains correct priority order: ollama → groq → nvidia → gemini', () => {
    process.env.NVIDIA_API_KEY = 'nvapi-test';
    process.env.GEMINI_API_KEY_1 = 'gem-test';
    const { AIProviderClient } = require('@/lib/ai/ai-provider-client');
    const client = new AIProviderClient();
    const providers = client.getProviderNames();
    expect(providers[0]).toBe('ollama');
    expect(providers[1]).toBe('groq');
    expect(providers[2]).toBe('nvidia');
    expect(providers[3]).toBe('gemini');
  });
});
