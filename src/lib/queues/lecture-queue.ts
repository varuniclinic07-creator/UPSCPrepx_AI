// ═══════════════════════════════════════════════════════════════
// LECTURE QUEUE SETUP
// BullMQ queue for 3-hour lecture generation
// ═══════════════════════════════════════════════════════════════

import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

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

// Lecture queue for main orchestration
export const lectureQueue = new Queue<LectureJobData>('lectures', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 10000
        },
        removeOnComplete: 50,
        removeOnFail: 100
    }
});

// Outline generation queue
export const outlineQueue = new Queue<LectureJobData>('lecture-outline', {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
    }
});

// Script generation queue (one job per chapter)
export const scriptQueue = new Queue<ChapterJobData>('lecture-scripts', {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
    }
});

// Visual generation queue
export const visualQueue = new Queue<ChapterJobData>('lecture-visuals', {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
    }
});

// TTS generation queue
export const ttsQueue = new Queue<ChapterJobData>('lecture-tts', {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
    }
});

// Video compilation queue
export const compilationQueue = new Queue<{ lectureJobId: string }>('lecture-compilation', {
    connection: redis,
    defaultJobOptions: {
        attempts: 1,
    }
});

// Note: QueueScheduler was removed in BullMQ v4+
// Delayed job handling is now built into the Worker class

/**
 * Add lecture generation job
 */
export async function addLectureJob(data: LectureJobData) {
    const job = await lectureQueue.add('generate-lecture', data, {
        priority: 3 // MEDIUM priority
    });

    return {
        jobId: job.id!,
        queuePosition: await lectureQueue.getWaitingCount()
    };
}

/**
 * Get job status
 */
export async function getLectureJobStatus(jobId: string) {
    const job = await lectureQueue.getJob(jobId);

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
        failedReason: job.failedReason
    };
}

/**
 * Cancel lecture job
 */
export async function cancelLectureJob(jobId: string) {
    const job = await lectureQueue.getJob(jobId);

    if (job && (await job.getState()) !== 'completed') {
        await job.remove();
        return true;
    }

    return false;
}