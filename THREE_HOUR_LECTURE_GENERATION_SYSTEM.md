# 🎓 3-HOUR VIDEO LECTURE GENERATION SYSTEM
## Optimized for 10 RPM Rate Limit + VPS Resources

---

## 📋 EXECUTIVE SUMMARY

### The Challenge
```
3-Hour Lecture = 180 minutes of content
Traditional Approach = 50-100 API calls = 5-10 minutes of API time
At 10 RPM = Would block other users for 10 minutes
```

### The Solution: CHUNKED PROGRESSIVE GENERATION
```
Break lecture into 18 x 10-minute segments
Generate each segment independently
Queue-based background processing
Compile locally on VPS using FFmpeg
Progressive delivery (user can watch while rest generates)
```

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REQUEST                                  │
│                "Generate lecture on: Indian Freedom Movement"    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 1: OUTLINE GENERATION                      │
│                    (1 API Call - TONGYI_RESEARCH)                │
│                                                                  │
│  Output: 18 chapters with titles, subtopics, duration            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 2: SCRIPT GENERATION                       │
│                    (18 API Calls - KIMI_THINKING)                │
│                    Queued: 2 calls/minute = 9 minutes            │
│                                                                  │
│  Output: Full narration script for each chapter                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 3: VISUAL GENERATION                       │
│                    (36 API Calls - IMAGE models)                 │
│                    Queued: 2 calls/minute = 18 minutes           │
│                    (~2 images per chapter)                       │
│                                                                  │
│  Output: Diagrams, maps, infographics for each chapter           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 4: TTS GENERATION                          │
│                    (18 API Calls - GEMINI_TTS)                   │
│                    Queued: 2 calls/minute = 9 minutes            │
│                                                                  │
│  Output: Audio narration for each chapter (10 min each)          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 5: VIDEO COMPILATION                       │
│                    (LOCAL - FFmpeg on VPS)                       │
│                    No API calls needed!                          │
│                                                                  │
│  Process: Combine images + audio + text overlays                 │
│  Output: 18 video segments → Merge into final 3-hour video       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FINAL OUTPUT                                     │
│                                                                  │
│  • Full 3-hour lecture video                                     │
│  • Chapter markers for navigation                                │
│  • Auto-generated PDF notes                                      │
│  • Quiz questions for each chapter                               │
└─────────────────────────────────────────────────────────────────┘

TOTAL API CALLS: ~73 calls
TOTAL API TIME: ~37 minutes (at 2 calls/min to leave capacity)
TOTAL PROCESSING: ~60-90 minutes
USER NOTIFICATION: When ready
```

---

## 🎯 OPTIMIZED GENERATION PROMPT

### MASTER PROMPT FOR AI IDE (Cursor/Windsurf/Claude Code)

```markdown
# 3-HOUR LECTURE VIDEO GENERATION SYSTEM

## PROJECT CONTEXT
Build a lecture video generation system for UPSC CSE preparation app.
- Rate Limit: 10 RPM on A4F API (use only 2-3 RPM for lectures to leave capacity)
- VPS: Self-hosted with FFmpeg, Node.js, PostgreSQL
- Must handle 3-hour lectures without blocking other users
- Progressive generation with queue system

## TECHNICAL STACK
- Backend: Node.js/Next.js API routes
- Queue: BullMQ with Redis
- Video: FFmpeg (local compilation)
- Storage: MinIO/S3 for video files
- Database: PostgreSQL/Supabase

## API CONFIGURATION
```typescript
const A4F_CONFIG = {
  API_KEY: "ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621",
  BASE_URL: "https://api.a4f.co/v1",
  
  MODELS: {
    // For outline generation (deep research)
    RESEARCH: "provider-2/tongyi-deepresearch-30b-a3b",
    
    // For script writing (extended thinking)
    SCRIPT: "provider-2/kimi-k2-thinking-tee",
    
    // For quick tasks
    FAST: "provider-3/grok-4.1-fast",
    
    // For images
    IMAGE_QUALITY: "provider-8/imagen-4",
    IMAGE_FAST: "provider-3/FLUX.1-schnell",
    IMAGE_DIAGRAM: "provider-3/flux-kontext-max",
    
    // For TTS
    TTS: "provider-3/gemini-2.5-flash-preview-tts"
  },
  
  // Rate limiting config
  RATE_LIMIT: {
    LECTURE_RPM: 2,  // Use only 2 RPM for lectures
    BUFFER_MS: 30000 // 30 seconds between calls
  }
};
```

