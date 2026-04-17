/**
 * @jest-environment node
 */

describe('agentic service url resolution', () => {
  beforeEach(() => {
    delete process.env.AGENTIC_WEB_SEARCH_URL;
    delete process.env.AGENTIC_FILE_SEARCH_URL;
    delete process.env.AGENTIC_AUTODOC_URL;
    delete process.env.AGENTIC_DOC_CHAT_URL;
    delete process.env.AUTODOC_THINKER_URL;
    jest.resetModules();
  });

  it('resolves doc chat url from legacy and current env names', async () => {
    process.env.AGENTIC_DOC_CHAT_URL = 'http://doc-chat:8031';
    const mod = await import('@/lib/agentic/service-urls');
    expect(mod.resolveDocChatServiceUrl()).toBe('http://doc-chat:8031');
  });

  it('prefers AGENTIC_AUTODOC_URL when multiple doc chat envs are set', async () => {
    process.env.AGENTIC_DOC_CHAT_URL = 'http://doc-chat:8031';
    process.env.AGENTIC_AUTODOC_URL = 'http://autodoc:8031';
    const mod = await import('@/lib/agentic/service-urls');
    expect(mod.resolveDocChatServiceUrl()).toBe('http://autodoc:8031');
  });

  it('resolves defaults for web and file search services', async () => {
    const mod = await import('@/lib/agentic/service-urls');
    expect(mod.resolveWebSearchServiceUrl()).toBe('http://localhost:8030');
    expect(mod.resolveFileSearchServiceUrl()).toBe('http://localhost:8032');
    expect(mod.hasConfiguredWebSearchServiceUrl()).toBe(false);
    expect(mod.hasConfiguredFileSearchServiceUrl()).toBe(false);
    expect(mod.hasConfiguredDocChatServiceUrl()).toBe(false);
  });

  it('reports explicit configuration separately from localhost fallbacks', async () => {
    process.env.AGENTIC_WEB_SEARCH_URL = 'http://web-search:8030';
    process.env.AGENTIC_FILE_SEARCH_URL = 'http://file-search:8032';
    process.env.AUTODOC_THINKER_URL = 'http://autodoc:8031';
    const mod = await import('@/lib/agentic/service-urls');
    expect(mod.hasConfiguredWebSearchServiceUrl()).toBe(true);
    expect(mod.hasConfiguredFileSearchServiceUrl()).toBe(true);
    expect(mod.hasConfiguredDocChatServiceUrl()).toBe(true);
  });
});
