// Lightweight error monitoring without Sentry SDK
// Add Sentry SDK when ready: npm install @sentry/nextjs

interface ErrorContext {
  userId?: string;
  requestId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class ErrorMonitoring {
  private enabled = process.env.NODE_ENV === 'production';
  private dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  captureException(error: Error, context?: ErrorContext): void {
    if (!this.enabled || !this.dsn) {
      console.error('[Error Monitoring]', error, context);
      return;
    }

    // TODO: Implement Sentry.captureException when SDK is added
    console.error('[Error Monitoring]', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      timestamp: new Date().toISOString(),
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.enabled || !this.dsn) {
      console.debug(`[${level.toUpperCase()}]`, message);
      return;
    }

    // TODO: Implement Sentry.captureMessage when SDK is added
    console.debug('[Error Monitoring]', { message, level, timestamp: new Date().toISOString() });
  }

  setUser(_user: { id: string; email?: string }): void {
    if (!this.enabled || !this.dsn) return;
    // TODO: Implement Sentry.setUser when SDK is added
  }
}

export const errorMonitoring = new ErrorMonitoring();