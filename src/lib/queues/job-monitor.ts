// ═══════════════════════════════════════════════════════════════
// JOB MONITORING SERVICE
// Monitor queue health and job progress
// ═══════════════════════════════════════════════════════════════

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
        { name: 'lectures', queue: lectureQueue },
        { name: 'compilation', queue: compilationQueue }
    ];

    const stats = await Promise.all(
        queues.map(async ({ name, queue }) => {
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
    const failed = await lectureQueue.getFailed(0, limit);

    return failed.map(job => ({
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
    const job = await lectureQueue.getJob(jobId);

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

    await lectureQueue.clean(grace, 1000, 'completed');
    await lectureQueue.clean(grace, 1000, 'failed');
    await compilationQueue.clean(grace, 1000, 'completed');
    await compilationQueue.clean(grace, 1000, 'failed');
}

/**
 * Get active jobs with progress
 */
export async function getActiveJobs() {
    const active = await lectureQueue.getActive();

    return active.map(job => ({
        id: job.id,
        data: job.data,
        progress: job.progress,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade
    }));
}