## DATABASE SCHEMA
```sql
-- Lecture generation jobs
CREATE TABLE lecture_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  topic VARCHAR(500) NOT NULL,
  subject VARCHAR(100),
  language VARCHAR(20) DEFAULT 'english',
  target_duration INTEGER DEFAULT 180, -- minutes
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'queued',
  -- queued → outline → scripting → visuals → audio → compiling → ready → failed
  
  current_phase VARCHAR(50),
  current_chapter INTEGER DEFAULT 0,
  total_chapters INTEGER,
  progress_percent INTEGER DEFAULT 0,
  
  -- Output
  outline JSONB,
  chapters JSONB DEFAULT '[]',
  video_url TEXT,
  notes_pdf_url TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual chapter progress
CREATE TABLE lecture_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES lecture_jobs(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(255),
  duration INTEGER, -- target minutes
  
  -- Content
  subtopics TEXT[],
  script TEXT,
  visual_prompts JSONB,
  
  -- Generated assets
  image_urls TEXT[],
  audio_url TEXT,
  video_segment_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- pending → script_ready → visuals_ready → audio_ready → compiled
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## IMPLEMENTATION REQUIREMENTS

### 1. Job Queue System
Create a BullMQ-based queue with these queues:
- `lecture-outline` - Priority 1
- `lecture-script` - Priority 2  
- `lecture-visuals` - Priority 3
- `lecture-audio` - Priority 4
- `lecture-compile` - Priority 5

### 2. Rate Limiter
Implement sliding window rate limiter:
- Max 2 requests/minute for lecture generation
- Leave 8 RPM for real-time features
- Exponential backoff on failures

### 3. Progressive Generation
- Generate chapter by chapter
- User can watch completed chapters while rest generates
- WebSocket/SSE for real-time progress updates

### 4. Video Compilation (FFmpeg)
Use FFmpeg locally on VPS:
- Combine images with Ken Burns effect
- Overlay text/captions
- Add audio narration
- Add background music (optional)
- Merge all chapters

### 5. Error Recovery
- Checkpoint after each chapter
- Resume from last successful chapter on failure
- Max 3 retries per chapter
- Alert admin on persistent failures

## FILE STRUCTURE
```
lib/
├── lecture-generator/
│   ├── index.ts              # Main orchestrator
│   ├── queue.ts              # BullMQ setup
│   ├── rate-limiter.ts       # API rate limiting
│   ├── phases/
│   │   ├── outline.ts        # Phase 1: Generate outline
│   │   ├── script.ts         # Phase 2: Generate scripts
│   │   ├── visuals.ts        # Phase 3: Generate images
│   │   ├── audio.ts          # Phase 4: Generate TTS
│   │   └── compile.ts        # Phase 5: FFmpeg compilation
│   ├── utils/
│   │   ├── ffmpeg.ts         # FFmpeg wrapper
│   │   ├── storage.ts        # S3/MinIO upload
│   │   └── notifications.ts  # User notifications
│   └── prompts/
│       ├── outline.ts        # Outline generation prompt
│       ├── script.ts         # Script generation prompt
│       └── visuals.ts        # Visual prompt generation
```

## GENERATION PHASES - DETAILED

### PHASE 1: Outline Generation
```typescript
const OUTLINE_PROMPT = `You are creating a comprehensive 3-hour lecture outline for UPSC CSE preparation.

TOPIC: {{topic}}
SUBJECT: {{subject}}
TARGET DURATION: {{duration}} minutes

Create a detailed lecture outline with:
1. Exactly 18 chapters (each ~10 minutes)
2. Logical flow from basics to advanced
3. Include for each chapter:
   - Title (engaging, clear)
   - Duration in minutes
   - 4-6 subtopics to cover
   - Key facts/dates/figures to mention
   - Suggested visual aids (diagram/map/timeline/chart)
   - Connection to previous/next chapter

Structure the lecture as:
- Chapter 1-3: Introduction & Background
- Chapter 4-9: Core Concepts (Part 1)
- Chapter 10-12: Core Concepts (Part 2)
- Chapter 13-15: Advanced Topics & Analysis
- Chapter 16-17: Current Relevance & Applications
- Chapter 18: Summary & Exam Tips

Return as JSON:
{
  "title": "Full lecture title",
  "subject": "Subject area",
  "total_duration": 180,
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title",
      "duration": 10,
      "subtopics": ["subtopic1", "subtopic2", ...],
      "key_points": ["point1", "point2", ...],
      "visual_suggestions": ["diagram of X", "map showing Y"],
      "transition_to_next": "How this connects to next chapter"
    }
  ]
}`;
```

### PHASE 2: Script Generation (Per Chapter)
```typescript
const SCRIPT_PROMPT = `You are an experienced UPSC faculty creating a lecture script.

LECTURE: {{lecture_title}}
CHAPTER {{chapter_number}}/18: {{chapter_title}}
DURATION: {{duration}} minutes
SUBTOPICS: {{subtopics}}
KEY POINTS: {{key_points}}

Generate a natural, engaging lecture script:
1. Word count: {{duration * 130}} words (130 words/minute speaking pace)
2. Start with a hook connecting to previous chapter
3. Cover all subtopics systematically
4. Include memory aids (mnemonics, stories, analogies)
5. Reference real examples (schemes, cases, events)
6. Mark visual cues as [VISUAL: description]
7. End with transition to next chapter

STYLE:
- Conversational but informative
- Use rhetorical questions
- Include "Let's understand this with an example..."
- Add emphasis markers for important points
- Make it engaging for 3-4 hour study sessions

Return as JSON:
{
  "chapter_number": {{chapter_number}},
  "title": "{{chapter_title}}",
  "script": "Full narration script...",
  "visual_cues": [
    {"timestamp_hint": "early", "description": "Diagram showing X"},
    {"timestamp_hint": "middle", "description": "Map of Y"}
  ],
  "key_terms": ["term1", "term2"],
  "exam_tips": ["tip1", "tip2"]
}`;
```

### PHASE 3: Visual Generation
```typescript
const VISUAL_PROMPT_TEMPLATE = `Educational {{visual_type}} for UPSC preparation:

Topic: {{description}}
Context: {{chapter_title}}

Requirements:
- Clean, professional design
- Blue and white color scheme
- Clear labels in English
- High contrast for readability
- No watermarks or text overlays
- Suitable for video presentation (16:9 aspect ratio)
- Modern, minimalist style

Style: Professional educational infographic`;
```

### PHASE 4: TTS Generation
- Split script into chunks of 4000 characters max
- Generate audio for each chunk
- Merge audio files locally with FFmpeg

### PHASE 5: Video Compilation (FFmpeg)
```typescript
const FFMPEG_PIPELINE = {
  // For each chapter:
  steps: [
    // 1. Create slideshow from images with Ken Burns effect
    'ffmpeg -framerate 0.1 -i image_%d.png -vf "zoompan=z=1.1:d=100" -c:v libx264 slideshow.mp4',
    
    // 2. Add audio narration
    'ffmpeg -i slideshow.mp4 -i narration.mp3 -c:v copy -c:a aac chapter.mp4',
    
    // 3. Add text overlays (chapter title, key points)
    'ffmpeg -i chapter.mp4 -vf "drawtext=text=\'Chapter Title\':fontsize=48:fontcolor=white:x=50:y=50" final_chapter.mp4'
  ],
  
  // Merge all chapters
  merge: 'ffmpeg -f concat -i chapters.txt -c copy final_lecture.mp4'
};
```

## API ENDPOINTS

### POST /api/lectures/generate
Start new lecture generation
```typescript
{
  "topic": "Indian National Movement 1857-1947",
  "subject": "Modern History",
  "language": "english",
  "targetDuration": 180
}
```

### GET /api/lectures/:id/status
Get generation progress
```typescript
{
  "status": "scripting",
  "currentPhase": "Generating chapter scripts",
  "currentChapter": 5,
  "totalChapters": 18,
  "progressPercent": 28,
  "estimatedCompletion": "2024-01-15T15:30:00Z",
  "completedChapters": [
    { "number": 1, "videoUrl": "...", "ready": true },
    { "number": 2, "videoUrl": "...", "ready": true }
  ]
}
```

### GET /api/lectures/:id/chapter/:num
Stream individual chapter (progressive delivery)

## USER EXPERIENCE FLOW

1. User requests lecture on topic
2. Show estimated time: "~60-90 minutes to generate"
3. Start background generation
4. Real-time progress updates via WebSocket
5. As each chapter completes, make it available to watch
6. Notify user when fully complete
7. Provide: Full video + PDF notes + Chapter navigation

## NOTIFICATION TEMPLATES

### Generation Started
"🎬 Your 3-hour lecture on '{{topic}}' is being generated. 
Estimated completion: {{time}}
We'll notify you when it's ready!"

### Chapter Ready
"✅ Chapter {{num}}/18 of your lecture is ready!
You can start watching while the rest generates."

### Generation Complete
"🎉 Your lecture is ready!
'{{topic}}' - 3 hours
📺 Watch now: {{link}}
📄 Download notes: {{pdf_link}}"

## ERROR HANDLING

### Retry Logic
```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMs: [30000, 60000, 120000], // 30s, 1m, 2m
  
  retryableErrors: [
    'rate_limit_exceeded',
    'timeout',
    'server_error'
  ],
  
  fatalErrors: [
    'invalid_api_key',
    'model_not_found',
    'content_policy_violation'
  ]
};
```

### Checkpoint System
- Save state after each successful chapter
- On restart, resume from last checkpoint
- Store partial results in database

## MONITORING & ALERTS

Track:
- Queue depth
- Average generation time
- Failure rate
- API call usage
- Storage usage

Alert on:
- Queue depth > 10 lectures
- Failure rate > 20%
- API approaching rate limit
- Storage > 80% full
```

