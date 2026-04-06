# Crawl4AI Coolify Deployment Guide

## 🚀 Quick Deploy to Coolify

### Prerequisites
- Coolify instance running at `89.117.60.144:8000`
- Supabase project with `current_affairs` table
- Docker and Docker Compose installed

### Step 1: Prepare Environment Variables

Create `.env` file in Crawl4ai folder:

```env
# Supabase (REQUIRED)
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# API Security (REQUIRED)
CRAWL4AI_API_TOKEN=your_secure_random_token_here

# Next.js App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 2: Deploy via Coolify

#### Option A: Coolify UI (Recommended)

1. **Login to Coolify**
   ```
   http://89.117.60.144:8000
   ```

2. **Create New Application**
   - Click "New Resource" → "Application"
   - Name: `upsc-crawl4ai`
   - Type: Docker Compose

3. **Configure Source**
   - Repository: Upload `Crawl4ai` folder or connect Git repo
   - Branch: `main`
   - Docker Compose File: `docker-compose.production.yml`

4. **Set Environment Variables**
   - Add all variables from `.env` file
   - Mark `SUPABASE_SERVICE_ROLE_KEY` and `CRAWL4AI_API_TOKEN` as secrets

5. **Configure Network**
   - Port: `11235`
   - Domain: `crawl4ai.yourdomain.com` (optional)
   - Network: `coolify` (default)

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~3-5 minutes)

#### Option B: Manual Docker Compose

```bash
# SSH to VPS
ssh root@89.117.60.144

# Navigate to deployment directory
cd /opt/upsc-crawl4ai

# Copy files
# (Upload Crawl4ai folder contents here)

# Create .env file
nano .env
# (Paste environment variables)

# Deploy
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose logs -f crawl4ai
```

### Step 3: Verify Deployment

```bash
# Check health
curl http://89.117.60.144:11235/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-15T10:30:00",
#   "crawler_ready": true
# }
```

### Step 4: Update Next.js App Environment

Add to your Next.js `.env.local`:

```env
CRAWL4AI_URL=http://89.117.60.144:11235
CRAWL4AI_API_TOKEN=your_secure_random_token_here
```

### Step 5: Test Integration

```bash
# From Next.js app, test API call
curl -X POST http://89.117.60.144:11235/crawl \
  -H "Authorization: Bearer your_secure_random_token_here" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://pib.gov.in/allRel.aspx"}'
```

## 📊 Monitoring

### View Logs
```bash
# Via Docker
docker logs upsc-crawl4ai -f

# Via Coolify UI
Navigate to Application → Logs tab
```

### Check Stats
```bash
curl -H "Authorization: Bearer your_token" \
  http://89.117.60.144:11235/stats
```

### Health Monitoring
- Coolify automatically monitors health endpoint
- Alerts configured in Coolify settings
- Uptime Kuma integration available at `http://89.117.60.144:3003`

## 🔧 Maintenance

### Update Deployment
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

### Scale Resources
Edit `docker-compose.production.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'      # Increase CPU
      memory: 4G       # Increase RAM
```

### Backup Logs
```bash
# Backup logs volume
docker run --rm -v crawl4ai-logs:/data -v $(pwd):/backup \
  alpine tar czf /backup/logs-backup.tar.gz /data
```

## 🐛 Troubleshooting

### Issue: Container won't start
```bash
# Check logs
docker logs upsc-crawl4ai

# Common causes:
# - Missing environment variables
# - Invalid Supabase credentials
# - Port 11235 already in use
```

### Issue: Health check failing
```bash
# Test health endpoint manually
curl http://localhost:11235/health

# Check if API server is running
docker exec upsc-crawl4ai ps aux | grep python
```

### Issue: Scraping fails
```bash
# Check crawler logs
docker exec upsc-crawl4ai tail -f /app/logs/crawler.log

# Test single URL
curl -X POST http://localhost:11235/crawl \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://pib.gov.in/allRel.aspx"}'
```

### Issue: Out of memory
```bash
# Check memory usage
docker stats upsc-crawl4ai

# Increase memory limit in docker-compose.production.yml
# Restart container
docker-compose restart crawl4ai
```

## 🔒 Security Checklist

- [ ] Changed default `API_TOKEN` to secure random value
- [ ] Using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- [ ] Firewall configured to allow only necessary ports
- [ ] CORS configured with actual app URL (not wildcard)
- [ ] Logs don't contain sensitive data
- [ ] Container running as non-root user
- [ ] Regular security updates applied

## 📈 Performance Tuning

### High Traffic
```yaml
environment:
  MAX_CONCURRENT_REQUESTS: 5
  WORKERS: 4

deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G
```

### Low Resources
```yaml
environment:
  MAX_CONCURRENT_REQUESTS: 2
  WORKERS: 1

deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
```

## 🔗 Integration with Next.js

Your Next.js app is already configured! The following files handle integration:

- `src/lib/scraping/crawl4ai-client.ts` - API client
- `src/app/api/scraping/current-affairs/route.ts` - Admin scraping
- `src/app/api/cron/scrape-current-affairs/route.ts` - Daily cron job

## 📞 Support

- Check logs first: `docker logs upsc-crawl4ai`
- Review Coolify dashboard for resource usage
- Test health endpoint: `curl http://89.117.60.144:11235/health`
- Verify environment variables are set correctly

---

**Deployment Complete! 🎉**

Your Crawl4AI service is now running and integrated with your UPSC CSE Master app.
