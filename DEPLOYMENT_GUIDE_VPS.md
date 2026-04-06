# 🚀 UPSC AI - Complete VPS Deployment Guide with Coolify

## 📋 Prerequisites

- VPS with Ubuntu 22.04+ (Your VPS: `89.117.60.144`)
- Domain name configured (Optional)
- SSH access to VPS
- Supabase project already set up
- Minimum 4GB RAM, 2 CPU cores recommended

---

## 🎯 PART 1: COOLIFY INSTALLATION ON VPS

### Step 1: SSH into Your VPS

```bash
ssh root@89.117.60.144
```

### Step 2: Install Coolify

```bash
# Download and run Coolify installer
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### Step 3: Access Coolify Dashboard

After installation (takes 2-3 minutes):

```
Coolify URL: http://89.117.60.144:8000
Default Email: admin@admin.com
Default Password: Change on first login!
```

### Step 4: Configure Coolify

1. **Login to Coolify** at `http://89.117.60.144:8000`
2. **Change default password** immediately
3. **Add your server** (should be auto-detected)
4. **Configure domains** (optional, for production URLs)

---

## 🎯 PART 2: DEPLOY BACKEND SERVICES

### Step 1: Upload Project Files to VPS

```bash
# On your local machine, upload files to VPS
scp -r /a0/usr/projects/upsc_ai/* root@89.117.60.144:/opt/upsc-ai/

# Or use Git
cd /a0/usr/projects/upsc_ai
git add .
git commit -m "Production deployment"
git push origin main

# On VPS
git clone https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git /opt/upsc-ai
```

### Step 2: Create Production Environment File

On VPS, create `/opt/upsc-ai/.env.production`:

```bash
# SSH to VPS
ssh root@89.117.60.144
cd /opt/upsc-ai
nano .env.production
```

Copy contents from your local `.env.production` file.

### Step 3: Deploy Services via Coolify

#### Option A: Deploy via Coolify UI (Recommended)

1. **Create New Application**
   - Click "New Resource" → "Application"
   - Name: `upsc-ai-backend`
   - Type: Docker Compose

2. **Configure Source**
   - Repository: `/opt/upsc-ai`
   - Docker Compose File: `docker-compose.vps-complete.yml`

3. **Set Environment Variables**
   - Load from `.env.production` file
   - Mark secrets: `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `A4F_API_KEY`, etc.

4. **Configure Network**
   - Network: `coolify`
   - Expose required ports (see below)

5. **Deploy**
   - Click "Deploy"
   - Wait for build (~5-10 minutes)

#### Option B: Deploy via Docker Compose (Manual)

```bash
cd /opt/upsc-ai

# Copy production env
cp .env.production .env

# Start all services
docker-compose -f docker-compose.vps-complete.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🎯 PART 3: SERVICE PORTS & URLS

After deployment, your services will be available at:

| Service | Port | URL |
|---------|------|-----|
| **Main App** | 3000 | `http://89.117.60.144:3000` |
| **Crawl4AI** | 11235 | `http://89.117.60.144:11235` |
| **Remotion** | 3002 | `http://89.117.60.144:3002` |
| **Manim** | 8085 | `http://89.117.60.144:8085` |
| **Redis** | 6379 | `http://89.117.60.144:6379` |
| **MinIO** | 9000 | `http://89.117.60.144:9000` |
| **MinIO Console** | 9001 | `http://89.117.60.144:9001` |
| **Prometheus** | 9090 | `http://89.117.60.144:9090` |
| **Grafana** | 3004 | `http://89.117.60.144:3004` |
| **Uptime Kuma** | 3003 | `http://89.117.60.144:3003` |
| **Plausible** | 8088 | `http://89.117.60.144:8088` |
| **Mautic** | 8083 | `http://89.117.60.144:8083` |

---

## 🎯 PART 4: VERIFY DEPLOYMENT

### Check Health Endpoints

```bash
# Main app health
curl http://89.117.60.144:3000/api/health

# Crawl4AI health
curl http://89.117.60.144:11235/health

# Redis health
docker exec upsc-redis redis-cli ping
# Expected: PONG

# MinIO health
curl http://89.117.60.144:9000/minio/health/live
```

