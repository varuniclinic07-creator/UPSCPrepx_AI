// ═══════════════════════════════════════════════════════════════
// BASE SERVICE
// Abstract base class for all services with common functionality
// ═══════════════════════════════════════════════════════════════

import { logger, measure, type Logger } from '@/lib/logging/logger';
import { AppError, ErrorCode, handleError } from '@/lib/errors/app-error';
import { executeResilient, CircuitBreaker, defaultTimeouts } from '@/lib/async/timeout-retry';

export interface ServiceOptions {
  serviceName: string;
  timeoutMs?: number;
  maxRetries?: number;
  circuitBreaker?: CircuitBreaker;
}

export interface ServiceResult<T> {
  data?: T;
  error?: AppError;
  success: boolean;
}

export abstract class BaseService {
  protected readonly serviceName: string;
  protected readonly timeoutMs: number;
  protected readonly maxRetries: number;
  protected readonly circuitBreaker?: CircuitBreaker;
  protected readonly logger: Logger;

  constructor(options: ServiceOptions) {
    this.serviceName = options.serviceName;
    this.timeoutMs = options.timeoutMs || defaultTimeouts.api;
    this.maxRetries = options.maxRetries ?? 3;
    this.circuitBreaker = options.circuitBreaker;
    this.logger = logger.child({ service: options.serviceName });
  }

  /**
   * Execute operation with timeout, retry, and circuit breaker
   */
  protected async execute<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: {
      timeoutMs?: number;
      maxRetries?: number;
      shouldRetry?: (error: Error) => boolean;
    }
  ): Promise<T> {
    return measure(
      `${this.serviceName}:${operation}`,
      async () => {
        return executeResilient(fn, {
          timeoutMs: options?.timeoutMs || this.timeoutMs,
          maxRetries: options?.maxRetries || this.maxRetries,
          circuitBreaker: this.circuitBreaker,
          operationName: `${this.serviceName}:${operation}`,
          shouldRetry: options?.shouldRetry,
        });
      },
      { service: this.serviceName, operation }
    );
  }

  /**
   * Wrap operation with error handling
   */
  protected async safeExecute<T>(
    operation: string,
    fn: () => Promise<T>,
    errorMap?: Record<string, { code: ErrorCode; message: string }>
  ): Promise<ServiceResult<T>> {
    try {
      const data = await this.execute(operation, fn);
      return { data, success: true };
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError({
              code: ErrorCode.INTERNAL_ERROR,
              message: (error as Error).message,
              cause: error as Error,
            });

      this.logger.error(`Operation failed: ${operation}`, {}, appError);

      return {
        error: appError,
        success: false,
      };
    }
  }

  /**
   * Validate input against schema
   */
  protected validate<T>(
    schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: any } },
    data: unknown
  ): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        metadata: { errors: result.error.errors },
      });
    }
    return result.data!;
  }
}
