// ═══════════════════════════════════════════════════════════════
// BULLMQ WORKER - MAIN
// Processes lecture generation jobs
// ═══════════════════════════════════════════════════════════════

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { orchestrateLecture } = require('./lecture-orchestrator');
const { compileVideo } = require('./compilation-worker');

const redis = new Redis(process.env.REDIS_URL);

// Main lecture worker
const lectureWorker = new Worker(
    'lectures',
    async (job) => {
        console.log(`Processing lecture job: ${job.id}`);

        try {
            await orchestrateLecture(job.data.jobId);
            return { success: true, lectureId: job.data.jobId };
        } catch (error) {
            console.error('Lecture worker error:', error);
            throw error;
        }
    },
    {
        connection: redis,
        concurrency: 2, // Process 2 lectures at a time
        limiter: {
            max: 5,
            duration: 60000 // Max 5 jobs per minute
        }
    }
);

// Compilation worker
const compilationWorker = new Worker(
    'lecture-compilation',
    async (job) => {
        console.log(`Compiling lecture: ${job.data.lectureJobId}`);

        try {
            const videoUrl = await compileVideo(job.data.lectureJobId);
            return { success: true, videoUrl };
        } catch (error) {
            console.error('Compilation worker error:', error);
            throw error;
        }
    },
    {
        connection: redis,
        concurrency: 1 // One compilation at a time (resource-intensive)
    }
);

// Event listeners
lectureWorker.on('completed', (job, result) => {
    console.log(`✅ Lecture job ${job.id} completed:`, result);
});

lectureWorker.on('failed', (job, error) => {
    console.error(`❌ Lecture job ${job?.id} failed:`, error.message);
});

compilationWorker.on('completed', (job, result) => {
    console.log(`✅ Compilation ${job.id} completed:`, result);
});

compilationWorker.on('failed', (job, error) => {
    console.error(`❌ Compilation ${job?.id} failed:`, error.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down workers...');
    await lectureWorker.close();
    await compilationWorker.close();
    process.exit(0);
});

console.log('🚀 BullMQ workers started');
console.log('- Lecture worker: 2 concurrent jobs');
console.log('- Compilation worker: 1 concurrent job');
