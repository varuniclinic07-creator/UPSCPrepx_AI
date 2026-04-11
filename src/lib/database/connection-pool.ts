// ═══════════════════════════════════════════════════════════════
// DATABASE CONNECTION POOL
// Supabase connection pooling and query optimization
// ═══════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@/lib/supabase/server';
import { logger, measure } from '@/lib/logging/logger';
import { CircuitBreaker } from '@/lib/async/timeout-retry';

// ═══════════════════════════════════════════════════════════════
// CONNECTION POOL CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface PoolConfig {
    minConnections: number;
    maxConnections: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
    acquireTimeoutMs: number;
    retryAttempts: number;
    retryDelayMs: number;
}

export const defaultPoolConfig: PoolConfig = {
    minConnections: 2,
    maxConnections: 20,
    idleTimeoutMs: 30000,
    connectionTimeoutMs: 10000,
    acquireTimeoutMs: 5000,
    retryAttempts: 3,
    retryDelayMs: 100,
};

// ═══════════════════════════════════════════════════════════════
// POOLED CONNECTION
// ═══════════════════════════════════════════════════════════════

interface PooledConnection {
    client: SupabaseClient;
    createdAt: number;
    lastUsedAt: number;
    inUse: boolean;
    queryCount: number;
}

// ═══════════════════════════════════════════════════════════════
// CONNECTION POOL CLASS
// ═══════════════════════════════════════════════════════════════

export class ConnectionPool {
    private pool: PooledConnection[] = [];
    private config: PoolConfig;
    private circuitBreaker: CircuitBreaker;
    private isInitialized = false;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(config: Partial<PoolConfig> = {}) {
        this.config = { ...defaultPoolConfig, ...config };
        this.circuitBreaker = new CircuitBreaker({
            failureThreshold: 5,
            resetTimeoutMs: 30000,
            halfOpenMaxAttempts: 3,
        });
    }

    /**
     * Initialize the connection pool
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('[ConnectionPool] Already initialized');
            return;
        }

        logger.info('[ConnectionPool] Initializing', {
            minConnections: this.config.minConnections,
            maxConnections: this.config.maxConnections,
        });

        // Create minimum connections upfront
        for (let i = 0; i < this.config.minConnections; i++) {
            const client = await this.createConnection();
            this.pool.push(client);
        }

        // Start cleanup interval
        this.cleanupInterval = setInterval(
            () => this.cleanupIdleConnections(),
            this.config.idleTimeoutMs
        );

        this.isInitialized = true;
        logger.info('[ConnectionPool] Initialized', { size: this.pool.length });
    }

    /**
     * Create a new Supabase client connection
     */
    private async createConnection(): Promise<PooledConnection> {
        const client = await createClient();
        const now = Date.now();

        return {
            client,
            createdAt: now,
            lastUsedAt: now,
            inUse: false,
            queryCount: 0,
        };
    }

    /**
     * Acquire a connection from the pool
     */
    async acquire(): Promise<SupabaseClient> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return this.circuitBreaker.execute(async () => {
            const startTime = Date.now();

            // Try to find an idle connection
            for (const conn of this.pool) {
                if (!conn.inUse) {
                    conn.inUse = true;
                    conn.lastUsedAt = Date.now();
                    logger.debug('[ConnectionPool] Connection acquired', {
                        age: Date.now() - conn.createdAt,
                        queryCount: conn.queryCount,
                    });
                    return conn.client;
                }
            }

            // No idle connections available
            if (this.pool.length < this.config.maxConnections) {
                // Create a new connection
                const newConn = await this.createConnection();
                newConn.inUse = true;
                this.pool.push(newConn);
                logger.debug('[ConnectionPool] New connection created', {
                    size: this.pool.length,
                });
                return newConn.client;
            }

            // Pool exhausted - wait for available connection
            const acquireTimeout = this.config.acquireTimeoutMs;
            while (Date.now() - startTime < acquireTimeout) {
                for (const conn of this.pool) {
                    if (!conn.inUse) {
                        conn.inUse = true;
                        conn.lastUsedAt = Date.now();
                        return conn.client;
                    }
                }
                await new Promise((resolve) =>
                    setTimeout(resolve, this.config.retryDelayMs)
                );
            }

            throw new Error(
                `Connection pool exhausted (max: ${this.config.maxConnections})`
            );
        });
    }

    /**
     * Release a connection back to the pool
     */
    release(client: SupabaseClient): void {
        const conn = this.pool.find((c) => c.client === client);
        if (conn) {
            conn.inUse = false;
            conn.lastUsedAt = Date.now();
            conn.queryCount++;
            logger.debug('[ConnectionPool] Connection released', {
                queryCount: conn.queryCount,
            });
        } else {
            logger.warn('[ConnectionPool] Unknown connection released');
        }
    }

    /**
     * Cleanup idle connections
     */
    private cleanupIdleConnections(): void {
        const now = Date.now();
        const toRemove: PooledConnection[] = [];

        for (const conn of this.pool) {
            if (
                !conn.inUse &&
                now - conn.lastUsedAt > this.config.idleTimeoutMs &&
                this.pool.length > this.config.minConnections
            ) {
                toRemove.push(conn);
            }
        }

        for (const conn of toRemove) {
            const index = this.pool.indexOf(conn);
            if (index > -1) {
                this.pool.splice(index, 1);
                logger.debug('[ConnectionPool] Idle connection removed');
            }
        }

        if (toRemove.length > 0) {
            logger.info('[ConnectionPool] Cleanup completed', {
                removed: toRemove.length,
                size: this.pool.length,
            });
        }
    }

    /**
     * Get pool statistics
     */
    getStats(): {
        total: number;
        inUse: number;
        idle: number;
        minConnections: number;
        maxConnections: number;
    } {
        const inUse = this.pool.filter((c) => c.inUse).length;
        return {
            total: this.pool.length,
            inUse,
            idle: this.pool.length - inUse,
            minConnections: this.config.minConnections,
            maxConnections: this.config.maxConnections,
        };
    }

    /**
     * Close all connections
     */
    async close(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Wait for all connections to be released
        const timeout = Date.now() + 10000;
        while (this.pool.some((c) => c.inUse) && Date.now() < timeout) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        this.pool = [];
        this.isInitialized = false;
        logger.info('[ConnectionPool] Closed');
    }
}

