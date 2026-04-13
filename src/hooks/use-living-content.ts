'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

type LivingContentType =
  | 'notes'
  | 'quiz'
  | 'mind_map'
  | 'answer_framework'
  | 'doubt_answer'
  | 'evaluation'
  | 'video_script'
  | 'animation';

interface LivingContentOptions {
  topic: string;
  contentType: LivingContentType;
  subject?: string;
  brevityLevel?: string;
  forceRefresh?: boolean;
  userInput?: string;
  questionCount?: number;
}

interface LivingContentState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  generatedNow: boolean;
  nodeId: string | null;
  freshness: number;
}

/**
 * Hook for fetching living content from any dashboard page.
 *
 * Usage:
 *   const { data, loading, error, fetch: fetchContent } = useLivingContent<NotesResult>();
 *   // Then call:
 *   fetchContent({ topic: 'Fundamental Rights', contentType: 'notes' });
 *
 * The hook handles:
 * - Checking KG for existing content (instant if cached)
 * - Generating fresh content via Hermes agents if missing/stale
 * - Showing loading skeletons while generating
 * - Error toasts on failure
 */
export function useLivingContent<T = any>() {
  const [state, setState] = useState<LivingContentState<T>>({
    data: null,
    loading: false,
    error: null,
    generatedNow: false,
    nodeId: null,
    freshness: 0,
  });

  const fetchContent = useCallback(async (options: LivingContentOptions) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/content/living', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch content');
      }

      setState({
        data: result.content as T,
        loading: false,
        error: null,
        generatedNow: result.generatedNow,
        nodeId: result.nodeId || null,
        freshness: result.freshness || 0,
      });

      if (result.generatedNow) {
        toast.success('Fresh content generated');
      }

      return result.content as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Content fetch failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
        generatedNow: false,
      }));
      toast.error(message);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      generatedNow: false,
      nodeId: null,
      freshness: 0,
    });
  }, []);

  return {
    ...state,
    fetch: fetchContent,
    reset,
  };
}
