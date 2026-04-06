# 🚀 UPSCPrepx AI - Intelligent Learning Platform

> An enterprise-grade, AI-powered learning ecosystem for UPSC aspirants. Featuring automated video generation, personalized study planning, spaced repetition, and a real-time analytics dashboard.

---

## 📊 Executive Summary
- **Target Audience**: UPSC CSE Aspirants (English & Hindi)
- **Architecture**: Microservices (Next.js, Python/Manim, React/Remotion, Supabase)
- **Core AI**: 9Router -> Groq -> Ollama Fallback
- **Deployment**: Dockerized & Coolify-Ready (VPS)

---

## ✨ Key Features Implemented

### 📚 READ Mode (100% Complete)
- **Notes & Studio**: Rich text editor, AI summarization.
- **MCQ & Planner**: Adaptive testing, personalized study schedules.
- **Analytics**: Real-time progress tracking, leaderboard.
- **PDF Reader**: Annotations, highlights.

### 🎥 WATCH Mode (100% Complete)
- **AI Video Gen**: Automated script -> Manim/Remotion render pipeline.
- **Custom Player**: 2x Speed, Transcript Sync, Timestamp Notes.
- **Sync**: Notes link bidirectionally with video.

### 🛡️ Admin & Community (100% Complete)
- **Admin Dashboard**: User banning, XP grants, system stats.
- **Forum**: Tagged threads, upvoting.
- **Mobile**: Offline caching, Push Notifications, Queue sync.

---

## 🏗️ Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), Tailwind, React Native (Expo) |
| **Backend** | Next.js API Routes, BullMQ (Redis) |
| **Database** | PostgreSQL (Supabase) |
| **AI** | OpenRouter, Groq, Ollama |
| **Video** | Manim (Python), Remotion |
| **Deploy** | Docker, Coolify, GitHub Actions |

---

## ⚡ Quick Start (Development)

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd upscprepx_ai
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env.local`.
   - Configure `NEXT_PUBLIC_SUPABASE_URL` and `ANON_KEY`.

3. **Run Migrations**
   ```bash
   supabase db push
   # Or manually apply 018_* through 037_* in Supabase Dashboard SQL Editor
   ```

4. **Start Dev Server**
   ```bash
   npm run dev
   ```

---

## 🚢 Deployment to VPS (Coolify)

This project includes `docker-compose.prod.yml` for production.

1. **Add to Coolify**:
   - Connect GitHub Repository.
   - Select `docker-compose.prod.yml`.
   - Set Environment Variables (from `.env.example`).

2. **Database**:
   - Coolify will spin up PostgreSQL & Redis automatically.
   - Run Migrations: `supabase db push` or `npx prisma migrate deploy`.

---

## 📁 Project Structure

```text
upsc_ai/
├── src/
│   ├── app/            # Next.js App Router (Pages & API)
│   ├── components/     # React UI Components
│   ├── lib/            # Services (AI, Video, Search)
│   └── middleware.ts   # Auth & Security Middleware
├── manim-service/      # Python Animation Engine
├── remotion-service/   # React Video Editor
├── mobile-app/         # React Native (Expo) Client
└── supabase/           # SQL Migrations (018 to 037)
```

---

## 📜 License

**Proprietary - All Rights Reserved**
This software is part of the UPSCPrepx AI commercial platform. Unauthorized copying or distribution is prohibited.