---

## 🔧 COMPLETE IMPLEMENTATION CODE

### Core Orchestrator

```typescript
// lib/lecture-generator/index.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';
import { generateOutline } from './phases/outline';
import { generateScript } from './phases/script';
import { generateVisuals } from './phases/visuals';
import { generateAudio } from './phases/audio';
import { compileVideo } from './phases/compile';
import { supabase } from '@/lib/db/supabase';
import { notifyUser } from './utils/notifications';

const redis = new Redis(process.env.REDIS_URL!);

// Rate limiter - 2 RPM for lectures (leaving 8 for real-time)
class LectureRateLimiter {
  private readonly limit = 2;
  private readonly window = 60000;
  private readonly key = 'lecture_api_calls';
  
  async waitForSlot(): Promise<void> {
    while (true) {
      const now = Date.now();
      await redis.zremrangebyscore(this.key, 0, now - this.window);
      const count = await redis.zcard(this.key);
      
      if (count < this.limit) {
        await redis.zadd(this.key, now, `${now}-${Math.random()}`);
        return;
      }
      
      // Wait 30 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

const rateLimiter = new LectureRateLimiter();

// Main queue
const lectureQueue = new Queue('lecture-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 }
  }
});

// Worker
const worker = new Worker('lecture-generation', async (job) => {
  const { jobId, phase, data } = job.data;
  
  // Wait for rate limit slot
  await rateLimiter.waitForSlot();
  
  // Update job status
  await updateJobStatus(jobId, phase, data.chapterNumber);
  
  switch (phase) {
    case 'outline':
      return await processOutlinePhase(jobId, data);
    case 'script':
      return await processScriptPhase(jobId, data);
    case 'visuals':
      return await processVisualsPhase(jobId, data);
    case 'audio':
      return await processAudioPhase(jobId, data);
    case 'compile':
      return await processCompilePhase(jobId, data);
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}, { 
  connection: redis, 
  concurrency: 1 // Process one at a time
});

// Phase 1: Outline
async function processOutlinePhase(jobId: string, data: any) {
  const outline = await generateOutline(data.topic, data.subject, data.duration);
  
  // Save outline
  await supabase
    .from('lecture_jobs')
    .update({ 
      outline,
      total_chapters: outline.chapters.length,
      status: 'outline_ready'
    })
    .eq('id', jobId);
  
  // Create chapter records
  for (const chapter of outline.chapters) {
    await supabase.from('lecture_chapters').insert({
      job_id: jobId,
      chapter_number: chapter.number,
      title: chapter.title,
      duration: chapter.duration,
      subtopics: chapter.subtopics,
      visual_prompts: chapter.visual_suggestions
    });
  }
  
  // Queue script generation for each chapter
  for (const chapter of outline.chapters) {
    await lectureQueue.add('script', {
      jobId,
      phase: 'script',
      data: { chapterNumber: chapter.number, chapter, outline }
    }, { priority: 2 });
  }
  
  return outline;
}

// Phase 2: Script
async function processScriptPhase(jobId: string, data: any) {
  const { chapterNumber, chapter, outline } = data;
  
  const script = await generateScript(chapter, outline);
  
  // Save script
  await supabase
    .from('lecture_chapters')
    .update({ 
      script: script.script,
      visual_prompts: script.visual_cues,
      status: 'script_ready'
    })
    .eq('job_id', jobId)
    .eq('chapter_number', chapterNumber);
  
  // Update progress
  await updateProgress(jobId);
  
  // Queue visual generation
  for (let i = 0; i < script.visual_cues.length; i++) {
    await lectureQueue.add('visuals', {
      jobId,
      phase: 'visuals',
      data: { 
        chapterNumber, 
        visualIndex: i,
        visual: script.visual_cues[i],
        chapterTitle: chapter.title
      }
    }, { priority: 3 });
  }
  
  return script;
}

// Phase 3: Visuals
async function processVisualsPhase(jobId: string, data: any) {
  const { chapterNumber, visualIndex, visual, chapterTitle } = data;
  
  const imageUrl = await generateVisuals(visual, chapterTitle);
  
  // Append to chapter's image URLs
  const { data: chapter } = await supabase
    .from('lecture_chapters')
    .select('image_urls')
    .eq('job_id', jobId)
    .eq('chapter_number', chapterNumber)
    .single();
  
  const imageUrls = chapter?.image_urls || [];
  imageUrls[visualIndex] = imageUrl;
  
  await supabase
    .from('lecture_chapters')
    .update({ image_urls: imageUrls })
    .eq('job_id', jobId)
    .eq('chapter_number', chapterNumber);
  
  // Check if all visuals for chapter are done
  await checkAndQueueAudio(jobId, chapterNumber);
  
  return imageUrl;
}

// Phase 4: Audio
async function processAudioPhase(jobId: string, data: any) {
  const { chapterNumber } = data;
  
  // Get script
  const { data: chapter } = await supabase
    .from('lecture_chapters')
    .select('script')
    .eq('job_id', jobId)
    .eq('chapter_number', chapterNumber)
    .single();
  
  const audioUrl = await generateAudio(chapter.script);
  
  await supabase
    .from('lecture_chapters')
    .update({ 
      audio_url: audioUrl,
      status: 'audio_ready'
    })
    .eq('job_id', jobId)
    .eq('chapter_number', chapterNumber);
  
  // Queue video compilation for this chapter
  await lectureQueue.add('compile', {
    jobId,
    phase: 'compile',
    data: { chapterNumber }
  }, { priority: 5 });
  
  return audioUrl;
}

// Phase 5: Compile
async function processCompilePhase(jobId: string, data: any) {
  const { chapterNumber } = data;
  
  // Get chapter data
  const { data: chapter } = await supabase
    .from('lecture_chapters')
    .select('*')
    .eq('job_id', jobId)
    .eq('chapter_number', chapterNumber)
    .single();
  
  const videoUrl = await compileVideo(chapter);
  
  await supabase
    .from('lecture_chapters')
    .update({ 
      video_segment_url: videoUrl,
      status: 'compiled'
    })
    .eq('job_id', jobId)
    .eq('chapter_number', chapterNumber);
  
  // Notify user that chapter is ready
  await notifyChapterReady(jobId, chapterNumber);
  
  // Check if all chapters are compiled
  await checkAndMergeFinal(jobId);
  
  return videoUrl;
}

// Helper: Check and merge final video
async function checkAndMergeFinal(jobId: string) {
  const { data: chapters } = await supabase
    .from('lecture_chapters')
    .select('status, video_segment_url')
    .eq('job_id', jobId);
  
  const allCompiled = chapters?.every(c => c.status === 'compiled');
  
  if (allCompiled) {
    // Merge all segments
    const segmentUrls = chapters!.map(c => c.video_segment_url);
    const finalVideoUrl = await mergeVideoSegments(segmentUrls);
    
    // Generate PDF notes
    const { data: job } = await supabase
      .from('lecture_jobs')
      .select('outline, topic')
      .eq('id', jobId)
      .single();
    
    const notesUrl = await generatePDFNotes(job.outline, chapters);
    
    // Update job as complete
    await supabase
      .from('lecture_jobs')
      .update({ 
        status: 'ready',
        video_url: finalVideoUrl,
        notes_pdf_url: notesUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Notify user
    await notifyLectureComplete(jobId);
  }
}

// Start lecture generation
export async function startLectureGeneration(
  userId: string,
  topic: string,
  subject: string,
  duration: number = 180
) {
  // Create job record
  const { data: job, error } = await supabase
    .from('lecture_jobs')
    .insert({
      user_id: userId,
      topic,
      subject,
      target_duration: duration,
      status: 'queued',
      started_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 90 * 60 * 1000).toISOString() // 90 min estimate
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Queue outline generation
  await lectureQueue.add('outline', {
    jobId: job.id,
    phase: 'outline',
    data: { topic, subject, duration }
  }, { priority: 1 });
  
  return job;
}
```

