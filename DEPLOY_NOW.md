# 🚀 DEPLOY NOW - Quick Start Guide

## Your VPS Credentials
- **IP:** `89.117.60.144`
- **User:** `root`
- **Password:** `772877mAmcIaS`
- **Coolify Dashboard:** `http://89.117.60.144:8000`

---

## ⚡ QUICK DEPLOYMENT (5 Minutes)

### Step 1: Open Terminal and SSH into VPS

```bash
ssh root@89.117.60.144
```
When prompted, enter password: `772877mAmcIaS`

---

### Step 2: Run These Commands on VPS

Copy and paste each block one at a time:

#### 2.1 - Create Directory and Clone Repository
```bash
mkdir -p /root/upscprepx
cd /root/upscprepx
rm -rf /root/upscprepx/*
git clone https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git .
```

#### 2.2 - Copy Environment File
```bash
cp .env.production .env
```

#### 2.3 - Stop Any Existing Services
```bash
docker-compose -f docker-compose.coolify.yml down --remove-orphans 2>/dev/null || true
```

#### 2.4 - Pull Docker Images
```bash
docker-compose -f docker-compose.coolify.yml pull
```

#### 2.5 - Start All Services
```bash
docker-compose -f docker-compose.coolify.yml up -d
```

#### 2.6 - Wait and Check Status
```bash
sleep 30
docker-compose -f docker-compose.coolify.yml ps
```

---

### Step 3: Verify Deployment

Run this health check:
```bash
echo "=== Health Check ==="
curl -sf http://localhost:9000/minio/health/live && echo "MinIO: ✓" || echo "MinIO: ✗"
curl -sf http://localhost:11235/health && echo "Crawl4AI: ✓" || echo "Crawl4AI: ✗"
curl -sf http://localhost:8030/health && echo "Web Search: ✓" || echo "Web Search: ✗"
curl -sf http://localhost:8031/health && echo "Autodoc: ✓" || echo "Autodoc: ✗"
curl -sf http://localhost:3004/api/health && echo "Grafana: ✓" || echo "Grafana: ✗"
curl -sf http://localhost:9090/-/healthy && echo "Prometheus: ✓" || echo "Prometheus: ✗"
echo "=== Done ==="
```

---

## 🌐 Access Your Services

After deployment, access these URLs:

| Service | URL |
|---------|-----|
| **MinIO Console** | http://89.117.60.144:9001 |
| **Grafana** | http://89.117.60.144:3004 |
| **Prometheus** | http://89.117.60.144:9090 |
| **Uptime Kuma** | http://89.117.60.144:3003 |
| **Jaeger** | http://89.117.60.144:16686 |

---

## 🔧 Deploy Main Next.js App via Coolify UI

### Option A: Using Coolify Dashboard

1. **Open Coolify:** http://89.117.60.144:8000
2. **Login:**
   - Email: `dranilkumarsharma4@gmail.com`
   - Password: `22547728.mIas`
3. **Create Project:**
   - Click "Projects" → "+ New Project"
   - Name: `UPSC-PrepX-AI`
4. **Add Resource:**
   - Click "+ New Resource"
   - Select "Public Repository"
   - URL: `https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git`
   - Branch: `main`
5. **Configure Build:**
   - Build Pack: `Dockerfile`
   - Port: `3000`
6. **Add Environment Variables:**
   - Go to "Environment Variables" tab
   - Copy ALL variables from `.env.production`
7. **Deploy:**
   - Click "Deploy" button
   - Wait for build to complete

### Option B: Build Docker Image Manually on VPS

```bash
cd /root/upscprepx

# Build the Next.js app
docker build -t upsc-app:latest .

# Run the container
docker run -d \
  --name upsc-app \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  upsc-app:latest

# Check logs
docker logs upsc-app --tail 50
```

---

## 🔒 Configure DNS & SSL

### DNS Configuration (at your domain registrar)

Add these A records for `aimasteryedu.in`:

| Type | Name | Value |
|------|------|-------|
| A | upscbyvarunsh | 89.117.60.144 |
| A | cdn | 89.117.60.144 |
| A | grafana | 89.117.60.144 |

### SSL Certificate (on VPS)

```bash
# Install certbot if not installed
apt-get update && apt-get install -y certbot

# Generate certificate
certbot certonly --standalone -d upscbyvarunsh.aimasteryedu.in

# Or use Coolify's built-in SSL feature
```

---

## 🆘 Troubleshooting

### If services don't start:
```bash
# Check logs
docker-compose -f docker-compose.coolify.yml logs --tail 50

# Restart services
docker-compose -f docker-compose.coolify.yml restart

# Check disk space
df -h

# Check memory
free -h
```

### If build fails:
```bash
# Clean Docker cache
docker system prune -af

# Rebuild
docker-compose -f docker-compose.coolify.yml build --no-cache
```

### If container keeps restarting:
```bash
# Check specific container logs
docker logs <container-name> --tail 100

# Check container status
docker inspect <container-name>
```

---

## ✅ Deployment Checklist

- [ ] SSH into VPS successful
- [ ] Repository cloned
- [ ] Environment file copied
- [ ] Docker images pulled
- [ ] Services started
- [ ] Health checks passing
- [ ] Main app deployed via Coolify
- [ ] DNS configured
- [ ] SSL certificate issued
- [ ] All services accessible

---

**🎉 Your UPSC CSE Master app should now be deployed!**

Main URL: https://upscbyvarunsh.aimasteryedu.in