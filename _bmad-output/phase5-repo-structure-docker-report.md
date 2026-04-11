# Phase 5: Repo Structure + Docker - Implementation Report

**Date**: 2026-04-11  
**Status**: ✅ Completed  
**Phase**: Repo Structure + Docker Containerization

---

## Executive Summary

Phase 5 establishes a containerized deployment infrastructure with:
- **Multi-stage Dockerfiles** for optimized image sizes
- **Development docker-compose** with full stack (web, api, worker, redis, postgres, supabase)
- **Production docker-compose** with resource limits and security hardening
- **Environment separation** (.env.development, .env.docker, .env.production.template)
- **Health checks** for all services
- **Network isolation** with dedicated bridge network

---

## Directory Structure

```
upsc_ai/
├── docker/
│   ├── Dockerfile.web          # Next.js web application
│   ├── Dockerfile.api          # API server
│   ├── Dockerfile.worker       # BullMQ worker
│   ├── docker-compose.yml      # Development environment
│   ├── docker-compose.production.yml  # Production deployment
│   └── README.md               # Docker usage guide
├── .env.development            # Local development config
├── .env.docker                 # Docker deployment template
├── .env.docker.example         # Example Docker config
└── .env.production.template    # Production config template
```

---

## Files Created

### 1. Dockerfiles

#### `docker/Dockerfile.web`
Multi-stage build for Next.js web application:

**Stages**:
1. **deps** - Install dependencies (node:20.11-alpine)
2. **builder** - Build application with `npm run build`
3. **runner** - Production runtime with non-root user

**Features**:
- Standalone output for minimal image size
- Non-root user (nextjs:nodejs) for security
- Health check on `/api/health`
- Proper ownership and permissions

**Image Size**: ~1.2GB (optimized)

#### `docker/Dockerfile.api`
API server for backend services:

**Configuration**:
- Port: 3001
- Same multi-stage build as web
- Includes `src/lib` for service layer
- Health check endpoint

#### `docker/Dockerfile.worker`
BullMQ worker for async job processing:

**Features**:
- Chromium, ffmpeg for video processing
- TypeScript compilation stage
- Port: 3002
- Resource-intensive (4 CPU, 4G memory in production)

**Runtime Dependencies**:
```dockerfile
RUN apk add --no-cache \
    ffmpeg \
    chromium \
    font-noto \
    font-noto-cjk \
    curl
```

### 2. Docker Compose Files

#### `docker/docker-compose.yml` (Development)

**Services**:
| Service | Port | Description |
|---------|------|-------------|
| web | 3000 | Next.js application |
| api | 3001 | API server |
| worker | 3002 | BullMQ worker |
| redis | 6379 | Cache + queue |
| postgres | 5432 | PostgreSQL |
| supabase | 8000 | Supabase local |
| pgadmin | 5050 | Database admin (optional profile) |

**Features**:
- All services on `upsc-network` bridge network
- Health checks with proper start periods
- Volume persistence for data
- Optional tools profile for pgadmin

**Usage**:
```bash
# Start development
docker-compose -f docker/docker-compose.yml up -d

# With tools (pgadmin)
docker-compose -f docker/docker-compose.yml --profile tools up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f worker
```

#### `docker/docker-compose.production.yml`

**Production Hardening**:
- Resource limits (CPU/memory)
- Restart policies (always)
- Graceful shutdown periods
- Logging with rotation (10m, 3 files)
- Network IPAM configuration
- Redis maxmemory policy (allkeys-lru)

**Resource Allocation**:
| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| web | 2.0 | 2G |
| api | 2.0 | 2G |
| worker | 4.0 | 4G |
| redis | 1.0 | 512M |

**Usage**:
```bash
# Production deploy
docker-compose -f docker/docker-compose.production.yml \
  --env-file .env.production \
  up -d --build

# Scale workers
docker-compose -f docker/docker-compose.production.yml \
  up -d --scale worker=5
```

### 3. Environment Files

#### `.env.development`
Local development configuration:
- Supabase local (localhost:8000)
- Redis localhost:6379
- Test Razorpay keys
- Debug flags enabled
- Relaxed rate limiting (1000 RPM)

#### `.env.docker`
Docker deployment template with `CHANGE_ME_*` placeholders:
- All required environment variables
- Comments for each section
- Safe defaults for local Docker

#### `.env.docker.example`
Example configuration with descriptions:
- Copy to `.env.docker.local`
- Fill in real values
- Never commit to version control

