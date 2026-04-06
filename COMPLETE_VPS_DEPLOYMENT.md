# 🚀 Complete VPS Stack Deployment Guide

## 📊 Service Integration Status

### ✅ **INTEGRATED & READY** (9 services)
1. **Redis** - Rate limiting, caching, queues
2. **MinIO** - Object storage
3. **Crawl4AI** - Web scraping
4. **Plausible** - Analytics
5. **Mautic** - Marketing automation
6. **Uptime Kuma** - Monitoring
7. **Supabase** - Database (Cloud)
8. **A4F API** - AI generation (Cloud)
9. **Razorpay** - Payments (Cloud)

### ❌ **NOT INTEGRATED** (3 services)
- Autodoc Thinker (8031) - No client exists
- File Search (8032) - No client exists
- Web Search (8030) - No client exists

**Action**: These can be removed from .env or implemented if needed.

---

## 🎯 Deployment Options

### Option 1: Deploy All Services (Recommended)
Use `docker-compose.vps-complete.yml` to deploy everything at once.

### Option 2: Deploy Only Critical Services
Use individual docker-compose files for Redis, MinIO, and Crawl4AI.

### Option 3: Deploy via Coolify UI
Upload docker-compose file through Coolify dashboard.

---

## 📋 Pre-Deployment Checklist

- [ ] VPS accessible at 89.117.60.144
- [ ] Coolify installed and running on port 8000
- [ ] Docker and Docker Compose installed
- [ ] Supabase project created
- [ ] A4F API key obtained
- [ ] Razorpay account setup
- [ ] Domain configured (optional)

---

## 🚀 Quick Deploy (All Services)

### Step 1: Generate Environment Variables

```bash
# SSH to VPS
ssh root@89.117.60.144

# Create deployment directory
mkdir -p /opt/upsc-stack
cd /opt/upsc-stack

# Generate all passwords
cat > .env << 'EOF'
# Critical Services
REDIS_PASSWORD=$(openssl rand -base64 32)
MINIO_ROOT_USER=upscadmin
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)
CRAWL4AI_API_TOKEN=$(openssl rand -hex 32)

# Supabase (Get from dashboard)
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here

# Next.js App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional Services
PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -base64 64)
PLAUSIBLE_DB_PASSWORD=$(openssl rand -base64 32)
MAUTIC_DB_PASSWORD=$(openssl rand -base64 32)
MAUTIC_DB_ROOT_PASSWORD=$(openssl rand -base64 32)
EOF

# Execute to generate actual values
bash -c 'source .env && env | grep -E "PASSWORD|TOKEN|KEY" > .env.generated'
```

### Step 2: Upload Files

```bash
# Upload these files to /opt/upsc-stack:
# - docker-compose.vps-complete.yml
# - Crawl4ai/ folder (entire directory)
# - .env (with your actual values)
```

### Step 3: Deploy Stack

```bash
cd /opt/upsc-stack

# Deploy all services
docker-compose -f docker-compose.vps-complete.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Verify Services

```bash
# Redis
redis-cli -h localhost -p 6379 -a your_redis_password ping
# Expected: PONG

# MinIO
curl http://localhost:9000/minio/health/live
# Expected: 200 OK

# Crawl4AI
curl http://localhost:11235/health
# Expected: {"status":"healthy"}

# Plausible
curl http://localhost:8088
# Expected: HTML response

# Mautic
curl http://localhost:8083
# Expected: HTML response

# Uptime Kuma
curl http://localhost:3003
# Expected: HTML response
```

---

## 🔧 Individual Service Deployment

### Deploy Only Critical Services

```bash
# Create minimal docker-compose
cat > docker-compose.critical.yml << 'EOF'
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports: ["6379:6379"]
    volumes: [redis-data:/data]
    networks: [coolify]
  
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio-data:/data]
    networks: [coolify]
  
  crawl4ai:
    build: ./Crawl4ai
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      API_TOKEN: ${CRAWL4AI_API_TOKEN}
    ports: ["11235:11235"]
    networks: [coolify]

volumes:
  redis-data:
  minio-data:

networks:
  coolify:
    external: true
EOF

