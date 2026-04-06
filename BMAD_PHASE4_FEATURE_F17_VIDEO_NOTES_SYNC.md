# BMAD Phase 4 - Feature F17: AI Video Notes Sync

## Master Prompt v8.0 Compliance
- **WATCH Mode Feature** (Section 6 - Video Learning)
- **Bilingual**: English + Hindi UI
- **Mobile-first**: Responsive

---

## 1. Feature Overview

### 1.1 Purpose
Seamlessly convert timestamped video notes into permanent study notes.

### 1.2 User Stories

#### US-F17-01: Sync to Library
**As** a student
**I want** to save a video note to my main Notes Library
**So** I can review it with my other notes

**Acceptance:**
- Notes card shows "Source: Video"
- Click links back to Video Player at correct timestamp.

---

## 2. Database Schema

**Migration 035**

```sql
-- Add columns to user_notes table
ALTER TABLE user_notes 
  ADD COLUMN source_video_id UUID REFERENCES video_requests(id),
  ADD COLUMN source_timestamp INT,
  ADD COLUMN source_type TEXT DEFAULT null
```

---

## 3. API Endpoints

### 3.1 POST /api/notes/sync-from-video
- **Input:** `{ video_id, content, timestamp, title? }`
- **Action:** Creates a new entry in `user_notes` with `source_video_id`.

## 4. UI Updates

- **Video Player:** Add "Save to Notes" button in Transcript Bar and Player Overlay.
- **Notes Library:** Show small badge "Video Note" with play icon.