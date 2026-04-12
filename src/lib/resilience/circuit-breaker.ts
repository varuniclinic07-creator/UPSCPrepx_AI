/**
 * Circuit Breaker Pattern for External Services
 * Prevents cascading failures and improves resilience
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private stats: CircuitStats = { failures: 0, successes: 0 };
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = {
      failureThreshold: config?.failureThreshold || 5,
      successThreshold: config?.successThreshold || 2,
      timeout: config?.timeout || 30000,
      resetTimeout: config?.resetTimeout || 60000,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        console.debug(`[Circuit Breaker: ${this.name}] Attempting reset (HALF_OPEN)`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
      ),
    ]);
  }

  private onSuccess(): void {
    this.stats.failures = 0;

    if (this.state === 'HALF_OPEN') {
      this.stats.successes++;
      if (this.stats.successes >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.stats.successes = 0;
        console.debug(`[Circuit Breaker: ${this.name}] Reset to CLOSED`);
      }
    }
  }

  private onFailure(): void {
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.stats.successes = 0;
      this.stats.nextAttemptTime = Date.now() + this.config.resetTimeout;
      console.error(`[Circuit Breaker: ${this.name}] Reopened due to failure`);
    } else if (this.stats.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.stats.nextAttemptTime = Date.now() + this.config.resetTimeout;
      console.error(`[Circuit Breaker: ${this.name}] Opened due to ${this.stats.failures} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.stats.nextAttemptTime !== undefined &&
      Date.now() >= this.stats.nextAttemptTime
    );
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): CircuitStats & { state: CircuitState } {
    return { ...this.stats, state: this.state };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.stats = { failures: 0, successes: 0 };
    console.debug(`[Circuit Breaker: ${this.name}] Manually reset`);
  }
}

// Circuit breakers for external services
export const circuitBreakers = {
  a4f: new CircuitBreaker('A4F_API', {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
    resetTimeout: 60000,
  }),
  razorpay: new CircuitBreaker('RAZORPAY_API', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 10000,
    resetTimeout: 30000,
  }),
  supabase: new CircuitBreaker('SUPABASE_API', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 15000,
    resetTimeout: 30000,
  }),
};

/**
 * Wrapper for A4F API calls with circuit breaker
 */
export async function withA4FCircuitBreaker<T>(
  fn: () => Promise<T>
): Promise<T> {
  return circuitBreakers.a4f.execute(fn);
}

/**
 * Wrapper for Razorpay API calls with circuit breaker
 */
export async function withRazorpayCircuitBreaker<T>(
  fn: () => Promise<T>
): Promise<T> {
  return circuitBreakers.razorpay.execute(fn);
}

/**
 * Get all circuit breaker statuses
 */
export function getCircuitBreakerStatus() {
  return {
    a4f: circuitBreakers.a4f.getStats(),
    razorpay: circuitBreakers.razorpay.getStats(),
    supabase: circuitBreakers.supabase.getStats(),
  };
}

/**
 * Reset all circuit breakers (admin function)
 */
export function resetAllCircuitBreakers() {
  Object.values(circuitBreakers).forEach((cb) => cb.reset());
}

/**
 * Generic circuit breaker wrapper for any async function
 * Uses a default circuit breaker for external services
 */
const defaultCircuitBreaker = new CircuitBreaker('DEFAULT_EXTERNAL', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
  resetTimeout: 60000,
});

export async function withCircuitBreaker<T>(
  fn: () => Promise<T>
): Promise<T> {
  return defaultCircuitBreaker.execute(fn);
}