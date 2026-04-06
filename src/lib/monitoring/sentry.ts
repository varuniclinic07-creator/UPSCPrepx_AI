export const config = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
};

export function captureException(error: Error, context?: Record<string, any>) {
  if (!config.enabled) {
    console.error('Error:', error, context);
    return;
  }
  
  // Simple error logging - replace with actual Sentry when installed
  console.error('[Sentry]', error.message, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!config.enabled) return;
  console.log(`[Sentry][${level}]`, message);
}
