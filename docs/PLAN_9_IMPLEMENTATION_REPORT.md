# Plan 9: WATCH Mode + Polish + Wire-up + E2E Testing — Implementation Report

**Date:** 2026-04-14  
**Commits:** 7 (afe8619 → 970d43f)  
**Build status:** PASSING (exit code 0)

---

## Summary

Plan 9 completed the WATCH mode pipeline (Features F15–F18), wiring BullMQ workers to the lecture orchestrator, replacing the Remotion stub with a real FFmpeg renderer, building full classroom lecture pages, adding Manim-enhanced notes, monthly compilation videos, admin lecture management, and comprehensive E2E + unit testing.

---

## Sub-Plans Delivered

### 9A: Wire BullMQ Worker for Lecture Generation (afe8619)
- **Fixed critical bug:** `compilationQueue.add()` crash — the export was `{ get: fn }`, not a Queue. Fixed to call `.get()` first.
- Added `GENERATE_LECTURE` and `COMPILE_LECTURE` to `JobType` enum in `worker-queue.ts`
- Added lecture handlers in `bullmq-worker.ts` with dynamic imports
- Converted `compilation-worker.ts` from JS to TypeScript

### 9B: Remotion → FFmpeg MVP (f95d62f)
- Rewrote `remotion-service/server.js` with real FFmpeg rendering (multi-scene, slideshow, audio-only, text cards)
- Removed unused `@remotion/*` dependencies
- Simplified Dockerfile (no Chromium, just ffmpeg + fonts)
- Both `/render` and `/api/render` endpoints supported (fixed URL mismatch with video-agent.ts)

### 9C: Lecture Pages — Real Data + Classroom (30e2839)
- Migration `049_lecture_enhancements.sql`: `lecture_bookmarks` + `lecture_watch_history` tables with RLS
- API routes: `/api/lectures/[id]/progress` (save/resume), `/api/lectures/[id]/chapters`
- Video player rewrite: speed control (0.5–2x), keyboard shortcuts, PiP, chapter sidebar, progress seeking
- 6 new components: generation dialog, progress card, notes tab, Q&A tab, bookmarks tab
- Lecture listing page: fetches real data, shows in-progress/ready/failed sections
- Lecture detail page: video + tabbed classroom panel (Notes/Q&A/Bookmarks)

### 9D: Manim-Enhanced Notes (86e00d7)
- `diagram-viewer.tsx`: Mermaid.js renderer + "Watch Animation" button
- `/api/notes/[slug]/animate`: triggers Manim service with auto-generated scene code

### 9E: Monthly Compilation Video (86e00d7)
- Migration `050_monthly_compilations.sql`: compilations table with status enum + RLS
- `/api/compilations`: GET list + POST request
- Monthly compilation page: real data, PDF download + video player

### 9F: Admin Lecture Management (86e00d7)
- `/api/admin/lectures`: GET all jobs with stats, POST admin-trigger generation
- `/api/admin/lectures/[id]`: GET detail, PATCH status, DELETE
- Admin lectures page: real DB queries, filter tabs, retry/cancel, stats cards

### 9G: E2E + Unit Tests (970d43f)
- Playwright config: Chromium-only, webServer auto-start
- 4 E2E spec files (18 tests): auth-flow, lecture-generation, analytics-dashboards, admin-lectures
- 2 unit test files: `orchestrator.test.ts` (pipeline phases), `compilation.test.ts` (FFmpeg compilation)
- npm scripts: `test:e2e`, `test:e2e:ui`

---

## Files Created/Modified

| Category | Count |
|----------|-------|
| New files | ~30 |
| Modified files | ~12 |
| Migrations | 2 (049, 050) |
| API routes | 8 new |
| Components | 9 new |
| Test files | 6 new (4 E2E + 2 unit) |

---

## Architecture Decisions

1. **FFmpeg over Remotion**: Remotion requires bundled React compositions that don't exist. FFmpeg is already in Docker and the compilation-worker already uses it.
2. **Dual endpoint support**: `/render` + `/api/render` on FFmpeg server to match both direct calls and video-agent.ts URL patterns.
3. **Dynamic imports in BullMQ worker**: Prevents circular dependency and heavy module loading at worker boot time.
4. **Mermaid.js over custom SVG**: Dynamic import of mermaid for diagram rendering — lighter than shipping a custom SVG renderer.

---

## Known Limitations

1. **Manim service must be running** (Docker port 8033) for animation generation
2. **FFmpeg service must be running** (Docker port 8034) for video compilation
3. **Redis required** for BullMQ job queue
4. **Local dev paths**: compilation-worker uses `process.cwd()/temp/` for local dev; Docker uses `/app/temp/`
5. **E2E tests require running dev server** — Playwright auto-starts it via webServer config

---

## Verification Checklist

- [x] `npx next build` exits 0
- [x] All 7 sub-plans committed
- [x] Migrations 049 + 050 created
- [x] RLS policies on all new tables
- [x] API auth checks on all new routes
- [x] E2E test specs cover all major flows
