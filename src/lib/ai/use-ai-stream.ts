/**
 * useAIStream Hook
 * React hook for consuming SSE streaming AI responses with live rendering
 */

import { useState, useRef, useCallback } from 'react';

export interface UseAIStreamOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  onError?: (error: Error) => void;
  onComplete?: (content: string, metadata: StreamMetadata) => void;
  onChunk?: (content: string) => void;
}

export interface StreamMetadata {
  provider: string;
  tokens?: number;
  latency?: number;
}

export interface UseAIStreamReturn {
  /** Current accumulated content */
  content: string;
  /** Whether streaming is in progress */
  isLoading: boolean;
  /** Error if any occurred */
  error: Error | null;
  /** Stream metadata (provider, tokens, etc.) */
  metadata: StreamMetadata | null;
  /** Whether stream is complete */
  isDone: boolean;
  /** Start streaming with messages */
  startStream: (messages: Array<{ role: string; content: string }>) => void;
  /** Abort the current stream */
  abortStream: () => void;
  /** Reset state */
  reset: () => void;
}

export function useAIStream(options: UseAIStreamOptions = {}): UseAIStreamReturn {
  const {
    model = 'default',
    temperature,
    maxTokens,
    systemPrompt,
    onError,
    onComplete,
    onChunk,
  } = options;

  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null);
  const [isDone, setIsDone] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef('');

  const startStream = useCallback(
    (messages: Array<{ role: string; content: string }>) => {
      // Reset state
      setContent('');
      setError(null);
      setMetadata(null);
      setIsDone(false);
      contentRef.current = '';

      // Create abort controller
      controllerRef.current = new AbortController();

      // Prepare request body
      const body: Record<string, unknown> = {
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        model,
      };

      if (temperature !== undefined) body.temperature = temperature;
      if (maxTokens !== undefined) body.max_tokens = maxTokens;

      setIsLoading(true);
      const startTime = Date.now();

      // Connect to SSE stream
      const connectStream = async () => {
        try {
          const response = await fetch('/api/ai/chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controllerRef.current?.signal,
          });

          if (!response.ok) {
            // Handle error response
            const errorText = await response.text();
            let errorMessage = 'Failed to start stream';

            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch {
              // Response might be SSE error format
              const lines = errorText.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.error) {
                      errorMessage = data.error;
                      break;
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }

            throw new Error(errorMessage);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Response body is not readable');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              // Check for [DONE] marker
              if (trimmedLine === 'data: [DONE]') {
                setIsDone(true);
                setIsLoading(false);
                return;
              }

              // Parse SSE data
              if (trimmedLine.startsWith('data: ')) {
                const dataStr = trimmedLine.slice(6);
                try {
                  const data = JSON.parse(dataStr);

                  // Handle error events
                  if (data.error) {
                    const error = new Error(data.error);
                    setError(error);
                    onError?.(error);
                    setIsLoading(false);
                    setIsDone(true);
                    return;
                  }

                  // Handle metadata events
                  if (data.type === 'metadata') {
                    setMetadata({
                      provider: data.provider,
                      tokens: data.tokens,
                      latency: Date.now() - startTime,
                    });
                  }

                  // Handle done events
                  if (data.type === 'done') {
                    setMetadata((prev) => ({
                      ...(prev || { provider: 'unknown' }),
                      provider: data.provider || prev?.provider || 'unknown',
                    }));
                    setIsDone(true);
                    setIsLoading(false);
                    onComplete?.(contentRef.current, {
                      provider: data.provider,
                    });
                    return;
                  }

                  // Handle content chunks
                  if (data.content) {
                    contentRef.current += data.content;
                    setContent(contentRef.current);
                    onChunk?.(data.content);
                  }
                } catch (e) {
                  console.warn('Failed to parse SSE chunk:', e);
                }
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          if ((err as Error).name === 'AbortError') {
            // Stream was aborted - don't treat as error
            setIsLoading(false);
            return;
          }
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          onError?.(error);
          setIsLoading(false);
          setIsDone(true);
        }
      };

      connectStream();
    },
    [model, temperature, maxTokens, systemPrompt, onError, onComplete, onChunk]
  );

  const abortStream = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setContent('');
    setError(null);
    setMetadata(null);
    setIsLoading(false);
    setIsDone(false);
    contentRef.current = '';
  }, []);

  return {
    content,
    isLoading,
    error,
    metadata,
    isDone,
    startStream,
    abortStream,
    reset,
  };
}
