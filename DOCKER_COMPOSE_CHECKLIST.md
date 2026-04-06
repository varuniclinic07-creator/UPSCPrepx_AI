# 📦 Docker Compose Files - Complete Deployment Checklist

## 🎯 **ALL DOCKER COMPOSE FILES TO UPLOAD**

### **Critical Services (REQUIRED)**

#### 1. **Crawl4AI Service**
**File**: `Crawl4ai/docker-compose.coolify.yml`
**Location**: `/opt/upsc-crawl4ai/`
**Services**: Crawl4AI web scraping
**Port**: 11235
**Status**: ✅ Ready

#### 2. **Complete VPS Stack**
**File**: `docker-compose.vps-complete.yml`
**Location**: `/opt/upsc-stack/`
**Services**: 
- Redis (6379)
- MinIO (9000, 9001)
- Crawl4AI (11235)
- Plausible (8088)
- Mautic (8083)
- Uptime Kuma (3003)
**Status**: ✅ Ready

---

### **Optional Services**

#### 3. **Optional Services Stack**
**File**: `docker-compose.optional-services.yml`
**Location**: `/opt/upsc-stack/`
**Services**:
- Autodoc Thinker (8031)
- File Search (8032)
- Web Search (8030)
- Plausible Analytics (8088)
- Mautic Marketing (8083)
- Uptime Kuma (3003)
**Status**: ✅ Ready

#### 4. **Monitoring Stack**
**File**: `docker-compose.monitoring.yml`
**Location**: `/opt/upsc-stack/`
**Services**:
- Prometheus (9090)
- Grafana (3001)
- Jaeger (16686)
**Status**: ✅ Ready

---

## 📋 **DEPLOYMENT MATRIX**

| File | Services | Ports | Priority | Upload To |
|------|----------|-------|----------|-----------|
| `Crawl4ai/docker-compose.coolify.yml` | Crawl4AI | 11235 | CRITICAL | `/opt/upsc-crawl4ai/` |
| `docker-compose.vps-complete.yml` | Redis, MinIO, Crawl4AI | 6379, 9000, 11235 | CRITICAL | `/opt/upsc-stack/` |
| `docker-compose.optional-services.yml` | Agentic + Analytics | 8030-8088 | OPTIONAL | `/opt/upsc-stack/` |
| `docker-compose.monitoring.yml` | Prometheus, Grafana | 9090, 3001 | OPTIONAL | `/opt/upsc-stack/` |

---

## 🚀 **DEPLOYMENT STRATEGY**

### **Option 1: Minimal Deployment (Critical Only)**
Upload and deploy:
1. `Crawl4ai/docker-compose.coolify.yml`
2. `docker-compose.vps-complete.yml`

**Total Services**: 6 (Redis, MinIO, Crawl4AI, Plausible, Mautic, Uptime Kuma)

### **Option 2: Full Deployment (All Services)**
Upload and deploy:
1. `Crawl4ai/docker-compose.coolify.yml`
2. `docker-compose.vps-complete.yml`
3. `docker-compose.optional-services.yml`
4. `docker-compose.monitoring.yml`

**Total Services**: 15 (All services + monitoring)

### **Option 3: Recommended Deployment**
Upload and deploy:
1. `Crawl4ai/docker-compose.coolify.yml` - Web scraping
2. `docker-compose.vps-complete.yml` - Core infrastructure
3. `docker-compose.monitoring.yml` - Observability

**Total Services**: 9 (Critical + Monitoring)

---

## 📁 **FILES TO UPLOAD**

### **To VPS at 89.117.60.144**

#### Directory: `/opt/upsc-crawl4ai/`
```
Crawl4ai/
├── docker-compose.coolify.yml ✅
├── Dockerfile ✅
├── api_server.py ✅
├── upsc_content_crawler.py ✅
├── upsc_crawler_config.py ✅
├── requirements.txt ✅
└── .env (create on server)
```

#### Directory: `/opt/upsc-stack/`
```
├── docker-compose.vps-complete.yml ✅
├── docker-compose.optional-services.yml ✅
├── docker-compose.monitoring.yml ✅
├── prometheus.yml ✅
├── AgenticServices/ ✅
│   ├── requirements.txt
│   ├── autodoc/
│   │   ├── main.py
│   │   └── Dockerfile
│   ├── file-search/
│   │   ├── main.py
│   │   └── Dockerfile
│   └── web-search/
│       ├── main.py
│       └── Dockerfile
└── .env (create on server)
```

---

## 🔧 **ENVIRONMENT FILES NEEDED**

### 1. `/opt/upsc-crawl4ai/.env`
```env
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
CRAWL4AI_API_TOKEN=your_token
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2. `/opt/upsc-stack/.env`
```env
# Redis
REDIS_PASSWORD=your_redis_password