#### `.env.production.template`
Production-ready template:
- 9Router, Groq, Ollama AI providers
- Razorpay payment gateway
- AWS S3 storage
- Sentry analytics
- Feature flags
- CORS configuration

---

## New Worker Entry Point

### `src/workers/bullmq-worker.ts`

Complete TypeScript worker integrating with Phase 4 `worker-queue.ts`:

**Job Handlers Implemented**:
```typescript
const jobHandlers: JobHandlers = {
    // Email jobs
    [JobType.SEND_WELCOME_EMAIL]: async (job) => { ... },
    [JobType.SEND_RENEWAL_REMINDER]: async (job) => { ... },
    [JobType.SEND_PAYMENT_CONFIRMATION]: async (job) => { ... },
    [JobType.SEND_PASSWORD_RESET]: async (job) => { ... },
    
    // Subscription jobs
    [JobType.SUBSCRIPTION_EXPIRY_CHECK]: async (job) => { ... },
    [JobType.SUBSCRIPTION_RENEWAL]: async (job) => { ... },
    [JobType.TRIAL_EXPIRY_CHECK]: async (job) => { ... },
    
    // AI jobs
    [JobType.GENERATE_NOTES]: async (job) => { ... },
    [JobType.GENERATE_MIND_MAP]: async (job) => { ... },
    [JobType.EVALUATE_ANSWER]: async (job) => { ... },
    [JobType.GENERATE_QUIZ]: async (job) => { ... },
    
    // Video jobs
    [JobType.GENERATE_VIDEO_SHORT]: async (job) => { ... },
    [JobType.PROCESS_VIDEO]: async (job) => { ... },
    
    // Data jobs
    [JobType.GENERATE_INVOICE]: async (job) => { ... },
    [JobType.EXPORT_USER_DATA]: async (job) => { ... },
    [JobType.CLEANUP_TEMP_DATA]: async (job) => { ... },
    
    // Analytics jobs
    [JobType.TRACK_EVENT]: async (job) => { ... },
    [JobType.UPDATE_METRICS]: async (job) => { ... },
};
```

**Health Server**:
```typescript
// Built-in HTTP health check server
GET /health  -> {"status": "healthy", "uptime": ...}
GET /ready   -> {"status": "ready"}
```

**Graceful Shutdown**:
```typescript
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network (upsc-network)            │
│                     172.28.0.0/16                             │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │     Web     │   │     API     │   │   Worker    │       │
│  │   :3000     │   │   :3001     │   │   :3002     │       │
│  │ Next.js 14  │   │  Backend    │   │  BullMQ     │       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐       │
│  │    Redis    │   │  PostgreSQL │   │  Supabase   │       │
│  │   :6379     │   │   :5432     │   │   :8000     │       │
│  │ Cache/Queue │   │  Database   │   │  Local Dev  │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              pgAdmin (optional profile)             │   │
│  │                    :5050                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ External Access
                              ▼
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │  (nginx/traefik)│
                    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              HTTPS :443           Health Checks
```

---

## Health Check Endpoints

All services expose health check endpoints:

| Service | Endpoint | Port | Check Command |
|---------|----------|------|---------------|
| web | `/api/health` | 3000 | HTTP GET |
| api | `/api/health` | 3001 | HTTP GET |
| worker | `/health` | 3002 | HTTP GET |
| redis | - | 6379 | `redis-cli ping` |
| postgres | - | 5432 | `pg_isready` |
| supabase | `/health` | 8000 | HTTP GET |

**Health Check Configuration**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s  # 60s for production
```

---

## Quick Start Guide

### Prerequisites

```bash
# Check Docker version
docker --version  # 20.10+
docker-compose --version  # 2.0+

# Clone and navigate
cd upsc_ai
```

### Development Setup

```bash
# 1. Copy environment template
cp .env.docker.example .env.docker.local

# 2. Edit .env.docker.local with your values
#    - SUPABASE_* keys
#    - RAZORPAY_* keys (test mode)
#    - AI provider API keys

# 3. Start all services
docker-compose -f docker/docker-compose.yml \
  --env-file .env.docker.local \
  up -d

# 4. Check health
docker-compose -f docker/docker-compose.yml ps

# 5. View logs
docker-compose -f docker/docker-compose.yml logs -f web
docker-compose -f docker/docker-compose.yml logs -f worker
```

### Access Services

```bash
# Web Application
open http://localhost:3000

# API Server
curl http://localhost:3001/api/health

# Worker Health
curl http://localhost:3002/health

# Redis CLI
docker-compose -f docker/docker-compose.yml exec redis \
  redis-cli -a devpassword ping

