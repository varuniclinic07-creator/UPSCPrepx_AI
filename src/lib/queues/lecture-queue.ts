// ═══════════════════════════════════════════════════════════════
// LECTURE QUEUE SETUP
// BullMQ queue for 3-hour lecture generation
// ═══════════════════════════════════════════════════════════════

import { Queue } from 'bullmq';
import Redis from 'ioredis';

export interface LectureJobData {
    jobId: string;
    userId: string;
    topic: string;
    subject: string;
    language: string;
    targetDuration: number; // minutes
}

export interface ChapterJobData {
    lectureJobId: string;
    chapterNumber: number;
    title: string;
    content: string;
}

// Lazy-init Redis and queues to avoid connection at import time
let _redis: Redis | null = null;
function getRedis(): Redis {
    if (!_redis) _redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    return _redis;
}

let _lectureQueue: Queue<LectureJobData> | null = null;
function getLectureQueue(): Queue<LectureJobData> {
    if (!_lectureQueue) {
        _lectureQueue = new Queue<LectureJobData>('lectures', {
            connection: getRedis(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 10000 },
                removeOnComplete: 50,
                removeOnFail: 100,
            },
        });
    }
    return _lectureQueue;
}

let _outlineQueue: Queue<LectureJobData> | null = null;
function getOutlineQueue(): Queue<LectureJobData> {
    if (!_outlineQueue) {
        _outlineQueue = new Queue<LectureJobData>('lecture-outline', {
            connection: getRedis(),
            defaultJobOptions: { attempts: 2 },
        });
    }
    return _outlineQueue;
}

let _scriptQueue: Queue<ChapterJobData> | null = null;
function getScriptQueue(): Queue<ChapterJobData> {
    if (!_scriptQueue) {
        _scriptQueue = new Queue<ChapterJobData>('lecture-scripts', {
            connection: getRedis(),
            defaultJobOptions: { attempts: 2 },
        });
    }
    return _scriptQueue;
}

let _visualQueue: Queue<ChapterJobData> | null = null;
function getVisualQueue(): Queue<ChapterJobData> {
    if (!_visualQueue) {
        _visualQueue = new Queue<ChapterJobData>('lecture-visuals', {
            connection: getRedis(),
            defaultJobOptions: { attempts: 2 },
        });
    }
    return _visualQueue;
}

let _ttsQueue: Queue<ChapterJobData> | null = null;
function getTtsQueue(): Queue<ChapterJobData> {
    if (!_ttsQueue) {
        _ttsQueue = new Queue<ChapterJobData>('lecture-tts', {
            connection: getRedis(),
            defaultJobOptions: { attempts: 2 },
        });
    }
    return _ttsQueue;
}

let _compilationQueue: Queue<{ lectureJobId: string }> | null = null;
function getCompilationQueue(): Queue<{ lectureJobId: string }> {
    if (!_compilationQueue) {
        _compilationQueue = new Queue<{ lectureJobId: string }>('lecture-compilation', {
            connection: getRedis(),
            defaultJobOptions: { attempts: 1 },
        });
    }
    return _compilationQueue;
}

// Re-export as getters for backward compatibility
export const lectureQueue = { get: getLectureQueue };
export const outlineQueue = { get: getOutlineQueue };
export const scriptQueue = { get: getScriptQueue };
export const visualQueue = { get: getVisualQueue };
export const ttsQueue = { get: getTtsQueue };
export const compilationQueue = { get: getCompilationQueue };

/**
 * Add lecture generation job
 */
export async function addLectureJob(data: LectureJobData) {
    const queue = getLectureQueue();
    const job = await queue.add('generate-lecture', data, {
        priority: 3,
    });

    return {
        jobId: job.id!,
        queuePosition: await queue.getWaitingCount(),
    };
}

/**
 * Get job status
 */
export async function getLectureJobStatus(jobId: string) {
    const queue = getLectureQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
        return { found: false };
    }

    const state = await job.getState();

    return {
        found: true,
        state,
        progress: job.progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
    };
}

/**
 * Cancel lecture job
 */
export async function cancelLectureJob(jobId: string) {
    const queue = getLectureQueue();
    const job = await queue.getJob(jobId);

    if (job && (await job.getState()) !== 'completed') {
        await job.remove();
        return true;
    }

    return false;
}
