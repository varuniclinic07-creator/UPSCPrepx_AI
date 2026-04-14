// ═══════════════════════════════════════════════════════════════
// WORKER QUEUE SERVICE
// BullMQ-based job processing for async tasks
// ═══════════════════════════════════════════════════════════════

import { Queue, Worker, Job, QueueEvents, QueueScheduler } from 'bullmq';
import { logger } from '@/lib/logging/logger';
import { Redis } from 'ioredis';

// ═══════════════════════════════════════════════════════════════
// JOB TYPES
// ═══════════════════════════════════════════════════════════════

export enum JobType {
    // Email jobs
    SEND_WELCOME_EMAIL = 'email:welcome',
    SEND_RENEWAL_REMINDER = 'email:renewal',
    SEND_PAYMENT_CONFIRMATION = 'email:payment',
    SEND_PASSWORD_RESET = 'email:password_reset',

    // Subscription jobs
    SUBSCRIPTION_EXPIRY_CHECK = 'subscription:expiry_check',
    SUBSCRIPTION_RENEWAL = 'subscription:renewal',
    TRIAL_EXPIRY_CHECK = 'trial:expiry_check',

    // AI processing jobs
    GENERATE_NOTES = 'ai:generate_notes',
    GENERATE_MIND_MAP = 'ai:generate_mind_map',
    EVALUATE_ANSWER = 'ai:evaluate_answer',
    GENERATE_QUIZ = 'ai:generate_quiz',

    // Video processing jobs
    GENERATE_VIDEO_SHORT = 'video:generate_short',
    PROCESS_VIDEO = 'video:process',

    // Lecture generation jobs
    GENERATE_LECTURE = 'lecture:generate',
    COMPILE_LECTURE = 'lecture:compile',

    // Data processing jobs
    GENERATE_INVOICE = 'invoice:generate',
    EXPORT_USER_DATA = 'data:export',
    CLEANUP_TEMP_DATA = 'data:cleanup',

    // Analytics jobs
    TRACK_EVENT = 'analytics:track',
    UPDATE_METRICS = 'analytics:update_metrics',
}

// ═══════════════════════════════════════════════════════════════
// JOB PAYLOADS
// ═══════════════════════════════════════════════════════════════

export interface EmailJobPayload {
    to: string;
    subject: string;
    template: string;
    data: Record<string, unknown>;
}

export interface SubscriptionJobPayload {
    userId: string;
    subscriptionId: string;
    planSlug?: string;
}

export interface AIJobPayload {
    userId: string;
    prompt: string;
    options?: Record<string, unknown>;
    resourceId?: string;
}

export interface VideoJobPayload {
    userId: string;
    script: string;
    style?: string;
    duration?: number;
}

export interface InvoiceJobPayload {
    paymentId: string;
    userId: string;
}

export interface LectureJobPayload {
    jobId: string;
    userId: string;
    topic: string;
    subject: string;
    language?: string;
    targetDuration?: number;
}

export interface CompilationJobPayload {
    lectureJobId: string;
}

export interface AnalyticsJobPayload {
    event: string;
    userId?: string;
    properties?: Record<string, unknown>;
}

export type JobPayload =
    | EmailJobPayload
    | SubscriptionJobPayload
    | AIJobPayload
    | VideoJobPayload
    | LectureJobPayload
    | CompilationJobPayload
    | InvoiceJobPayload
    | AnalyticsJobPayload;

// ═══════════════════════════════════════════════════════════════
// JOB OPTIONS
// ═══════════════════════════════════════════════════════════════

export interface JobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
    backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
    };
    removeOnComplete?: boolean | {
        count: number;
        age: number;
    };
    removeOnFail?: boolean | {
        count: number;
    };
}

