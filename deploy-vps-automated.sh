#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# UPSC CSE MASTER - AUTOMATED VPS DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════════════════
# Execute this script on the VPS after transferring files
# Usage: bash deploy-vps-automated.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/root/upscprepx"
GITHUB_REPO="https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git"
GITHUB_BRANCH="main"

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  UPSC CSE Master - Automated VPS Deployment${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: System Prerequisites Check
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${GREEN}[STEP 1/8] Checking System Prerequisites...${NC}"
echo "────────────────────────────────────────────────────────"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed successfully${NC}"
else
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo -e "${GREEN}✓ Docker installed (v${DOCKER_VERSION})${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Docker Compose not found. Installing...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠ Git not found. Installing...${NC}"
    apt-get update && apt-get install -y git
    echo -e "${GREEN}✓ Git installed successfully${NC}"
else
    echo -e "${GREEN}✓ Git installed${NC}"
fi

# Check system resources
echo ""
echo "System Resources:"
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')
MEM_AVAIL=$(free -h | awk 'NR==2 {print $7}')
echo "  Disk Available: ${DISK_AVAIL}"
echo "  Memory Available: ${MEM_AVAIL}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Setup Application Directory
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${GREEN}[STEP 2/8] Setting up Application Directory...${NC}"
echo "────────────────────────────────────────────────────────"

# Create directory if not exists
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or update repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠ Repository exists. Updating...${NC}"
    git fetch origin
    git reset --hard origin/$GITHUB_BRANCH
    git pull origin $GITHUB_BRANCH
    echo -e "${GREEN}✓ Repository updated${NC}"
else
    echo -e "${BLUE}Cloning repository...${NC}"
    git clone -b $GITHUB_BRANCH $GITHUB_REPO .
    echo -e "${GREEN}✓ Repository cloned${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Check Environment File
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}[STEP 3/8] Checking Environment Configuration...${NC}"
echo "────────────────────────────────────────────────────────"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
elif [ -f ".env.production" ]; then
    echo -e "${YELLOW}⚠ Copying .env.production to .env${NC}"
    cp .env.production .env
    echo -e "${GREEN}✓ Environment file ready${NC}"
else
    echo -e "${RED}✗ ERROR: No .env or .env.production file found!${NC}"
    echo -e "${YELLOW}Please transfer .env.production to ${APP_DIR}/.env${NC}"
    exit 1
fi

# Verify critical environment variables
echo ""
echo "Verifying critical environment variables..."
REQUIRED_VARS=("NODE_ENV" "NEXT_PUBLIC_SUPABASE_URL" "A4F_API_KEY" "REDIS_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env; then
        echo -e "  ${GREEN}✓${NC} ${var}"
    else
        echo -e "  ${RED}✗${NC} ${var} - MISSING"
        MISSING_VARS+=($var)
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}✗ Missing required environment variables!${NC}"
    exit 1
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Stop Existing Services
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${GREEN}[STEP 4/8] Stopping Existing Services...${NC}"
echo "────────────────────────────────────────────────────────"

if [ -f "docker-compose.coolify.yml" ]; then
    docker-compose -f docker-compose.coolify.yml down --remove-orphans 2>/dev/null || true
    echo -e "${GREEN}✓ Existing services stopped${NC}"
else
    echo -e "${YELLOW}⚠ No existing docker-compose.coolify.yml found${NC}"
fi

# Clean up any orphaned containers
docker container prune -f 2>/dev/null || true
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: Pull Docker Images
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${GREEN}[STEP 5/8] Pulling Docker Images...${NC}"
echo "────────────────────────────────────────────────────────"

docker-compose -f docker-compose.coolify.yml pull
echo -e "${GREEN}✓ All images pulled successfully${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: Deploy Services
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${GREEN}[STEP 6/8] Deploying Services...${NC}"
echo "────────────────────────────────────────────────────────"

# Start services
docker-compose -f docker-compose.coolify.yml up -d

echo -e "${GREEN}✓ Services deployment initiated${NC}"
echo ""

# Wait for services to start
echo -e "${BLUE}Waiting 60 seconds for services to initialize...${NC}"
sleep 60

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: Health Checks
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}[STEP 7/8] Running Health Checks...${NC}"
echo "────────────────────────────────────────────────────────"

# Service health check function
check_service() {
    local name=$1
    local url=$2
    local timeout=${3:-5}
    
    if curl -sf --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $name: Healthy"
        return 0
    else
        echo -e "  ${RED}✗${NC} $name: Unhealthy"
        return 1
    fi
}

# Check Docker service status
echo ""
echo "Docker Container Status:"
docker-compose -f docker-compose.coolify.yml ps --format "table {{.Name}}\t{{.Status}}"

echo ""
echo "Service Health Checks:"

# Redis check
echo -n "  Redis: "
if docker exec upsc-redis redis-cli -a "$(grep REDIS_PASSWORD .env | cut -d'=' -f2)" ping 2>/dev/null | grep -q PONG; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# MinIO check
check_service "MinIO" "http://localhost:9000/minio/health/live"

# Crawl4AI check
check_service "Crawl4AI" "http://localhost:11235/health" 10

# Web Search check
check_service "Web Search" "http://localhost:8030/health"

# Autodoc check
check_service "Autodoc" "http://localhost:8031/health"

# File Search check
check_service "File Search" "http://localhost:8032/health"

# Grafana check
check_service "Grafana" "http://localhost:3004/api/health"

# Prometheus check
check_service "Prometheus" "http://localhost:9090/-/healthy"

# Uptime Kuma check
check_service "Uptime Kuma" "http://localhost:3003"

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 8: Display Access Information
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${GREEN}[STEP 8/8] Deployment Complete!${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  🎉 UPSC CSE Master - Deployment Successful!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}Access URLs:${NC}"
echo "────────────────────────────────────────────────────────"
echo "  Main Application:  http://${SERVER_IP}:3000"
echo "  MinIO Console:     http://${SERVER_IP}:9001"
echo "  Grafana:           http://${SERVER_IP}:3004"
echo "  Prometheus:        http://${SERVER_IP}:9090"
echo "  Uptime Kuma:       http://${SERVER_IP}:3003"
echo "  Jaeger Tracing:    http://${SERVER_IP}:16686"
echo ""

echo -e "${GREEN}Next Steps:${NC}"
echo "────────────────────────────────────────────────────────"
echo "  1. Configure DNS A record for upscbyvarunsh.aimasteryedu.in → ${SERVER_IP}"
echo "  2. Setup SSL certificate via Coolify or certbot"
echo "  3. Configure Uptime Kuma monitoring"
echo "  4. Verify all services are accessible"
echo ""

echo -e "${GREEN}Useful Commands:${NC}"
echo "────────────────────────────────────────────────────────"
echo "  View logs:      docker-compose -f docker-compose.coolify.yml logs -f"
echo "  Restart:        docker-compose -f docker-compose.coolify.yml restart"
echo "  Stop:           docker-compose -f docker-compose.coolify.yml down"
echo "  Status:         docker-compose -f docker-compose.coolify.yml ps"
echo ""

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

# Show recent logs
echo ""
echo -e "${BLUE}Recent Container Logs (last 20 lines):${NC}"
echo "────────────────────────────────────────────────────────"
docker-compose -f docker-compose.coolify.yml logs --tail=20 2>/dev/null || true

echo ""
echo -e "${GREEN}Deployment script completed at $(date)${NC}"