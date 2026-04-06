# BMAD Phase 4 - Feature F16: AI Video Player & Sync

## Master Prompt v8.0 Compliance
- **WATCH Mode Feature** (Section 6 - Video Learning)
- **Bilingual**: English + Hindi UI
- **Mobile-first**: Responsive controls

---

## 1. Feature Overview

### 1.1 Purpose
Enhanced video consumption experience:
- **Custom Controls**: Speed (0.5x-2.0x), Theater Mode, PiP.
- **Smart Transcript**: Highlight current sentence as video plays.
- **Timestamp Notes**: "Add Note at 02:15" opens a modal linked to that time.
- **AI Summary**: Key points extracted from transcript.

### 1.2 User Stories

#### US-F16-01: Interactive Player
**As a** student  
**I want** speed and quality controls  
**So that** I study efficiently  

**Acceptance Criteria:**
- Speed slider
- Theater mode toggles sidebar
- Resume from last watched position (00:12:45)

#### US-F16-02: Synced Transcript
**As a** student  
**I want** to read along while watching  
**So that** I understand better  

**Acceptance Criteria:**
- Sidebar with transcript text
- Scrolling highlights matching spoken words
- Click text to jump video

#### US-F16-03: Timestamp Notes
**As a** student  
**I want** to save notes for specific parts  
**So that** I review later  

**Acceptance Criteria:**
- "Note" button freezes video
- Saves text + timestamp
- Viewable in notes list

---

## 2. Database Schema

```sql
-- Video Notes
CREATE TABLE video_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_request_id UUID REFERENCES video_requests(id) ON DELETE CASCADE,
  timestamp_seconds INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API Endpoints

### 3.1 GET /api/video/:id/transcript
Get transcript segments with timings.

### 3.2 POST /api/video/:id/notes
Save a timestamped note.

### 3.3 GET /api/video/:id/notes
Get notes for this video.

---

## 4. UI Components

### 4.1 CustomVideoPlayer.tsx
- Wraps HTML5 Video / ReactPlayer
- Overlay for Controls

### 4.2 TranscriptBar.tsx
- Scrollable text sidebar
- Active segment highlighting

### 4.3 VideoPlayerPage.tsx
- Main layout combining Player + Transcript + Notes
