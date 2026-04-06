# BMAD Phase 4 - Feature F15: AI Video Generation

## Master Prompt v8.0 Compliance
- **WATCH Mode Feature** (Section 6 - Video Learning)
- **Bilingual**: English + Hindi output support
- **Mobile-first**: Responsive video player

---

## 1. Feature Overview

### 1.1 Purpose
Automated creation of UPSC concept videos using:
- **AI Scripting**: LLM generates lecture script based on syllabus topic.
- **Manim Engine**: Python library for mathematical animations.
- **Remotion**: React-based video composition for modern UI elements.
- **Storage**: S3/Supabase Storage hosting.

### 1.2 User Stories

#### US-F15-01: Generate Video from Topic
**As a** student  
**I want to** enter a topic and get a video  
**So that** I can learn visually  

**Acceptance Criteria:**
- Input: Topic Name (e.g., "Fundamental Rights")
- Process: Queue -> Generate Script -> Render -> Notify
- Output: MP4 Video + Transcript

#### US-F15-02: Video Player
**As a** student  
**I want to** watch generated videos  
**So that** I can study  

**Acceptance Criteria:**
- Custom Player (Speed, Quality, Captions)
- Note-taking synced to timestamp
- AI Summary of video

#### US-F15-03: History & Queue
**As a** student  
**I want to** see my video requests  
**So that** I track progress  

**Acceptance Criteria:**
- List of generated videos
- Queue status (Pending, Rendering, Done)

---

## 2. Architecture

### 2.1 Components
1.  **Next.js API**: Receives topic request. Authenticates user.
2.  **Agentic Worker**: Calls 9Router/Groq to generate Manim Python script.
3.  **Manim Service (`manim-service/`):** Dockerized Python service that executes scripts and outputs MP4.
4.  **Remotion Service (`remotion-service/`)**: Adds UI overlays, titles, and intros.
5.  **Storage**: Uploads final MP4 to Supabase Storage.

### 2.2 Database Schema
```sql
-- Video Requests
CREATE TABLE video_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  topic TEXT,
  status TEXT, -- PENDING, GENERATING, RENDERING, DONE, FAILED
  video_url TEXT,
  thumbnail_url TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ
);
```

---

## 3. API Endpoints

- `POST /api/video/generate` - Request a new video.
- `GET /api/video/history` - User's video list.
- `GET /api/video/:id` - Details/Status of specific video.

---

## 4. Implementation Checklist
- [ ] BMAD Spec
- [ ] Migration 033
- [ ] `manim-service` update for API
- [ ] Agentic Worker for Script Gen
- [ ] Video Player UI (React-Player)
- [ ] Request/History UI
