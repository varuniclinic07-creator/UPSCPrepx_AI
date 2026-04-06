# 🚀 Single Docker Compose Deployment Guide

## 📦 **ONE FILE TO RULE THEM ALL**

**File**: `docker-compose.complete.yml`  
**Environment**: `.env.complete`  
**All Services**: 15 containers in one stack

---

## 📋 **WHAT'S INCLUDED**

### Critical Services (6)
1. **Redis** - Cache & queues (6379)
2. **MinIO** - Object storage (9000, 9001)
3. **Crawl4AI** - Web scraping (11235)
4. **Autodoc** - Explanations (8031)
5. **File Search** - Semantic search (8032)
6. **Web Search** - Real-time search (8030)

### Optional Services (6)
7. **Plausible** - Analytics (8088)
8. **Mautic** - Marketing (8083)
9. **Uptime Kuma** - Monitoring (3003)
10. **Prometheus** - Metrics (9090)
11. **Grafana** - Dashboards (3001)
12. **Jaeger** - Tracing (16686)

### Databases (3)
- Plausible PostgreSQL
- Mautic MySQL
- All data persisted in volumes

---

## 🚀 **DEPLOYMENT STEPS**

### Step 1: Upload Files to VPS

```bash
# SSH to VPS
ssh root@89.117.60.144

# Create directory
mkdir -p /opt/upsc-complete
cd /opt/upsc-complete

# From local machine, upload files
scp docker-compose.complete.yml root@89.117.60.144:/opt/upsc-complete/
scp .env.complete root@89.117.60.144:/opt/upsc-complete/.env
scp prometheus.yml root@89.117.60.144:/opt/upsc-complete/
scp -r Crawl4ai root@89.117.60.144:/opt/upsc-complete/
scp -r AgenticServices root@89.117.60.144:/opt/upsc-complete/
```

### Step 2: Configure Environment

```bash
# On VPS
cd /opt/upsc-complete

# Edit .env file
nano .env

# Generate all passwords at once
cat > generate-passwords.sh << 'EOF'
#!/bin/bash
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)"
echo "CRAWL4AI_API_TOKEN=$(openssl rand -hex 32)"
echo "PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -base64 64)"
echo "PLAUSIBLE_DB_PASSWORD=$(openssl rand -base64 32)"
echo "MAUTIC_DB_PASSWORD=$(openssl rand -base64 32)"
echo "MAUTIC_DB_ROOT_PASSWORD=$(openssl rand -base64 32)"
EOF

chmod +x generate-passwords.sh
./generate-passwords.sh

# Copy output to .env file
```

### Step 3: Deploy All Services

```bash
cd /opt/upsc-complete

# Deploy everything
docker-compose -f docker-compose.complete.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Verify Deployment

```bash
# Test each service
curl http://localhost:6379  # Redis
curl http://localhost:9000/minio/health/live  # MinIO
curl http://localhost:11235/health  # Crawl4AI
curl http://localhost:8031/health  # Autodoc
curl http://localhost:8032/health  # File Search
curl http://localhost:8030/health  # Web Search
curl http://localhost:8088  # Plausible
curl http://localhost:8083  # Mautic
curl http://localhost:3003  # Uptime Kuma
curl http://localhost:9090  # Prometheus
curl http://localhost:3001  # Grafana
curl http://localhost:16686  # Jaeger
```

---

## 🎯 **QUICK COMMANDS**

### Start All Services
```bash
docker-compose -f docker-compose.complete.yml up -d
```

### Stop All Services
```bash
docker-compose -f docker-compose.complete.yml down
```

### Restart Specific Service
```bash
docker-compose -f docker-compose.complete.yml restart redis
docker-compose -f docker-compose.complete.yml restart crawl4ai
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.complete.yml logs -f

