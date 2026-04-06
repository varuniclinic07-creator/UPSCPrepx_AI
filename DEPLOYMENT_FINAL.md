# 🚀 Single Docker Compose - Final Deployment Guide

## ✅ **PORT CONFIGURATION (CONFLICT-FREE)**

### Ports Already in Use (Coolify)
- ❌ 8000 - Coolify Dashboard
- ❌ 8080 - Reserved
- ❌ 8088 - Reserved

### Our Service Ports (Updated)
| Service | Port | Status |
|---------|------|--------|
| Redis | 6379 | ✅ Available |
| MinIO API | 9000 | ✅ Available |
| MinIO Console | 9001 | ✅ Available |
| Crawl4AI | 11235 | ✅ Available |
| Autodoc | 8031 | ✅ Available |
| File Search | 8032 | ✅ Available |
| Web Search | 8030 | ✅ Available |
| **Plausible** | **8089** | ✅ Changed from 8088 |
| **Mautic** | **8084** | ✅ Changed from 8083 |
| Uptime Kuma | 3003 | ✅ Available |
| Prometheus | 9090 | ✅ Available |
| Grafana | 3001 | ✅ Available |
| Jaeger | 16686 | ✅ Available |

---

## 📦 **FILES TO UPLOAD**

### 1. Main Files
```
/opt/upsc-complete/
├── docker-compose.complete.yml  ✅
├── .env                         ✅ (renamed from .env.complete)
├── prometheus.yml               ✅
├── Crawl4ai/                    ✅ (entire folder)
└── AgenticServices/             ✅ (entire folder)
```

### 2. Upload Commands
```bash
# From local machine
scp docker-compose.complete.yml root@89.117.60.144:/opt/upsc-complete/
scp .env.complete root@89.117.60.144:/opt/upsc-complete/.env
scp prometheus.yml root@89.117.60.144:/opt/upsc-complete/
scp -r Crawl4ai root@89.117.60.144:/opt/upsc-complete/
scp -r AgenticServices root@89.117.60.144:/opt/upsc-complete/
```

---

## 🚀 **DEPLOYMENT**

### Step 1: Generate Passwords
```bash
ssh root@89.117.60.144
cd /opt/upsc-complete

# Generate all passwords
cat > generate-passwords.sh << 'EOF'
#!/bin/bash
echo "# Generated passwords - copy to .env file"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)"
echo "CRAWL4AI_API_TOKEN=$(openssl rand -hex 32)"
echo "PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -base64 64)"
echo "PLAUSIBLE_DB_PASSWORD=$(openssl rand -base64 32)"
echo "MAUTIC_DB_PASSWORD=$(openssl rand -base64 32)"
echo "MAUTIC_DB_ROOT_PASSWORD=$(openssl rand -base64 32)"
EOF

chmod +x generate-passwords.sh
./generate-passwords.sh > passwords.txt
cat passwords.txt
```

### Step 2: Update .env File
```bash
nano .env

# Update these values:
# - All generated passwords from passwords.txt
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_APP_URL
```

### Step 3: Deploy All Services
```bash
cd /opt/upsc-complete

# Deploy
docker-compose -f docker-compose.complete.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## ✅ **VERIFICATION**

### Test All Services
```bash
# Critical Services
curl http://localhost:6379  # Redis
curl http://localhost:9000/minio/health/live  # MinIO
curl http://localhost:11235/health  # Crawl4AI

# Agentic Services
curl http://localhost:8031/health  # Autodoc
curl http://localhost:8032/health  # File Search
curl http://localhost:8030/health  # Web Search

# Analytics & Marketing
curl http://localhost:8089  # Plausible (NEW PORT)
curl http://localhost:8084  # Mautic (NEW PORT)

# Monitoring
curl http://localhost:3003  # Uptime Kuma
curl http://localhost:9090  # Prometheus
curl http://localhost:3001  # Grafana
curl http://localhost:16686  # Jaeger
```

---

## 🌐 **ACCESS URLS**

| Service | URL | Credentials |
|---------|-----|-------------|
| MinIO Console | http://89.117.60.144:9001 | upscadmin / [password] |
| **Plausible** | **http://89.117.60.144:8089** | Setup on first visit |
| **Mautic** | **http://89.117.60.144:8084** | Setup on first visit |
| Uptime Kuma | http://89.117.60.144:3003 | Setup on first visit |
| Prometheus | http://89.117.60.144:9090 | No auth |
| Grafana | http://89.117.60.144:3001 | admin / [password] |
| Jaeger | http://89.117.60.144:16686 | No auth |

---

## 📝 **UPDATE NEXT.JS .ENV.LOCAL**

```env
# VPS Services (UPDATED PORTS)
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
PLAUSIBLE_URL=http://89.117.60.144:8089
MAUTIC_URL=http://89.117.60.144:8084
UPTIME_KUMA_URL=http://89.117.60.144:3003
```

---

## 🎯 **QUICK COMMANDS**

```bash
# Start all
docker-compose -f docker-compose.complete.yml up -d

# Stop all
docker-compose -f docker-compose.complete.yml down

# Restart service
docker-compose -f docker-compose.complete.yml restart plausible

# View logs
docker-compose -f docker-compose.complete.yml logs -f

# Check status
docker-compose -f docker-compose.complete.yml ps
```

---

## ✅ **FINAL CHECKLIST**

- [ ] All files uploaded to `/opt/upsc-complete/`
- [ ] Passwords generated and added to `.env`
- [ ] Supabase credentials configured
- [ ] `docker-compose up -d` executed successfully
- [ ] All 15 containers running
- [ ] Health checks passing
- [ ] Plausible accessible on port **8089**
- [ ] Mautic accessible on port **8084**
- [ ] Next.js `.env.local` updated with new ports

---

## 🎉 **SUCCESS!**

**All 15 services deployed on conflict-free ports!**

**Changed Ports:**
- Plausible: 8088 → **8089** ✅
- Mautic: 8083 → **8084** ✅

**One command deployment:**
```bash
docker-compose -f docker-compose.complete.yml up -d
```
