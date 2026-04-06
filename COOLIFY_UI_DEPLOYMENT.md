# 🚀 UPSC CSE Master - Coolify UI Deployment Guide

## Deploy via Self-Hosted Coolify Dashboard

**Coolify Dashboard:** `http://89.117.60.144:8000`  
**Login Email:** `dranilkumarsharma4@gmail.com`  
**Login Password:** `22547728.mIas`

---

## 📋 Overview

This guide walks you through deploying the UPSC CSE Master application using the **Coolify web interface**. Coolify will handle:
- ✅ Building Docker images from your Dockerfile
- ✅ Managing environment variables
- ✅ SSL certificate generation
- ✅ Automatic deployments on git push
- ✅ Health monitoring

---

## 🔴 PHASE 1: Login to Coolify

### Step 1.1: Access Coolify Dashboard

1. Open your browser
2. Navigate to: **http://89.117.60.144:8000**
3. Login with:
   - **Email:** `dranilkumarsharma4@gmail.com`
   - **Password:** `22547728.mIas`

---

## 🔴 PHASE 2: Create a New Project

### Step 2.1: Create Project

1. Click **"Projects"** in the left sidebar
2. Click **"+ Add"** or **"+ New Project"** button
3. Fill in the details:
   - **Name:** `UPSC-PrepX-AI`
   - **Description:** `UPSC CSE Master - AI-Powered Exam Preparation Platform`
4. Click **"Continue"** or **"Create"**

---

## 🔴 PHASE 3: Add Main Application Resource

### Step 3.1: Add New Resource

1. Inside your project, click **"+ New"** or **"+ Add Resource"**
2. Select **"Public Repository"** (since GitHub repo is public)

### Step 3.2: Configure Repository

1. **Repository URL:** 
   ```
   https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git
   ```
2. **Branch:** `main`
3. Click **"Continue"**

### Step 3.3: Configure Build Settings

1. **Build Pack:** Select **"Dockerfile"**
2. **Dockerfile Location:** Leave as `Dockerfile` (root directory)
3. **Docker Build Context:** Leave as `.` (root)
4. Click **"Continue"**

### Step 3.4: Configure General Settings

1. **Name:** `upsc-app`
2. **Description:** `Main Next.js Application`

---

## 🔴 PHASE 4: Configure Environment Variables

### Step 4.1: Navigate to Environment Variables

1. In your resource settings, click **"Environment Variables"** tab
2. Click **"Add"** or use **"Bulk Add"** option

### Step 4.2: Add All Environment Variables