// Default job options by type
const DEFAULT_JOB_OPTIONS: Record<JobType, JobOptions> = {
    // Email jobs - high priority, retry on failure
    [JobType.SEND_WELCOME_EMAIL]: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, priority: 10 },
    [JobType.SEND_RENEWAL_REMINDER]: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, priority: 5 },
    [JobType.SEND_PAYMENT_CONFIRMATION]: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, priority: 10 },
    [JobType.SEND_PASSWORD_RESET]: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, priority: 10 },

    // Subscription jobs - medium priority
    [JobType.SUBSCRIPTION_EXPIRY_CHECK]: { attempts: 2, priority: 5 },
    [JobType.SUBSCRIPTION_RENEWAL]: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, priority: 8 },
    [JobType.TRIAL_EXPIRY_CHECK]: { attempts: 2, priority: 5 },

    // AI jobs - lower priority, can be slow
    [JobType.GENERATE_NOTES]: { attempts: 2, backoff: { type: 'exponential', delay: 5000 }, priority: 3 },
    [JobType.GENERATE_MIND_MAP]: { attempts: 2, backoff: { type: 'exponential', delay: 5000 }, priority: 3 },
    [JobType.EVALUATE_ANSWER]: { attempts: 2, backoff: { type: 'exponential', delay: 5000 }, priority: 3 },
    [JobType.GENERATE_QUIZ]: { attempts: 2, backoff: { type: 'exponential', delay: 5000 }, priority: 3 },

    // Video jobs - lowest priority, very slow
    [JobType.GENERATE_VIDEO_SHORT]: { attempts: 2, backoff: { type: 'exponential', delay: 10000 }, priority: 1 },
    [JobType.PROCESS_VIDEO]: { attempts: 2, backoff: { type: 'exponential', delay: 10000 }, priority: 1 },

    // Lecture jobs - low priority, very long running
    [JobType.GENERATE_LECTURE]: { attempts: 2, backoff: { type: 'exponential', delay: 15000 }, priority: 2 },
    [JobType.COMPILE_LECTURE]: { attempts: 2, backoff: { type: 'exponential', delay: 10000 }, priority: 2 },

    // Data jobs - medium priority
    [JobType.GENERATE_INVOICE]: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, priority: 6 },
    [JobType.EXPORT_USER_DATA]: { attempts: 2, priority: 4 },
    [JobType.CLEANUP_TEMP_DATA]: { attempts: 1, priority: 1 },

    // Analytics jobs - low priority, fire-and-forget
    [JobType.TRACK_EVENT]: { removeOnComplete: true, priority: 1 },
    [JobType.UPDATE_METRICS]: { attempts: 2, priority: 2 },
};

// ═══════════════════════════════════════════════════════════════
// JOB HANDLER TYPES
// ═══════════════════════════════════════════════════════════════

export type JobHandler<T extends JobPayload = JobPayload> = (job: Job<T>) => Promise<void>;

export interface JobHandlers {
    [JobType.SEND_WELCOME_EMAIL]?: JobHandler<EmailJobPayload>;
    [JobType.SEND_RENEWAL_REMINDER]?: JobHandler<EmailJobPayload>;
    [JobType.SEND_PAYMENT_CONFIRMATION]?: JobHandler<EmailJobPayload>;
    [JobType.SEND_PASSWORD_RESET]?: JobHandler<EmailJobPayload>;
    [JobType.SUBSCRIPTION_EXPIRY_CHECK]?: JobHandler<SubscriptionJobPayload>;
    [JobType.SUBSCRIPTION_RENEWAL]?: JobHandler<SubscriptionJobPayload>;
    [JobType.TRIAL_EXPIRY_CHECK]?: JobHandler<SubscriptionJobPayload>;
    [JobType.GENERATE_NOTES]?: JobHandler<AIJobPayload>;
    [JobType.GENERATE_MIND_MAP]?: JobHandler<AIJobPayload>;
    [JobType.EVALUATE_ANSWER]?: JobHandler<AIJobPayload>;
    [JobType.GENERATE_QUIZ]?: JobHandler<AIJobPayload>;
    [JobType.GENERATE_VIDEO_SHORT]?: JobHandler<VideoJobPayload>;
    [JobType.PROCESS_VIDEO]?: JobHandler<VideoJobPayload>;
    [JobType.GENERATE_LECTURE]?: JobHandler<LectureJobPayload>;
    [JobType.COMPILE_LECTURE]?: JobHandler<CompilationJobPayload>;
    [JobType.GENERATE_INVOICE]?: JobHandler<InvoiceJobPayload>;
    [JobType.EXPORT_USER_DATA]?: JobHandler;
    [JobType.CLEANUP_TEMP_DATA]?: JobHandler;
    [JobType.TRACK_EVENT]?: JobHandler<AnalyticsJobPayload>;
    [JobType.UPDATE_METRICS]?: JobHandler<AnalyticsJobPayload>;
}

// ═══════════════════════════════════════════════════════════════
// WORKER QUEUE SERVICE
// ═══════════════════════════════════════════════════════════════