# Deploy
docker-compose -f docker-compose.critical.yml up -d
```

---

## 🎛️ Coolify UI Deployment

### Step 1: Login to Coolify
```
http://89.117.60.144:8000
```

### Step 2: Create New Resource
1. Click "New Resource"
2. Select "Docker Compose"
3. Name: `upsc-complete-stack`

### Step 3: Configure
1. **Source**: Upload `docker-compose.vps-complete.yml`
2. **Environment**: Add all variables from `.env.vps-stack`
3. **Network**: Select `coolify` network
4. **Domain**: Optional (e.g., `services.yourdomain.com`)

### Step 4: Deploy
1. Click "Deploy"
2. Monitor build logs
3. Wait for all services to be healthy (~5-10 minutes)

---

## 📊 Service URLs After Deployment

| Service | Internal URL | External URL | Port |
|---------|-------------|--------------|------|
| Redis | redis://localhost:6379 | 89.117.60.144:6379 | 6379 |
| MinIO API | http://localhost:9000 | http://89.117.60.144:9000 | 9000 |
| MinIO Console | http://localhost:9001 | http://89.117.60.144:9001 | 9001 |
| Crawl4AI | http://localhost:11235 | http://89.117.60.144:11235 | 11235 |
| Plausible | http://localhost:8088 | http://89.117.60.144:8088 | 8088 |
| Mautic | http://localhost:8083 | http://89.117.60.144:8083 | 8083 |
| Uptime Kuma | http://localhost:3003 | http://89.117.60.144:3003 | 3003 |

---

## 🔗 Update Next.js Environment

Add to your Next.js `.env.local`:

```env
# Critical Services
REDIS_URL=redis://:your_redis_password@89.117.60.144:6379
MINIO_ENDPOINT=89.117.60.144
MINIO_PORT=9000
MINIO_ACCESS_KEY=upscadmin
MINIO_SECRET_KEY=your_minio_password
CRAWL4AI_URL=http://89.117.60.144:11235
CRAWL4AI_API_TOKEN=your_crawl4ai_token

# Optional Services
PLAUSIBLE_URL=http://89.117.60.144:8088
PLAUSIBLE_DOMAIN=aimasteryedu.in
MAUTIC_URL=http://89.117.60.144:8083
UPTIME_KUMA_URL=http://89.117.60.144:3003
```

---

## 🔒 Security Hardening

### 1. Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8000/tcp  # Coolify
ufw enable
```

### 2. Change Default Passwords
```bash
# Redis
redis-cli -h localhost -p 6379 -a old_password
CONFIG SET requirepass new_password

# MinIO
mc alias set myminio http://localhost:9000 upscadmin old_password
mc admin user add myminio newuser newpassword
```

### 3. Enable SSL (Optional)
```bash
# Use Coolify's built-in SSL with Let's Encrypt
# Or configure Traefik for SSL termination
```

---

## 📈 Monitoring Setup

### Configure Uptime Kuma

1. Access: `http://89.117.60.144:3003`
2. Create admin account
3. Add monitors for each service:
   - Redis: TCP monitor on port 6379
   - MinIO: HTTP monitor on `/minio/health/live`
   - Crawl4AI: HTTP monitor on `/health`
   - Plausible: HTTP monitor on `/api/health`

### Configure Plausible

1. Access: `http://89.117.60.144:8088`
2. Create admin account
3. Add site: `aimasteryedu.in`
4. Copy tracking script to Next.js app

---

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs service_name

# Check resource usage
docker stats

# Restart service
docker-compose restart service_name
```

### Port Already in Use
```bash
# Find process using port
netstat -tulpn | grep :PORT

# Kill process
kill -9 PID
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
# Check if database is running
docker-compose ps

# Check database logs
docker-compose logs database_name

# Restart database
docker-compose restart database_name
```

---

## 🎉 Success Criteria

### All Services Healthy
```bash
# Run health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🔍 Checking all services..."

# Redis
redis-cli -h localhost -p 6379 -a $REDIS_PASSWORD ping && echo "✅ Redis OK" || echo "❌ Redis FAIL"

# MinIO
curl -sf http://localhost:9000/minio/health/live && echo "✅ MinIO OK" || echo "❌ MinIO FAIL"

# Crawl4AI
curl -sf http://localhost:11235/health && echo "✅ Crawl4AI OK" || echo "❌ Crawl4AI FAIL"

# Plausible
curl -sf http://localhost:8088 > /dev/null && echo "✅ Plausible OK" || echo "❌ Plausible FAIL"

# Mautic
curl -sf http://localhost:8083 > /dev/null && echo "✅ Mautic OK" || echo "❌ Mautic FAIL"

# Uptime Kuma
curl -sf http://localhost:3003 > /dev/null && echo "✅ Uptime Kuma OK" || echo "❌ Uptime Kuma FAIL"

echo "✅ Health check complete!"
EOF

chmod +x health-check.sh
./health-check.sh
```

---

## 📞 Support

**Documentation**: See `SERVICE_INTEGRATION_STATUS.md`  
**Logs**: `docker-compose logs -f`  
**Status**: `docker-compose ps`  
**Restart**: `docker-compose restart`  
**Stop**: `docker-compose down`  
**Update**: `docker-compose pull && docker-compose up -d`

---

## ✅ Final Checklist

- [ ] All critical services deployed (Redis, MinIO, Crawl4AI)
- [ ] All services passing health checks
- [ ] Environment variables configured in Next.js
- [ ] Firewall configured
- [ ] Monitoring setup (Uptime Kuma)
- [ ] Analytics configured (Plausible)
- [ ] Backups configured
- [ ] SSL certificates installed (optional)
- [ ] Documentation updated
- [ ] Team notified

---

**🎉 Your complete VPS stack is now deployed and integrated with UPSC CSE Master!**