Copy and paste ALL these variables (use Bulk Add if available):

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://upscbyvarunsh.aimasteryedu.in
NEXT_PUBLIC_APP_NAME=UPSCPrepX-AI
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtb3Rxa3VrdmZ3anljdndmdnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTk1NTgsImV4cCI6MjA3ODE3NTU1OH0.REzTJWw4xOnrNx7myp-u8frItlUs4YknpS8uOm6yyz0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtb3Rxa3VrdmZ3anljdndmdnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU5OTU1OCwiZXhwIjoyMDc4MTc1NTU4fQ.vPq_A32l4jcQUwSJ2D6lNZSNJKGlX4W8wHZZ1FstY7Y
SUPABASE_JWT_SECRET=qDYyoXcdCGtwvBLUbiq36Pm4DF6xAD2ZodL8i9ceOk5uxaNWIf390BOwTpEJrcu+J/arHLZkCjhRRJ2RoUHksA==
DATABASE_URL=postgresql://postgres:22547728.mIas@db.emotqkukvfwjycvwfvyj.supabase.co:5432/postgres
NEXTAUTH_SECRET=H7jK3mN9pQ2rT5vX8yZ1bC4dF6gJ0kL3mN6pQ9rT2vX5
NEXTAUTH_URL=https://upscbyvarunsh.aimasteryedu.in
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
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
CIRCUIT_BREAKER_TIMEOUT=60000
ENABLE_REQUEST_CACHING=true
CACHE_TTL_SECONDS=300
SERVER_IP=89.117.60.144
REDIS_URL=redis://:R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8@89.117.60.144:6379
REDIS_PASSWORD=R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8
REDIS_TLS_ENABLED=false
MINIO_ENDPOINT=89.117.60.144
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=M7xQK3mN9pR2tV5wY8zB
MINIO_SECRET_KEY=S4x1K8m6N3pQ0rT7vX2yZ9bC5dF1gH4jL7mN0pQ3rT6vX9wY2z
MINIO_BUCKET_NAME=upsc-production
MATERIALS_BUCKET=upsc-materials
CRAWL4AI_URL=http://89.117.60.144:11235
CRAWL4AI_TOKEN=Q8x4K2m9N7pR1tV5wY3zB6cD0eF8gH2jL4mN7pQ0rT3v
AGENTIC_AUTODOC_URL=http://89.117.60.144:8031
AGENTIC_FILE_SEARCH_URL=http://89.117.60.144:8032
PROMETHEUS_URL=http://89.117.60.144:9090
GRAFANA_URL=http://89.117.60.144:3004
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=G8x5K2m0N7pQ4rT1vX9yZ3bC6dF0gH3jL6
RAZORPAY_KEY_ID=rzp_test_S2jukyfBQSJoab
RAZORPAY_KEY_SECRET=jdBHxxZmnLg8N6H6OHgAk75o
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=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
SMTP_FROM=noreply@upsc.aimasteryedu.in
TWILIO_ACCOUNT_SID=AC92ac91aef71637a6c9d6b011007cc784
TWILIO_AUTH_TOKEN=6c755f04b5a3d7c68a63983344b2c783
TWILIO_PHONE_NUMBER=+12196003657
NEXT_PUBLIC_SENTRY_DSN=https://1190845463e6572f6982c93b43ae95e3@o4510713202933760.ingest.us.sentry.io/4510713204047872
SENTRY_AUTH_TOKEN=c7f11c22f1e211f096b19efe9d4933c3
LOG_LEVEL=info
ENABLE_AGENTIC_SEARCH=true
ENABLE_PDF_EXPORT=true
ENABLE_LIVE_PREVIEWS=true
ENABLE_VIDEO_GENERATION=true
ENABLE_MAINTENANCE_MODE=false
ENABLE_NEW_STUDENT_REGISTRATION=true
```

### Step 4.3: Save Environment Variables

Click **"Save"** to store all variables.

---

## 🔴 PHASE 5: Configure Network & Ports

### Step 5.1: Configure Ports

1. Go to **"Network"** or **"General"** settings tab
2. Set **Exposed Port:** `3000`
3. **Port Mapping:** `3000:3000`

### Step 5.2: Configure Health Check (Optional but Recommended)

1. **Health Check Path:** `/api/health`
2. **Health Check Interval:** `30` seconds
3. **Health Check Timeout:** `10` seconds

---

## 🔴 PHASE 6: Configure Domain & SSL

### Step 6.1: Add Custom Domain

1. Go to **"Domains"** or **"URLs"** tab
2. Click **"+ Add Domain"**
3. Enter: `upscbyvarunsh.aimasteryedu.in`
4. Click **"Add"**

### Step 6.2: Enable SSL/HTTPS

1. Toggle **"HTTPS"** to enabled
2. Toggle **"Force HTTPS"** to enabled (redirects HTTP to HTTPS)
3. Coolify will automatically generate Let's Encrypt certificate

### Step 6.3: DNS Configuration Required

**Before SSL works, configure DNS at your domain registrar:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | upscbyvarunsh | 89.117.60.144 | 3600 |

---

## 🔴 PHASE 7: Deploy the Application

### Step 7.1: Initial Deployment

1. Click **"Deploy"** button (usually top-right)
2. Coolify will:
   - Clone your repository
   - Build the Docker image using your Dockerfile
   - Start the container
   - Configure networking

### Step 7.2: Monitor Build Progress

1. Click on **"Deployments"** tab to see build logs
2. Watch for any errors during:
   - `npm ci` (installing dependencies)
   - `npm run build` (building Next.js)
   - Container startup

### Step 7.3: Expected Build Time

- **First build:** 5-10 minutes (downloading dependencies)
- **Subsequent builds:** 2-5 minutes (cached layers)

---

## 🔴 PHASE 8: Deploy Supporting Services (Docker Compose)

### Step 8.1: Add Docker Compose Resource

1. Go back to your Project
2. Click **"+ New"** or **"+ Add Resource"**
3. Select **"Docker Compose"**

### Step 8.2: Configure Docker Compose

1. **Name:** `upsc-services`
2. **Repository URL:** `https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git`
3. **Branch:** `main`
4. **Docker Compose File:** `docker-compose.coolify.yml`

### Step 8.3: Add Environment Variables for Services

Add these variables for the supporting services:

```env
REDIS_PASSWORD=R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8
MINIO_ACCESS_KEY=M7xQK3mN9pR2tV5wY8zB
MINIO_SECRET_KEY=S4x1K8m6N3pQ0rT7vX2yZ9bC5dF1gH4jL7mN0pQ3rT6vX9wY2z
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1
CRAWL4AI_TOKEN=Q8x4K2m9N7pR1tV5wY3zB6cD0eF8gH2jL4mN7pQ0rT3v
GRAFANA_ADMIN_USER=admin
GRAFANA_PASSWORD=G8x5K2m0N7pQ4rT1vX9yZ3bC6dF0gH3jL6
PLAUSIBLE_SECRET=P2x7K4m1N9pQ6rT3vX0wY8zB5cD2eF9gH6jL3mN0pQ7rT4vX1wY8zB5cD2eF9gH6jL3mN0pQ7
PLAUSIBLE_DB_PASSWORD=P9x4K7m2N0pQ5rT8vX3wY6zB1cD4eF7gH0
MAUTIC_DB_PASSWORD=M6x3K0m8N5pQ2rT9vX6wY3zB0cD7eF4gH1
MAUTIC_DB_ROOT_PASSWORD=M1x8K5m2N9pQ6rT3vX0wY7zB4cD1eF8gH5jL2
```

### Step 8.4: Deploy Services

Click **"Deploy"** to start all supporting services.

---

## 🔴 PHASE 9: Verify Deployment

### Step 9.1: Check Application Status

1. In Coolify, go to your `upsc-app` resource
2. Check the **"Status"** indicator (should be green/running)
3. Click **"Logs"** to view container logs

### Step 9.2: Test Application URLs

After deployment, test these URLs:

| Test | URL | Expected |
|------|-----|----------|
| Main App | https://upscbyvarunsh.aimasteryedu.in | Landing page loads |
| Health Check | https://upscbyvarunsh.aimasteryedu.in/api/health | `{"status":"ok"}` |
| Login Page | https://upscbyvarunsh.aimasteryedu.in/login | Login form |

### Step 9.3: Check Supporting Services

| Service | URL | Expected |
|---------|-----|----------|
| MinIO Console | http://89.117.60.144:9001 | MinIO login page |
| Grafana | http://89.117.60.144:3004 | Grafana dashboard |
| Prometheus | http://89.117.60.144:9090 | Prometheus UI |
| Uptime Kuma | http://89.117.60.144:3003 | Monitoring dashboard |

---

## 🔴 PHASE 10: Configure Auto-Deploy (Optional)

### Step 10.1: Enable Webhook Deployment

1. In your resource settings, go to **"Webhooks"** tab
2. Copy the **Webhook URL**
3. In GitHub:
   - Go to your repository Settings → Webhooks
   - Add new webhook with the Coolify URL
   - Select "Push" events
4. Now every `git push` will trigger automatic deployment

---

## 🔧 Troubleshooting Common Issues

### Issue: Build Fails

**Check build logs in Coolify:**
1. Go to Deployments tab
2. Click on failed deployment
3. Look for error messages

**Common fixes:**
- Missing environment variables → Add them in Environment Variables tab
- Dockerfile not found → Verify path is `Dockerfile` (case-sensitive)
- Out of memory → Increase container memory limit in settings

### Issue: Container Keeps Restarting

**Check container logs:**
1. Go to Logs tab
2. Look for startup errors

**Common causes:**
- Missing required environment variables
- Database connection issues
- Port already in use

### Issue: SSL Certificate Not Working

**Requirements:**
1. DNS A record must point to `89.117.60.144`
2. Wait 5-10 minutes for DNS propagation
3. Port 80 and 443 must be open on VPS

**Fix:**
1. In Coolify, go to Domains tab
2. Click "Regenerate Certificate"
3. Wait for Let's Encrypt validation

### Issue: Cannot Connect to Redis/MinIO

**Check if services are running:**
1. Go to Docker Compose resource
2. Check container status
3. Verify network connectivity

**Fix:**
- Use external IP (`89.117.60.144`) instead of `localhost` in env vars
- Ensure firewall allows internal Docker network traffic

---

## 📊 Service Architecture in Coolify

```
┌─────────────────────────────────────────────────────────────┐
│                    COOLIFY DASHBOARD                         │
│                  http://89.117.60.144:8000                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PROJECT: UPSC-PrepX-AI                                     │
│  ├── Resource: upsc-app (Dockerfile)                        │
│  │   └── Port: 3000 → https://upscbyvarunsh.aimasteryedu.in │
│  │                                                          │
│  └── Resource: upsc-services (Docker Compose)               │
│      ├── redis (6379)                                       │
│      ├── minio (9000, 9001)                                 │
│      ├── crawl4ai (11235)                                   │
│      ├── web-search (8030)                                  │
│      ├── autodoc (8031)                                     │
│      ├── file-search (8032)                                 │
│      ├── grafana (3004)                                     │
│      ├── prometheus (9090)                                  │
│      ├── uptime-kuma (3003)                                 │
│      └── jaeger (16686)                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Deployment Checklist

### Phase 1-2: Setup
- [ ] Logged into Coolify dashboard
- [ ] Created UPSC-PrepX-AI project

### Phase 3-4: Main App
- [ ] Added public repository resource
- [ ] Configured Dockerfile build
- [ ] Added all environment variables

### Phase 5-6: Network & Domain
- [ ] Configured port 3000
- [ ] Added custom domain
- [ ] Enabled HTTPS
- [ ] DNS A record configured

### Phase 7: Deployment
- [ ] Initial deployment successful
- [ ] Build completed without errors
- [ ] Container running (green status)

### Phase 8: Services
- [ ] Docker Compose resource added
- [ ] Supporting services deployed
- [ ] All containers running

### Phase 9: Verification
- [ ] Main app accessible via HTTPS
- [ ] Health check endpoint working
- [ ] Supporting services accessible

### Phase 10: Auto-Deploy
- [ ] Webhook configured (optional)
- [ ] Test push triggers deployment

---

## 🎉 Deployment Complete!

Your UPSC CSE Master application is now deployed on Coolify!

**Main Application:** https://upscbyvarunsh.aimasteryedu.in

**Coolify Dashboard:** http://89.117.60.144:8000

---

*Guide Version: 1.0 | Last Updated: January 16, 2026*