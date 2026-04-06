#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# UPSC CSE Master - VPS Deployment Script
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo "  UPSC CSE Master - VPS Deployment"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/root/upscprepx"
GITHUB_REPO="https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git"
GITHUB_BRANCH="main"

# ═══════════════════════════════════════════════════════════════════════════
# 1. System Preparation
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${GREEN}Step 1: Checking System Prerequisites${NC}"
echo "────────────────────────────────────────────────────────"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found. Installing...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠ Git not found. Installing...${NC}"
    apt-get update && apt-get install -y git
else
    echo -e "${GREEN}✓ Git installed${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# 2. Clone/Update Repository
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}Step 2: Setting up Application Directory${NC}"
echo "────────────────────────────────────────────────────────"

if [ -d "$APP_DIR" ]; then
    echo -e "${YELLOW}⚠ Application directory exists. Updating...${NC}"
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/$GITHUB_BRANCH
    git pull origin $GITHUB_BRANCH
else
    echo -e "${GREEN}✓ Cloning repository...${NC}"
    git clone -b $GITHUB_BRANCH $GITHUB_REPO $APP_DIR
    cd $APP_DIR
fi

# ═══════════════════════════════════════════════════════════════════════════
# 3. Stop Existing Services
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}Step 3: Stopping Existing Services${NC}"
echo "────────────────────────────────────────────────────────"

if [ -f "docker-compose.coolify.yml" ]; then
    docker-compose -f docker-compose.coolify.yml down --remove-orphans || true
    echo -e "${GREEN}✓ Existing services stopped${NC}"
else
    echo -e "${YELLOW}⚠ No existing deployment found${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# 4. Pull Latest Images
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}Step 4: Pulling Docker Images${NC}"
echo "────────────────────────────────────────────────────────"

docker-compose -f docker-compose.coolify.yml pull
echo -e "${GREEN}✓ Images pulled successfully${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# 5. Deploy Services
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}Step 5: Deploying Services${NC}"
echo "────────────────────────────────────────────────────────"

docker-compose -f docker-compose.coolify.yml up -d
echo -e "${GREEN}✓ Services deployed${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# 6. Wait for Services to be Healthy
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}Step 6: Waiting for Services to be Healthy${NC}"
echo "────────────────────────────────────────────────────────"

sleep 30  # Give services time to start

# Check service health
echo "Checking service status..."
docker-compose -f docker-compose.coolify.yml ps

# ═══════════════════════════════════════════════════════════════════════════
# 7. Display Access Information
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Access URLs:"
echo "  Main App:         http://89.117.60.144:3000"
echo "  MinIO Console:    http://89.117.60.144:9001"
echo "  Grafana:          http://89.117.60.144:3004"
echo "  Uptime Kuma:      http://89.117.60.144:3003"
echo "  Prometheus:       http://89.117.60.144:9090"
echo ""
echo "Next Steps:"
echo "  1. Configure DNS for upscbyvarunsh.aimasteryedu.in"
echo "  2. Setup SSL certificates"
echo "  3. Configure monitoring alerts"
echo "  4. Run health checks"
echo ""
echo "════════════════════════════════════════════════════════════════"

# ═══════════════════════════════════════════════════════════════════════════
# 8. Display Logs
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}Recent Logs:${NC}"
echo "────────────────────────────────────────────────────────"
docker-compose -f docker-compose.coolify.yml logs --tail=50
