// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER - Failure Protection for AI Providers
// GRACEFUL DEGRADATION: Falls back to in-memory when Redis unavailable
// ═══════════════════════════════════════════════════════════════════════════

import {
    type AIProvider,
    type CircuitState,
    type CircuitBreakerConfig,
    type CircuitBreakerState,
} from './providers/provider-types';

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
    successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '2'),
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '30000'),
    monitorWindow: 60000,
};

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY STATE STORAGE
// ═══════════════════════════════════════════════════════════════════════════

const memoryStates: Map<string, CircuitBreakerState> = new Map();
const memoryErrors: Map<string, Array<{ message: string; timestamp: number }>> = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class CircuitBreaker {
    private redis: any = null;
    private config: CircuitBreakerConfig;
    private usingFallback: boolean = false;

    constructor(config: Partial<CircuitBreakerConfig> = {}, redisUrl?: string) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initRedis(redisUrl);
    }

    private async initRedis(redisUrl?: string): Promise<void> {
        try {
            const { Redis } = await import('ioredis');

            const url = redisUrl || process.env.REDIS_URL;
            if (!url) {
                console.warn('[CircuitBreaker] No REDIS_URL configured, using in-memory fallback');
                this.usingFallback = true;
                return;
            }

            this.redis = new Redis(url, {
                maxRetriesPerRequest: 3,
                retryStrategy(times: number) {
                    if (times > 3) return null;
                    return Math.min(times * 50, 2000);
                },
                lazyConnect: true,
            });

            const connectPromise = this.redis.ping();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
            );

            try {
                await Promise.race([connectPromise, timeoutPromise]);
                console.debug('[CircuitBreaker] Redis connected successfully');
            } catch (e) {
                console.warn('[CircuitBreaker] Redis unavailable, using in-memory fallback');
                this.usingFallback = true;
                this.redis = null;
            }

            if (this.redis) {
                this.redis.on('error', () => {
                    this.usingFallback = true;
                });
                this.redis.on('connect', () => {
                    this.usingFallback = false;
                });
            }
        } catch (error) {
            console.warn('[CircuitBreaker] Failed to initialize Redis, using in-memory fallback');
            this.usingFallback = true;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // EXECUTE WITH CIRCUIT BREAKER PROTECTION
    // ═════════════════════════════════════════════════════════════════════════

    async execute<T>(provider: AIProvider, fn: () => Promise<T>): Promise<T> {
        const state = await this.getState(provider);

        if (state.state === 'OPEN') {
            const timeSinceOpen = Date.now() - state.lastStateChange;

            if (timeSinceOpen >= this.config.resetTimeout) {
                await this.setState(provider, 'HALF_OPEN');
            } else {
                throw new Error(
                    `Circuit breaker is OPEN for ${provider}. Retry after ${this.config.resetTimeout - timeSinceOpen}ms`
                );
            }
        }

        try {
            const result = await fn();
            await this.recordSuccess(provider);
            return result;
        } catch (error) {
            await this.recordFailure(provider, error as Error);
            throw error;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RECORD SUCCESS
    // ═════════════════════════════════════════════════════════════════════════

    async recordSuccess(provider: AIProvider): Promise<void> {
        const state = await this.getState(provider);
        state.successCount++;

        if (state.state === 'HALF_OPEN' && state.successCount >= this.config.successThreshold) {
            await this.setState(provider, 'CLOSED');
            state.failureCount = 0;
            state.successCount = 0;
        }

        if (state.state === 'CLOSED') {
            state.failureCount = 0;
        }

        await this.saveState(provider, state);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RECORD FAILURE
    // ═════════════════════════════════════════════════════════════════════════

    async recordFailure(provider: AIProvider, error: Error): Promise<void> {
        const state = await this.getState(provider);
        state.failureCount++;
        state.lastFailureTime = Date.now();

        if (state.state === 'HALF_OPEN') {
            await this.setState(provider, 'OPEN');
            state.successCount = 0;
        }

        if (state.state === 'CLOSED' && state.failureCount >= this.config.failureThreshold) {
            await this.setState(provider, 'OPEN');
            console.error(`Circuit breaker opened for ${provider} after ${state.failureCount} failures`);
        }

        await this.saveState(provider, state);
        await this.trackError(provider, error);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GET CURRENT STATE
    // ═════════════════════════════════════════════════════════════════════════

    async getState(provider: AIProvider): Promise<CircuitBreakerState> {
        const defaultState: CircuitBreakerState = {
            state: 'CLOSED',
            failureCount: 0,
            successCount: 0,
            lastStateChange: Date.now(),
        };

        if (this.usingFallback || !this.redis) {
            return memoryStates.get(provider) || defaultState;
        }

        try {
            const key = `ai:circuit:${provider}:state`;
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : defaultState;
        } catch (error) {
            return memoryStates.get(provider) || defaultState;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // SET STATE  
    // ═════════════════════════════════════════════════════════════════════════

    private async setState(provider: AIProvider, newState: CircuitState): Promise<void> {
        const state = await this.getState(provider);
        state.state = newState;
        state.lastStateChange = Date.now();

        if (newState === 'CLOSED') {
            state.failureCount = 0;
            state.successCount = 0;
        }

        await this.saveState(provider, state);
        console.debug(`Circuit breaker for ${provider} changed to ${newState}`);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // SAVE STATE
    // ═════════════════════════════════════════════════════════════════════════

    private async saveState(provider: AIProvider, state: CircuitBreakerState): Promise<void> {
        if (this.usingFallback || !this.redis) {
            memoryStates.set(provider, state);
            return;
        }

        try {
            const key = `ai:circuit:${provider}:state`;
            await this.redis.set(key, JSON.stringify(state), 'EX', 3600);
        } catch (error) {
            memoryStates.set(provider, state);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // TRACK ERROR FOR MONITORING
    // ═════════════════════════════════════════════════════════════════════════

    private async trackError(provider: AIProvider, error: Error): Promise<void> {
        const errorData = { message: error.message, timestamp: Date.now() };

        if (this.usingFallback || !this.redis) {
            const errors = memoryErrors.get(provider) || [];
            errors.unshift(errorData);
            memoryErrors.set(provider, errors.slice(0, 100));
            return;
        }

        try {
            const key = `ai:circuit:${provider}:errors`;
            await this.redis
                .multi()
                .lpush(key, JSON.stringify(errorData))
                .ltrim(key, 0, 99)
                .expire(key, 3600)
                .exec();
        } catch (e) {
            const errors = memoryErrors.get(provider) || [];
            errors.unshift(errorData);
            memoryErrors.set(provider, errors.slice(0, 100));
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GET ERROR HISTORY
    // ═════════════════════════════════════════════════════════════════════════

    async getErrorHistory(provider: AIProvider, limit: number = 10): Promise<Array<{
        message: string;
        timestamp: number;
    }>> {
        if (this.usingFallback || !this.redis) {
            return (memoryErrors.get(provider) || []).slice(0, limit);
        }

        try {
            const key = `ai:circuit:${provider}:errors`;
            const errors = await this.redis.lrange(key, 0, limit - 1);
            return errors.map((e: string) => JSON.parse(e));
        } catch (error) {
            return (memoryErrors.get(provider) || []).slice(0, limit);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // FORCE OPEN/CLOSE (FOR ADMIN/TESTING)
    // ═════════════════════════════════════════════════════════════════════════

    async forceState(provider: AIProvider, state: CircuitState): Promise<void> {
        await this.setState(provider, state);
    }

    async reset(provider: AIProvider): Promise<void> {
        const state: CircuitBreakerState = {
            state: 'CLOSED',
            failureCount: 0,
            successCount: 0,
            lastStateChange: Date.now(),
        };
        await this.saveState(provider, state);

        if (this.redis && !this.usingFallback) {
            try {
                await this.redis.del(`ai:circuit:${provider}:errors`);
            } catch (e) {
                memoryErrors.delete(provider);
            }
        } else {
            memoryErrors.delete(provider);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GET ALL STATES (FOR MONITORING)
    // ═════════════════════════════════════════════════════════════════════════

    async getAllStates(): Promise<Record<AIProvider, CircuitBreakerState>> {
        const providers: AIProvider[] = ['a4f', 'groq'];
        const states: Record<string, CircuitBreakerState> = {};

        for (const provider of providers) {
            states[provider] = await this.getState(provider);
        }

        return states as Record<AIProvider, CircuitBreakerState>;
    }

    async disconnect(): Promise<void> {
        if (this.redis) {
            await this.redis.quit();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let circuitBreakerInstance: CircuitBreaker | null = null;

export function getCircuitBreaker(): CircuitBreaker {
    if (!circuitBreakerInstance) {
        circuitBreakerInstance = new CircuitBreaker();
    }
    return circuitBreakerInstance;
}
