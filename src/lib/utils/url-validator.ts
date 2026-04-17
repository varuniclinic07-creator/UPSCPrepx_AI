/**
 * Production-safe URL validation utilities
 * Ensures OAuth redirects and other URLs use the correct production domain
 */

/**
 * Check if a URL is a valid production URL (not a placeholder)
 */
function isValidProductionUrl(url: string | undefined): boolean {
  if (!url) return false;

  const placeholderPatterns = [
    'your-production-domain',
    'yourdomain',
    'example.com',
    'placeholder',
  ];

  const lowerUrl = url.toLowerCase();
  for (const pattern of placeholderPatterns) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }

  // In production, must start with https:// and NOT be localhost
  if (process.env.NODE_ENV === 'production') {
    if (!url.startsWith('https://')) return false;
    if (lowerUrl.includes('localhost')) return false;
  }

  return true;
}

/**
 * Normalize a URL so it's reachable by the browser.
 * `0.0.0.0` is a valid bind address for servers but NOT a routable client
 * address — browsers return ERR_ADDRESS_INVALID. Rewrite to `localhost`.
 */
function normalizeBrowserUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === '0.0.0.0' || u.hostname === '::' || u.hostname === '[::]') {
      u.hostname = 'localhost';
      return u.toString().replace(/\/$/, '');
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Get the canonical app URL
 * Priority: NEXT_PUBLIC_APP_URL > NEXTAUTH_URL > window.location.origin
 * With validation to reject placeholder URLs
 */
export function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  // Coolify injects these automatically into containers
  const coolifyUrl = process.env.COOLIFY_URL;

  // Server-side: use environment variables (with validation)
  if (typeof window === 'undefined') {
    if (isValidProductionUrl(envUrl)) {
      return normalizeBrowserUrl(envUrl!);
    }
    if (isValidProductionUrl(nextAuthUrl)) {
      return normalizeBrowserUrl(nextAuthUrl!);
    }
    if (isValidProductionUrl(coolifyUrl)) {
      return normalizeBrowserUrl(coolifyUrl!);
    }
    return 'http://localhost:3000';
  }

  // Client-side: prefer valid env var
  if (isValidProductionUrl(envUrl)) {
    return normalizeBrowserUrl(envUrl!);
  }

  // In production, always use window.location.origin as the most reliable source
  // This handles the case where NEXT_PUBLIC_APP_URL was missing at build time
  if (process.env.NODE_ENV === 'production') {
    return normalizeBrowserUrl(window.location.origin);
  }

  return normalizeBrowserUrl(window.location.origin);
}

/**
 * Build OAuth redirect URL
 * Ensures the redirect URL is always using the canonical app URL
 */
export function getOAuthRedirectUrl(next: string = '/dashboard'): string {
  const appUrl = getAppUrl();
  return `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}

/**
 * Build email verification redirect URL
 */
export function getEmailRedirectUrl(next: string = '/dashboard'): string {
  const appUrl = getAppUrl();
  return `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}

/**
 * Validate that a URL is safe for redirect
 * Prevents open redirect vulnerabilities
 */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const appUrl = getAppUrl();
    const targetUrl = new URL(url, appUrl);
    const appHost = new URL(appUrl).host;
    
    // Only allow redirects to the same host
    return targetUrl.host === appHost;
  } catch {
    return false;
  }
}

/**
 * Get safe redirect URL, falling back to dashboard if invalid
 */
export function getSafeRedirectUrl(url: string | null | undefined, fallback: string = '/dashboard'): string {
  if (!url) return fallback;
  
  // If it's a relative path, it's safe
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  
  // Check if absolute URL is safe
  if (isSafeRedirectUrl(url)) {
    return url;
  }
  
  return fallback;
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Log URL configuration for debugging (only in development)
 */
export function logUrlConfig(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.debug('[URL Config]', {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    computed: getAppUrl(),
  });
}