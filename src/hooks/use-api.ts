'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
  showErrorToast?: boolean;
}

/**
 * Generic fetch hook for GET requests
 */
export function useFetch<T>(
  url: string | null,
  options: UseFetchOptions = {}
): FetchState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: !!url,
    error: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { onSuccess, onError, showErrorToast = true } = options;

  const fetchData = useCallback(async () => {
    if (!url) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setState({ data, loading: false, error: null });
      onSuccess?.(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore abort errors
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMessage });
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      onError?.(errorMessage);
    }
  }, [url, onSuccess, onError, showErrorToast]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
}

/**
 * Generic mutation hook for POST/PATCH/DELETE requests
 */
export function useMutation<TData = unknown, TInput = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
  options: UseMutationOptions<TData> = {}
): MutationState<TData> & { mutate: (input?: TInput) => Promise<TData | null> } {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    loading: false,
    error: null,
  });

  const { 
    onSuccess, 
    onError, 
    showSuccessToast = false,
    successMessage = 'Success!',
    showErrorToast = true 
  } = options;

  const mutate = useCallback(async (input?: TInput): Promise<TData | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: input ? JSON.stringify(input) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setState({ data, loading: false, error: null });
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      onSuccess?.(data);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMessage });
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      onError?.(errorMessage);
      
      return null;
    }
  }, [url, method, onSuccess, onError, showSuccessToast, successMessage, showErrorToast]);

  return { ...state, mutate };
}

/**
 * Hook for lazy loading data (fetch on demand)
 */
export function useLazyFetch<T>(
  url: string,
  options: UseFetchOptions = {}
): FetchState<T> & { fetch: () => Promise<T | null> } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { onSuccess, onError, showErrorToast = true } = options;

  const fetchData = useCallback(async (): Promise<T | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setState({ data, loading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMessage });
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      onError?.(errorMessage);
      return null;
    }
  }, [url, onSuccess, onError, showErrorToast]);

  return { ...state, fetch: fetchData };
}
