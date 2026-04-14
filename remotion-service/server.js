/**
 * UPSC Video Rendering Service — FFmpeg-based
 *
 * Assembles educational videos from scenes (images + audio + text overlays)
 * using FFmpeg. Replaces the previous Remotion stub with real rendering.
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8034;
const OUTPUT_DIR = '/app/output';
const TEMP_DIR = '/app/temp';
const CONCURRENCY = parseInt(process.env.REMOTION_CONCURRENCY || '2');

// Ensure directories exist
[OUTPUT_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Job tracking
const jobs = new Map();
let activeJobs = 0;

// ─── Health ─────────────────────────────────────────────────────

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'video-render-ffmpeg',
        version: '2.0.0',
        concurrency: CONCURRENCY,
        activeJobs,
    });
});

app.get('/', (req, res) => {
    res.json({
        service: 'UPSC Video Rendering Service (FFmpeg)',
        status: 'running',
        endpoints: ['/health', '/render', '/api/render', '/status/:jobId', '/download/:jobId', '/jobs'],
    });
});

// ─── Render endpoint ────────────────────────────────────────────

async function handleRender(req, res) {
    try {
        const {
            scenes,         // [{ imageUrl, audioUrl, text, duration }]
            audioUrl,       // single audio track for entire video
            imageUrls,      // array of image URLs (simple slideshow)
            text,           // text overlay
            compositionId,  // backward compat
            inputProps,     // backward compat
            durationInFrames,
            fps = 30,
            width = 1920,
            height = 1080,
        } = req.body;

        const jobId = uuidv4();

        jobs.set(jobId, {
            status: 'queued',
            compositionId: compositionId || 'ffmpeg-render',
            progress: 0,
            outputPath: null,
            createdAt: new Date().toISOString(),
        });

        // Fire-and-forget
        processRenderJob(jobId, { scenes, audioUrl, imageUrls, text, width, height, fps, durationInFrames });

        res.json({ jobId, status: 'queued', message: `Render job ${jobId} queued` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to queue render', message: error.message });
    }
}

// Support both /render and /api/render (video-agent uses /api/render)
app.post('/render', handleRender);
app.post('/api/render', handleRender);

// ─── FFmpeg rendering logic ─────────────────────────────────────

async function processRenderJob(jobId, opts) {
    if (activeJobs >= CONCURRENCY) {
        // Simple backpressure — wait until a slot opens
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (activeJobs < CONCURRENCY) { clearInterval(interval); resolve(); }
            }, 1000);
        });
    }

    activeJobs++;
    const job = jobs.get(jobId);
    job.status = 'rendering';
    jobs.set(jobId, job);

    const jobDir = path.join(TEMP_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    try {
        const outputPath = path.join(OUTPUT_DIR, `${jobId}.mp4`);
        const { scenes, audioUrl, imageUrls, text, width, height, fps } = opts;

        if (scenes && scenes.length > 0) {
            // Multi-scene assembly: each scene has image + audio + optional text
            await renderMultiScene(jobId, jobDir, scenes, outputPath, width, height, fps);
        } else if (imageUrls && imageUrls.length > 0 && audioUrl) {
            // Simple slideshow: images + single audio track
            await renderSlideshow(jobId, jobDir, imageUrls, audioUrl, outputPath, width, height);
        } else if (audioUrl) {
            // Audio-only: black screen + audio
            await renderAudioOnly(jobDir, audioUrl, text || '', outputPath, width, height);
        } else {
            // Static: text card for given duration
            const dur = opts.durationInFrames ? opts.durationInFrames / (fps || 30) : 10;
            await renderTextCard(jobDir, text || 'UPSC PrepX', dur, outputPath, width, height);
        }

        job.status = 'completed';
        job.outputPath = outputPath;
        job.progress = 100;
        job.completedAt = new Date().toISOString();
        jobs.set(jobId, job);
    } catch (error) {
        console.error(`[Render ${jobId}] Error:`, error.message);
        job.status = 'failed';
        job.error = error.message;
        jobs.set(jobId, job);
    } finally {
        activeJobs--;
        // Cleanup temp
        fs.rm(jobDir, { recursive: true, force: true }, () => {});
    }
}

async function renderMultiScene(jobId, jobDir, scenes, outputPath, w, h, fps) {
    const segments = [];
    const job = jobs.get(jobId);

    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const segPath = path.join(jobDir, `seg_${i}.mp4`);
        const duration = scene.duration || 10;

        let inputArgs = '';
        let filterArgs = '';

        if (scene.imageUrl) {
            inputArgs += `-loop 1 -i "${scene.imageUrl}" `;
        } else {
            inputArgs += `-f lavfi -i color=c=0x1A365D:s=${w}x${h}:d=${duration} `;
        }

        if (scene.audioUrl) {
            inputArgs += `-i "${scene.audioUrl}" `;
            filterArgs = `-c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest`;
        } else {
            filterArgs = `-t ${duration} -c:v libx264 -pix_fmt yuv420p`;
        }

        if (scene.text) {
            const escaped = scene.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
            filterArgs += ` -vf "scale=${w}:${h},drawtext=text='${escaped}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=h-80:box=1:boxcolor=black@0.5:boxborderw=10"`;
        } else if (scene.imageUrl) {
            filterArgs += ` -vf "scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2"`;
        }

        await execAsync(`ffmpeg -y ${inputArgs} ${filterArgs} "${segPath}"`, { timeout: 120000 });
        segments.push(segPath);

        job.progress = Math.round(((i + 1) / scenes.length) * 90);
        jobs.set(jobId, job);
    }

    // Concatenate all segments
    const concatFile = path.join(jobDir, 'concat.txt');
    fs.writeFileSync(concatFile, segments.map(s => `file '${s}'`).join('\n'));
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}"`, { timeout: 300000 });
}

async function renderSlideshow(jobId, jobDir, imageUrls, audioUrl, outputPath, w, h) {
    // Download/reference images and create slideshow with audio
    const concatFile = path.join(jobDir, 'images.txt');
    const durPerImage = 5; // 5 seconds per image default

    const entries = imageUrls.map(url => `file '${url}'\nduration ${durPerImage}`).join('\n');
    fs.writeFileSync(concatFile, entries);

    await execAsync(
        `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -i "${audioUrl}" ` +
        `-vf "scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2" ` +
        `-c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`,
        { timeout: 300000 }
    );
}

async function renderAudioOnly(jobDir, audioUrl, text, outputPath, w, h) {
    const escaped = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
    const textFilter = text
        ? `drawtext=text='${escaped}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`
        : '';

    await execAsync(
        `ffmpeg -y -f lavfi -i color=c=0x1A365D:s=${w}x${h} -i "${audioUrl}" ` +
        (textFilter ? `-vf "${textFilter}" ` : '') +
        `-c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`,
        { timeout: 300000 }
    );
}

async function renderTextCard(jobDir, text, duration, outputPath, w, h) {
    const escaped = text.replace(/'/g, "\\'").replace(/:/g, '\\:');

    await execAsync(
        `ffmpeg -y -f lavfi -i color=c=0x1A365D:s=${w}x${h}:d=${duration} ` +
        `-vf "drawtext=text='${escaped}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" ` +
        `-c:v libx264 -pix_fmt yuv420p "${outputPath}"`,
        { timeout: 60000 }
    );
}

// ─── Status / Download / List ───────────────────────────────────

app.get('/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    res.json({
        jobId: req.params.jobId,
        status: job.status,
        progress: job.progress,
        error: job.error,
        outputAvailable: !!job.outputPath,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
    });
});

app.get('/download/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'completed') return res.status(400).json({ error: `Job status: ${job.status}` });
    if (!job.outputPath || !fs.existsSync(job.outputPath)) return res.status(404).json({ error: 'File not found' });
    res.download(job.outputPath, `video-${req.params.jobId}.mp4`);
});

app.get('/jobs', (req, res) => {
    const list = Array.from(jobs.entries()).map(([id, j]) => ({
        jobId: id, status: j.status, progress: j.progress, createdAt: j.createdAt,
    }));
    res.json({ jobs: list, activeJobs });
});

// ─── Start ──────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
    console.log(`UPSC Video Rendering Service (FFmpeg) running on port ${PORT}`);
    console.log(`Concurrency: ${CONCURRENCY}`);
});
