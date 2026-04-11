// ═══════════════════════════════════════════════════════════════
// TIMEOUT AND RETRY UTILITIES
// Production-ready async handling
// ═══════════════════════════════════════════════════════════════

import { logger } from '@/lib/logging/logger';

// ═══════════════════════════════════════════════════════════════
// TIMEOUT
// ═══════════════════════════════════════════════════════════════

export interface TimeoutOptions {
    timeoutMs: number;
    operationName?: string;
    signal?: AbortSignal;
}

export class TimeoutError extends Error {
    public readonly operationName: string;
    public readonly timeoutMs: number;

    constructor(operationName: string, timeoutMs: number) {
        super(`${operationName} timed out after ${timeoutMs}ms`);
        this.name = 'TimeoutError';
        this.operationName = operationName;
        this.timeoutMs = timeoutMs;
    }
}

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    options: TimeoutOptions
): Promise<T> {
    const { timeoutMs, operationName = 'Operation', signal } = options;

    return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            logger.warn('Timeout triggered', { operation: operationName, timeoutMs });
            reject(new TimeoutError(operationName, timeoutMs));
        }, timeoutMs);

        promise
            .then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });

        // Handle abort signal
        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                reject(new Error(`${operationName} aborted`));
            });
        }
    });
}

/**
 * Execute function with timeout
 */
export async function executeWithTimeout<T>(
    fn: () => Promise<T>,
    options: TimeoutOptions
): Promise<T> {
    return withTimeout(fn(), options);
}

// ═══════════════════════════════════════════════════════════════
// RETRY
// ═══════════════════════════════════════════════════════════════

export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
    onRetry?: (attempt: number, error: Error, result?: unknown) => void;
    shouldRetry?: (error: Error, attempt: number) => boolean;
    operationName?: string;
}

export interface RetryResult<T> {
    result: T;
    attempts: number;
    totalDurationMs: number;
}

/**
 * Default retry strategy: Check if error is retryable
 */
