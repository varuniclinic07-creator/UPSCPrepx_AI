/**
 * UPSC Video Render Server
 * Express + node-canvas + FFmpeg template engine
 *
 * Endpoints:
 *   POST /render      — { composition, inputProps, format, resolution } (shorts-generator)
 *   POST /api/render  — { scenes, topic, style } (video-agent)
 *   GET  /status/:id  — poll job status
 *   GET  /download/:id — download rendered file
 *   GET  /health      — health check
 */

const express = require('express');
const cors = require('cors');
const { createCanvas } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const OUTPUT_DIR = '/app/output';
const FRAMES_DIR = '/app/frames';
const PORT = parseInt(process.env.PORT || '3001', 10);
const FPS = 30;

// Ensure directories exist
[OUTPUT_DIR, FRAMES_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// In-memory job store
const jobs = {};

// Load composition modules
const compositions = {};
const COMP_DIR = path.join(__dirname, 'compositions');
if (fs.existsSync(COMP_DIR)) {
  for (const file of fs.readdirSync(COMP_DIR)) {
    if (file.endsWith('.js')) {
      const name = path.basename(file, '.js');
      compositions[name] = require(path.join(COMP_DIR, file));
    }
  }
}

// ── Endpoints ────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'video-render',
    version: '2.0.0',
    compositions: Object.keys(compositions),
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'UPSC Video Render Server',
    status: 'running',
    endpoints: ['/health', '/render', '/api/render', '/status/:id', '/download/:id'],
  });
});

// POST /render — composition-based render (shorts-generator contract)
app.post('/render', async (req, res) => {
  const { composition, inputProps, format = 'mp4', resolution = '1080x1920' } = req.body;
  const jobId = uuidv4();
  const [width, height] = resolution.split('x').map(Number);

  jobs[jobId] = { status: 'queued', composition, format };

  // Start rendering in background
  renderComposition(jobId, composition, inputProps || {}, format, width || 1080, height || 1920);

  res.json({ job_id: jobId, jobId, status: 'queued', message: `Render job ${jobId} queued` });
});

// POST /api/render — scene-based render (video-agent contract)
app.post('/api/render', async (req, res) => {
  const { scenes, topic, style = 'default' } = req.body;
  const jobId = uuidv4();

  jobs[jobId] = { status: 'queued', topic, style, format: 'mp4' };

  // Convert scenes to composition sequence
  renderSceneSequence(jobId, scenes || [], topic || 'UPSC Topic', style);

  res.json({ job_id: jobId, jobId, id: jobId, status: 'queued', message: `Scene render ${jobId} queued` });
});

app.get('/status/:id', (req, res) => {
  const job = jobs[req.params.id];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({
    job_id: req.params.id,
    status: job.status,
    error: job.error,
    videoUrl: job.videoUrl,
    thumbnailUrl: job.thumbnailUrl,
    output_available: !!job.outputPath,
  });
});

app.get('/download/:id', (req, res) => {
  const job = jobs[req.params.id];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'completed') return res.status(400).json({ error: `Job status: ${job.status}` });
  if (!job.outputPath || !fs.existsSync(job.outputPath)) return res.status(404).json({ error: 'File not found' });
  res.download(job.outputPath);
});

// ── Render Logic ─────────────────────────────────────────────

async function renderComposition(jobId, compositionName, props, format, width, height) {
  try {
    jobs[jobId].status = 'rendering';

    const comp = compositions[compositionName] || compositions['title-card'];
    if (!comp) {
      throw new Error(`Composition "${compositionName}" not found`);
    }

    const duration = props.duration || 5;
    const totalFrames = duration * FPS;
    const framesDir = path.join(FRAMES_DIR, jobId);
    fs.mkdirSync(framesDir, { recursive: true });

    // Generate frames
    for (let frame = 0; frame < totalFrames; frame++) {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      comp.render(ctx, props, frame, totalFrames, width, height);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(path.join(framesDir, `frame_${String(frame).padStart(5, '0')}.png`), buffer);
    }

    // Assemble with FFmpeg
    const outputPath = path.join(OUTPUT_DIR, `${jobId}.${format}`);
    await assembleFrames(framesDir, outputPath, FPS, width, height);

    jobs[jobId].status = 'completed';
    jobs[jobId].outputPath = outputPath;
    jobs[jobId].videoUrl = `/download/${jobId}`;

    // Cleanup frames
    fs.rmSync(framesDir, { recursive: true, force: true });

  } catch (err) {
    jobs[jobId].status = 'failed';
    jobs[jobId].error = err.message;
    console.error(`Render failed for ${jobId}:`, err.message);
  }
}

async function renderSceneSequence(jobId, scenes, topic, style) {
  try {
    jobs[jobId].status = 'rendering';

    const width = 1920;
    const height = 1080;
    const framesDir = path.join(FRAMES_DIR, jobId);
    fs.mkdirSync(framesDir, { recursive: true });

    let frameIndex = 0;

    // Title card (3 seconds)
    const titleComp = compositions['title-card'] || compositions['TitleCard'];
    if (titleComp) {
      for (let f = 0; f < 3 * FPS; f++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        titleComp.render(ctx, { title: topic, style }, f, 3 * FPS, width, height);
        fs.writeFileSync(path.join(framesDir, `frame_${String(frameIndex++).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
      }
    }

    // Each scene
    for (const scene of scenes.slice(0, 10)) {
      const duration = scene.duration || 5;
      const sceneFPS = duration * FPS;

      // Use bullet-points composition for scene content
      const sceneComp = compositions['bullet-points'] || Object.values(compositions)[0];
      if (sceneComp) {
        for (let f = 0; f < sceneFPS; f++) {
          const canvas = createCanvas(width, height);
          const ctx = canvas.getContext('2d');
          sceneComp.render(ctx, {
            title: scene.onScreenText || `Scene ${scene.sceneNumber || ''}`,
            items: [scene.narration || '', scene.visualDescription || ''],
            style,
          }, f, sceneFPS, width, height);
          fs.writeFileSync(path.join(framesDir, `frame_${String(frameIndex++).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
        }
      }
    }

    // Credits (2 seconds)
    const creditsComp = compositions['credits-slide'];
    if (creditsComp) {
      for (let f = 0; f < 2 * FPS; f++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        creditsComp.render(ctx, { title: 'UPSC PrepX-AI' }, f, 2 * FPS, width, height);
        fs.writeFileSync(path.join(framesDir, `frame_${String(frameIndex++).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
      }
    }

    // Assemble
    const outputPath = path.join(OUTPUT_DIR, `${jobId}.mp4`);
    await assembleFrames(framesDir, outputPath, FPS, width, height);

    jobs[jobId].status = 'completed';
    jobs[jobId].outputPath = outputPath;
    jobs[jobId].videoUrl = `/download/${jobId}`;

    fs.rmSync(framesDir, { recursive: true, force: true });

  } catch (err) {
    jobs[jobId].status = 'failed';
    jobs[jobId].error = err.message;
    console.error(`Scene render failed for ${jobId}:`, err.message);
  }
}

function assembleFrames(framesDir, outputPath, fps, width, height) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(framesDir, 'frame_%05d.png'))
      .inputFPS(fps)
      .videoCodec('libx264')
      .outputOptions(['-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '23'])
      .size(`${width}x${height}`)
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// ── Start Server ─────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video Render Server running on port ${PORT}`);
  console.log(`Compositions loaded: ${Object.keys(compositions).join(', ')}`);
});
