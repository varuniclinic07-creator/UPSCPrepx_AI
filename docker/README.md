# UPSC CSE Master - Docker Deployment Guide

## Overview

This directory contains all Docker configuration for the UPSC CSE Master platform:

- **Dockerfile.web** - Next.js web application
- **Dockerfile.api** - API server for backend services
- **Dockerfile.worker** - BullMQ worker for async job processing
- **docker-compose.yml** - Development environment
- **docker-compose.production.yml** - Production deployment

## Quick Start

### Development

```bash
# Start all services (development)
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop all services
docker-compose -f docker/docker-compose.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker/docker-compose.yml down -v
```

### Production

```bash
# Build and start production
docker-compose -f docker/docker-compose.production.yml up -d --build

# Scale worker instances
docker-compose -f docker/docker-compose.production.yml up -d --scale worker=3
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| web | 3000 | Next.js web application |
| api | 3001 | API server |
| worker | 3002 | BullMQ worker |
| redis | 6379 | Redis cache + queue |
| postgres | 5432 | PostgreSQL database |
| supabase | 8000 | Supabase local (dev only) |
| pgadmin | 5050 | Database admin (optional) |

## Environment Configuration

1. Copy the template:
   ```bash
   cp .env.docker.example .env.docker.local
   ```

2. Update values in `.env.docker.local`:
   - `REDIS_PASSWORD` - Generate strong password
   - `SUPABASE_*` - Your Supabase credentials
   - `RAZORPAY_*` - Payment gateway credentials
   - `*_API_KEY` - AI provider API keys

3. Start with your config:
   ```bash
   docker-compose -f docker/docker-compose.yml --env-file .env.docker.local up -d
   ```

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose -f docker/docker-compose.yml ps

# Individual health checks
curl http://localhost:3000/api/health  # Web
curl http://localhost:3001/api/health  # API
curl http://localhost:3002/health      # Worker
```

## Accessing Services

### Web Application
- URL: http://localhost:3000
- Health: http://localhost:3000/api/health

### API Server
- URL: http://localhost:3001
- Health: http://localhost:3001/api/health

### Worker
- Health: http://localhost:3002/health

### Redis
- Host: localhost
- Port: 6379
- Password: devpassword (dev) / REDIS_PASSWORD (prod)
```bash
redis-cli -a devpassword ping
```

### PostgreSQL
- Host: localhost
- Port: 5432
- User: postgres
- Password: devpassword (dev) / POSTGRES_PASSWORD (prod)
- Database: upsc_db (dev) / upsc_production (prod)
```bash
psql postgresql://postgres:devpassword@localhost:5432/upsc_db
```

### pgAdmin (Optional)
- URL: http://localhost:5050
- Email: admin@upsc.local
- Password: admin

Enable with: `docker-compose -f docker/docker-compose.yml --profile tools up -d`

## Volume Management

### Persistent Data
- `redis_data` - Redis persistence
- `postgres_data` - PostgreSQL database
- `supabase_data` - Supabase data
- `pgadmin_data` - pgAdmin configuration

### Backup Database
```bash
docker-compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres upsc_db > backup.sql
```

### Restore Database
```bash
docker-compose -f docker/docker-compose.yml exec -T postgres \
  psql -U postgres upsc_db < backup.sql
```

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose -f docker/docker-compose.yml logs <service-name>

# Restart service
docker-compose -f docker/docker-compose.yml restart <service-name>

# Rebuild service
docker-compose -f docker/docker-compose.yml up -d --build <service-name>
```

### Database connection issues
```bash
# Check PostgreSQL is healthy
docker-compose -f docker/docker-compose.yml ps postgres

# Test connection
docker-compose -f docker/docker-compose.yml exec postgres \
  pg_isready -U postgres
```

### Redis connection issues
```bash
# Check Redis is healthy
docker-compose -f docker/docker-compose.yml ps redis

# Test connection
docker-compose -f docker/docker-compose.yml exec redis \
  redis-cli -a devpassword ping
```

## Production Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- SSL/TLS certificates (for HTTPS)
- Domain configured

### Steps

1. Create production environment file:
   ```bash
   cp .env.production.template .env.production
   # Edit .env.production with real values
   ```

2. Build and deploy:
   ```bash
   docker-compose -f docker/docker-compose.production.yml \
     --env-file .env.production \
     up -d --build
   ```

3. Verify deployment:
   ```bash
   docker-compose -f docker/docker-compose.production.yml ps
   curl https://your-domain.com/api/health
   ```

### Resource Limits

Production compose file includes resource limits:

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| web | 2.0 | 2G |
| api | 2.0 | 2G |
| worker | 4.0 | 4G |
| redis | 1.0 | 512M |

### Scaling Workers

```bash
# Scale to 5 worker instances
docker-compose -f docker/docker-compose.production.yml up -d --scale worker=5
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                           │
│                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                   │
│  │   Web   │   │   API   │   │ Worker  │                   │
│  │ :3000   │   │ :3001   │   │ :3002   │                   │
│  └────┬────┘   └────┬────┘   └────┬────┘                   │
│       │             │             │                         │
│       └─────────────┼─────────────┘                         │
│                     │                                       │
│       ┌─────────────┼─────────────┐                         │
│       │             │             │                         │
│  ┌────▼────┐   ┌────▼────┐        │                         │
│  │  Redis  │   │ Postgres│        │                         │
│  │ :6379   │   │ :5432   │        │                         │
│  └─────────┘   └─────────┘        │                         │
│                                   │                         │
│  ┌────────────────────────────────▼─────┐                  │
│  │         Supabase (dev only)          │                  │
│  │               :8000                  │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Security Notes

1. **Never commit** `.env.docker.local` or `.env.production` to version control
2. Change all `CHANGE_ME_*` values before deploying
3. Use strong passwords (minimum 32 characters)
4. Enable SSL/TLS for production
5. Restrict network access to database ports
6. Use Docker secrets for sensitive data in production

## Next Steps

- Phase 6: CI/CD Pipeline (GitHub Actions)
- Phase 7: Kubernetes Deployment
- Phase 8: Monitoring Stack (Prometheus + Grafana)
