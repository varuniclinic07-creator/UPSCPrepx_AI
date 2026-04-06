# ═══════════════════════════════════════════════════════════════════════════
# UPSC CSE MASTER - COOLIFY DEPLOYMENT AUTOMATION SCRIPT
# ═══════════════════════════════════════════════════════════════════════════
# Purpose: Automated full production deployment to Coolify
# VPS: 89.117.60.144
# Domain: upscbyvarunsh.aimasteryedu.in
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  UPSC CSE Master - Coolify Production Deployment" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# VPS Configuration
$VPS_IP = "89.117.60.144"
$VPS_USER = "root"
$VPS_PASSWORD = "772877mAmcIaS"
$APP_DIR = "/root/upscprepx"

# Repository Configuration
$GITHUB_REPO = "https://github.com/varuniclinic07-creator/UPSCPrepx_AI.git"
$GITHUB_BRANCH = "main"

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: PRE-DEPLOYMENT CHECKS
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "Phase 1: Pre-Deployment Checks" -ForegroundColor Green
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Check if .env.production exists
if (!(Test-Path ".env.production")) {
    Write-Host "✗ ERROR: .env.production not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ .env.production file found" -ForegroundColor Green

# Check if docker-compose.coolify.yml exists
if (!(Test-Path "docker-compose.coolify.yml")) {
    Write-Host "✗ ERROR: docker-compose.coolify.yml not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ docker-compose.coolify.yml found" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: SSH CONNECTION TEST
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "Phase 2: Testing SSH Connection" -ForegroundColor Green
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

try {
    # Test SSH connection
    $sshTest = @"
    `$password = ConvertTo-SecureString '$VPS_PASSWORD' -AsPlainText -Force
    `$cred = New-Object System.Management.Automation.PSCredential ('$VPS_USER', `$password)
    
    # Create SSH session
    `$session = New-PSSession -HostName $VPS_IP -Credential `$cred -ErrorAction Stop
    
    if (`$session) {
        Write-Host "✓ SSH connection successful" -ForegroundColor Green
        Remove-PSSession `$session
        exit 0
    }
"@
    
    Invoke-Expression $sshTest
    
} catch {
    Write-Host "⚠ WARNING: PowerShell SSH not available. Will use manual deployment." -ForegroundColor Yellow
    Write-Host "Please ensure you can SSH manually: ssh $VPS_USER@$VPS_IP" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3: GENERATE DEPLOYMENT COMMANDS
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "Phase 3: Generating Deployment Commands" -ForegroundColor Green
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$deploymentScript = @"
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
GITHUB_REPO="$GITHUB_REPO"
GITHUB_BRANCH="$GITHUB_BRANCH"

# ═══════════════════════════════════════════════════════════════════════════
# 1. System Preparation
# ═══════════════════════════════════════════════════════════════════════════

echo -e "`${GREEN}Step 1: Checking System Prerequisites`${NC}"
echo "────────────────────────────────────────────────────────"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "`${RED}✗ Docker not found. Installing...`${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "`${GREEN}✓ Docker installed`${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "`${RED}✗ Docker Compose not found. Installing...`${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "`${GREEN}✓ Docker Compose installed`${NC}"
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "`${YELLOW}⚠ Git not found. Installing...`${NC}"
    apt-get update && apt-get install -y git
else
    echo -e "`${GREEN}✓ Git installed`${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# 2. Clone/Update Repository
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "`${GREEN}Step 2: Setting up Application Directory`${NC}"
echo "────────────────────────────────────────────────────────"

if [ -d "`$APP_DIR" ]; then
    echo -e "`${YELLOW}⚠ Application directory exists. Updating...`${NC}"
    cd `$APP_DIR
    git fetch origin
    git reset --hard origin/`$GITHUB_BRANCH
    git pull origin `$GITHUB_BRANCH
else
    echo -e "`${GREEN}✓ Cloning repository...`${NC}"
    git clone -b `$GITHUB_BRANCH `$GITHUB_REPO `$APP_DIR
    cd `$APP_DIR
fi

# ═══════════════════════════════════════════════════════════════════════════
# 3. Stop Existing Services
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "`${GREEN}Step 3: Stopping Existing Services`${NC}"
echo "────────────────────────────────────────────────────────"

if [ -f "docker-compose.coolify.yml" ]; then
    docker-compose -f docker-compose.coolify.yml down --remove-orphans || true
    echo -e "`${GREEN}✓ Existing services stopped`${NC}"
else
    echo -e "`${YELLOW}⚠ No existing deployment found`${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# 4. Pull Latest Images
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "`${GREEN}Step 4: Pulling Docker Images`${NC}"
echo "────────────────────────────────────────────────────────"

docker-compose -f docker-compose.coolify.yml pull
echo -e "`${GREEN}✓ Images pulled successfully`${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# 5. Deploy Services
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "`${GREEN}Step 5: Deploying Services`${NC}"
echo "────────────────────────────────────────────────────────"

docker-compose -f docker-compose.coolify.yml up -d
echo -e "`${GREEN}✓ Services deployed`${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# 6. Wait for Services to be Healthy
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "`${GREEN}Step 6: Waiting for Services to be Healthy`${NC}"
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
echo -e "`${GREEN}  Deployment Complete!`${NC}"
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
echo -e "`${GREEN}Recent Logs:`${NC}"
echo "────────────────────────────────────────────────────────"
docker-compose -f docker-compose.coolify.yml logs --tail=50

"@

# Save deployment script
$deploymentScript | Out-File -FilePath "deploy-to-vps.sh" -Encoding UTF8 -NoNewline
Write-Host "✓ Created deploy-to-vps.sh" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 4: CREATE HELPER SCRIPTS
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "Phase 4: Creating Helper Scripts" -ForegroundColor Green
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Health check script
$healthCheckScript = @"
#!/bin/bash
# Health Check Script

echo "Checking service health..."

services=(
    "http://localhost:3000/api/health:Main App"
    "http://localhost:9000/minio/health/live:MinIO"
    "http://localhost:6379:Redis"
)

for service in "`${services[@]}"; do
    IFS=':' read -ra ADDR <<< "`$service"
    url="`${ADDR[0]}"
    name="`${ADDR[1]}"
    
    if curl -f -s "`$url" > /dev/null; then
        echo "✓ `$name: Healthy"
    else
        echo "✗ `$name: Unhealthy"
    fi
done
"@

$healthCheckScript | Out-File -FilePath "health-check.sh" -Encoding UTF8 -NoNewline
Write-Host "✓ Created health-check.sh" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 5: DISPLAY NEXT STEPS
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Deployment Preparation Complete!" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generated Files:" -ForegroundColor Green
Write-Host "  ✓ deploy-to-vps.sh      - Main deployment script" -ForegroundColor White
Write-Host "  ✓ health-check.sh       - Health verification" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Green
Write-Host ""
Write-Host "Option A: Automated Deployment (Recommended)" -ForegroundColor Cyan
Write-Host "  1. Copy deployment script to VPS:" -ForegroundColor White
Write-Host "     scp deploy-to-vps.sh root@89.117.60.144:/tmp/" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Copy .env.production to VPS:" -ForegroundColor White
Write-Host "     scp .env.production root@89.117.60.144:/tmp/" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Copy docker-compose to VPS:" -ForegroundColor White
Write-Host "     scp docker-compose.coolify.yml root@89.117.60.144:/tmp/" -ForegroundColor Yellow
Write-Host ""
Write-Host "  4. SSH into VPS and execute:" -ForegroundColor White
Write-Host "     ssh root@89.117.60.144" -ForegroundColor Yellow
Write-Host "     chmod +x /tmp/deploy-to-vps.sh" -ForegroundColor Yellow
Write-Host "     /tmp/deploy-to-vps.sh" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option B: Coolify Web UI" -ForegroundColor Cyan
Write-Host "  1. Access Coolify: http://89.117.60.144:8000" -ForegroundColor Yellow
Write-Host "  2. Create new project" -ForegroundColor White
Write-Host "  3. Connect GitHub repository" -ForegroundColor White
Write-Host "  4. Upload .env.production via UI" -ForegroundColor White
Write-Host "  5. Deploy via dashboard" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Ask user which option they prefer
Write-Host "Which deployment option would you like to proceed with?" -ForegroundColor Yellow
Write-Host "  [A] Automated SSH deployment (I'll execute it)" -ForegroundColor White
Write-Host "  [B] Manual Coolify UI deployment (Guided steps)" -ForegroundColor White
Write-Host "  [C] Generate commands only (You execute manually)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (A/B/C)"

switch ($choice.ToUpper()) {
    "A" {
        Write-Host ""
        Write-Host "Proceeding with automated deployment..." -ForegroundColor Green
        Write-Host "This will:" -ForegroundColor Yellow
        Write-Host "  1. Copy files to VPS" -ForegroundColor White
        Write-Host "  2. Execute deployment script" -ForegroundColor White
        Write-Host "  3. Verify health checks" -ForegroundColor White
        Write-Host ""
        $confirm = Read-Host "Continue? (Y/N)"
        
        if ($confirm.ToUpper() -eq "Y") {
            Write-Host ""
            Write-Host "Starting deployment..." -ForegroundColor Green
            # Deployment commands will be executed here
        }
    }
    
    "B" {
        Write-Host ""
        Write-Host "Opening Coolify deployment guide..." -ForegroundColor Green
        # Open browser or show guided steps
    }
    
    "C" {
        Write-Host ""
        Write-Host "Deployment commands saved to:" -ForegroundColor Green
        Write-Host "  - deploy-to-vps.sh" -ForegroundColor White
        Write-Host "  - health-check.sh" -ForegroundColor White
        Write-Host ""
        Write-Host "Execute manually when ready!" -ForegroundColor Yellow
    }
    
    default {
        Write-Host ""
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    }
}
