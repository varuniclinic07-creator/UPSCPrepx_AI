# Docker Deployment Guide

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+
- At least 8GB RAM available
- 20GB free disk space

## Quick Start

### 1. Build Custom Images

```bash
# Windows
build-images.bat

# Linux/Mac
chmod +x build-images.sh
./build-images.sh
```

### 2. Configure Environment

```bash
# Copy example environment file
copy .env.docker.example .env.docker

# Edit .env.docker with your values
notepad .env.docker
```

### 3. Start Services

```bash
# Start all services
docker-compose -f docker-compose.complete.yml --env-file .env.docker up -d

# View logs
docker-compose -f docker-compose.complete.yml logs -f

# Check status
docker-compose -f docker-compose.complete.yml ps
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Redis | 6379 | Cache & Queue |
| MinIO | 9000, 9001 | Object Storage |
| Crawl4AI | 11235 | Web Scraping |
| Web Search | 8030 | Real-time Search |
| AutoDoc | 8031 | Explanation Generator |
| File Search | 8032 | Semantic Search |
| Manim | 8033 | Animation Rendering |
| Remotion | 8034 | Video Rendering |
| Plausible | 8089 | Analytics |
| Mautic | 8084 | Marketing |
| Uptime Kuma | 3003 | Monitoring |
| Prometheus | 9090 | Metrics |
| Grafana | 3001 | Visualization |
| Jaeger | 16686 | Tracing |

## Troubleshooting

### Issue: "pull access denied" errors

**Solution:** Build images locally first using `build-images.bat`

### Issue: Services not starting

**Solution:** Check logs and ensure ports are not in use
```bash
docker-compose -f docker-compose.complete.yml logs [service-name]
```

### Issue: Out of memory

**Solution:** Increase Docker Desktop memory limit to 8GB+

### Issue: Build context errors

**Solution:** Ensure directory structure matches:
```
latest app/
├── Crawl4ai/
│   └── Dockerfile
├── AgenticServices/
│   ├── web-search/Dockerfile
│   ├── file-search/Dockerfile
│   └── autodoc/Dockerfile
├── manim-service/
│   └── Dockerfile
└── remotion-service/
    └── Dockerfile
```

## Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose.complete.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.complete.yml down -v
```

## Updating Services

```bash
# Rebuild specific service
docker-compose -f docker-compose.complete.yml build [service-name]

# Restart specific service
docker-compose -f docker-compose.complete.yml restart [service-name]
```

## Health Checks

All services include health checks. View status:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Resource Limits

Services have CPU and memory limits configured. Adjust in `docker-compose.complete.yml` if needed.

## Production Deployment

For production:
1. Use strong passwords in `.env.docker`
2. Enable SSL/TLS
3. Configure proper backup strategy
4. Set up monitoring alerts
5. Use Docker secrets for sensitive data
