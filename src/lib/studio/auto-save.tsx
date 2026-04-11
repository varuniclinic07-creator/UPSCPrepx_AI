/**
 * Auto-Save Hook - User Content Studio (Feature F4)
 * 
 * Automatic saving with debouncing and conflict resolution
 * Master Prompt v8.0 - READ Mode
 * TipTap Rich Text Editor
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Client-side auto-save via API (avoids importing server-only code)
async function autoSaveNote(noteId: string, userId: string, content: any): Promise<boolean> {
  try {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'auto_save', content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface AutoSaveConfig {
  delayMs?: number; // Default: 30000 (30 seconds)
  maxVersions?: number; // Default: 10
  enabled?: boolean; // Default: true
  onSaving?: () => void;
  onSaved?: (timestamp: Date) => void;
  onError?: (error: Error) => void;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  lastSavedContent: any | null;
  hasUnsavedChanges: boolean;
  error: Error | null;
  saveCount: number;
}

export interface UseAutoSaveReturn extends AutoSaveState {
  setContent: (content: any) => void;
  forceSave: () => Promise<boolean>;
  reset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<AutoSaveConfig> = {
  delayMs: 30000, // 30 seconds
  maxVersions: 10,
  enabled: true,
  onSaving: () => {},
  onSaved: () => {},
  onError: () => {},
};

const STORAGE_KEY_PREFIX = 'autosave_';

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

/**
 * Save content to localStorage as backup
 */
function saveToLocalStorage(noteId: string, content: any): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${noteId}`;
    const data = {
      content,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Load content from localStorage
 */
function loadFromLocalStorage(noteId: string): any | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${noteId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;

    const parsed = JSON.parse(data);
    return parsed.content || null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear localStorage backup
 */
function clearLocalStorage(noteId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${noteId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

// ============================================================================
// AUTO-SAVE HOOK
// ============================================================================

/**
 * Auto-save hook for TipTap editor content
 * 
 * Features:
 * - Debounced saving (30 second intervals)
 * - LocalStorage backup
 * - Conflict resolution
 * - Save status indicators
 * - Manual save trigger
 * 
 * @param noteId - The note ID to save
 * @param userId - The user ID
 * @param config - Auto-save configuration
 * @returns Auto-save state and controls
 */
export function useAutoSave(
  noteId: string,
  userId: string,
  config: AutoSaveConfig = {}
): UseAutoSaveReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // State
  const [content, setContent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [saveCount, setSaveCount] = useState(0);

  // Refs
  const contentRef = useRef(content);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const pendingSaveRef = useRef(false);

  // Update content ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Load from localStorage on mount
  useEffect(() => {
    if (noteId && mergedConfig.enabled) {
      const savedContent = loadFromLocalStorage(noteId);
      if (savedContent) {
        setContent(savedContent);
        setHasUnsavedChanges(true);
      }
    }

    isInitialMount.current = false;
  }, [noteId, mergedConfig.enabled]);

  // Auto-save effect
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      return;
    }

    // Skip if auto-save is disabled
    if (!mergedConfig.enabled) {
      return;
    }

    // Skip if no content
    if (!content) {
      return;
    }

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer
    saveTimerRef.current = setTimeout(() => {
      performSave();
    }, mergedConfig.delayMs);

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Cleanup
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [content]);

  // Perform save operation
  const performSave = useCallback(async () => {
    if (!noteId || !userId || !contentRef.current) {
      return false;
    }

    // Prevent concurrent saves
    if (isSaving || pendingSaveRef.current) {
      pendingSaveRef.current = true;
      return false;
    }

    try {
      setIsSaving(true);
      pendingSaveRef.current = false;
      setError(null);

      mergedConfig.onSaving();

      // Save to server
      const success = await autoSaveNote(noteId, userId, contentRef.current);

      if (!success) {
        throw new Error('Failed to save to server');
      }

      // Update state
      const now = new Date();
      setLastSavedAt(now);
      setLastSavedContent(contentRef.current);
      setHasUnsavedChanges(false);
      setSaveCount((prev) => prev + 1);

      // Clear localStorage backup on successful save
      clearLocalStorage(noteId);

      mergedConfig.onSaved(now);

      return true;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errObj);
      mergedConfig.onError(errObj);

      // Save to localStorage as fallback
      saveToLocalStorage(noteId, contentRef.current);

      return false;
    } finally {
      setIsSaving(false);
    }
  }, [noteId, userId, mergedConfig]);

  // Force save immediately
  const forceSave = useCallback(async (): Promise<boolean> => {
    if (!contentRef.current) {
      return false;
    }

    // Clear pending timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    return performSave();
  }, [performSave]);

  // Reset auto-save state
  const reset = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setContent(null);
    setLastSavedAt(null);
    setLastSavedContent(null);
    setHasUnsavedChanges(false);
    setError(null);
    setSaveCount(0);
    pendingSaveRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return {
    isSaving,
    lastSavedAt,
    lastSavedContent,
    hasUnsavedChanges,
    error,
    saveCount,
    setContent,
    forceSave,
    reset,
  };
}

// ============================================================================
// AUTO-SAVE INDICATOR COMPONENT
// ============================================================================

/**
 * Props for AutoSaveIndicator component
 */
export interface AutoSaveIndicatorProps {
  state: AutoSaveState;
  showHindi?: boolean;
}

/**
 * Auto-save status indicator component
 * 
 * Displays:
 * - Saving animation
 * - Last saved timestamp
 * - Unsaved changes warning
 * - Error state
 */
export function AutoSaveIndicator({
  state,
  showHindi = false,
}: AutoSaveIndicatorProps): JSX.Element {
  const { isSaving, lastSavedAt, hasUnsavedChanges, error } = state;

  // Format time ago
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) {
      return showHindi ? 'कभी नहीं' : 'Never';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) {
      return showHindi ? 'अभी' : 'Just now';
    } else if (diffMins < 60) {
      return showHindi ? `${diffMins} मिनट पहले` : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return showHindi ? `${diffHours} घंटे पहले` : `${diffHours}h ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  // Saving state
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        <span>{showHindi ? 'सहेजा जा रहा है...' : 'Saving...'}</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <span className="text-lg">⚠️</span>
        <span>{showHindi ? 'सहेजने में विफल' : 'Save failed'}</span>
      </div>
    );
  }

  // Unsaved changes
  if (hasUnsavedChanges && lastSavedAt) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <span className="text-lg">●</span>
        <span>
          {showHindi ? 'परिवर्तन सहेजे नहीं गए' : 'Unsaved changes'} •{' '}
          {showHindi ? 'अंतिम बार सहेजा गया' : 'Last saved'}{' '}
          {formatTimeAgo(lastSavedAt)}
        </span>
      </div>
    );
  }

  // Saved state
  if (lastSavedAt) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <span className="text-lg">✓</span>
        <span>
          {showHindi ? 'सहेजा गया' : 'Saved'} {formatTimeAgo(lastSavedAt)}
        </span>
      </div>
    );
  }

  // Initial state
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span>{showHindi ? 'सहेजने के लिए टाइप करें' : 'Type to save'}</span>
    </div>
  );
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Keyboard shortcut handler for manual save
 * 
 * Shortcuts:
 * - Ctrl/Cmd + S: Force save
 * - Ctrl/Cmd + Shift + S: Save as (export)
 */