### FFmpeg Video Compiler

```typescript
// lib/lecture-generator/phases/compile.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { uploadToStorage } from '../utils/storage';

const execAsync = promisify(exec);

interface ChapterData {
  chapter_number: number;
  title: string;
  script: string;
  image_urls: string[];
  audio_url: string;
}

export async function compileVideo(chapter: ChapterData): Promise<string> {
  const workDir = `/tmp/lecture_${chapter.chapter_number}_${Date.now()}`;
  await fs.mkdir(workDir, { recursive: true });
  
  try {
    // 1. Download images
    const imageFiles = await downloadImages(chapter.image_urls, workDir);
    
    // 2. Download audio
    const audioFile = await downloadFile(chapter.audio_url, `${workDir}/narration.mp3`);
    
    // 3. Get audio duration
    const audioDuration = await getAudioDuration(audioFile);
    
    // 4. Create slideshow with Ken Burns effect
    const slideshowFile = `${workDir}/slideshow.mp4`;
    const imageDuration = audioDuration / imageFiles.length;
    
    // Create input file list for concat
    const inputList = imageFiles.map((img, i) => 
      `file '${img}'\nduration ${imageDuration}`
    ).join('\n');
    await fs.writeFile(`${workDir}/images.txt`, inputList);
    
    // Generate slideshow with zoom effect
    await execAsync(`
      ffmpeg -y -f concat -safe 0 -i ${workDir}/images.txt \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0015,1.5)':d=${Math.floor(imageDuration * 25)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080" \
      -c:v libx264 -pix_fmt yuv420p \
      ${slideshowFile}
    `);
    
    // 5. Add chapter title overlay
    const withTitle = `${workDir}/with_title.mp4`;
    await execAsync(`
      ffmpeg -y -i ${slideshowFile} \
      -vf "drawtext=text='Chapter ${chapter.chapter_number}: ${chapter.title}':fontsize=48:fontcolor=white:borderw=2:bordercolor=black:x=50:y=50:enable='lt(t,5)'" \
      -c:v libx264 -c:a copy \
      ${withTitle}
    `);
    
    // 6. Add audio
    const finalFile = `${workDir}/final.mp4`;
    await execAsync(`
      ffmpeg -y -i ${withTitle} -i ${audioFile} \
      -c:v copy -c:a aac -b:a 192k \
      -map 0:v:0 -map 1:a:0 \
      -shortest \
      ${finalFile}
    `);
    
    // 7. Upload to storage
    const videoUrl = await uploadToStorage(
      finalFile, 
      `lectures/chapters/chapter_${chapter.chapter_number}_${Date.now()}.mp4`
    );
    
    return videoUrl;
    
  } finally {
    // Cleanup
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

export async function mergeVideoSegments(segmentUrls: string[]): Promise<string> {
  const workDir = `/tmp/lecture_merge_${Date.now()}`;
  await fs.mkdir(workDir, { recursive: true });
  
  try {
    // Download all segments
    const segmentFiles = await Promise.all(
      segmentUrls.map((url, i) => 
        downloadFile(url, `${workDir}/segment_${i.toString().padStart(2, '0')}.mp4`)
      )
    );
    
    // Create concat list
    const concatList = segmentFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(`${workDir}/segments.txt`, concatList);
    
    // Merge videos
    const finalFile = `${workDir}/final_lecture.mp4`;
    await execAsync(`
      ffmpeg -y -f concat -safe 0 -i ${workDir}/segments.txt \
      -c copy \
      ${finalFile}
    `);
    
    // Generate chapter markers file
    const chapters = await generateChapterMarkers(segmentFiles);
    await fs.writeFile(`${workDir}/chapters.txt`, chapters);
    
    // Add chapter metadata
    const withChapters = `${workDir}/with_chapters.mp4`;
    await execAsync(`
      ffmpeg -y -i ${finalFile} -i ${workDir}/chapters.txt \
      -map_metadata 1 -codec copy \
      ${withChapters}
    `);
    
    // Upload final video
    const videoUrl = await uploadToStorage(
      withChapters,
      `lectures/final/lecture_${Date.now()}.mp4`
    );
    
    return videoUrl;
    
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

async function getAudioDuration(audioFile: string): Promise<number> {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFile}"`
  );
  return parseFloat(stdout.trim());
}