function isRetryableError(error: Error): boolean {
    // Network errors
    if (error.message.includes('ETIMEDOUT') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND')) {
        return true;
    }

    // Rate limit errors
    if (error.message.includes('429') || error.message.includes('rate limit')) {
        return true;
    }

    // Service unavailable
    if (error.message.includes('503') || error.message.includes('502')) {
        return true;
    }

    // Timeout errors
    if (error.name === 'TimeoutError') {
        return true;
    }

    return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoff(
    attempt: number,
    options: Required<Pick<RetryOptions, 'baseDelayMs' | 'maxDelayMs' | 'factor'>>
): number {
    const { baseDelayMs, maxDelayMs, factor } = options;

    // Exponential backoff: baseDelay * (factor ^ attempt)
    const exponentialDelay = baseDelayMs * Math.pow(factor, attempt);

    // Add jitter (±20% randomness to prevent thundering herd)
    const jitter = (Math.random() - 0.5) * 0.4 * exponentialDelay;

    const delay = exponentialDelay + jitter;

    // Cap at max delay
    return Math.min(delay, maxDelayMs);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<RetryResult<T>> {
    const {
        maxRetries = 3,
        baseDelayMs = 1000,
        maxDelayMs = 30000,
        factor = 2,
        onRetry,
        shouldRetry = isRetryableError,
        operationName = 'Operation',
    } = options;

    const startTime = Date.now();
    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts <= maxRetries) {
        try {
            attempts++;
            const result = await fn();

            const totalDuration = Date.now() - startTime;

            if (attempts > 1) {
                logger.info(`${operationName} succeeded after ${attempts} attempts`, {
                    attempts,
                    totalDuration,
                    operation: operationName,
                });
            }

            return {
                result,
                attempts,
                totalDurationMs: totalDuration,
            };
        } catch (error) {
            lastError = error as Error;
            const isLastAttempt = attempts > maxRetries;

            // Check if we should retry
            const retryable = shouldRetry(error as Error, attempts);

            if (isLastAttempt || !retryable) {
                logger.error(`${operationName} failed after ${attempts} attempts`, {
                    attempts,
                    error: (error as Error).message,
                    retryable,
                    operation: operationName,
                });
                throw error;
            }

            // Calculate delay
            const delay = calculateBackoff(attempts - 1, { baseDelayMs, maxDelayMs, factor });

            logger.warn(`${operationName} attempt ${attempts} failed, retrying in ${Math.round(delay)}ms`, {
                attempt: attempts,
                maxRetries,
                delay,
                error: (error as Error).message,
                operation: operationName,
            });

            // Call retry callback
            onRetry?.(attempts, error as Error);

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError;
}

// ═══════════════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════

export interface CircuitBreakerOptions {
    failureThreshold?: number;
    successThreshold?: number;
    timeoutMs?: number;
    operationName?: string;
}

export enum CircuitState {
    CLOSED = 'CLOSED',      // Normal operation
    OPEN = 'OPEN',          // Failing, reject requests
    HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export class CircuitBreakerError extends Error {
    public readonly state: CircuitState;

    constructor(state: CircuitState) {
        super(`Circuit breaker is ${state}`);
        this.name = 'CircuitBreakerError';
        this.state = state;
    }
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private successCount = 0;
    private nextAttempt?: number;

    constructor(private readonly options: CircuitBreakerOptions = {}) {
        this.options = {
            failureThreshold: options.failureThreshold ?? 5,
            successThreshold: options.successThreshold ?? 2,
            timeoutMs: options.timeoutMs ?? 60000,
            operationName: options.operationName ?? 'CircuitBreaker',
        };
    }

    /**
     * Execute function through circuit breaker
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            if (this.nextAttempt && Date.now() < this.nextAttempt) {
                logger.warn('Circuit breaker OPEN, rejecting request', {
                    operation: this.options.operationName,
                    state: this.state,
                });
                throw new CircuitBreakerError(CircuitState.OPEN);
            }

            // Transition to half-open
            this.state = CircuitState.HALF_OPEN;
            this.successCount = 0;

            logger.info('Circuit breaker HALF_OPEN, testing', {
                operation: this.options.operationName,
            });
        }

        try {
            const result = await fn();

            // Success
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;

            if (this.successCount >= (this.options.successThreshold ?? 2)) {
                this.state = CircuitState.CLOSED;
                this.failureCount = 0;
                this.successCount = 0;

                logger.info('Circuit breaker CLOSED, service recovered', {
                    operation: this.options.operationName,
                });
            }
        } else if (this.state === CircuitState.CLOSED) {
            // Reset failure count on success
            this.failureCount = 0;
        }
    }

    private onFailure(): void {
        this.failureCount++;

        if (this.state === CircuitState.HALF_OPEN) {
            // Immediately open on failure in half-open state
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + (this.options.timeoutMs ?? 60000);

            logger.error('Circuit breaker OPEN, service failing', {
                operation: this.options.operationName,
                failureCount: this.failureCount,
            });
        } else if (this.state === CircuitState.CLOSED) {
            if (this.failureCount >= (this.options.failureThreshold ?? 5)) {
                this.state = CircuitState.OPEN;
                this.nextAttempt = Date.now() + (this.options.timeoutMs ?? 60000);

                logger.error('Circuit breaker OPEN, threshold exceeded', {
                    operation: this.options.operationName,
                    failureCount: this.failureCount,
                });
            }
        }
    }

    getState(): CircuitState {
        return this.state;
    }

    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = undefined;

        logger.info('Circuit breaker manually reset', {
            operation: this.options.operationName,
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// COMBINED: TIMEOUT + RETRY + CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════

export interface ResilientOptions extends RetryOptions, TimeoutOptions {
    circuitBreaker?: CircuitBreaker;
}

/**
 * Execute function with timeout, retry, and optional circuit breaker
 */
export async function executeResilient<T>(
    fn: () => Promise<T>,
    options: ResilientOptions
): Promise<T> {
    const { circuitBreaker, timeoutMs, operationName = 'Operation' } = options;

    // If circuit breaker is open, fail fast
    if (circuitBreaker && circuitBreaker.getState() === CircuitState.OPEN) {
        throw new CircuitBreakerError(CircuitState.OPEN);
    }

    // Execute with circuit breaker
    if (circuitBreaker) {
        return circuitBreaker.execute(async () => {
            // Execute with timeout
            const withTimeoutResult = await executeWithTimeout(fn, {
                timeoutMs: timeoutMs ?? 30000,
                operationName,
            });

            // Execute with retry
            const retryResult = await withRetry(
                () => Promise.resolve(withTimeoutResult),
                { ...options, operationName }
            );

            return retryResult.result;
        });
    }

    // No circuit breaker - just timeout + retry
    const withTimeoutResult = await executeWithTimeout(fn, {
        timeoutMs: timeoutMs ?? 30000,
        operationName,
    });

    const retryResult = await withRetry(
        () => Promise.resolve(withTimeoutResult),
        { ...options, operationName }
    );

    return retryResult.result;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

export const defaultTimeouts = {
    api: 10000,           // 10 seconds for API calls
    database: 5000,       // 5 seconds for DB queries
    ai: 30000,            // 30 seconds for AI generation
    file: 60000,          // 60 seconds for file operations
    webhook: 5000,        // 5 seconds for webhook processing
};

export const defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    factor: 2,
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { CircuitBreaker, CircuitState };