# Specific service
docker-compose -f docker-compose.complete.yml logs -f crawl4ai
```

### Check Status
```bash
docker-compose -f docker-compose.complete.yml ps
```

### Update Services
```bash
docker-compose -f docker-compose.complete.yml pull
docker-compose -f docker-compose.complete.yml up -d
```

---

## 📊 **ACCESS SERVICES**

| Service | URL | Credentials |
|---------|-----|-------------|
| MinIO Console | http://89.117.60.144:9001 | upscadmin / [MINIO_ROOT_PASSWORD] |
| Plausible | http://89.117.60.144:8088 | Setup on first visit |
| Mautic | http://89.117.60.144:8083 | Setup on first visit |
| Uptime Kuma | http://89.117.60.144:3003 | Setup on first visit |
| Prometheus | http://89.117.60.144:9090 | No auth |
| Grafana | http://89.117.60.144:3001 | admin / [GRAFANA_PASSWORD] |
| Jaeger | http://89.117.60.144:16686 | No auth |

---

## 🔧 **RESOURCE USAGE**

| Service | CPU | RAM | Storage |
|---------|-----|-----|---------|
| Redis | 1.0 | 512M | ~100MB |
| MinIO | 2.0 | 2G | Variable |
| Crawl4AI | 2.0 | 2G | ~1GB |
| Autodoc | 1.0 | 512M | Minimal |
| File Search | 1.0 | 512M | ~1GB |
| Web Search | 1.0 | 512M | Minimal |
| Plausible | 1.0 | 1G | ~2GB |
| Mautic | 1.0 | 1G | ~5GB |
| Uptime Kuma | 0.5 | 512M | ~500MB |
| Prometheus | 1.0 | 1G | ~2GB |
| Grafana | 1.0 | 512M | ~500MB |
| Jaeger | 1.0 | 512M | ~1GB |
| **Total** | **13.5** | **11.5GB** | **~14GB** |

**Recommended VPS**: 16 CPU cores, 16GB RAM, 50GB storage

---

## ✅ **DEPLOYMENT CHECKLIST**

### Pre-Deployment
- [ ] VPS accessible at 89.117.60.144
- [ ] Docker installed (`docker --version`)
- [ ] Docker Compose installed (`docker-compose --version`)
- [ ] Minimum 16GB RAM available
- [ ] Minimum 50GB storage available

### File Upload
- [ ] `docker-compose.complete.yml` uploaded
- [ ] `.env.complete` renamed to `.env` and uploaded
- [ ] `prometheus.yml` uploaded
- [ ] `Crawl4ai/` folder uploaded
- [ ] `AgenticServices/` folder uploaded

### Configuration
- [ ] All passwords generated
- [ ] `.env` file updated with real values
- [ ] SUPABASE_URL configured
- [ ] SUPABASE_SERVICE_ROLE_KEY configured
- [ ] NEXT_PUBLIC_APP_URL configured

### Deployment
- [ ] `docker-compose up -d` executed
- [ ] All containers running (`docker-compose ps`)
- [ ] No errors in logs (`docker-compose logs`)

### Verification
- [ ] All health checks passing
- [ ] All ports accessible
- [ ] Services communicating
- [ ] Web UIs accessible

---

## 🐛 **TROUBLESHOOTING**

### Container Won't Start
```bash
# Check logs
docker-compose logs service_name

# Check resources
docker stats

# Restart service
docker-compose restart service_name
```

### Port Already in Use
```bash
# Find process using port
netstat -tulpn | grep :PORT

# Kill process or change port in docker-compose.yml
```

### Out of Memory
```bash
# Check memory
free -h

# Increase swap
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### Database Connection Failed
```bash
# Restart database
docker-compose restart plausible-db
docker-compose restart mautic-db

# Check database logs
docker-compose logs plausible-db
docker-compose logs mautic-db
```

---

## 🎉 **SUCCESS!**

Once deployed, update your Next.js `.env.local`:

```env
# VPS Services
REDIS_URL=redis://:your_redis_password@89.117.60.144:6379
MINIO_ENDPOINT=89.117.60.144
MINIO_PORT=9000
MINIO_ACCESS_KEY=upscadmin
MINIO_SECRET_KEY=your_minio_password
CRAWL4AI_URL=http://89.117.60.144:11235
CRAWL4AI_API_TOKEN=your_crawl4ai_token
AUTODOC_THINKER_URL=http://89.117.60.144:8031
AGENTIC_FILE_SEARCH_URL=http://89.117.60.144:8032
AGENTIC_WEB_SEARCH_URL=http://89.117.60.144:8030
PLAUSIBLE_URL=http://89.117.60.144:8088
MAUTIC_URL=http://89.117.60.144:8083
UPTIME_KUMA_URL=http://89.117.60.144:3003
```

**All 15 services deployed with one command!** 🚀
