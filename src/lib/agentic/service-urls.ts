export function resolveWebSearchServiceUrl(): string {
  return process.env.AGENTIC_WEB_SEARCH_URL || 'http://localhost:8030';
}

export function hasConfiguredWebSearchServiceUrl(): boolean {
  return Boolean(process.env.AGENTIC_WEB_SEARCH_URL);
}

export function resolveFileSearchServiceUrl(): string {
  return process.env.AGENTIC_FILE_SEARCH_URL || 'http://localhost:8032';
}

export function hasConfiguredFileSearchServiceUrl(): boolean {
  return Boolean(process.env.AGENTIC_FILE_SEARCH_URL);
}

export function resolveDocChatServiceUrl(): string {
  return (
    process.env.AGENTIC_AUTODOC_URL ||
    process.env.AGENTIC_DOC_CHAT_URL ||
    process.env.AUTODOC_THINKER_URL ||
    'http://localhost:8031'
  );
}

export function hasConfiguredDocChatServiceUrl(): boolean {
  return Boolean(
    process.env.AGENTIC_AUTODOC_URL ||
      process.env.AGENTIC_DOC_CHAT_URL ||
      process.env.AUTODOC_THINKER_URL
  );
}
