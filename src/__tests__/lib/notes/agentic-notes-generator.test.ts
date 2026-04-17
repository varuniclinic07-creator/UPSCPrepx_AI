/**
 * @jest-environment node
 */

const mockProcessQuery = jest.fn();

jest.mock('@/lib/agentic/agentic-orchestrator', () => ({
  getAgenticOrchestrator: jest.fn(() => ({
    processQuery: mockProcessQuery,
  })),
}));

jest.mock('@/lib/ai/ai-provider-client', () => ({
  getAIProviderClient: jest.fn(() => ({})),
}));

describe('AgenticNotesGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not inject placeholder note sections into grounded content', async () => {
    mockProcessQuery.mockResolvedValue({
      content: [
        '# Fundamental Rights',
        '',
        '## Key Concepts',
        '- Fundamental Rights protect liberty and equality.',
        '',
        '## Detailed Explanation',
        'They are given in Part III of the Constitution.',
      ].join('\n'),
      sources: [
        {
          system: 'web-search',
          sourceName: 'PIB explainer',
          sourceUrl: 'https://pib.gov.in/example',
          sourceType: 'government',
          relevanceScore: 0.95,
        },
      ],
      agenticSystemsUsed: ['web-search'],
      aiProviderUsed: 'groq',
      wordCount: 20,
      confidence: 0.92,
      processingTimeMs: 100,
    });

    const { getAgenticNotesGenerator } = await import('@/lib/notes/agentic-notes-generator');
    const generator = getAgenticNotesGenerator();

    const note = await generator.generateNotes({
      topic: 'Fundamental Rights',
      subject: 'GS2',
      brevityLevel: '1000',
    });

    expect(note.content).not.toContain('Example 1');
    expect(note.content).not.toContain('Create an acronym');
    expect(note.content).not.toContain('Related Topic 1');
    expect(note.content).toContain('Fundamental Rights');
    expect(note.content).toContain('Part III of the Constitution');
  });
});
