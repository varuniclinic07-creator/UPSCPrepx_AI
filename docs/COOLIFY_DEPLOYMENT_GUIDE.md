# UPSC PrepX-AI — Coolify Deployment Guide (Production)

**VPS IP:** `89.117.60.144`
**Domain:** `upscbyvarunsh.aimasteryedu.in`
**Supabase:** Cloud-hosted at `emotqkukvfwjycvwfvyj.supabase.co`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    COOLIFY (VPS 89.117.60.144)              │
│                                                             │
│  ┌──────────────┐  ┌───────┐  ┌───────┐  ┌──────────────┐ │
│  │  Next.js App  │  │ Redis │  │ MinIO │  │ Observability│ │
│  │  (Nixpacks)   │  │       │  │       │  │    Stack     │ │
│  └──────┬───────┘  └───┬───┘  └───┬───┘  └──────────────┘ │
│         │              │          │                         │
│  ┌──────┴──────────────┴──────────┴──────────────────────┐ │
│  │              Docker Network (coolify)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐  │
│  │ Plausible  │ │  Mautic  │ │Crawl4AI │ │ Uptime Kuma │  │
│  └────────────┘ └──────────┘ └─────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼  External Services (Cloud)
┌────────────────────────────────────────────┐
│  Supabase (DB/Auth)  │  9Router (AI)       │
│  Groq (AI Fallback)  │  Ollama Cloud (AI)  │
│  Razorpay (Payments) │  SendGrid (Email)   │
│  Twilio (SMS)        │  Sentry (Errors)    │
└────────────────────────────────────────────┘
```

---

## STEP 1: Install Required Services on Coolify

Deploy these in order. Each service should be created as a **Docker Compose** resource or **One-click Service** in Coolify.

### 1.1 Redis (REQUIRED — Cache & Job Queue)

**Coolify:** New Resource → Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8 --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

volumes:
  redis_data:
```

**Verify after deploy:**
```bash
docker exec <redis-container> redis-cli -a R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8 ping
# Should return: PONG
```

---

### 1.2 MinIO (REQUIRED — Object Storage for Files/PDFs/Images)

**Coolify:** New Resource → Docker Compose

```yaml
version: '3.8'
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: M7xQK3mN9pR2tV5wY8zB
      MINIO_ROOT_PASSWORD: <YOUR_MINIO_ROOT_PASSWORD>
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  minio_data:
```

**After deploy — create buckets:**
1. Open MinIO Console: `http://89.117.60.144:9001`
2. Login with `M7xQK3mN9pR2tV5wY8zB` / `S4x1K8m6N3pQ0rT7vX2yZ9bC5dF1gH4jL7mN0pQ3rT6vX9wY2z`
3. Create buckets:
   - `upsc-production` (main bucket)
   - `upsc-materials` (study materials)
4. Set both buckets to **Public** read access (for CDN serving)

---

### 1.3 Uptime Kuma (OPTIONAL — Health Monitoring)

**Coolify:** New Resource → One-click Service → Uptime Kuma

OR Docker Compose:
```yaml
version: '3.8'
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    ports:
      - "3003:3001"
    volumes:
      - uptime_kuma_data:/app/data
    restart: unless-stopped

volumes:
  uptime_kuma_data:
```

---

### 1.4 Plausible Analytics (OPTIONAL — Privacy-Focused Analytics)

**Coolify:** New Resource → One-click Service → Plausible Analytics

Set these env vars in Coolify:
```
BASE_URL=https://analytics.aimasteryedu.in
SECRET_KEY_BASE=<YOUR_SECRET_KEY_BASE>
DISABLE_REGISTRATION=true
POSTGRES_PASSWORD=<YOUR_POSTGRES_PASSWORD>
```

Map port `8089:8000` if using docker-compose manually.

---

### 1.5 Mautic (OPTIONAL — Marketing Automation)

**Coolify:** New Resource → Docker Compose

