// ═══════════════════════════════════════════════════════════════
// LECTURE QUEUE SETUP
// BullMQ queue for 3-hour lecture generation
// ═══════════════════════════════════════════════════════════════

import { Queue } from 'bullmq';
import type RedisType from 'ioredis';

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
let _redis: RedisType | null = null;
let _redisChecked = false;
function getRedis(): RedisType | null {
    if (_redis) return _redis;
    if (_redisChecked) return null;
    _redisChecked = true;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.warn('[LectureQueue] REDIS_URL not set — queue operations disabled');
        return null;
    }
    try {
        const IORedis = require('ioredis');
        _redis = new IORedis(redisUrl);
        return _redis;
    } catch {
        console.warn('[LectureQueue] ioredis not available');
        return null;
    }
}

function createQueue<T>(name: string, opts?: object): Queue<T> | null {
    const redis = getRedis();
    if (!redis) return null;
    return new Queue<T>(name, {
        connection: redis,
        defaultJobOptions: { attempts: 2, ...opts },
    });
}

let _lectureQueue: Queue<LectureJobData> | null = null;
function getLectureQueue(): Queue<LectureJobData> | null {
    if (!_lectureQueue) {
        _lectureQueue = createQueue<LectureJobData>('lectures', {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 },
            removeOnComplete: 50,
            removeOnFail: 100,
        });
    }
    return _lectureQueue;
}

let _outlineQueue: Queue<LectureJobData> | null = null;
function getOutlineQueue() {
    if (!_outlineQueue) _outlineQueue = createQueue<LectureJobData>('lecture-outline');
    return _outlineQueue;
}

let _scriptQueue: Queue<ChapterJobData> | null = null;
function getScriptQueue() {
    if (!_scriptQueue) _scriptQueue = createQueue<ChapterJobData>('lecture-scripts');
    return _scriptQueue;
}

let _visualQueue: Queue<ChapterJobData> | null = null;
function getVisualQueue() {
    if (!_visualQueue) _visualQueue = createQueue<ChapterJobData>('lecture-visuals');
    return _visualQueue;
}

let _ttsQueue: Queue<ChapterJobData> | null = null;
function getTtsQueue() {
    if (!_ttsQueue) _ttsQueue = createQueue<ChapterJobData>('lecture-tts');
    return _ttsQueue;
}

let _compilationQueue: Queue<{ lectureJobId: string }> | null = null;
function getCompilationQueue() {
    if (!_compilationQueue) _compilationQueue = createQueue<{ lectureJobId: string }>('lecture-compilation', { attempts: 1 });
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
    if (!queue) {
        return { jobId: 'noop', queuePosition: 0 };
    }

    const job = await queue.add('generate-lecture', data, { priority: 3 });
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
    if (!queue) return { found: false };

    const job = await queue.getJob(jobId);
    if (!job) return { found: false };

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
    if (!queue) return false;

    const job = await queue.getJob(jobId);
    if (job && (await job.getState()) !== 'completed') {
        await job.remove();
        return true;
    }
    return false;
}
