type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const logMessage = this.formatMessage('error', message, {
      ...context,
      error: error?.message,
      stack: this.isDevelopment ? error?.stack : undefined,
    });
    console.error(logMessage);
  }

  warn(message: string, context?: LogContext): void {
    const logMessage = this.formatMessage('warn', message, context);
    console.warn(logMessage);
  }

  info(message: string, context?: LogContext): void {
    const logMessage = this.formatMessage('info', message, context);
    console.log(logMessage);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const logMessage = this.formatMessage('debug', message, context);
      console.log(logMessage);
    }
  }
}

export const logger = new Logger();