const QUEUE_NAME = 'upsc-worker-queue';
const QUEUE_CONNECTION = process.env.REDIS_URL || 'redis://localhost:6379';

export class WorkerQueueService {
    private queue: Queue;
    private workers: Map<string, Worker> = new Map();
    private queueEvents: QueueEvents;
    private scheduler?: QueueScheduler;
    private isInitialized = false;

    constructor() {
        const connection = {
            url: QUEUE_CONNECTION,
        };

        this.queue = new Queue(QUEUE_NAME, { connection });
        this.queueEvents = new QueueEvents(QUEUE_NAME, { connection });
        this.scheduler = new QueueScheduler(QUEUE_NAME, { connection });

        logger.info('[WorkerQueue] Service initialized');
    }

    /**
     * Initialize the worker queue with handlers
     */
    async initialize(handlers: JobHandlers): Promise<void> {
        if (this.isInitialized) {
            logger.warn('[WorkerQueue] Already initialized');
            return;
        }

        // Create worker for each job type
        for (const [jobType, handler] of Object.entries(handlers)) {
            if (handler) {
                await this.registerHandler(jobType as JobType, handler);
            }
        }

        // Set up event listeners
        this.setupEventListeners();

        this.isInitialized = true;
        logger.info('[WorkerQueue] All handlers registered');
    }

    /**
     * Register a job handler
     */
    async registerHandler<T extends JobPayload>(jobType: JobType, handler: JobHandler<T>): Promise<void> {
        const worker = new Worker<T>(
            QUEUE_NAME,
            async (job: Job<T>) => {
                const startTime = Date.now();
                logger.info('[WorkerQueue] Job started', {
                    jobId: job.id,
                    jobType: job.name,
                    data: job.data,
                });

                try {
                    await handler(job);

                    logger.info('[WorkerQueue] Job completed', {
                        jobId: job.id,
                        jobType: job.name,
                        duration: Date.now() - startTime,
                    });
                } catch (error) {
                    logger.error('[WorkerQueue] Job failed', {
                        jobId: job.id,
                        jobType: job.name,
                        attempts: job.attemptsMade,
                    }, error as Error);
                    throw error;
                }
            },
            {
                connection: { url: QUEUE_CONNECTION },
                concurrency: 5, // Process 5 jobs concurrently
            }
        );

        this.workers.set(jobType, worker);
        logger.debug('[WorkerQueue] Handler registered', { jobType });
    }

    /**
     * Set up queue event listeners
     */
    private setupEventListeners(): void {
        this.queueEvents.on('completed', ({ jobId }) => {
            logger.debug('[WorkerQueue] Job completed', { jobId });
        });

        this.queueEvents.on('failed', ({ jobId, failedReason }) => {
            logger.error('[WorkerQueue] Job failed', { jobId, reason: failedReason });
        });

        this.queueEvents.on('progress', ({ jobId, data }) => {
            logger.debug('[WorkerQueue] Job progress', { jobId, progress: data });
        });

        this.queueEvents.on('stalled', ({ jobId }) => {
            logger.warn('[WorkerQueue] Job stalled', { jobId });
        });
    }

    /**
     * Add a job to the queue
     */
    async addJob<T extends JobPayload>(
        jobType: JobType,
        payload: T,
        options?: JobOptions
    ): Promise<Job<T>> {
        const defaultOptions = DEFAULT_JOB_OPTIONS[jobType] || {};
        const jobId = `${jobType}:${payload instanceof Object && 'userId' in payload ? (payload as any).userId : Date.now()}:${Date.now()}`;

        const job = await this.queue.add<T>(jobType, payload as T, {
            jobId,
            ...defaultOptions,
            ...options,
        });

        logger.debug('[WorkerQueue] Job added', {
            jobId: job.id,
            jobType,
            delay: options?.delay,
            priority: options?.priority,
        });

        return job;
    }

