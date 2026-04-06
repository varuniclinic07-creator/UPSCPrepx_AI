# ═══════════════════════════════════════════════════════════════════════════
# PRODUCTION DEPLOYMENT GUIDE - UPSC CSE MASTER
# Cloud Architecture Following Best Practices
# ═══════════════════════════════════════════════════════════════════════════

## Overview

This guide provides production-ready deployment instructions following cloud-architect best practices for scalability, security, cost optimization, and disaster recovery.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE CDN                               │
│                    (DDoS Protection + SSL)                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    NGINX PROXY MANAGER                               │
│              (Reverse Proxy + SSL Termination)                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   NEXT.JS   │    │   AGENTIC   │    │  MONITORING │
│     APP     │    │  SERVICES   │    │    STACK    │
│  (Port 3000)│    │ (8030-8032) │    │ (Prometheus)│
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SUPABASE   │  │    REDIS     │  │    MINIO     │
│  (Postgres)  │  │   (Cache)    │  │  (Storage)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Phase 1: Pre-Deployment Setup

### 1.1 VPS Initial Configuration

```bash
# SSH into VPS
ssh root@89.117.60.144

# Update system
apt update && apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Install security tools
apt install -y fail2ban ufw

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 6379/tcp  # Redis
ufw allow 9000/tcp  # MinIO
ufw enable

# Create application directory
mkdir -p /opt/upsc-master
cd /opt/upsc-master
```

### 1.2 Secrets Management

**Option A: HashiCorp Vault (Recommended)**
```bash
# Install Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
mv vault /usr/local/bin/

# Initialize Vault
vault server -dev  # For development
# Production: Use proper Vault cluster
```

**Option B: Docker Secrets (Simpler)**
```bash
# Create secrets directory
mkdir -p /opt/upsc-master/secrets

# Store secrets securely (chmod 600)
echo "your-secret-value" > /opt/upsc-master/secrets/db_password
chmod 600 /opt/upsc-master/secrets/*
```

### 1.3 SSL Certificates (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot

# Generate certificates
certbot certonly --standalone -d app.aimasteryedu.in
certbot certonly --standalone -d api.aimasteryedu.in
certbot certonly --standalone -d cdn.aimasteryedu.in
certbot certonly --standalone -d analytics.aimasteryedu.in
certbot certonly --standalone -d grafana.aimasteryedu.in

# Auto-renewal
echo "0 3 * * * certbot renew --quiet" | crontab -
```

## Phase 2: Database Setup (Supabase)

### 2.1 Supabase Configuration

**Option A: Supabase Cloud (Recommended for Production)**
1. Sign up at https://supabase.com
2. Create new project: "upsc-master-prod"
3. Note credentials:
   - Project URL
   - Anon key (public)
   - Service role key (private)
   - Database password

**Option B: Self-Hosted Supabase**
```bash
git clone https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env

# Edit .env with production credentials
nano .env

# Start Supabase
docker-compose up -d
```

### 2.2 Run Database Migrations

```bash
# Copy migration files to VPS
scp -r supabase/migrations root@89.117.60.144:/opt/upsc-master/

# Connect to database
psql "postgresql://postgres:PASSWORD@db.your-project.supabase.co:5432/postgres"

# Run migrations in order
\i /opt/upsc-master/migrations/001_initial_schema.sql
\i /opt/upsc-master/migrations/002_auth_setup.sql
# ... all migrations including 014_agentic_intelligence.sql
```

### 2.3 Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_notes_user_created ON notes(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Set up read replicas (Supabase Pro)
-- Enable Point-in-Time Recovery
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 10;

-- Vacuum and analyze
VACUUM ANALYZE;
```

## Phase 3: Redis Deployment

### 3.1 Redis Production Setup

```bash
# Create Redis config
cat > /opt/upsc-master/redis.conf <<EOF
bind 0.0.0.0
protected-mode yes
port 6379
requirepass $(openssl rand -base64 32)
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
EOF

# Deploy Redis with persistence
docker run -d \
  --name upsc-redis \
  --restart unless-stopped \
  -p 6379:6379 \
  -v /opt/upsc-master/redis-data:/data \
  -v /opt/upsc-master/redis.conf:/usr/local/etc/redis/redis.conf \
  redis:7-alpine \
  redis-server /usr/local/etc/redis/redis.conf
```

