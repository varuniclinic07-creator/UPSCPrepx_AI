# 🚀 UPSC CSE Master - Complete Coolify Deployment Guide

## Production Deployment to Self-Hosted Coolify

**VPS IP:** `89.117.60.144`  
**Domain:** `upscbyvarunsh.aimasteryedu.in`  
**Coolify Dashboard:** `http://89.117.60.144:8000`

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#phase-1-pre-deployment-checklist)
2. [SSH into VPS & Verify Coolify](#phase-2-ssh-into-vps--verify-coolify)
3. [Push Code to GitHub](#phase-3-push-code-to-github)
4. [Create Project in Coolify](#phase-4-create-project-in-coolify)
5. [Configure Environment Variables](#phase-5-configure-environment-variables)
6. [Deploy Main Application](#phase-6-deploy-main-application)
7. [Deploy Supporting Services](#phase-7-deploy-supporting-services)
8. [Configure DNS & SSL](#phase-8-configure-dns--ssl)
9. [Health Checks & Verification](#phase-9-health-checks--verification)
10. [Monitoring & Backup Setup](#phase-10-monitoring--backup-setup)

---

## 🔴 PHASE 1: Pre-Deployment Checklist

### Step 1.1: Verify All Files Are Ready

Run these commands in your local terminal (PowerShell):

```powershell
cd "c:\Users\DR-VARUNI\Desktop\AI APPS NEW\BMAD Latest\latest app"

# Check critical files exist
Test-Path ".env.production"           # Should return True
Test-Path "Dockerfile"                # Should return True
Test-Path "docker-compose.coolify.yml" # Should return True
Test-Path "next.config.js"            # Should return True
```

### Step 1.2: Verify next.config.js has standalone output

```javascript
// next.config.js should contain:
output: 'standalone',
```

✅ **VERIFIED** - Your next.config.js already has this configured.

### Step 1.3: Verify .env.production has all required variables

Key variables to check:
- ✅ `NODE_ENV=production`
- ✅ `NEXT_PUBLIC_APP_URL=https://upscbyvarunsh.aimasteryedu.in`
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Configured
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Configured
- ✅ `A4F_API_KEY` - Configured
- ✅ `REDIS_PASSWORD` - Configured
- ✅ `MINIO_ACCESS_KEY` & `MINIO_SECRET_KEY` - Configured

---

## 🔴 PHASE 2: SSH into VPS & Verify Coolify

### Step 2.1: SSH into your VPS

```bash
ssh root@89.117.60.144
# Password: 772877mAmcIaS
```

### Step 2.2: Verify Coolify is running

```bash
# Check Coolify containers
docker ps | grep coolify

# Check Coolify version
curl -s http://localhost:8000/api/health

# If Coolify is not running, start it:
cd /data/coolify
docker compose up -d
```

### Step 2.3: Check system resources

```bash
# Check available disk space (need at least 20GB free)
df -h

# Check available memory (need at least 4GB free)
free -h

# Check Docker status
systemctl status docker
```

### Step 2.4: Prepare deployment directory

```bash
# Create app directory
mkdir -p /root/upscprepx
cd /root/upscprepx

# Clean any old deployments
rm -rf /root/upscprepx/*
```

---

## 🔴 PHASE 3: Push Code to GitHub

### Step 3.1: Commit all changes locally

```powershell
cd "c:\Users\DR-VARUNI\Desktop\AI APPS NEW\BMAD Latest\latest app"

# Add all files
git add .

# Commit with deployment message
git commit -m "Production deployment ready - Coolify setup"

# Push to GitHub
git push origin main
```

### Step 3.2: Verify GitHub repository is updated

Open: https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git

Ensure all files are present including:
- `Dockerfile`
- `docker-compose.coolify.yml`
- `next.config.js` (with standalone output)

---

## 🔴 PHASE 4: Create Project in Coolify

### Step 4.1: Access Coolify Dashboard

1. Open browser: `http://89.117.60.144:8000`
2. Login with your credentials:
   - Email: `dranilkumarsharma4@gmail.com`
   - Password: `22547728.mIas`

### Step 4.2: Create New Project

1. Click **"Projects"** in the sidebar
2. Click **"+ New Project"**
3. Enter project details:
   - **Name:** `UPSC-PrepX-AI`
   - **Description:** `UPSC CSE Master Application`
4. Click **"Create"**

### Step 4.3: Add New Resource

1. Inside the project, click **"+ New Resource"**
2. Select **"Public Repository"** (or Private if you have SSH key configured)
3. Enter repository URL:
   ```
   https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git
   ```
4. Select branch: `main`

### Step 4.4: Configure Build Settings

1. **Build Pack:** Select **"Dockerfile"**
2. **Dockerfile Location:** `./Dockerfile`
3. **Port:** `3000`
4. Click **"Continue"**

---

## 🔴 PHASE 5: Configure Environment Variables

### Step 5.1: Add Environment Variables in Coolify

In the Coolify resource settings, go to **"Environment Variables"** tab and add ALL variables from `.env.production`:

```env
# APPLICATION CONFIGURATION
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://upscbyvarunsh.aimasteryedu.in
NEXT_PUBLIC_APP_NAME=UPSCPrepX-AI

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtb3Rxa3VrdmZ3anljdndmdnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTk1NTgsImV4cCI6MjA3ODE3NTU1OH0.REzTJWw4xOnrNx7myp-u8frItlUs4YknpS8uOm6yyz0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtb3Rxa3VrdmZ3anljdndmdnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU5OTU1OCwiZXhwIjoyMDc4MTc1NTU4fQ.vPq_A32l4jcQUwSJ2D6lNZSNJKGlX4W8wHZZ1FstY7Y
SUPABASE_JWT_SECRET=qDYyoXcdCGtwvBLUbiq36Pm4DF6xAD2ZodL8i9ceOk5uxaNWIf390BOwTpEJrcu+J/arHLZkCjhRRJ2RoUHksA==
DATABASE_URL=postgresql://postgres:22547728.mIas@db.emotqkukvfwjycvwfvyj.supabase.co:5432/postgres

# NEXTAUTH
NEXTAUTH_SECRET=H7jK3mN9pQ2rT5vX8yZ1bC4dF6gJ0kL3mN6pQ9rT2vX5
NEXTAUTH_URL=https://upscbyvarunsh.aimasteryedu.in

# AI PROVIDER
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1
A4F_RATE_LIMIT_RPM=10
A4F_RATE_LIMIT_CONCURRENT=5
GROQ_API_KEY=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
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_RATE_LIMIT_RPM=30
GROQ_RATE_LIMIT_CONCURRENT=10
USE_AI_ROUTING=true
ENABLE_GROQ_FALLBACK=true

# VPS SERVICES
SERVER_IP=89.117.60.144
REDIS_URL=redis://:R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8@redis:6379
REDIS_PASSWORD=R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8

# MINIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=M7xQK3mN9pR2tV5wY8zB
MINIO_SECRET_KEY=S4x1K8m6N3pQ0rT7vX2yZ9bC5dF1gH4jL7mN0pQ3rT6vX9wY2z
MINIO_BUCKET_NAME=upsc-production

# AGENTIC SERVICES
CRAWL4AI_URL=http://crawl4ai:11235
CRAWL4AI_TOKEN=Q8x4K2m9N7pR1tV5wY3zB6cD0eF8gH2jL4mN7pQ0rT3v
AGENTIC_AUTODOC_URL=http://autodoc:8031
AGENTIC_FILE_SEARCH_URL=http://file-search:8032

# MONITORING
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=G8x5K2m0N7pQ4rT1vX9yZ3bC6dF0gH3jL6

# PAYMENTS
RAZORPAY_KEY_ID=rzp_test_S2jukyfBQSJoab
RAZORPAY_KEY_SECRET=jdBHxxZmnLg8N6H6OHgAk75o

# EMAIL
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=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
SMTP_FROM=noreply@upsc.aimasteryedu.in

# SENTRY
NEXT_PUBLIC_SENTRY_DSN=https://1190845463e6572f6982c93b43ae95e3@o4510713202933760.ingest.us.sentry.io/4510713204047872
SENTRY_AUTH_TOKEN=c7f11c22f1e211f096b19efe9d4933c3
LOG_LEVEL=info

# FEATURE FLAGS
ENABLE_AGENTIC_SEARCH=true
ENABLE_PDF_EXPORT=true
ENABLE_VIDEO_GENERATION=true
ENABLE_MAINTENANCE_MODE=false
```

### Step 5.2: Save Environment Variables

Click **"Save"** to store all environment variables.

---

## 🔴 PHASE 6: Deploy Main Application

### Step 6.1: Configure Deployment Settings

In Coolify resource settings:

1. **General Settings:**
   - Name: `upsc-app`
   - Port: `3000`

2. **Domain Settings:**
   - Add domain: `upscbyvarunsh.aimasteryedu.in`
   - Enable HTTPS: `Yes`
   - Force HTTPS: `Yes`

3. **Health Check:**
   - Path: `/api/health`
   - Interval: `30s`

4. **Resources:**
   - CPU Limit: `2`
   - Memory Limit: `2GB`

### Step 6.2: Deploy the Application

1. Click **"Deploy"** button
2. Watch the build logs for any errors
3. Wait for deployment to complete (5-10 minutes)

### Step 6.3: Verify Deployment

After deployment completes:
```bash
# On VPS, check container is running
docker ps | grep upsc-app

# Check logs
docker logs upsc-app --tail 100
```

---

## 🔴 PHASE 7: Deploy Supporting Services

### Step 7.1: Deploy via Docker Compose (Recommended)

SSH into your VPS and run:

```bash
cd /root/upscprepx

# Clone the repository
git clone https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git .

# Copy environment file
# (You'll need to transfer .env.production from local machine)

# Deploy all services
docker-compose -f docker-compose.coolify.yml up -d
```

### Step 7.2: Transfer .env.production to VPS

From your local machine (PowerShell):

```powershell
# Using SCP
scp "c:\Users\DR-VARUNI\Desktop\AI APPS NEW\BMAD Latest\latest app\.env.production" root@89.117.60.144:/root/upscprepx/.env
```

Or manually copy the content and create the file on VPS:

```bash
# On VPS
cd /root/upscprepx
nano .env
# Paste all environment variables and save
```

### Step 7.3: Start All Services

```bash
cd /root/upscprepx

# Pull all images
docker-compose -f docker-compose.coolify.yml pull

# Start all services
docker-compose -f docker-compose.coolify.yml up -d

# Check all services are running
docker-compose -f docker-compose.coolify.yml ps
```

### Step 7.4: Verify Services

```bash
# Check Redis
docker exec upsc-redis redis-cli -a R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8 ping

# Check MinIO
curl http://localhost:9000/minio/health/live

# Check Crawl4AI
curl http://localhost:11235/health

# Check Grafana
curl http://localhost:3004/api/health
```

---

## 🔴 PHASE 8: Configure DNS & SSL

### Step 8.1: Configure DNS Records

Add these DNS records at your domain registrar (for aimasteryedu.in):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | upscbyvarunsh | 89.117.60.144 | 3600 |
| A | cdn | 89.117.60.144 | 3600 |
| A | analytics | 89.117.60.144 | 3600 |
| A | grafana | 89.117.60.144 | 3600 |

### Step 8.2: Configure SSL in Coolify

1. In Coolify dashboard, go to your application
2. Navigate to **"Domain"** settings
3. Click **"Generate SSL Certificate"**
4. Wait for Let's Encrypt certificate to be issued

### Step 8.3: Verify SSL

```bash
# Check SSL certificate
curl -I https://upscbyvarunsh.aimasteryedu.in

# Should show:
# HTTP/2 200
# strict-transport-security: max-age=31536000
```

---

## 🔴 PHASE 9: Health Checks & Verification

### Step 9.1: Run Health Check Script

On VPS:

```bash
#!/bin/bash
echo "=== UPSC CSE Master Health Check ==="

# Main App
echo -n "Main App: "
curl -sf http://localhost:3000/api/health && echo "✓ Healthy" || echo "✗ Unhealthy"

# Redis
echo -n "Redis: "
docker exec upsc-redis redis-cli -a R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8 ping 2>/dev/null | grep -q PONG && echo "✓ Healthy" || echo "✗ Unhealthy"

# MinIO
echo -n "MinIO: "
curl -sf http://localhost:9000/minio/health/live && echo "✓ Healthy" || echo "✗ Unhealthy"

# Crawl4AI
echo -n "Crawl4AI: "
curl -sf http://localhost:11235/health && echo "✓ Healthy" || echo "✗ Unhealthy"

# Web Search
echo -n "Web Search: "
curl -sf http://localhost:8030/health && echo "✓ Healthy" || echo "✗ Unhealthy"

# Autodoc
echo -n "Autodoc: "
curl -sf http://localhost:8031/health && echo "✓ Healthy" || echo "✗ Unhealthy"

# File Search
echo -n "File Search: "
curl -sf http://localhost:8032/health && echo "✓ Healthy" || echo "✗ Unhealthy"

# Grafana
echo -n "Grafana: "
curl -sf http://localhost:3004/api/health && echo "✓ Healthy" || echo "✗ Unhealthy"

# Prometheus
echo -n "Prometheus: "
curl -sf http://localhost:9090/-/healthy && echo "✓ Healthy" || echo "✗ Unhealthy"

echo "=== Health Check Complete ==="
```

### Step 9.2: Test Application Endpoints

```bash
# Test main page
curl -I https://upscbyvarunsh.aimasteryedu.in

# Test API health
curl https://upscbyvarunsh.aimasteryedu.in/api/health

# Test authentication
curl https://upscbyvarunsh.aimasteryedu.in/api/auth/session
```

### Step 9.3: Check Container Logs for Errors

```bash
# Check main app logs
docker logs upsc-app --tail 50

# Check all service logs
docker-compose -f docker-compose.coolify.yml logs --tail 20
```

---

## 🔴 PHASE 10: Monitoring & Backup Setup

### Step 10.1: Access Monitoring Dashboards

- **Grafana:** http://89.117.60.144:3004
  - Username: `admin`
  - Password: `G8x5K2m0N7pQ4rT1vX9yZ3bC6dF0gH3jL6`

- **Prometheus:** http://89.117.60.144:9090

- **Uptime Kuma:** http://89.117.60.144:3003

### Step 10.2: Configure Uptime Kuma Monitors

1. Access Uptime Kuma: http://89.117.60.144:3003
2. Create monitors for:
   - Main App: `https://upscbyvarunsh.aimasteryedu.in`
   - API Health: `https://upscbyvarunsh.aimasteryedu.in/api/health`
   - Redis: `redis://89.117.60.144:6379`
   - MinIO: `http://89.117.60.144:9000/minio/health/live`

### Step 10.3: Setup Automated Backups

```bash
# Create backup script
cat > /root/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup Docker volumes
docker run --rm -v upsc-redis_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/redis-data.tar.gz -C /data .
docker run --rm -v upsc-minio_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/minio-data.tar.gz -C /data .

# Cleanup old backups (keep 7 days)
find /root/backups -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /root/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup.sh") | crontab -
```

---

## 🎯 Quick Reference - Service URLs

| Service | Internal URL | External URL |
|---------|-------------|--------------|
| Main App | http://localhost:3000 | https://upscbyvarunsh.aimasteryedu.in |
| Redis | redis://localhost:6379 | - |
| MinIO Console | http://localhost:9001 | http://89.117.60.144:9001 |
| MinIO API | http://localhost:9000 | http://89.117.60.144:9000 |
| Grafana | http://localhost:3004 | http://89.117.60.144:3004 |
| Prometheus | http://localhost:9090 | http://89.117.60.144:9090 |
| Uptime Kuma | http://localhost:3003 | http://89.117.60.144:3003 |
| Crawl4AI | http://localhost:11235 | - |
| Web Search | http://localhost:8030 | - |
| Autodoc | http://localhost:8031 | - |
| File Search | http://localhost:8032 | - |

---

## 🔧 Troubleshooting Guide

### Issue: Build fails in Coolify

```bash
# Check build logs in Coolify UI
# Common fixes:
1. Ensure Dockerfile exists
2. Verify next.config.js has output: 'standalone'
3. Check all dependencies in package.json
```

### Issue: Container won't start

```bash
# Check container logs
docker logs <container-name> --tail 100

# Check if port is already in use
netstat -tlnp | grep <port>

# Restart the container
docker restart <container-name>
```

### Issue: Cannot connect to Redis

```bash
# Test Redis connection
docker exec upsc-redis redis-cli -a <password> ping

# Check Redis logs
docker logs upsc-redis
```

### Issue: SSL certificate not working

```bash
# Regenerate certificate in Coolify
# Or manually with certbot:
certbot --nginx -d upscbyvarunsh.aimasteryedu.in
```

### Issue: Out of memory

```bash
# Check memory usage
docker stats

# Increase swap
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## ✅ Deployment Checklist

- [ ] Phase 1: Pre-deployment files verified
- [ ] Phase 2: SSH access and Coolify verified
- [ ] Phase 3: Code pushed to GitHub
- [ ] Phase 4: Project created in Coolify
- [ ] Phase 5: Environment variables configured
- [ ] Phase 6: Main application deployed
- [ ] Phase 7: Supporting services deployed
- [ ] Phase 8: DNS and SSL configured
- [ ] Phase 9: Health checks passing
- [ ] Phase 10: Monitoring and backups configured

---

**Deployment Guide Version:** 1.0  
**Last Updated:** January 16, 2026  
**Author:** Deployment Engineer Agent