# MinIO
MINIO_ROOT_USER=upscadmin
MINIO_ROOT_PASSWORD=your_minio_password

# Crawl4AI
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
CRAWL4AI_API_TOKEN=your_token
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Plausible
PLAUSIBLE_SECRET_KEY_BASE=your_secret
PLAUSIBLE_DB_PASSWORD=your_password

# Mautic
MAUTIC_DB_PASSWORD=your_password
MAUTIC_DB_ROOT_PASSWORD=your_root_password

# Grafana
GRAFANA_PASSWORD=admin
```

---

## 📝 **DEPLOYMENT COMMANDS**

### **Step 1: Upload Files**
```bash
# SSH to VPS
ssh root@89.117.60.144

# Create directories
mkdir -p /opt/upsc-crawl4ai
mkdir -p /opt/upsc-stack

# Upload files (from local machine)
scp -r Crawl4ai/* root@89.117.60.144:/opt/upsc-crawl4ai/
scp docker-compose.*.yml root@89.117.60.144:/opt/upsc-stack/
scp prometheus.yml root@89.117.60.144:/opt/upsc-stack/
scp -r AgenticServices root@89.117.60.144:/opt/upsc-stack/
```

### **Step 2: Create Environment Files**
```bash
# On VPS
cd /opt/upsc-crawl4ai
nano .env  # Add variables

cd /opt/upsc-stack
nano .env  # Add variables
```

### **Step 3: Deploy Services**
```bash
# Deploy Crawl4AI
cd /opt/upsc-crawl4ai
docker-compose -f docker-compose.coolify.yml up -d

# Deploy Core Stack
cd /opt/upsc-stack
docker-compose -f docker-compose.vps-complete.yml up -d

# Deploy Optional Services (if needed)
docker-compose -f docker-compose.optional-services.yml up -d

# Deploy Monitoring (if needed)
docker-compose -f docker-compose.monitoring.yml up -d
```

### **Step 4: Verify Deployment**
```bash
# Check all containers
docker ps

# Check logs
docker-compose logs -f

# Test health endpoints
curl http://localhost:11235/health  # Crawl4AI
curl http://localhost:9000/minio/health/live  # MinIO
curl http://localhost:9090  # Prometheus
```

---

## ✅ **DEPLOYMENT CHECKLIST**

### Pre-Deployment
- [ ] VPS accessible at 89.117.60.144
- [ ] Docker and Docker Compose installed
- [ ] Coolify running (if using Coolify UI)
- [ ] All passwords generated
- [ ] Supabase credentials ready

### File Upload
- [ ] `Crawl4ai/docker-compose.coolify.yml` uploaded
- [ ] `docker-compose.vps-complete.yml` uploaded
- [ ] `docker-compose.optional-services.yml` uploaded (optional)
- [ ] `docker-compose.monitoring.yml` uploaded (optional)
- [ ] `prometheus.yml` uploaded
- [ ] `AgenticServices/` folder uploaded
- [ ] All Python files uploaded

### Environment Setup
- [ ] `.env` created in `/opt/upsc-crawl4ai/`
- [ ] `.env` created in `/opt/upsc-stack/`
- [ ] All passwords set
- [ ] All URLs configured

### Deployment
- [ ] Crawl4AI deployed and healthy
- [ ] Redis deployed and accessible
- [ ] MinIO deployed and accessible
- [ ] Optional services deployed (if needed)
- [ ] Monitoring deployed (if needed)

### Verification
- [ ] All containers running
- [ ] Health checks passing
- [ ] Ports accessible
- [ ] Services communicating
- [ ] Logs clean (no errors)

---

## 🎯 **QUICK REFERENCE**

### Deploy Everything
```bash
cd /opt/upsc-stack
docker-compose -f docker-compose.vps-complete.yml \
               -f docker-compose.optional-services.yml \
               -f docker-compose.monitoring.yml up -d
```

### Deploy Critical Only
```bash
cd /opt/upsc-crawl4ai
docker-compose -f docker-compose.coolify.yml up -d

cd /opt/upsc-stack
docker-compose -f docker-compose.vps-complete.yml up -d
```

### Stop All Services
```bash
cd /opt/upsc-stack
docker-compose -f docker-compose.vps-complete.yml down
docker-compose -f docker-compose.optional-services.yml down
docker-compose -f docker-compose.monitoring.yml down
```

---

## 📞 **Support**

**Documentation**: 
- `COMPLETE_VPS_DEPLOYMENT.md`
- `OPTIONAL_SERVICES_DEPLOYMENT.md`
- `IMPROVEMENTS_COMPLETE.md`

**Troubleshooting**: Check logs with `docker-compose logs -f`