    /**
     * Add job with delay
     */
    async addDelayedJob<T extends JobPayload>(
        jobType: JobType,
        payload: T,
        delayMs: number,
        options?: JobOptions
    ): Promise<Job<T>> {
        return this.addJob(jobType, payload, { ...options, delay: delayMs });
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }> {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
            this.queue.getDelayedCount(),
        ]);

        return { waiting, active, completed, failed, delayed };
    }

    /**
     * Get jobs by status
     */
    async getJobs(status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed', count = 10): Promise<Job[]> {
        return this.queue.getJobs([status], 0, count, true);
    }

    /**
     * Retry a failed job
     */
    async retryJob(jobId: string): Promise<void> {
        const job = await this.queue.getJob(jobId);
        if (job) {
            await job.retry();
            logger.info('[WorkerQueue] Job retried', { jobId });
        }
    }

    /**
     * Cancel a job
     */
    async cancelJob(jobId: string): Promise<void> {
        const job = await this.queue.getJob(jobId);
        if (job) {
            await job.remove();
            logger.info('[WorkerQueue] Job cancelled', { jobId });
        }
    }

    /**
     * Drain the queue (remove all waiting jobs)
     */
    async drainQueue(): Promise<void> {
        await this.queue.drain();
        logger.warn('[WorkerQueue] Queue drained');
    }

    /**
     * Pause the queue
     */
    async pause(): Promise<void> {
        await this.queue.pause();
        logger.warn('[WorkerQueue] Queue paused');
    }

    /**
     * Resume the queue
     */
    async resume(): Promise<void> {
        await this.queue.resume();
        logger.info('[WorkerQueue] Queue resumed');
    }

    /**
     * Close the queue and all workers
     */
    async close(): Promise<void> {
        // Close all workers
        for (const worker of this.workers.values()) {
            await worker.close();
        }
        this.workers.clear();

        // Close queue events
        await this.queueEvents.close();

        // Close scheduler
        await this.scheduler?.close();

        // Close queue
        await this.queue.close();

        logger.info('[WorkerQueue] Service closed');
    }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Singleton instance
let workerQueueInstance: WorkerQueueService | null = null;

export function getWorkerQueue(): WorkerQueueService {
    if (!workerQueueInstance) {
        workerQueueInstance = new WorkerQueueService();
    }
    return workerQueueInstance;
}

/**
 * Initialize worker queue with handlers
 */
export async function initializeWorkerQueue(handlers: JobHandlers): Promise<void> {
    const queue = getWorkerQueue();
    await queue.initialize(handlers);
}

/**
 * Quick helpers for adding common jobs
 */
export const QueueHelpers = {
    // Email helpers
    sendWelcomeEmail: async (to: string, name: string) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.SEND_WELCOME_EMAIL, {
            to,
            subject: 'Welcome to UPSC CSE Master!',
            template: 'welcome',
            data: { name },
        });
    },

    sendRenewalReminder: async (to: string, name: string, planName: string, expiryDate: string) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.SEND_RENEWAL_REMINDER, {
            to,
            subject: 'Your subscription is expiring soon',
            template: 'renewal-reminder',
            data: { name, planName, expiryDate },
        });
    },

    sendPaymentConfirmation: async (to: string, name: string, amount: number, planName: string) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.SEND_PAYMENT_CONFIRMATION, {
            to,
            subject: 'Payment confirmed',
            template: 'payment-confirmation',
            data: { name, amount, planName },
        });
    },

    sendPasswordReset: async (to: string, resetUrl: string) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.SEND_PASSWORD_RESET, {
            to,
            subject: 'Reset your password',
            template: 'password-reset',
            data: { resetUrl },
        });
    },

    // AI helpers
    generateNotes: async (userId: string, prompt: string, options?: Record<string, unknown>) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.GENERATE_NOTES, { userId, prompt, options });
    },

    generateMindMap: async (userId: string, topic: string, options?: Record<string, unknown>) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.GENERATE_MIND_MAP, { userId, prompt: topic, options });
    },

    evaluateAnswer: async (userId: string, answerText: string, options?: Record<string, unknown>) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.EVALUATE_ANSWER, { userId, prompt: answerText, options });
    },

    // Subscription helpers
    checkSubscriptionExpiry: async (userId: string, subscriptionId: string) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.SUBSCRIPTION_EXPIRY_CHECK, { userId, subscriptionId });
    },

    // Invoice helpers
    generateInvoice: async (paymentId: string, userId: string) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.GENERATE_INVOICE, { paymentId, userId });
    },

    // Analytics helpers
    trackEvent: async (event: string, userId?: string, properties?: Record<string, unknown>) => {
        const queue = getWorkerQueue();
        return queue.addJob(JobType.TRACK_EVENT, { event, userId, properties });
    },
};
