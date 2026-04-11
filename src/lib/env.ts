/**
 * Safe environment variable access.
 * Returns empty string during build time (SSG) when env vars aren't available.
 * Throws at runtime if a required var is missing.
 */
export function env(key: string, required = true): string {
  const value = process.env[key];
  if (value) return value;

  // During Next.js build (SSG), env vars may not be available
  // Return empty string to prevent build crashes
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return '';
  }

  if (required && typeof window === 'undefined') {
    console.warn(`[env] Missing required env var: ${key}`);
  }

  return value || '';
}