```yaml
version: '3.8'
services:
  mautic:
    image: mautic/mautic:latest
    ports:
      - "8083:80"
    environment:
      MAUTIC_DB_HOST: mautic-db
      MAUTIC_DB_USER: mautic
      MAUTIC_DB_PASSWORD: <YOUR_MAUTIC_DB_PASSWORD>
      MAUTIC_DB_NAME: mautic
    depends_on:
      - mautic-db
    volumes:
      - mautic_data:/var/www/html
    restart: unless-stopped

  mautic-db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: <YOUR_MYSQL_ROOT_PASSWORD>
      MYSQL_DATABASE: mautic
      MYSQL_USER: mautic
      MYSQL_PASSWORD: <YOUR_MAUTIC_DB_PASSWORD>
    volumes:
      - mautic_db_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mautic_data:
  mautic_db_data:
```

---

### 1.6 Crawl4AI (OPTIONAL — Web Scraping for Current Affairs)

**Coolify:** New Resource → Docker Compose

```yaml
version: '3.8'
services:
  crawl4ai:
    image: unclecode/crawl4ai:latest
    ports:
      - "11235:11235"
    environment:
      CRAWL4AI_API_TOKEN: <YOUR_CRAWL4AI_API_TOKEN>
    restart: unless-stopped
```

---

### 1.7 Observability Stack (OPTIONAL — Prometheus + Grafana + Loki + Tempo)

**Coolify:** New Resource → Docker Compose

Use the file from your repo at `observability/docker-compose.yml`. Key ports:

| Service      | Port  |
|-------------|-------|
| Prometheus  | 9090  |
| Grafana     | 3004 (mapped from 3000) |
| Loki        | 3100  |
| Tempo       | 4317 (gRPC), 4318 (HTTP) |
| Alertmanager| 9093  |

Set Grafana password in the compose env:
```
GRAFANA_ADMIN_PASSWORD=<YOUR_GRAFANA_ADMIN_PASSWORD>
```

---

## STEP 2: Deploy the Next.js App

**Coolify:** New Resource → Application → GitHub Repository

### 2.1 Build Settings

| Setting | Value |
|---------|-------|
| Repository | `varuniclinic07-creator/UPSCPrepx_AI` |
| Branch | `main` |
| Build Pack | **Nixpacks** (auto-detected) |
| Base Directory | `/` |
| Port | `3000` |

### 2.2 Domain Configuration