### 3.2 Redis Monitoring

```bash
# Install Redis Exporter for Prometheus
docker run -d \
  --name redis-exporter \
  -p 9121:9121 \
  oliver006/redis_exporter:latest \
  --redis.addr=redis://89.117.60.144:6379 \
  --redis.password=$(cat /opt/upsc-master/secrets/redis_password)
```

## Phase 4: MinIO Object Storage

### 4.1 MinIO Setup with High Availability

```bash
# Create MinIO data directories
mkdir -p /opt/upsc-master/minio/data{1,2,3,4}

# Deploy MinIO cluster (4 nodes for HA)
docker run -d \
  --name upsc-minio \
  --restart unless-stopped \
  -p 9000:9000 \
  -p 9001:9001 \
  -v /opt/upsc-master/minio/data1:/data1 \
  -v /opt/upsc-master/minio/data2:/data2 \
  -e "MINIO_ROOT_USER=$(openssl rand -base64 20)" \
  -e "MINIO_ROOT_PASSWORD=$(openssl rand -base64 40)" \
  minio/minio server /data{1...2} \
  --console-address ":9001"
```

### 4.2 Create Buckets & Policies

```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
mv mc /usr/local/bin/

# Configure alias
mc alias set myminio http://89.117.60.144:9000 ACCESS_KEY SECRET_KEY

# Create buckets
mc mb myminio/upsc-materials
mc mb myminio/upsc-videos
mc mb myminio/upsc-backups

# Set policies
mc anonymous set download myminio/upsc-materials  # Public read
mc anonymous set none myminio/upsc-backups         # Private
```

## Phase 5: Agentic Services Deployment

### 5.1 Deploy All Services

```bash
# Copy docker-compose to VPS
scp docker-compose.coolify.yml root@89.117.60.144:/opt/upsc-master/docker-compose.yml

# Copy environment file
scp .env.production root@89.117.60.144:/opt/upsc-master/.env

# Generate secure passwords for all services
cd /opt/upsc-master
bash generate-secrets.sh  # See script below

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
docker-compose logs -f
```

### 5.2 Service Health Checks

```bash
# Create health check script
cat > /opt/upsc-master/health-check.sh <<'EOF'
#!/bin/bash
echo "=== UPSC Master Health Check ==="

services=(
  "crawl4ai:11235"
  "web-search:8030"
  "autodoc:8031"
  "file-search:8032"
  "redis:6379"
  "minio:9000"
  "prometheus:9090"
  "grafana:3000"
)

for service in "${services[@]}"; do
  name="${service%:*}"
  port="${service#*:}"
  
  # Different health check per service
  case $name in
    "redis")
      redis-cli -h localhost -p $port -a $REDIS_PASSWORD ping && echo "✓ $name" || echo "✗ $name"
      ;;
    *)
      curl -sf http://localhost:$port/health > /dev/null && echo "✓ $name" || echo "✗ $name"
      ;;
  esac
done
EOF

chmod +x /opt/upsc-master/health-check.sh

# Run health check
./health-check.sh
```

## Phase 6: Monitoring Stack Setup

### 6.1 Prometheus Configuration

```yaml
# /opt/upsc-master/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'upsc-app'
    static_configs:
      - targets: ['upsc-app:3000']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
  
  - job_name: 'minio'
    static_configs:
      - targets: ['minio:9000']
  
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 6.2 Grafana Dashboards

```bash
# Import community dashboards
# - Redis: Dashboard ID 11835
# - MinIO: Dashboard ID 13502
# - Node Exporter: Dashboard ID 1860
# - Next.js: Custom dashboard

# Access Grafana
open http://89.117.60.144:3004
# Login: admin / [your-grafana-password]
```

## Phase 7: Application Deployment

### 7.1 Build & Deploy Next.js App

```bash
# On local machine: Build optimized production image
docker build -t upsc-app:latest .

# Push to registry
docker tag upsc-app:latest registry.example.com/upsc-app:latest
docker push registry.example.com/upsc-app:latest

# On VPS: Pull and run
docker pull registry.example.com/upsc-app:latest
docker run -d \
  --name upsc-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/upsc-master/.env \
  --network upsc-master-network \
  registry.example.com/upsc-app:latest
