import { GeminiAdapter } from '@/lib/ai/gemini-adapter';

// Mock the Google SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Fundamental Rights are rights guaranteed by Part III of the Constitution.',
          },
        }),
      }),
    }),
  })),
}));

describe('GeminiAdapter', () => {
  const adapter = new GeminiAdapter({ apiKey: 'test-key', model: 'gemini-1.5-flash' });

  it('converts OpenAI-format messages and returns OpenAI-format response', async () => {
    const result = await adapter.chat([
      { role: 'system', content: 'You are a UPSC tutor.' },
      { role: 'user', content: 'What are Fundamental Rights?' },
    ]);

    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].message.role).toBe('assistant');
    expect(result.choices[0].message.content).toContain('Fundamental Rights');
    expect(result.choices[0].finish_reason).toBe('stop');
  });

  it('handles conversation history correctly', async () => {
    const result = await adapter.chat([
      { role: 'user', content: 'What is Polity?' },
      { role: 'assistant', content: 'Polity covers the Indian Constitution.' },
      { role: 'user', content: 'Tell me about Article 21.' },
    ]);

    expect(result.choices[0].message.content).toBeDefined();
  });

  it('works without system message', async () => {
    const result = await adapter.chat([
      { role: 'user', content: 'What is federalism?' },
    ]);

    expect(result.choices[0].message.content).toBeDefined();
  });

  it('returns model name in response', async () => {
    const result = await adapter.chat([{ role: 'user', content: 'Test' }]);
    expect(result.model).toBe('gemini-1.5-flash');
  });
});
