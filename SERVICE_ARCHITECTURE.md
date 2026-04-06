# ═══════════════════════════════════════════════════════════════════════════
# COMPLETE SERVICE ARCHITECTURE DOCUMENTATION
# UPSC CSE Master - Production Environment
# ═══════════════════════════════════════════════════════════════════════════

## Service Overview (23 Services Total)

### Infrastructure Layer (2 services)
1. **Redis** (Port 6379)
   - Purpose: Distributed cache, session storage, queue management
   - Volume: redis_data
   - Health Check: Yes
   - Env Vars: REDIS_PASSWORD

2. **MinIO** (Ports 9000, 9001)
   - Purpose: Object storage for videos, materials, uploads
   - Volumes: minio_data
   - Console: Port 9001
   - Env Vars: MINIO_ACCESS_KEY, MINIO_SECRET_KEY

---

### Video Generation Stack (5 services)

3. **Manim Community** (Port 8085)
   - Purpose: Mathematical animations, diagrams
   - Image: manimcommunity/manim:stable
   - Volumes: manim_media, manim_scenes
   - Type: On-demand worker

4. **ManimGL** (Port 8086)
   - Purpose: 3D mathematical animations
   - Image: widcardw/manimgl:latest
   - Volumes: manimgl_media, manimgl_scenes
   - Type: On-demand worker

5. **Remotion** (Port 3002)
   - Purpose: Programmatic video creation with React
   - Image: node:20-slim
   - Volumes: remotion_output, remotion_cache
   - Env Vars: REMOTION_CONCURRENCY

6. **FFmpeg Worker**
   - Purpose: Video encoding, transcoding, processing
   - Image: linuxserver/ffmpeg
   - Volume: video_processing, minio_data
   - Type: Background worker

7. **Video Worker** (BullMQ)
   - Purpose: Lecture video generation queue processor
   - Image: node:20-alpine
   - Queue: lecture-queue
   - Dependencies: Redis, MinIO, A4F API
   - Env Vars: A4F_API_KEY, REDIS_*, MINIO_*

---

### Agentic Intelligence Layer (4 services)

8. **Crawl4AI** (Port 11235)
   - Purpose: Intelligent web scraping base service
   - Image: unclecode/crawl4ai:latest
   - Health Check: Yes
   - Env Vars: CRAWL4AI_TOKEN

9. **Web Search** (Port 8030)
   - Purpose: Crawl4AI-powered search with UPSC prioritization
   - Image: python:3.11-slim (FastAPI)
   - Dependencies: Crawl4AI
   - API: /search, /health

10. **AutoDocThinker** (Port 8031)
    - Purpose: Multi-agent document processing & RAG
    - Image: python:3.11-slim (FastAPI)
    - Volume: autodoc_data, minio_data
    - Dependencies: Tesseract, Poppler
    - API: /analyze, /health

11. **File Search** (Port 8032)
    - Purpose: Dynamic document navigation
    - Image: python:3.11-slim (FastAPI)
    - Volume: file_search_data, minio_data
    - API: /search, /health

---

### Marketing & Analytics (7 services)

12. **Mautic** (Port 8083)
    - Purpose: Marketing automation, lead generation
    - Image: mautic/mautic:5-apache
    - Volume: mautic_data
    - Dependencies: mautic-db
    - Env Vars: MAUTIC_DB_*

13. **Mautic DB** (MySQL 8.0)
    - Purpose: Mautic database
    - Volume: mautic_db_data
    - Env Vars: MYSQL_*, MAUTIC_DB_PASSWORD

14. **Plausible** (Port 8089)
    - Purpose: Privacy-friendly analytics
    - Image: plausible/analytics
    - Dependencies: plausible-db, plausible-events-db
    - Env Vars: SECRET_KEY_BASE, BASE_URL

15. **Plausible DB** (PostgreSQL 14)
    - Purpose: Plausible database
    - Volume: plausible_db_data
    - Env Vars: PLAUSIBLE_DB_PASSWORD

16. **Plausible Events DB** (ClickHouse)
    - Purpose: Analytics events storage
    - Volume: plausible_events_data
    - Type: Time-series database