async function downloadImages(urls: string[], workDir: string): Promise<string[]> {
  return Promise.all(
    urls.map((url, i) => 
      downloadFile(url, `${workDir}/image_${i.toString().padStart(2, '0')}.png`)
    )
  );
}

async function downloadFile(url: string, destPath: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(buffer));
  return destPath;
}

async function generateChapterMarkers(segmentFiles: string[]): Promise<string> {
  let currentTime = 0;
  const chapters = [';FFMETADATA1'];
  
  for (let i = 0; i < segmentFiles.length; i++) {
    const duration = await getAudioDuration(segmentFiles[i]);
    chapters.push(`
[CHAPTER]
TIMEBASE=1/1000
START=${Math.floor(currentTime * 1000)}
END=${Math.floor((currentTime + duration) * 1000)}
title=Chapter ${i + 1}
    `.trim());
    currentTime += duration;
  }
  
  return chapters.join('\n');
}
```

---

## 📊 TIMING BREAKDOWN

```
PHASE 1: Outline Generation
├── API Call: 1 (wait 30s for slot)
├── Processing: ~30 seconds
└── Total: ~1 minute

PHASE 2: Script Generation (18 chapters)
├── API Calls: 18 (at 2 RPM = 9 minutes)
├── Processing: ~10 seconds each
└── Total: ~12 minutes