### Check All Containers

```bash
docker-compose -f docker-compose.vps-complete.yml ps
```

Expected: All services should show `Up` status

---

## 🎯 PART 5: CONFIGURE DOMAIN (Optional)

### Step 1: Configure DNS

Point your domain to VPS IP:

```
Type: A
Name: @
Value: 89.117.60.144
TTL: Auto

Type: A
Name: www
Value: 89.117.60.144
TTL: Auto
```

### Step 2: Configure in Coolify

1. Go to Application Settings
2. Add custom domain: `upscbyvarunsh.aimasteryedu.in`
3. Enable SSL/TLS (Coolify auto-provisions via Let's Encrypt)

### Step 3: Update Environment Variables

Update `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` in `.env.production`:

```env
NEXT_PUBLIC_APP_URL=https://upscbyvarunsh.aimasteryedu.in
NEXTAUTH_URL=https://upscbyvarunsh.aimasteryedu.in
```

Restart services:

```bash
docker-compose -f docker-compose.vps-complete.yml restart
```

---

## 🎯 PART 6: MOBILE APP DEPLOYMENT

See `MOBILE_APP_GUIDE.md` for Android app creation and deployment.

### Quick Summary:

1. **Android app created** in `/mobile-app/` directory
2. **Production .env** configured with your VPS IP
3. **Build APK** for production
4. **Distribute** via Google Play or direct download

---

## 🎯 PART 7: MONITORING & MAINTENANCE

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f upsc-crawl4ai

# Last 100 lines
docker-compose logs --tail=100 upsc-redis
```

### Check Resource Usage

```bash
# CPU and Memory
docker stats

# Disk usage
df -h
du -sh /opt/upsc-ai/*
```

### Backup Database

```bash
# Supabase backup (via their dashboard)
# Or use pg_dump:
pg_dump -h db.emotqkukvfwjycvwfvyj.supabase.co \
  -U postgres \
  -d postgres > backup_$(date +%Y%m%d).sql
```

### Update Deployment

```bash
cd /opt/upsc-ai
git pull origin main
docker-compose -f docker-compose.vps-complete.yml up -d --build
```

---

## 🎯 PART 8: SECURITY CHECKLIST

- [ ] Change Coolify default password
- [ ] Enable firewall (UFW)
- [ ] Configure fail2ban
- [ ] Use strong passwords in .env
- [ ] Enable SSL/TLS for domains
- [ ] Restrict database access
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

### Enable Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow Coolify
ufw allow 8000/tcp

# Allow App
ufw allow 3000/tcp

# Enable firewall
ufw enable
```

---

## 🎯 PART 9: TROUBLESHOOTING

### Service Won't Start

```bash
# Check logs
docker-compose logs [service-name]

# Check resources
docker stats
free -h
df -h

# Restart service
docker-compose restart [service-name]
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Stop non-essential services
docker-compose stop plausible mautic

# Or increase VPS RAM
```

### Port Already in Use

```bash
# Find process using port
netstat -tulpn | grep :3000

# Kill process
kill -9 [PID]

# Or change port in docker-compose.yml
```

---

## 🎯 PART 10: NEXT STEPS

1. ✅ **Test all endpoints** - Verify APIs are working
2. ✅ **Create admin user** - Login and create first admin
3. ✅ **Configure subscription** - Set up payment gateway
4. ✅ **Test video generation** - Generate sample lecture
5. ✅ **Deploy mobile app** - Build and distribute APK
6. ✅ **Setup monitoring** - Configure alerts in Grafana
7. ✅ **Backup strategy** - Schedule regular backups

---

## 📞 Support

For issues:
- Check logs: `docker-compose logs -f`
- Coolify docs: https://coolify.io/docs
- Supabase docs: https://supabase.com/docs

---

**🎉 Deployment Complete!**

Your UPSC AI platform is now running on your VPS with Coolify!

**Access URLs:**
- Main App: `http://89.117.60.144:3000`
- Coolify: `http://89.117.60.144:8000`
- Grafana: `http://89.117.60.144:3004`
- MinIO: `http://89.117.60.144:9000`
