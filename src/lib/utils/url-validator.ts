/**
 * Production-safe URL validation utilities
 * Ensures OAuth redirects and other URLs use the correct production domain
 */

/**
 * Check if a URL is a valid production URL (not a placeholder)
 */
function isValidProductionUrl(url: string | undefined): boolean {
  if (!url) return false;
  
  // Reject common placeholder patterns
  const placeholderPatterns = [
    'your-production-domain',
    'yourdomain',
    'example.com',
    'localhost',
    'placeholder',
  ];
  
  const lowerUrl = url.toLowerCase();
  for (const pattern of placeholderPatterns) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }
  
  // Must start with https:// for production
  if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
    return false;
  }
  
  return true;
}

/**
 * Get the canonical app URL
 * Priority: NEXT_PUBLIC_APP_URL > NEXTAUTH_URL > window.location.origin
 * With validation to reject placeholder URLs
 */
export function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  
  // Server-side: use environment variables (with validation)
  if (typeof window === 'undefined') {
    if (isValidProductionUrl(envUrl)) {
      return envUrl!;
    }
    if (isValidProductionUrl(nextAuthUrl)) {
      return nextAuthUrl!;
    }
    return 'http://localhost:3000';
  }

  // Client-side: prefer env var (if valid), fallback to current origin
  
  // If env var is set, valid, and we're in production, use it
  if (isValidProductionUrl(envUrl) && process.env.NODE_ENV === 'production') {
    return envUrl!;
  }
  
  // In development, use current origin for flexibility
  if (process.env.NODE_ENV === 'development') {
    return window.location.origin;
  }
  
  // Production fallback: use origin if env var is invalid/missing
  // This prevents redirects to placeholder domains
  if (!isValidProductionUrl(envUrl)) {
    console.warn('[URL Validator] Invalid NEXT_PUBLIC_APP_URL detected, using window.location.origin');
    return window.location.origin;
  }
  
  return envUrl || window.location.origin;
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
  
  console.log('[URL Config]', {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    computed: getAppUrl(),
  });
}