# 🚀 UPSC CSE Master - VPS Deployment Guide

## Production Deployment Checklist

### Prerequisites
- ✅ Ubuntu 22.04 VPS (minimum 4GB RAM, 2 vCPU)
- ✅ Docker & Docker Compose installed
- ✅ Domain name pointing to VPS IP
- ✅ SSL certificate (Let's Encrypt)
- ✅ Supabase project with migrations applied
- ✅ All API keys configured

---

## Step 1: VPS Setup

### 1.1 Connect to VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 1.3 Install Docker Compose
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### 1.4 Create app directory
```bash
mkdir -p /opt/upsc-app
cd /opt/upsc-app
```

---

## Step 2: Upload Application Files

### 2.1 Using deployment script (recommended)
```bash
# On local machine
./scripts/deploy.sh your-vps-ip
```

### 2.2 Manual upload
```bash
rsync -avz --exclude node_modules --exclude .next \
  ./ root@your-vps-ip:/opt/upsc-app/
```

---

## Step 3: Environment Configuration

### 3.1 Copy and configure .env
```bash
cd /opt/upsc-app
cp .env.production.template .env.production
nano .env.production
```

### 3.2 Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `A4F_API_KEY`
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `REDIS_URL`
- `POSTGRES_PASSWORD`
- `MINIO_ROOT_USER` & `MINIO_ROOT_PASSWORD`

---

## Step 4: Database Setup

### 4.1 Run Supabase migrations
```bash
# Connect to your Supabase project
npx supabase db push

# Or manually apply migrations
for file in supabase/migrations/*.sql; do
  psql $DATABASE_URL < $file
done
```

### 4.2 Verify tables
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## Step 5: Docker Services

### 5.1 Start all services
```bash
docker-compose -f docker-compose.production.yml up -d
```

### 5.2 Verify services
```bash
docker ps

# Expected services (9):
# - nextjs-app
# - bullmq-worker
# - redis
# - minio
# - postgres
# - agentic-web-search
# - autodoc-thinker
# - agentic-file-search
# - crawl4ai
```

### 5.3 Check logs
```bash
docker-compose -f docker-compose.production.yml logs -f
```

---

## Step 6: Nginx Configuration

### 6.1 Install Nginx
```bash
sudo apt-get install nginx
```

### 6.2 Create Nginx config
```nginx
# /etc/nginx/sites-available/upsc-app
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/agentic/web-search {
        proxy_pass http://localhost:8030;
    }
    
    location /api/agentic/doc-chat {
        proxy_pass http://localhost:8031;
    }
    
    location /api/agentic/file-search {
        proxy_pass http://localhost:8032;
    }
}
```

### 6.3 Enable site
```bash
sudo ln -s /etc/nginx/sites-available/upsc-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.4 Setup SSL with Certbot
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Step 7: Cron Jobs

### 7.1 Create cron script
```bash
nano /opt/upsc-app/scripts/cron-tasks.sh
```

```bash
#!/bin/bash
cd /opt/upsc-app

# Daily: Cleanup old jobs and temp files
docker exec upsc-app-worker node -e "require('./src/lib/queues/cleanup-service.ts').runAllCleanupTasks()"

# Daily: Expire subscriptions and send reminders
docker exec upsc-app-worker node -e "require('./src/lib/payments/subscription-cron.ts').runSubscriptionMaintenance()"
```

### 7.2 Add to crontab
```bash
chmod +x /opt/upsc-app/scripts/cron-tasks.sh
crontab -e
```

Add:
```
0 2 * * * /opt/upsc-app/scripts/cron-tasks.sh >> /var/log/upsc-cron.log 2>&1
```

---

## Step 8: MinIO Setup

### 8.1 Access MinIO console
```
http://your-vps-ip:9001
```

### 8.2 Create buckets
- `lectures` (public)
- `invoices` (private)
- `materials` (public)
- `user-uploads` (private)

### 8.3 Set bucket policies
```bash
docker exec upsc-minio mc alias set myminio http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
docker exec upsc-minio mc anonymous set download myminio/lectures
docker exec upsc-minio mc anonymous set download myminio/materials
```

---

## Step 9: Monitoring

### 9.1 Setup health checks
```bash
# Create healthcheck script
nano /opt/upsc-app/scripts/healthcheck.sh
```

```bash
#!/bin/bash
curl -f http://localhost:3000/api/health || exit 1
```

### 9.2 Redis monitoring
```bash
docker exec upsc-redis redis-cli INFO
```

### 9.3 Queue monitoring
Access BullBoard at: `http://your-domain.com/api/queues` (if configured)

---

## Step 10: Backup Strategy

### 10.1 Database backups (daily)
```bash
# Supabase auto-backups enabled
# Or manual backup:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 10.2 MinIO backups (weekly)
```bash
docker exec upsc-minio mc mirror myminio/lectures /backups/lectures
```

---

## Troubleshooting

### Service won't start
```bash
docker-compose -f docker-compose.production.yml logs [service-name]
```

### Out of memory
```bash
# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Rate limit errors
Check `.env.production`:
- `A4F_RATE_LIMIT_RPM=10` (don't exceed!)

### Payment webhook not working
- Verify `RAZORPAY_WEBHOOK_SECRET`
- Check Razorpay dashboard webhook URL: `https://your-domain.com/api/webhooks/razorpay`

---

## Production Checklist

Before going live:

- [ ] All migrations applied
- [ ] Environment variables set
- [ ] Docker services running
- [ ] Nginx configured with SSL
- [ ] MinIO buckets created
- [ ] Cron jobs scheduled
- [ ] Backups configured
- [ ] Health checks passing
- [ ] Payment webhooks tested
- [ ] Trial system tested
- [ ] Lecture generation tested

---

## Support & Maintenance

### Daily tasks
- Check error logs
- Monitor disk space
- Review failed payments

### Weekly tasks
- Review queue stats
- Check subscription renewals
- Update dependencies if needed

### Monthly tasks
- Review analytics
- Optimize database
- Update content library

---

## Quick Commands

```bash
# Restart all services
docker-compose -f docker-compose.production.yml restart

# View logs
docker-compose -f docker-compose.production.yml logs -f [service]

# Execute commands in container
docker exec -it upsc-app sh

# Database console
docker exec -it upsc-postgres psql -U postgres

# Redis console
docker exec -it upsc-redis redis-cli

# Check disk usage
df -h
docker system df
```

---

**🎉 Deployment Complete! Access your app at https://your-domain.com**