In Coolify → Application → Settings → Domains:
```
upscbyvarunsh.aimasteryedu.in
```
Enable **HTTPS** (Coolify auto-provisions Let's Encrypt).

---

## STEP 3: Environment Variables

In Coolify → Application → Environment Variables, add ALL of the following.

**IMPORTANT:** The code uses different env var names than what was in your old .env for some keys. The values below use the **correct names that the code expects**.

### 3.1 App Configuration

```
NODE_ENV=production
NIXPACKS_NODE_VERSION=22
NEXT_PUBLIC_APP_URL=https://upscbyvarunsh.aimasteryedu.in
NEXT_PUBLIC_APP_NAME=UPSCPrepX-AI
```

### 3.2 Supabase (Cloud — No Install Needed)

```
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>
SUPABASE_JWT_SECRET=<YOUR_SUPABASE_JWT_SECRET>
DATABASE_URL=postgresql://postgres:<YOUR_DB_PASSWORD>@db.emotqkukvfwjycvwfvyj.supabase.co:5432/postgres
```

> **NOTE:** Your old env had `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` in Coolify but the code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3.3 NextAuth

```
NEXTAUTH_SECRET=<YOUR_NEXTAUTH_SECRET>
NEXTAUTH_URL=https://upscbyvarunsh.aimasteryedu.in
```

### 3.4 AI Providers

```
PRIMARY_AI_PROVIDER=9router
UPSC_MODEL_NAME=upsc
```

**9Router (Primary AI):**
> **IMPORTANT:** Code uses `NINE_ROUTER_*` prefix, NOT `9ROUTER_*` or `ROUTER9_*`

```
NINE_ROUTER_BASE_URL=https://r94p885.9router.com/v1
NINE_ROUTER_API_KEY=<YOUR_9ROUTER_API_KEY>
```

**Groq (Fallback):**
> **IMPORTANT:** Code uses single `GROQ_API_KEY`, NOT numbered keys

```
GROQ_MODEL=groq/llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_API_KEY=<YOUR_GROQ_API_KEY>
```

> The numbered keys (`GROQ_API_KEY_1` through `GROQ_API_KEY_7`) and rotation settings are NOT used by the current code. Add them only if you plan to implement key rotation later:

```
GROQ_API_KEY_1=<YOUR_GROQ_API_KEY_1>
GROQ_API_KEY_2=<YOUR_GROQ_API_KEY_2>
GROQ_API_KEY_3=<YOUR_GROQ_API_KEY_3>
GROQ_API_KEY_4=<YOUR_GROQ_API_KEY_4>
GROQ_API_KEY_5=<YOUR_GROQ_API_KEY_5>
GROQ_API_KEY_6=<YOUR_GROQ_API_KEY_6>
GROQ_API_KEY_7=<YOUR_GROQ_API_KEY_7>
GROQ_ENABLE_KEY_ROTATION=true
GROQ_ROTATION_STRATEGY=round-robin
```

**Ollama Cloud (Secondary Fallback):**

```
OLLAMA_MODEL=qwen3.5:397b-cloud
OLLAMA_BASE_URL=https://ollama.com/v1
OLLAMA_API_KEY=<YOUR_OLLAMA_API_KEY>
```

### 3.5 AI Router

```
USE_AI_ROUTING=true
AI_ROUTER_STRATEGY=priority-fallback
AI_ROUTER_PRIORITY_ORDER=9router,groq,ollama
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
CIRCUIT_BREAKER_TIMEOUT=60000
ENABLE_REQUEST_CACHING=true
CACHE_TTL_SECONDS=300
ENABLE_USER_GROQ_KEY=true
```

### 3.6 Crawl4AI & Agentic Services

```
CRAWL4AI_URL=http://89.117.60.144:11235
CRAWL4AI_TOKEN=<YOUR_CRAWL4AI_TOKEN>
AGENTIC_AUTODOC_URL=http://89.117.60.144:8031
AGENTIC_FILE_SEARCH_URL=http://89.117.60.144:8032
AGENTIC_WEB_SEARCH_URL=http://89.117.60.144:8030
ENABLE_AGENTIC_SEARCH=true
ENABLE_PDF_EXPORT=true
ENABLE_LIVE_PREVIEWS=true
```

### 3.7 VPS Infrastructure Services

```
SERVER_IP=89.117.60.144
```

**Redis:**
```
REDIS_URL=redis://:<YOUR_REDIS_PASSWORD>@89.117.60.144:6379
REDIS_PASSWORD=<YOUR_REDIS_PASSWORD>
REDIS_TLS_ENABLED=false
```

**MinIO:**
```
MINIO_ENDPOINT=89.117.60.144
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=<YOUR_MINIO_ACCESS_KEY>
MINIO_SECRET_KEY=<YOUR_MINIO_SECRET_KEY>
MINIO_BUCKET_NAME=upsc-production
MATERIALS_BUCKET=upsc-materials
MATERIALS_BASE_URL=https://cdn.aimasteryedu.in/materials
```

**N8N:**
```
N8N_URL=http://89.117.60.144:5678
N8N_API_KEY=<YOUR_N8N_API_KEY>
```

### 3.8 Monitoring & Analytics

```
PROMETHEUS_URL=http://89.117.60.144:9090
GRAFANA_URL=http://89.117.60.144:3004
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<YOUR_GRAFANA_ADMIN_PASSWORD>
JAEGER_ENDPOINT=http://89.117.60.144:14268/api/traces
JAEGER_AGENT_HOST=89.117.60.144
JAEGER_AGENT_PORT=6831
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=app.aimasteryedu.in
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://analytics.aimasteryedu.in
PLAUSIBLE_BASE_URL=https://analytics.aimasteryedu.in
PLAUSIBLE_SECRET_KEY_BASE=<YOUR_SECRET_KEY_BASE>
PLAUSIBLE_DB_PASSWORD=<YOUR_PLAUSIBLE_DB_PASSWORD>
PLAUSIBLE_DISABLE_REGISTRATION=true
UPTIME_KUMA_URL=http://89.117.60.144:3003
```

### 3.9 Content Quality

```
ENABLE_SYLLABUS_CHECK=true
ENABLE_FACT_CHECKING=true
TARGET_READING_LEVEL=10th-grade
```

### 3.10 Video Generation

```
MANIM_URL=http://89.117.60.144:8085
REMOTION_URL=http://89.117.60.144:3002
REMOTION_CONCURRENCY=2
FFMPEG_WORKER_URL=http://89.117.60.144:8080
```

### 3.11 Marketing (Mautic)

```
MAUTIC_URL=http://89.117.60.144:8083
MAUTIC_DB_HOST=mautic-db
MAUTIC_DB_USER=mautic
MAUTIC_DB_PASSWORD=<YOUR_MAUTIC_DB_PASSWORD>
MAUTIC_DB_NAME=mautic
MAUTIC_DB_ROOT_PASSWORD=<YOUR_MAUTIC_DB_ROOT_PASSWORD>
```

### 3.12 Payments (Razorpay)

> **NOTE:** You currently have TEST keys (`rzp_test_*`). Replace with LIVE keys for production.

```
RAZORPAY_KEY_ID=<YOUR_RAZORPAY_KEY_ID>
RAZORPAY_KEY_SECRET=<YOUR_RAZORPAY_KEY_SECRET>
RAZORPAY_WEBHOOK_SECRET=<YOUR_RAZORPAY_WEBHOOK_SECRET>
```

### 3.13 Email & SMS

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<YOUR_SMTP_PASSWORD>
SMTP_FROM=noreply@upsc.aimasteryedu.in
TWILIO_ACCOUNT_SID=<YOUR_TWILIO_ACCOUNT_SID>
TWILIO_AUTH_TOKEN=<YOUR_TWILIO_AUTH_TOKEN>
TWILIO_PHONE_NUMBER=+12196003657
```

### 3.14 Security & Rate Limiting

```
CORS_ORIGINS=https://upscbyvarunsh.aimasteryedu.in
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
ENCRYPTION_KEY=<YOUR_ENCRYPTION_KEY>
```

### 3.15 Error Tracking & Logging

```
NEXT_PUBLIC_SENTRY_DSN=https://1190845463e6572f6982c93b43ae95e3@o4510713202933760.ingest.us.sentry.io/4510713204047872
SENTRY_AUTH_TOKEN=<YOUR_SENTRY_AUTH_TOKEN>
LOG_LEVEL=info
```

### 3.16 Workers

```
VIDEO_WORKER_CONCURRENCY=3
VIDEO_WORKER_MAX_RETRIES=3
LECTURE_QUEUE_NAME=lecture-queue-production
LECTURE_QUEUE_CONCURRENCY=2
```

### 3.17 Performance & CDN

```
NEXT_PUBLIC_CDN_URL=https://cdn.aimasteryedu.in
NEXT_IMAGE_DOMAINS=cdn.aimasteryedu.in,89.117.60.144
ENABLE_COMPRESSION=true
```

### 3.18 Backup & Recovery

```
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=upsc-backups
BACKUP_S3_REGION=ap-south-1
```

### 3.19 Feature Flags

```
ENABLE_MAINTENANCE_MODE=false
ENABLE_NEW_STUDENT_REGISTRATION=true
ENABLE_TRIAL_ACCOUNTS=true
ENABLE_MOCK_INTERVIEWS=true
ENABLE_VIDEO_GENERATION=true
ENABLE_COOKIE_CONSENT=true
ENABLE_DATA_EXPORT=true
ENABLE_DATA_DELETION=true
DATA_RETENTION_DAYS=365
ENABLE_DEBUG_MODE=false
ENABLE_API_DOCS=false
ENABLE_QUERY_LOGGING=false
```

---

## STEP 4: Coolify Build-Time vs Runtime Env Vars

In Coolify, mark these env vars as **Runtime Only** (uncheck "Available at Buildtime"):

- All secrets: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DATABASE_URL`, `NEXTAUTH_SECRET`, `NINE_ROUTER_API_KEY`, `GROQ_API_KEY*`, `OLLAMA_API_KEY`, `REDIS_PASSWORD`, `MINIO_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, `SMTP_PASSWORD`, `TWILIO_AUTH_TOKEN`, `ENCRYPTION_KEY`, `SENTRY_AUTH_TOKEN`, `N8N_API_KEY`, `CRAWL4AI_TOKEN`

Mark these as **Available at Buildtime** (needed by Next.js at compile time):

- `NEXT_PUBLIC_*` vars (these get baked into the client bundle)
- `NODE_ENV`
- `NIXPACKS_NODE_VERSION`

---

## STEP 5: DNS Configuration

Set these DNS records pointing to `89.117.60.144`:

| Type | Name | Value |
|------|------|-------|
| A | `upscbyvarunsh.aimasteryedu.in` | `89.117.60.144` |
| A | `cdn.aimasteryedu.in` | `89.117.60.144` |
| A | `analytics.aimasteryedu.in` | `89.117.60.144` |

---

## STEP 6: Post-Deployment Checklist

### Verify Services

```bash
# SSH into VPS
ssh root@89.117.60.144

# Check all containers are running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test Redis
docker exec <redis-container> redis-cli -a <password> ping

# Test MinIO
curl -s http://89.117.60.144:9000/minio/health/live

# Test the app
curl -s -o /dev/null -w "%{http_code}" https://upscbyvarunsh.aimasteryedu.in
# Should return: 200
```

### Run Supabase Migrations

Migrations are in `supabase/migrations/`. They should already be applied to your cloud Supabase instance. Verify:

1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;`
3. Ensure all migrations are listed

---

## STEP 7: Deployment Order Summary

| # | Service | Type | Port(s) | Required |
|---|---------|------|---------|----------|
| 1 | Redis | Docker Compose | 6379 | YES |
| 2 | MinIO | Docker Compose | 9000, 9001 | YES |
| 3 | **Next.js App** | Nixpacks (GitHub) | 3000 | YES |
| 4 | Uptime Kuma | Docker | 3003 | Optional |
| 5 | Plausible | Docker Compose | 8089 | Optional |
| 6 | Mautic + MySQL | Docker Compose | 8083 | Optional |
| 7 | Crawl4AI | Docker | 11235 | Optional |
| 8 | Observability Stack | Docker Compose | 9090,3004,3100,4317 | Optional |

> Deploy Redis and MinIO FIRST, then the Next.js app. All other services are optional and can be added later.

---

## Key Differences from Your Old .env

| Old Env Var | Correct Code Var | Notes |
|-------------|-----------------|-------|
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Code uses anon_key |
| `9ROUTER_BASE_URL` / `ROUTER9_BASE_URL` | `NINE_ROUTER_BASE_URL` | JS can't start var with number |
| `9ROUTER_API_KEY` / `ROUTER9_API_KEY` | `NINE_ROUTER_API_KEY` | Same reason |
| `GROQ_API_KEY_1` through `_7` | `GROQ_API_KEY` (single) | Code reads single key only |
| `ENABLE_GROQ_FALLBACK` | Not used | Routing handles fallback |