17. **Uptime Kuma** (Port 3003)
    - Purpose: Service monitoring, status page
    - Image: louislam/uptime-kuma:1
    - Volume: uptime_kuma_data
    - Web UI: Port 3003

18. **Prometheus** (Port 9090)
    - Purpose: Metrics collection & monitoring
    - Image: prom/prometheus
    - Volume: prometheus_data
    - Retention: 15 days
    - Health Check: Yes

19. **Grafana** (Port 3004)
    - Purpose: Metrics visualization dashboards
    - Image: grafana/grafana
    - Volume: grafana_data
    - Dependencies: Prometheus
    - Env Vars: GRAFANA_PASSWORD, GRAFANA_URL
    - Health Check: Yes

20. **Jaeger** (Ports 16686, 14268, 6831/udp)
    - Purpose: Distributed tracing
    - Image: jaegertracing/all-in-one
    - UI Port: 16686
    - Collector Port: 14268

---

## Port Mapping Reference

| Service          | Port(s) | Protocol | Purpose             |
| ---------------- | ------- | -------- | ------------------- |
| Redis            | 6379    | TCP      | Cache/Queue         |
| MinIO API        | 9000    | HTTP     | Object Storage      |
| MinIO Console    | 9001    | HTTP     | Admin UI            |
| Manim            | 8085    | HTTP     | Animation Service   |
| ManimGL          | 8086    | HTTP     | 3D Animation        |
| Remotion         | 3002    | HTTP     | Video Service       |
| Crawl4AI         | 11235   | HTTP     | Web Scraping        |
| Web Search       | 8030    | HTTP     | Search API          |
| AutoDoc          | 8031    | HTTP     | Document Processing |
| File Search      | 8032    | HTTP     | File Navigation     |
| Mautic           | 8083    | HTTP     | Marketing           |
| Plausible        | 8089    | HTTP     | Analytics           |
| Uptime Kuma      | 3003    | HTTP     | Monitoring          |
| Prometheus       | 9090    | HTTP     | Metrics             |
| Grafana          | 3004    | HTTP     | Dashboards          |
| Jaeger UI        | 16686   | HTTP     | Tracing UI          |
| Jaeger Collector | 14268   | HTTP     | Trace Collection    |
| Jaeger Agent     | 6831    | UDP      | Jaeger Protocol     |

---

## Volume Mapping

| Volume                | Purpose              | Service(s)                  |
| --------------------- | -------------------- | --------------------------- |
| redis_data            | Persistent cache     | Redis                       |
| minio_data            | Object storage       | MinIO, AutoDoc, File Search |
| manim_media           | Animation output     | Manim                       |
| manim_scenes          | Scene definitions    | Manim                       |
| manimgl_media         | 3D animation output  | ManimGL                     |
| manimgl_scenes        | 3D scene definitions | ManimGL                     |
| remotion_output       | Video output         | Remotion                    |
| remotion_cache        | Build cache          | Remotion                    |
| video_processing      | Video temp files     | FFmpeg, Video Worker        |
| video_worker_modules  | Node modules         | Video Worker                |
| autodoc_data          | Document cache       | AutoDoc                     |
| file_search_data      | Search index         | File Search                 |
| mautic_data           | Mautic files         | Mautic                      |
| mautic_db_data        | MySQL data           | Mautic DB                   |
| plausible_db_data     | PostgreSQL data      | Plausible DB                |
| plausible_events_data | ClickHouse data      | Plausible Events            |
| uptime_kuma_data      | Monitoring data      | Uptime Kuma                 |
| prometheus_data       | Metrics data         | Prometheus                  |
| grafana_data          | Dashboards           | Grafana                     |

---

## Environment Variables for Coolify

### Copy these to Coolify Environment Variables section:

```env
# Redis
REDIS_PASSWORD=<generate-secure-64-char>

# MinIO
MINIO_ACCESS_KEY=<generate-secure-20-char>
MINIO_SECRET_KEY=<generate-secure-40-char>

# A4F API (for video worker)
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1

# Crawl4AI
CRAWL4AI_TOKEN=<generate-secure-32-char>

# Mautic
MAUTIC_DB_PASSWORD=<generate-secure-32-char>
MAUTIC_DB_ROOT_PASSWORD=<generate-secure-32-char>

# Plausible
PLAUSIBLE_SECRET=<generate-secure-64-char>
PLAUSIBLE_DB_PASSWORD=<generate-secure-32-char>
PLAUSIBLE_BASE_URL=https://analytics.aimasteryedu.in
PLAUSIBLE_DISABLE_REGISTRATION=true

# Grafana
GRAFANA_PASSWORD=<generate-secure-32-char>
GRAFANA_ADMIN_USER=admin
GRAFANA_URL=https://grafana.aimasteryedu.in

# Remotion
REMOTION_CONCURRENCY=2
```

---

## Service Dependencies Graph

```
Main App (Next.js)
├── Redis (cache, sessions, queues)
├── MinIO (file storage)
├── Agentic Services
│   ├── Crawl4AI
│   │   └── Web Search (depends on Crawl4AI)
│   ├── AutoDoc (uses MinIO)
│   └── File Search (uses MinIO)
├── Video Generation
│   ├── Manim (on-demand)
│   ├── ManimGL (on-demand)
│   ├── Remotion (on-demand)
│   ├── FFmpeg (worker)
│   └── Video Worker (uses Redis, MinIO, A4F)
├── Marketing
│   └── Mautic
│       └── Mautic DB
├── Analytics
│   └── Plausible
│       ├── Plausible DB
│       └── Plausible Events DB
└── Monitoring
    ├── Prometheus
    ├── Grafana (uses Prometheus)
    ├── Jaeger
    └── Uptime Kuma
```

---

## Health Check Endpoints

Test all services after deployment:

```bash
# Infrastructure
curl http://localhost:6379  # Redis (requires auth)
curl http://localhost:9000/minio/health/live  # MinIO

# Agentic Services
curl http://localhost:11235/health  # Crawl4AI
curl http://localhost:8030/health   # Web Search
curl http://localhost:8031/health   # AutoDoc
curl http://localhost:8032/health   # File Search

# Monitoring
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:3004/api/health  # Grafana
curl http://localhost:3003  # Uptime Kuma

# Analytics
curl http://localhost:8089  # Plausible
```

---

## Deployment Checklist

- [ ] All environment variables set in Coolify
- [ ] Secrets generated (use generate-secrets.sh)
- [ ] Docker compose uploaded to Coolify
- [ ] All volumes created automatically by Coolify
- [ ] Services started successfully
- [ ] Health checks passing
- [ ] MinIO buckets created (upsc-materials, upsc-videos, upsc-backups)
- [ ] Redis connection tested
- [ ] Video worker queue tested
- [ ] Agentic services responding
- [ ] Monitoring dashboards accessible
- [ ] Plausible analytics configured
- [ ] Uptime Kuma monitoring configured
- [ ] All ports accessible via VPS firewall

---

## Service Integration Points

### Main App Integration

```typescript
// In your Next.js app, services are accessed via:

// Redis
const redis = new Redis(process.env.REDIS_URL)

// MinIO
const minio = new Minio({
  endPoint: process.env.MINIO_ENDPOINT,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
})

// Agentic Services
const webSearch = await fetch('http://web-search:8030/search', {...})
const autodoc = await fetch('http://autodoc:8031/analyze', {...})
const fileSearch = await fetch('http://file-search:8032/search', {...})

// Video Worker (via BullMQ)
const lectureQueue = new Queue('lecture-queue', {
  connection: redisConnection
})
await lectureQueue.add('generate-lecture', {topic, jobId})
```

---

## Cost Estimation (Monthly)

| Service         | Resources         | Est. Cost         |
| --------------- | ----------------- | ----------------- |
| VPS (16GB/8CPU) | Host all services | $50-80            |
| Traffic (1TB)   | Bandwidth         | $10-20            |
| Backups (100GB) | S3 storage        | $5-10             |
| **Total**       |                   | **$65-110/month** |

Note: All services run on single VPS in docker containers - very cost-effective!