PHASE 3: Visual Generation (36 images)
├── API Calls: 36 (at 2 RPM = 18 minutes)
├── Processing: ~15 seconds each
└── Total: ~25 minutes

PHASE 4: Audio Generation (18 chapters)
├── API Calls: 18 (at 2 RPM = 9 minutes)
├── Processing: ~30 seconds each
└── Total: ~18 minutes

PHASE 5: Video Compilation (LOCAL)
├── API Calls: 0
├── FFmpeg per chapter: ~2 minutes
├── 18 chapters: ~36 minutes
├── Final merge: ~5 minutes
└── Total: ~40 minutes

═══════════════════════════════════════
GRAND TOTAL: ~95-100 minutes
API CALLS: ~73 calls
USER WAIT: ~90 minutes (but can watch progressively)
═══════════════════════════════════════
```

---

## 🎯 QUICK START COMMAND

To generate a lecture, user hits this API:

```bash
curl -X POST https://your-app.com/api/lectures/generate \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Indian National Movement 1857-1947",
    "subject": "Modern History",
    "language": "english",
    "targetDuration": 180
  }'
```

Response:
```json
{
  "jobId": "uuid-xxx",
  "status": "queued",
  "estimatedCompletion": "2024-01-15T16:30:00Z",
  "message": "Your 3-hour lecture is being generated. You'll be notified when ready.",
  "progressUrl": "/api/lectures/uuid-xxx/status"
}
```

---

## ✅ FINAL CHECKLIST

- [ ] Set up BullMQ with Redis on VPS
- [ ] Install FFmpeg on VPS
- [ ] Set up MinIO/S3 for video storage
- [ ] Create database tables
- [ ] Implement rate limiter (2 RPM for lectures)
- [ ] Implement 5 phase processors
- [ ] Add WebSocket for progress updates
- [ ] Set up notification system
- [ ] Add error recovery and checkpoints
- [ ] Test end-to-end with sample topic

---

**This system will generate 3-hour lectures smoothly without blocking other users, using only 2 RPM out of your 10 RPM limit!**
