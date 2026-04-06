# Coolify Services Installation Guide

Complete guide for installing all services on your Coolify server at `89.117.60.144:8000`

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Manual Installation via Coolify UI](#manual-installation-via-coolify-ui)
5. [Automated Installation via Script](#automated-installation-via-script)
6. [Service Configuration](#service-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Service URLs & Access](#service-urls--access)

---

## 🎯 Overview

This guide will help you install and configure the following services:

### Core Services
- **Redis** (Port 6379) - Caching layer
- **BullMQ** (Port 3002) - Queue management with UI
- **MinIO** (Ports 9000/9001) - S3-compatible object storage
- **n8n** (Port 5678) - Workflow automation
- **Uptime Kuma** (Port 3001) - Service monitoring

### Supabase Stack
- **PostgreSQL** (Port 54322) - Database
- **Supabase API** (Port 54321) - REST API
- **Supabase Studio** (Port 54323) - Admin UI
- **Auth, Storage, Realtime** - Complete backend

### Video Processing Services
- **Manim Community** (Port 8010) - Math animations
- **ManimGL** (Port 8011) - OpenGL animations
- **Remotion** (Port 8012) - Video rendering
- **FFmpeg Service** (Port 8013) - Video processing

### Automation & Scraping
- **Crawl4AI** (Port 8014) - Web scraping service

---

## 📦 Prerequisites

1. **Server Access**
   - Server IP: `89.117.60.144`
   - Coolify running on port `8000`
   - SSH access with provided keys

2. **Local Tools** (for automated deployment)
   - Git
   - SSH client
   - Bash (Linux/Mac) or Git Bash (Windows)

3. **Server Requirements**
   - Docker & Docker Compose installed
   - Minimum 8GB RAM (16GB recommended)
   - 50GB+ free disk space
   - Ubuntu 20.04+ or similar

---

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Clone or navigate to the repository
cd bmad-method

# 2. Make the deployment script executable
chmod +x deploy-coolify-services.sh

# 3. Deploy all services
./deploy-coolify-services.sh deploy-all

# 4. Check service health
./deploy-coolify-services.sh check-health

# 5. View service URLs
./deploy-coolify-services.sh show-urls
```

### Option 2: Deploy Specific Service Groups

```bash
# Deploy only core services (Redis, MinIO, n8n, Uptime Kuma)
./deploy-coolify-services.sh deploy-core

# Deploy only Supabase
./deploy-coolify-services.sh deploy-supabase

# Deploy only video services
./deploy-coolify-services.sh deploy-video

# Deploy only automation services
./deploy-coolify-services.sh deploy-automation
```

---

## 🖥️ Manual Installation via Coolify UI

### Step 1: Login to Coolify

1. Open browser and navigate to: `http://89.117.60.144:8000`
2. Login with:
   - Username: `dranilkumarsharma4@gmail.com`
   - Password: `22547728.mIas`

### Step 2: Add Services via Docker Compose

#### Method A: Using Coolify's Docker Compose Feature

1. In Coolify, go to **"Resources"** → **"Add New Resource"**
2. Select **"Docker Compose"**
3. Copy content from one of these files:
   - `docker-compose.coolify-services.yml` (for core services)
   - `docker-compose.supabase.yml` (for Supabase)
   - `docker-compose.manimgl.yml` (for ManimGL)
4. Paste into Coolify's compose editor
5. Add environment variables from `.env.coolify`
6. Click **"Deploy"**

#### Method B: Using Individual Service Templates

For each service you want to add:

1. **Redis**
   - Go to **"Resources"** → **"Add New Resource"**
   - Select **"Service"** → **"Redis"**
   - Port: `6379`
   - Deploy

2. **MinIO**
   - Add new service → **"MinIO"**
   - API Port: `9000`
   - Console Port: `9001`
   - Set environment variables:
     - `MINIO_ROOT_USER=admin`
     - `MINIO_ROOT_PASSWORD=minioadmin123`
   - Deploy

3. **n8n**
   - Add new service → Search for **"n8n"**
   - Port: `5678`
   - Set environment variables:
     - `N8N_BASIC_AUTH_USER=admin`
     - `N8N_BASIC_AUTH_PASSWORD=changeme123`
   - Deploy

4. **Uptime Kuma**
   - Add new service → Search for **"Uptime Kuma"**
   - Port: `3001`
   - Deploy

5. **Supabase**
   - This requires the full docker-compose setup
   - Use Method A above with `docker-compose.supabase.yml`

### Step 3: Configure Network

Ensure all services are on the same Docker network for inter-service communication:
- Network name: `coolify-services`

---

## 🤖 Automated Installation via Script

### Windows Users (PowerShell/Git Bash)

```bash
# Using Git Bash
cd "c:/Users/DR-VARUNI/Desktop/AI APPS NEW/BMAD Latest/bmad-method"
bash deploy-coolify-services.sh deploy-all
```

### Linux/Mac Users

```bash
cd ~/path/to/bmad-method
./deploy-coolify-services.sh deploy-all
```

### Script Commands

```bash
# Show help
./deploy-coolify-services.sh help

# Deploy all services
./deploy-coolify-services.sh deploy-all

# Deploy specific groups
./deploy-coolify-services.sh deploy-core
./deploy-coolify-services.sh deploy-supabase
./deploy-coolify-services.sh deploy-video
./deploy-coolify-services.sh deploy-automation

# Health checks
./deploy-coolify-services.sh check-health

# Show service URLs
./deploy-coolify-services.sh show-urls

# Stop all services
./deploy-coolify-services.sh stop-all
```

---

## ⚙️ Service Configuration

### 1. Environment Variables

Before deployment, update `.env.coolify` with your custom values:

```bash
# Critical: Change these passwords!
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
MINIO_ROOT_PASSWORD=minioadmin123
N8N_PASSWORD=changeme123
```

**Generate secure secrets:**
```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate strong password
openssl rand -base64 24
```

### 2. Supabase Configuration

**Important:** Generate proper JWT tokens for Supabase:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Or use JWT.io to generate tokens with your JWT_SECRET
# Visit: https://jwt.io/
```

### 3. MinIO Initial Setup

After MinIO starts, access the console:

1. Go to: `http://89.117.60.144:9001`
2. Login: `admin` / `minioadmin123`
3. Create buckets:
   - `uploads` - for general file storage
   - `media` - for media files
   - `backups` - for backups

### 4. n8n Initial Setup

1. Access: `http://89.117.60.144:5678`
2. Login: `admin` / `changeme123`
3. Create your first workflow
4. Configure credentials for other services

### 5. Uptime Kuma Setup

1. Access: `http://89.117.60.144:3001`
2. Create admin account on first visit
3. Add monitors for all your services

---

## 🔧 Troubleshooting

### Services Won't Start

```bash
# SSH into server
ssh -i coolify_ssh_key root@89.117.60.144

# Check Docker status
docker ps -a

# Check specific service logs
docker logs <container-name>

# Example:
docker logs redis-cache
docker logs supabase-db
docker logs n8n-automation
```

### Port Conflicts

If ports are already in use, you can modify them in the docker-compose files:

```yaml
# Change port mapping (host:container)
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

### Memory Issues

If services crash due to memory:

```bash
# Check memory usage
docker stats

# Increase swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Database Connection Issues

For Supabase connection problems:

```bash
# Check PostgreSQL logs
docker logs supabase-db

# Test connection
docker exec supabase-db pg_isready -U postgres

# Restart database
docker restart supabase-db
```

### Network Issues

```bash
# Recreate Docker network
docker network rm coolify-services
docker network create coolify-services

# Restart all services
cd ~/coolify-services
docker-compose -f docker-compose.coolify-services.yml restart
```

---

## 🌐 Service URLs & Access

### After Installation

All services will be accessible at:

#### Core Services
- **Redis**: `89.117.60.144:6379`
- **MinIO Console**: http://89.117.60.144:9001
- **MinIO API**: http://89.117.60.144:9000
- **Bull Board**: http://89.117.60.144:3002

#### Supabase
- **API**: http://89.117.60.144:54321
- **Studio**: http://89.117.60.144:54323
- **Database**: `89.117.60.144:54322`

#### Video Services
- **Manim Community**: http://89.117.60.144:8010
- **ManimGL**: http://89.117.60.144:8011
- **Remotion**: http://89.117.60.144:8012
- **FFmpeg**: http://89.117.60.144:8013

#### Automation
- **n8n**: http://89.117.60.144:5678
- **Crawl4AI**: http://89.117.60.144:8014

#### Monitoring
- **Uptime Kuma**: http://89.117.60.144:3001

---

## 📝 Usage Examples

### Using Redis

```javascript
// Node.js example
const redis = require('redis');
const client = redis.createClient({
  host: '89.117.60.144',
  port: 6379
});
```

### Using MinIO (S3-Compatible)

```javascript
// Node.js with AWS SDK
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  endpoint: 'http://89.117.60.144:9000',
  accessKeyId: 'admin',
  secretAccessKey: 'minioadmin123',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});
```

### Using Supabase

```javascript
// JavaScript client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://89.117.60.144:54321',
  'YOUR_ANON_KEY'
)
```

### Using n8n Webhook

```bash
# POST to n8n webhook
curl -X POST http://89.117.60.144:5678/webhook/YOUR_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

## 🔒 Security Recommendations

1. **Change Default Passwords**
   - Update all passwords in `.env.coolify`
   - Use strong, unique passwords for each service

2. **Enable Firewall**
   ```bash
   # Allow only specific ports
   ufw allow 22/tcp
   ufw allow 8000/tcp
   ufw allow 54321/tcp
   ufw enable
   ```

3. **Use HTTPS**
   - Configure Coolify's built-in SSL/TLS
   - Or use Nginx reverse proxy with Let's Encrypt

4. **Regular Backups**
   - Set up automated backups for databases
   - Store backups in MinIO or external storage

5. **Monitor Services**
   - Use Uptime Kuma to monitor all services
   - Set up alerts for downtime

---

## 📚 Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [n8n Documentation](https://docs.n8n.io/)
- [MinIO Documentation](https://min.io/docs/)
- [Redis Documentation](https://redis.io/docs/)

---

## 🆘 Need Help?

If you encounter issues:

1. Check service logs: `docker logs <container-name>`
2. Review this troubleshooting guide
3. Check Coolify logs in the UI
4. Verify environment variables are set correctly
5. Ensure sufficient server resources (RAM, disk space)

---

## ✅ Post-Installation Checklist

- [ ] All services are running (`docker ps`)
- [ ] Health checks pass (`./deploy-coolify-services.sh check-health`)
- [ ] Can access all service UIs in browser
- [ ] Changed default passwords
- [ ] Configured MinIO buckets
- [ ] Set up Uptime Kuma monitors
- [ ] Tested basic operations (Redis, Supabase, n8n)
- [ ] Configured backups
- [ ] Documented custom configurations

---

**Installation Complete! 🎉**

Your Coolify server is now running all services. Access the Coolify dashboard at `http://89.117.60.144:8000` to manage them.
