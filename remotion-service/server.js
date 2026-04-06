/**
 * UPSC Remotion Video Rendering Service
 * Renders educational videos for UPSC preparation
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8034;
const OUTPUT_DIR = '/app/output';
const CONCURRENCY = parseInt(process.env.REMOTION_CONCURRENCY || '2');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Job tracking
const jobs = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'remotion-video',
        version: '1.0.0',
        concurrency: CONCURRENCY
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'UPSC Remotion Video Service',
        status: 'running',
        endpoints: ['/health', '/render', '/status/:jobId', '/download/:jobId']
    });
});

// Render video endpoint
app.post('/render', async (req, res) => {
    try {
        const { compositionId, inputProps, durationInFrames, fps, width, height } = req.body;

        const jobId = uuidv4();

        jobs.set(jobId, {
            status: 'queued',
            compositionId,
            inputProps,
            durationInFrames: durationInFrames || 300,
            fps: fps || 30,
            width: width || 1920,
            height: height || 1080,
            outputPath: null,
            createdAt: new Date().toISOString()
        });

        // Queue the rendering job (in production, use a proper queue)
        processRenderJob(jobId);

        res.json({
            jobId,
            status: 'queued',
            message: `Video rendering job ${jobId} queued`
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to queue render job',
            message: error.message
        });
    }
});

// Process render job (simplified - in production use Remotion renderer)
async function processRenderJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) return;

    job.status = 'rendering';
    jobs.set(jobId, job);

    try {
        // Simulate rendering (in production, use @remotion/renderer)
        // const { renderMedia } = require('@remotion/renderer');

        const outputPath = path.join(OUTPUT_DIR, `${jobId}.mp4`);

        // Placeholder: In production, this would call Remotion's renderMedia
        // For now, we'll simulate a delay
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Create a placeholder file for testing
        fs.writeFileSync(outputPath, 'placeholder');

        job.status = 'completed';
        job.outputPath = outputPath;
        job.completedAt = new Date().toISOString();
        jobs.set(jobId, job);

    } catch (error) {
        job.status = 'failed';
        job.error = error.message;
        jobs.set(jobId, job);
    }
}

// Get job status
app.get('/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
        jobId,
        status: job.status,
        compositionId: job.compositionId,
        error: job.error,
        outputAvailable: job.outputPath !== null,
        createdAt: job.createdAt,
        completedAt: job.completedAt
    });
});

// Download rendered video
app.get('/download/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
        return res.status(400).json({ error: `Job status: ${job.status}` });
    }

    if (!job.outputPath || !fs.existsSync(job.outputPath)) {
        return res.status(404).json({ error: 'Output file not found' });
    }

    res.download(job.outputPath, `video-${jobId}.mp4`);
});

// List all jobs
app.get('/jobs', (req, res) => {
    const jobList = Array.from(jobs.entries()).map(([id, job]) => ({
        jobId: id,
        status: job.status,
        compositionId: job.compositionId,
        createdAt: job.createdAt
    }));

    res.json({ jobs: jobList });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`UPSC Remotion Video Service running on port ${PORT}`);
    console.log(`Concurrency: ${CONCURRENCY}`);
});
