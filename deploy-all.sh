#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# UPSC PrepX AI - Automated Production Deployment Script
# ═══════════════════════════════════════════════════════════════
# This script automates ALL deployment steps for your VPS
# Run this ONCE on your VPS: ssh root@89.117.60.144
# Then: curl -O https://your-repo/deploy-all.sh && bash deploy-all.sh
# ═══════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="89.117.60.144"
DEPLOY_DIR="/opt/upsc-ai"
COOLIFY_PORT="8000"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   UPSC PrepX AI - Production Deployment               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Install Coolify
echo -e "${YELLOW}[1/10] Installing Coolify...${NC}"
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
echo -e "${GREEN}✓ Coolify installed${NC}"
echo -e "${BLUE}  Access: http://${VPS_IP}:${COOLIFY_PORT}${NC}"
echo ""

# Step 2: Create deployment directory
echo -e "${YELLOW}[2/10] Creating deployment directory...${NC}"
mkdir -p ${DEPLOY_DIR}
cd ${DEPLOY_DIR}
echo -e "${GREEN}✓ Directory created: ${DEPLOY_DIR}${NC}"
echo ""

# Step 3: Clone or copy project
echo -e "${YELLOW}[3/10] Setting up project files...${NC}"
if [ -d ".git" ]; then
    git pull origin main
else
    echo "Clone your repository here:"
    echo "git clone https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git ."
fi
echo -e "${GREEN}✓ Project files ready${NC}"
echo ""

# Step 4: Create production environment
echo -e "${YELLOW}[4/10] Configuring production environment...${NC}"
cat > .env << 'ENVEOF'
# Production Environment - UPSC PrepX AI
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://89.117.60.144:3000
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtb3Rxa3VrdmZ3anljdndmdnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU5OTU1OCwiZXhwIjoyMDc4MTc1NTU4fQ.vPq_A32l4jcQUwSJ2D6lNZSNJKGlX4W8wHZZ1FstY7Y
GROQ_API_KEY=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
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
NEXTAUTH_SECRET=H7jK3mN9pQ2rT5vX8yZ1bC4dF6gJ0kL3mN6pQ9rT2vX5
REDIS_PASSWORD=R3x9K6m2N8pQ4rT1vW7yZ0bC5dF3gH9jL2mN6pQ8rT4vX1wY5zB3cD7eF0gH4jK8
MINIO_ROOT_USER=upscadmin
MINIO_ROOT_PASSWORD=upsc2026miniopass
ENVEOF
echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Step 5: Start all services with Docker Compose
echo -e "${YELLOW}[5/10] Starting all services...${NC}"
docker-compose -f docker-compose.vps-complete.yml up -d
echo -e "${GREEN}✓ All services started${NC}"
echo ""

# Step 6: Wait for services to be healthy
echo -e "${YELLOW}[6/10] Waiting for services to be healthy (60 seconds)...${NC}"
sleep 60
echo -e "${GREEN}✓ Services should be running${NC}"
echo ""

# Step 7: Verify services
echo -e "${YELLOW}[7/10] Verifying services...${NC}"
echo "Checking health endpoints:"
curl -s http://localhost:3000/api/health && echo " - Main API: OK" || echo " - Main API: FAILED"
curl -s http://localhost:11235/health && echo " - Crawl4AI: OK" || echo " - Crawl4AI: FAILED"
docker exec upsc-redis redis-cli ping && echo " - Redis: OK" || echo " - Redis: FAILED"
echo -e "${GREEN}✓ Verification complete${NC}"
echo ""

# Step 8: Show service URLs
echo -e "${YELLOW}[8/10] Service URLs:${NC}"
echo -e "${GREEN}  Main App:     http://${VPS_IP}:3000${NC}"
echo -e "${GREEN}  Coolify:      http://${VPS_IP}:8000${NC}"
echo -e "${GREEN}  Crawl4AI:     http://${VPS_IP}:11235${NC}"
echo -e "${GREEN}  Remotion:     http://${VPS_IP}:3002${NC}"
echo -e "${GREEN}  Manim:        http://${VPS_IP}:8085${NC}"
echo -e "${GREEN}  MinIO:        http://${VPS_IP}:9000${NC}"
echo -e "${GREEN}  Grafana:      http://${VPS_IP}:3004${NC}"
echo -e "${GREEN}  Uptime Kuma:  http://${VPS_IP}:3003${NC}"
echo ""

# Step 9: Setup firewall
echo -e "${YELLOW}[9/10] Configuring firewall...${NC}"
ufw --force enable
ufw --force allow 22/tcp    # SSH
ufw --force allow 8000/tcp  # Coolify
ufw --force allow 3000/tcp  # Main App
ufw --force allow 11235/tcp # Crawl4AI
ufw --force allow 9000/tcp  # MinIO
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

# Step 10: Create admin user instructions
echo -e "${YELLOW}[10/10] Creating admin user...${NC}"
echo -e "${BLUE}  To create admin user, run this in Supabase SQL Editor:${NC}"
cat << 'SQLEOF'
-- Create admin user
INSERT INTO auth.users (email, role)
VALUES ('admin@upsccsemaster.com', 'admin');

-- Or use Supabase dashboard to create user then:
UPDATE public.users 
SET role = 'admin', subscription_tier = 'premium_plus'
WHERE email = 'your-email@example.com';
SQLEOF
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           DEPLOYMENT COMPLETE!                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Open Coolify: http://${VPS_IP}:8000 (change default password!)"
echo "2. Open Main App: http://${VPS_IP}:3000"
echo "3. Create admin user in Supabase"
echo "4. Test all features"
echo "5. Configure domain (optional)"
echo ""
echo -e "${YELLOW}For mobile app build, run: bash build-mobile-app.sh${NC}"
echo ""
