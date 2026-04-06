# BMAD Phase 4: Feature 6 - 60-Second Video Shorts
## Snackable UPSC Explainer Videos for Social Media & Revision

**Version**: 1.0  
**Date**: 2026-04-05  
**Status**: 🟢 IMPLEMENTATION  
**Goal**: Auto-create 60-second explainers for social media and quick revision

---

## 📋 ORIGINAL SPECIFICATION (Unchanged)

```
Feature 6: "UPSC Topic in 60 Seconds" Short AI Videos

What it does
* Auto-create snackable 60-second explainers for social and revision.

Sub-features
* Auto-generated thumbnails, SEO-friendly titles, scheduling to social accounts.

Inputs / Outputs
* Input: topic string.
* Output: 60s video + short notes.

Revideo / Manim
* Revideo main; Manim for 1–2 quick visuals.

Monetization
* Uses to market paid subscriptions; packaged short bank as product.

Complexity
* Medium
```

---

## 🏗️ TECHNICAL ARCHITECTURE

### Video Generation Pipeline
```
User Request (Topic)
    ↓
AI Script Generation (9Router → Groq → Ollama)
    ↓
TTS Audio Generation (ElevenLabs/Azure)
    ↓
Manim Visuals (1-2 key diagrams)
    ↓
Remotion Composition (scenes + audio + captions)
    ↓
Video Rendering (MP4, 1080x1920 for Shorts/Reels)
    ↓
Thumbnail Generation
    ↓
Storage (MinIO) + CDN
    ↓
Social Media Scheduling (optional)
```

---

## 📁 FILES TO CREATE

### Database Migration
- [ ] `supabase/migrations/020_video_shorts.sql`

### Video Generation Service
- [ ] `src/lib/video/shorts-generator.ts`
- [ ] `src/lib/video/script-generator.ts`
- [ ] `src/lib/video/thumbnail-generator.ts`

### API Endpoints
- [ ] `src/app/api/video/shorts/generate/route.ts`
- [ ] `src/app/api/video/shorts/library/route.ts`
- [ ] `src/app/api/video/shorts/[id]/route.ts`

### UI Components
- [ ] `src/components/video/shorts-generator.tsx`
- [ ] `src/components/video/shorts-library.tsx`
- [ ] `src/components/video/shorts-player.tsx`
- [ ] `src/components/video/shorts-card.tsx`

### Pages
- [ ] `src/app/(dashboard)/video-shorts/page.tsx`
- [ ] `src/app/(dashboard)/video-shorts/generate/page.tsx`
- [ ] `src/app/(dashboard)/video-shorts/[id]/page.tsx`

---

## 🗄️ DATABASE SCHEMA

```sql
-- Video Shorts Library
CREATE TABLE video_shorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  topic VARCHAR(500) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description TEXT,
  script TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 60,
  resolution VARCHAR(50) DEFAULT '1080x1920',
  format VARCHAR(50) DEFAULT 'mp4',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  seo_tags TEXT[],
  social_caption TEXT,
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Generation Queue
CREATE TABLE video_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(500) NOT NULL,
  subject VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  script TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Social Media Posts (for scheduling)
CREATE TABLE video_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES video_shorts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  post_status VARCHAR(50) DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  post_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX video_shorts_subject_idx ON video_shorts(subject);
CREATE INDEX video_shorts_published_idx ON video_shorts(is_published) WHERE is_published = true;
CREATE INDEX video_shorts_created_at_idx ON video_shorts(created_at DESC);
CREATE INDEX video_generation_queue_status_idx ON video_generation_queue(status);
```

---

## 🚀 IMPLEMENTATION PLAN

### Day 1: Database + Script Generator
- [ ] Create migration 020
- [ ] Create script generator (AI-powered)
- [ ] Test script generation

### Day 2: Video Generation Pipeline
- [ ] Integrate Remotion service
- [ ] Add Manim visuals
- [ ] Add TTS audio
- [ ] Create video generator service

### Day 3: API + UI
- [ ] Create API endpoints
- [ ] Create shorts generator UI
- [ ] Create shorts library UI
- [ ] Create video player

### Day 4: Social Media Integration
- [ ] Auto-generate thumbnails
- [ ] Generate SEO titles
- [ ] Add social media scheduling
- [ ] Deploy and test

---

## ✅ SUCCESS CRITERIA

- [ ] Generate 60-second video in <3 minutes
- [ ] Auto-generated script from topic
- [ ] 1-2 Manim visuals per video
- [ ] TTS voiceover
- [ ] Captions/subtitles
- [ ] Thumbnail generation
- [ ] Library of pre-generated shorts
- [ ] Social media sharing
- [ ] Premium/Free tier support

---

**Ready to implement!**