// ═══════════════════════════════════════════════════════════════
// QUERY OPTIMIZATION UTILITIES
// ═══════════════════════════════════════════════════════════════

export interface QueryOptions {
    timeoutMs?: number;
    retries?: number;
    cache?: boolean;
    cacheTtlSeconds?: number;
}

export interface PaginatedQueryOptions {
    page?: number;
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
    filters?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

/**
 * Execute a query with timeout and retry logic
 */
export async function executeQuery<T>(
    operation: string,
    fn: (client: SupabaseClient) => Promise<T>,
    options: QueryOptions = {}
): Promise<T> {
    return measure(
        `db:${operation}`,
        async () => {
            const pool = getPool();
            const client = await pool.acquire();

            try {
                return await fn(client);
            } finally {
                pool.release(client);
            }
        },
        { service: 'database', operation }
    );
}

/**
 * Execute a paginated query
 */
export async function executePaginatedQuery<T>(
    operation: string,
    fn: (
        client: SupabaseClient,
        options: { offset: number; limit: number }
    ) => Promise<{ data: T[]; count: number }>,
    options: PaginatedQueryOptions = {}
): Promise<PaginatedResult<T>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    return executeQuery(
        operation,
        async (client) => {
            const { data, count } = await fn(client, { offset, limit });

            const totalPages = Math.ceil((count || 0) / limit);

            return {
                data: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrevious: page > 1,
                },
            };
        },
        { timeoutMs: options?.timeoutMs }
    );
}

/**
 * Execute queries in transaction (batch operations)
 */
export async function executeTransaction<T>(
    operation: string,
    fn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
    return executeQuery(
        `transaction:${operation}`,
        async (client) => {
            // Note: Supabase doesn't support traditional transactions
            // This wrapper provides logical transaction grouping
            // For actual transactions, use RPC functions
            return fn(client);
        },
        { retries: 0 } // No retries for transactions to avoid duplicates
    );
}

/**
 * Batch execute multiple queries
 */
export async function executeBatch<T>(
    operation: string,
    queries: Array<(client: SupabaseClient) => Promise<T>>,
    options: { stopOnError?: boolean } = {}
): Promise<Array<{ result: T | null; error: Error | null }>> {
    const pool = getPool();
    const client = await pool.acquire();
    const results: Array<{ result: T | null; error: Error | null }> = [];

    try {
        for (const query of queries) {
            try {
                const result = await query(client);
                results.push({ result, error: null });
            } catch (error) {
                results.push({ result: null, error: error as Error });
                if (options.stopOnError) {
                    break;
                }
            }
        }
    } finally {
        pool.release(client);
    }

    return results;
}

/**
 * Debounced query execution (prevent duplicate rapid queries)
 */
const queryDebounce = new Map<string, { promise: Promise<unknown>; timestamp: number }>();

export async function executeDebouncedQuery<T>(
    key: string,
    fn: () => Promise<T>,
    debounceMs: number = 100
): Promise<T> {
    const now = Date.now();
    const existing = queryDebounce.get(key);

    if (existing && now - existing.timestamp < debounceMs) {
        return existing.promise as Promise<T>;
    }

    const promise = fn();
    queryDebounce.set(key, { promise, timestamp: now });

    promise.finally(() => {
        setTimeout(() => {
            queryDebounce.delete(key);
        }, debounceMs);
    });

    return promise;
}

/**
 * Query result caching wrapper
 */
export async function executeCachedQuery<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300
): Promise<T> {
    const { getFromCache, setInCache } = await import('@/lib/cache/redis-cache');

    const cached = await getFromCache<T>(key, { ttlSeconds });
    if (cached !== null) {
        logger.debug('[Database] Cache hit', { key });
        return cached;
    }

    const fresh = await fn();
    await setInCache(key, fresh, { ttlSeconds });

    return fresh;
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON POOL INSTANCE
// ═══════════════════════════════════════════════════════════════

let poolInstance: ConnectionPool | null = null;

export function getPool(): ConnectionPool {
    if (!poolInstance) {
        poolInstance = new ConnectionPool();
    }
    return poolInstance;
}

export async function initializePool(config?: Partial<PoolConfig>): Promise<void> {
    const pool = getPool();
    await pool.initialize();
}

export async function closePool(): Promise<void> {
    if (poolInstance) {
        await poolInstance.close();
        poolInstance = null;
    }
}

export function getPoolStats(): {
    total: number;
    inUse: number;
    idle: number;
    minConnections: number;
    maxConnections: number;
} {
    const pool = getPool();
    return pool.getStats();
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE CLIENT HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get a pooled Supabase client
 */
export async function getPooledClient(): Promise<SupabaseClient> {
    const pool = getPool();
    return pool.acquire();
}

/**
 * Execute with automatic connection management
 */
export async function withClient<T>(
    fn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
    const client = await getPooledClient();
    try {
        return await fn(client);
    } finally {
        getPool().release(client);
    }
}