```

### 7.2 Configure Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/upsc-master
server {
    listen 443 ssl http2;
    server_name app.aimasteryedu.in;
    
    ssl_certificate /etc/letsencrypt/live/app.aimasteryedu.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.aimasteryedu.in/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name app.aimasteryedu.in;
    return 301 https://$server_name$request_uri;
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/upsc-master /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Phase 8: Backup & Disaster Recovery

### 8.1 Automated Backups

```bash
# Create backup script
cat > /opt/upsc-master/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/upsc-master/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database backup
docker exec upsc-postgres pg_dump -U postgres > $BACKUP_DIR/db_$TIMESTAMP.sql
gzip $BACKUP_DIR/db_$TIMESTAMP.sql

# MinIO data backup
mc mirror myminio/upsc-materials s3/backup-bucket/materials-$TIMESTAMP/
mc mirror myminio/upsc-videos s3/backup-bucket/videos-$TIMESTAMP/

# Redis backup
docker exec upsc-redis redis-cli -a $REDIS_PASSWORD BGSAVE

# Rotate old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
EOF

chmod +x /opt/upsc-master/backup.sh

# Schedule daily backups
echo "0 2 * * * /opt/upsc-master/backup.sh" | crontab -
```

### 8.2 Disaster Recovery Testing

```bash
# Test restore procedure monthly
# 1. Restore database
gunzip < backup.sql.gz | docker exec -i upsc-postgres psql -U postgres

# 2. Restore MinIO
mc mirror s3/backup-bucket/materials-latest/ myminio/upsc-materials/

# 3. Verify application
curl -f http://localhost:3000/api/health
```

## Phase 9: Security Hardening

### 9.1 Apply Security Best Practices

```bash
# Install Fail2Ban
apt install -y fail2ban
systemctl enable fail2ban

# Configure SSH hardening
cat >> /etc/ssh/sshd_config <<EOF
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
EOF
systemctl restart sshd

# Install and configure UFW
ufw enable
ufw logging on
```

### 9.2 Security Scanning

```bash
# Install Trivy for container scanning
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/trivy.list
apt update && apt install trivy

# Scan containers
trivy image upsc-app:latest
trivy image redis:7-alpine
```

## Phase 10: Performance Optimization

### 10.1 Enable Production Optimizations

```bash
# Enable Docker swarm mode for better resource management
docker swarm init

# Set resource limits
docker update --cpus="2" --memory="2g" upsc-app
docker update --cpus="1" --memory="1g" upsc-redis

# Enable connection pooling in application
# Configure in .env:
# DB_POOL_SIZE=20
# DB_POOL_TIMEOUT=30000
```

### 10.2 CDN Configuration (Cloudflare)

1. Add domain to Cloudflare
2. Enable:
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - HTTP/3
   - Caching for static assets
3. Set page rules:
   - Cache /static/* for 30 days
   - Cache /api/* for 5 minutes

## Production Checklist

- [ ] All environment variables set with production credentials
- [ ] SSL certificates installed and auto-renewal configured
- [ ] Database migrations completed
- [ ] All services healthy and running
- [ ] Monitoring dashboards configured
- [ ] Backup automation tested
- [ ] Security hardening applied
- [ ] Performance optimization enabled
- [ ] CDN configured
- [ ] Error tracking (Sentry) configured
- [ ] Log aggregation setup (optional: ELK stack)
- [ ] Uptime monitoring configured
- [ ] DNS records properly configured
- [ ] CORS origins verified
- [ ] Rate limiting tested
- [ ] Payment processing tested (Stripe/Razorpay)
- [ ] Email delivery tested
- [ ] SMS delivery tested (Twilio)
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] Incident response runbook created

## Estimated Monthly Costs

| Service                  | Cost (USD)          |
| ------------------------ | ------------------- |
| VPS (16GB RAM, 8 CPU)    | $50-80              |
| Supabase Pro             | $25                 |
| Cloudflare Pro           | $20                 |
| MinIO Cloud (if needed)  | $0-50               |
| Monitoring (Datadog alt) | $0 (self-hosted)    |
| Backups Storage          | $10                 |
| **Total**                | **~$105-185/month** |

## Support & Maintenance

- Monitor health dashboards daily
- Review logs weekly
- Update Docker images monthly
- Review and rotate secrets quarterly
- Test disaster recovery quarterly
- Review and optimize costs monthly
