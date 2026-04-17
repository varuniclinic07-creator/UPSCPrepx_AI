/**
 * @jest-environment node
 */

const mockSearch = jest.fn();
const mockAnalyze = jest.fn();
const mockFileSearch = jest.fn();
const mockGenerateNotes = jest.fn();
const mockAnalyzeIntent = jest.fn();

jest.mock('@/lib/agentic/web-search-client', () => ({
  WebSearchClient: jest.fn().mockImplementation(() => ({
    search: mockSearch,
  })),
}));

jest.mock('@/lib/agentic/autodoc-client', () => ({
  AutodocClient: jest.fn().mockImplementation(() => ({
    analyze: mockAnalyze,
  })),
}));

jest.mock('@/lib/agentic/file-search-client', () => ({
  FileSearchClient: jest.fn().mockImplementation(() => ({
    search: mockFileSearch,
  })),
}));

jest.mock('@/lib/ai/ai-provider-client', () => ({
  AIProviderClient: jest.fn().mockImplementation(() => ({
    analyzeIntent: mockAnalyzeIntent,
    generateNotes: mockGenerateNotes,
  })),
}));

describe('AgenticOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAnalyzeIntent.mockResolvedValue({
      needsCurrentAffairs: true,
      needsStaticMaterials: false,
      needsDocumentAnalysis: false,
      topic: 'Fundamental Rights',
      subject: 'GS2',
    });

    mockSearch.mockResolvedValue({
      results: [
        {
          title: 'Random blog',
          url: 'https://random-example.com/fundamental-rights',
          snippet: 'Unsourced summary',
          relevanceScore: 0.8,
        },
      ],
    });

    mockAnalyze.mockResolvedValue({ results: [] });
    mockFileSearch.mockResolvedValue({ results: [] });
    mockGenerateNotes.mockResolvedValue({
      content: '# Fundamental Rights',
      providerUsed: 'groq',
      confidence: 0.9,
    });
  });

  it('fails instead of generating notes when no whitelisted or library sources are available', async () => {
    const { AgenticOrchestrator } = await import('@/lib/agentic/agentic-orchestrator');
    const orchestrator = new AgenticOrchestrator();

    await expect(
      orchestrator.processQuery({
        query: 'Fundamental Rights',
        topic: 'Fundamental Rights',
        subject: 'GS2',
        brevityLevel: '1000',
        includeCurrentAffairs: true,
        includeStaticMaterials: false,
        includeDocuments: false,
      })
    ).rejects.toThrow(/grounded|whitelisted|sources/i);

    expect(mockGenerateNotes).not.toHaveBeenCalled();
  });
});
