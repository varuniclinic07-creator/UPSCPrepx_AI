// ═══════════════════════════════════════════════════════════════
// JOB MONITORING SERVICE
// Monitor queue health and job progress
// ═══════════════════════════════════════════════════════════════

import { Job } from 'bullmq';
import { lectureQueue, compilationQueue } from './lecture-queue';

export interface QueueStats {
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

/**
 * Get stats for all queues
 */
export async function getAllQueueStats(): Promise<QueueStats[]> {
    const queues = [
        { name: 'lectures', queue: lectureQueue.get() },
        { name: 'compilation', queue: compilationQueue.get() }
    ];

    const stats = await Promise.all(
        queues.map(async ({ name, queue }) => {
            if (!queue) {
                return { name, waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
            }
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount()
            ]);

            return {
                name,
                waiting,
                active,
                completed,
                failed,
                delayed
            };
        })
    );

    return stats;
}

/**
 * Get failed jobs for retry
 */
export async function getFailedJobs(limit: number = 10) {
    const queue = lectureQueue.get();
    if (!queue) return [];
    const failed = await queue.getFailed(0, limit);

    return failed.map((job: Job) => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp
    }));
}

/**
 * Retry failed job
 */
export async function retryFailedJob(jobId: string) {
    const queue = lectureQueue.get();
    if (!queue) return false;
    const job = await queue.getJob(jobId);

    if (job) {
        await job.retry();
        return true;
    }

    return false;
}

/**
 * Clean old completed jobs
 */
export async function cleanOldJobs(olderThan: number = 7 * 24 * 60 * 60 * 1000) {
    const grace = olderThan;
    const lq = lectureQueue.get();
    const cq = compilationQueue.get();

    if (lq) {
        await lq.clean(grace, 1000, 'completed');
        await lq.clean(grace, 1000, 'failed');
    }
    if (cq) {
        await cq.clean(grace, 1000, 'completed');
        await cq.clean(grace, 1000, 'failed');
    }
}

/**
 * Get active jobs with progress
 */
export async function getActiveJobs() {
    const queue = lectureQueue.get();
    if (!queue) return [];
    const active = await queue.getActive();

    return active.map((job: Job) => ({
        id: job.id,
        data: job.data,
        progress: job.progress,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade
    }));
}