export function useSaveShortcuts(
  forceSave: () => Promise<void>,
  options?: {
    enabled?: boolean;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
): void {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();

        try {
          await forceSave();
          options?.onSuccess?.();
        } catch (err) {
          options?.onError?.(err instanceof Error ? err : new Error('Save failed'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [forceSave, enabled, options]);
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Conflict resolution strategies
 */
export enum ConflictStrategy {
  KEEP_LOCAL = 'keep_local', // Keep local changes
  KEEP_REMOTE = 'keep_remote', // Keep server version
  KEEP_NEWER = 'keep_newer', // Keep the newer version
  MERGE = 'merge', // Attempt to merge (advanced)
}

/**
 * Check for conflicts between local and server content
 */
export async function checkForConflict(
  noteId: string,
  userId: string,
  localContent: any,
  localLastModified: Date
): Promise<{
  hasConflict: boolean;
  serverContent: any | null;
  serverLastModified: Date | null;
}> {
  try {
    // In production, fetch server version
    // For now, return no conflict
    return {
      hasConflict: false,
      serverContent: null,
      serverLastModified: null,
    };
  } catch (error) {
    console.error('Error checking for conflict:', error);
    return {
      hasConflict: false,
      serverContent: null,
      serverLastModified: null,
    };
  }
}

/**
 * Resolve conflict based on strategy
 */
export function resolveConflict(
  strategy: ConflictStrategy,
  localContent: any,
  serverContent: any,
  localModified: Date,
  serverModified: Date
): any {
  switch (strategy) {
    case ConflictStrategy.KEEP_LOCAL:
      return localContent;
    case ConflictStrategy.KEEP_REMOTE:
      return serverContent;
    case ConflictStrategy.KEEP_NEWER:
      return localModified > serverModified ? localContent : serverContent;
    case ConflictStrategy.MERGE:
      // Advanced merge logic would go here
      // For now, prefer local
      return localContent;
    default:
      return localContent;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get auto-save status text
 */
export function getAutoSaveStatusText(
  state: AutoSaveState,
  showHindi: boolean = false
): string {
  const { isSaving, lastSavedAt, hasUnsavedChanges, error } = state;

  if (isSaving) {
    return showHindi ? 'सहेजा जा रहा है...' : 'Saving...';
  }

  if (error) {
    return showHindi ? 'सहेजने में त्रुटि' : 'Save error';
  }

  if (hasUnsavedChanges && lastSavedAt) {
    return showHindi ? 'परिवर्तन सहेजे नहीं गए' : 'Unsaved changes';
  }

  if (lastSavedAt) {
    return showHindi ? 'सहेजा गया' : 'Saved';
  }

  return showHindi ? 'सहेजने के लिए टाइप करें' : 'Type to save';
}

/**
 * Calculate time until next auto-save
 */
export function getTimeUntilNextSave(
  lastSavedAt: Date | null,
  delayMs: number = 30000
): number {
  if (!lastSavedAt) return 0;

  const now = new Date().getTime();
  const lastSave = lastSavedAt.getTime();
  const elapsed = now - lastSave;
  const remaining = delayMs - elapsed;

  return Math.max(0, remaining);
}
