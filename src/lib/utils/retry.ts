// ═══════════════════════════════════════════════════════════════════════════
// RETRY UTILITY - Exponential Backoff Retry Logic
// ═══════════════════════════════════════════════════════════════════════════

export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors?: string[];
}

const DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
};

// ═══════════════════════════════════════════════════════════════════════════
// RETRY WITH EXPONENTIAL BACKOFF  
// ═══════════════════════════════════════════════════════════════════════════

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Check if error is retryable
            if (!isRetryableError(error, fullConfig.retryableErrors)) {
                throw error;
            }

            // Don't retry if we've exhausted attempts
            if (attempt === fullConfig.maxRetries) {
                throw error;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                fullConfig.initialDelay * Math.pow(fullConfig.backoffMultiplier, attempt),
                fullConfig.maxDelay
            );

            console.debug(
                `Retry attempt ${attempt + 1}/${fullConfig.maxRetries} after ${delay}ms`
            );

            // Wait before retrying
            await sleep(delay);
        }
    }

    throw lastError!;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECK IF ERROR IS RETRYABLE
// ═══════════════════════════════════════════════════════════════════════════

function isRetryableError(error: any, retryableErrors?: string[]): boolean {
    // If specific retryable errors provided, check against them
    if (retryableErrors && retryableErrors.length > 0) {
        return retryableErrors.some(code =>
            error.code === code || error.message?.includes(code)
        );
    }

    // Default retryable conditions
    const retryableCodes = [
        'RATE_LIMIT_EXCEEDED',
        'PROVIDER_UNAVAILABLE',
        'TIMEOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
    ];

    return (
        error.retryable === true ||
        retryableCodes.some(code =>
            error.code === code || error.message?.includes(code)
        )
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SLEEP UTILITY
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY WITH JITTER (Prevents thundering herd)
// ═══════════════════════════════════════════════════════════════════════════

export async function retryWithJitter<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (!isRetryableError(error, fullConfig.retryableErrors)) {
                throw error;
            }

            if (attempt === fullConfig.maxRetries) {
                throw error;
            }

            // Calculate delay with exponential backoff + jitter
            const baseDelay = fullConfig.initialDelay * Math.pow(fullConfig.backoffMultiplier, attempt);
            const jitter = Math.random() * baseDelay * 0.3; // Up to 30% jitter
            const delay = Math.min(baseDelay + jitter, fullConfig.maxDelay);

            console.debug(
                `Retry attempt ${attempt + 1}/${fullConfig.maxRetries} after ${Math.round(delay)}ms`
            );

            await sleep(delay);
        }
    }

    throw lastError!;
}