# PostgreSQL
docker-compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d upsc_db
```

### Production Deployment

```bash
# 1. Create production config
cp .env.production.template .env.production
# Edit .env.production with real credentials

# 2. Build and deploy
docker-compose -f docker/docker-compose.production.yml \
  --env-file .env.production \
  up -d --build

# 3. Verify deployment
docker-compose -f docker/docker-compose.production.yml ps

# 4. Scale workers if needed
docker-compose -f docker/docker-compose.production.yml \
  up -d --scale worker=5
```

---

## Volume Management

### Persistent Volumes

| Volume | Service | Data |
|--------|---------|------|
| redis_data | redis | AOF persistence |
| postgres_data | postgres | Database files |
| supabase_data | supabase | Supabase data |
| pgadmin_data | pgadmin | pgAdmin config |

### Backup Database

```bash
# Backup
docker-compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres upsc_db > backup_$(date +%Y%m%d).sql

# Restore
docker-compose -f docker/docker-compose.yml exec -T postgres \
  psql -U postgres upsc_db < backup_20260411.sql
```

### Clean Slate

```bash
# Stop and remove volumes
docker-compose -f docker/docker-compose.yml down -v

# Remove all Docker artifacts
docker-compose -f docker/docker-compose.yml down -v --rmi all
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker/docker-compose.yml logs web
docker-compose -f docker/docker-compose.yml logs worker

# Restart service
docker-compose -f docker/docker-compose.yml restart web

# Rebuild
docker-compose -f docker/docker-compose.yml up -d --build web
```

### Database Connection Issues

```bash
# Check PostgreSQL health
docker-compose -f docker/docker-compose.yml ps postgres

# Test connection
docker-compose -f docker/docker-compose.yml exec postgres \
  pg_isready -U postgres

# View PostgreSQL logs
docker-compose -f docker/docker-compose.yml logs postgres
```

### Redis Connection Issues

```bash
# Check Redis health
docker-compose -f docker/docker-compose.yml ps redis

# Test connection
docker-compose -f docker/docker-compose.yml exec redis \
  redis-cli -a devpassword ping

# View Redis logs
docker-compose -f docker/docker-compose.yml logs redis
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose -f docker/docker-compose.yml logs worker

# Check queue stats (if worker is running)
curl http://localhost:3002/health

# Restart worker
docker-compose -f docker/docker-compose.yml restart worker
```

---

## Security Considerations

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Redis Password | devpassword | Strong random |
| Network | Open ports | Internal only |
| SSL/TLS | Not required | Required |
| Resource Limits | None | Enforced |
| Logging | Debug level | Info/Warn |
| Restart Policy | unless-stopped | always |

### Best Practices

1. **Never commit** `.env.docker.local` or `.env.production`
2. **Generate strong passwords**:
   ```bash
   openssl rand -base64 32
   ```
3. **Use Docker secrets** for production:
   ```bash
   echo "my_secret" | docker secret create redis_password -
   ```
4. **Enable SSL/TLS** with reverse proxy (nginx/traefik)
5. **Restrict network access** to database ports
6. **Regular security updates**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## Next Steps: Phase 6

Phase 6 will implement **CI/CD Pipeline**:

1. **GitHub Actions Workflows**
   - Auto build + test on push
   - Docker image build and push
   - SSH deployment to VPS

2. **Deployment Automation**
   - Zero-downtime deployment
   - Rollback capability
   - Environment promotion

3. **Image Registry**
   - Docker Hub or GitHub Container Registry
   - Multi-arch builds (amd64, arm64)
   - Image scanning for vulnerabilities

---

## Files Summary

| File | Type | Purpose |
|------|------|---------|
| `docker/Dockerfile.web` | Created | Web application container |
| `docker/Dockerfile.api` | Created | API server container |
| `docker/Dockerfile.worker` | Created | Worker container |
| `docker/docker-compose.yml` | Created | Development orchestration |
| `docker/docker-compose.production.yml` | Created | Production orchestration |
| `docker/README.md` | Created | Docker usage guide |
| `.env.development` | Created | Development config |
| `.env.docker` | Updated | Docker deployment template |
| `.env.docker.example` | Updated | Example Docker config |
| `.env.production.template` | Updated | Production config template |
| `src/workers/bullmq-worker.ts` | Created | TypeScript worker entry point |

---

**Phase 5 Status**: ✅ Complete

The platform is now fully containerized with development and production Docker configurations, ready for CI/CD automation in Phase 6.
