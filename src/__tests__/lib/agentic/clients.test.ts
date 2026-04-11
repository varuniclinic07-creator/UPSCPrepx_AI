/**
 * @jest-environment node
 */

// Mock fetch globally
global.fetch = jest.fn();

describe('agentic clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], total_results: 0 }),
    });
  });

  describe('web-search-client', () => {
    it('exports required functions', async () => {
      const mod = await import('@/lib/agentic/web-search-client');
      expect(typeof mod.searchWeb).toBe('function');
      expect(typeof mod.searchNews).toBe('function');
      expect(typeof mod.isWebSearchAvailable).toBe('function');
      expect(typeof mod.getWebSearchClient).toBe('function');
    });

    it('isWebSearchAvailable returns false when env not set', async () => {
      delete process.env.AGENTIC_WEB_SEARCH_URL;
      // Re-import to pick up env change
      jest.resetModules();
      const mod = await import('@/lib/agentic/web-search-client');
      expect(mod.isWebSearchAvailable()).toBe(false);
    });

    it('isWebSearchAvailable returns true when env set', async () => {
      process.env.AGENTIC_WEB_SEARCH_URL = 'http://localhost:8030';
      jest.resetModules();
      const mod = await import('@/lib/agentic/web-search-client');
      expect(mod.isWebSearchAvailable()).toBe(true);
    });

    it('searchWeb returns empty array on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      jest.resetModules();
      const mod = await import('@/lib/agentic/web-search-client');
      const results = await mod.searchWeb('test query');
      expect(results).toEqual([]);
    });
  });

  describe('file-search-client', () => {
    it('exports required functions', async () => {
      const mod = await import('@/lib/agentic/file-search-client');
      expect(typeof mod.searchFiles).toBe('function');
      expect(typeof mod.isFileSearchAvailable).toBe('function');
      expect(typeof mod.getFileSearchClient).toBe('function');
    });

    it('searchFiles returns empty array on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      jest.resetModules();
      const mod = await import('@/lib/agentic/file-search-client');
      const results = await mod.searchFiles('test query');
      expect(results).toEqual([]);
    });
  });

  describe('autodoc-client', () => {
    it('exports required functions', async () => {
      const mod = await import('@/lib/agentic/autodoc-client');
      expect(typeof mod.generateExplanation).toBe('function');
      expect(typeof mod.isAutodocAvailable).toBe('function');
      expect(typeof mod.getAutodocClient).toBe('function');
    });

    it('generateExplanation returns null on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      jest.resetModules();
      const mod = await import('@/lib/agentic/autodoc-client');
      const result = await mod.generateExplanation('test content');
      expect(result).toBeNull();
    });
  });
});
