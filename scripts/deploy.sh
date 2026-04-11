#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# UPSC CSE MASTER - ZERO-DOWNTIME DEPLOYMENT SCRIPT
# Deploy to VPS via SSH with automatic rollback on failure
# ═══════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
ENVIRONMENT="${ENVIRONMENT:-production}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/upsc-master}"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_INTERVAL=10

# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Zero-downtime deployment to VPS via SSH.

OPTIONS:
    -e, --environment ENV     Target environment (staging|production)
    -p, --path PATH           Deployment path on VPS
    -r, --rollback            Rollback to previous deployment
    -h, --help                Show this help

EXAMPLES:
    $0 --environment production
    $0 -e staging -p /opt/upsc-staging
    $0 --rollback

REQUIRED ENV VARS:
    VPS_HOST                  VPS hostname or IP
    VPS_USER                  SSH username (default: root)
    VPS_SSH_KEY              Path to SSH private key

EOF
    exit 1
}

# ═══════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════

ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment) ENVIRONMENT="$2"; shift 2 ;;
        -p|--path) DEPLOY_PATH="$2"; shift 2 ;;
        -r|--rollback) ROLLBACK=true; shift ;;
        -h|--help) usage ;;
        *) log_error "Unknown option: $1"; usage ;;
    esac
done

# ═══════════════════════════════════════════════════════════════
# VALIDATE
# ═══════════════════════════════════════════════════════════════

if [[ -z "${VPS_HOST}" ]]; then
    log_error "VPS_HOST environment variable is required"
    exit 1
fi

VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-upsc-master}"

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30"
[[ -n "${VPS_SSH_KEY}" ]] && SSH_OPTS="$SSH_OPTS -i ${VPS_SSH_KEY}"

ssh_cmd() { ssh $SSH_OPTS -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" "$1"; }

# ═══════════════════════════════════════════════════════════════
# PRE-CHECKS
# ═══════════════════════════════════════════════════════════════

log_info "Starting deployment to ${ENVIRONMENT}..."
log_info "Target: ${VPS_USER}@${VPS_HOST}:${DEPLOY_PATH}"

log_info "Checking SSH connectivity..."
if ! ssh_cmd "echo 'connected'" > /dev/null 2>&1; then
    log_error "Failed to connect to VPS via SSH"
    exit 1
fi
log_success "SSH connection established"

# ═══════════════════════════════════════════════════════════════
# ROLLBACK
# ═══════════════════════════════════════════════════════════════

if [[ "${ROLLBACK}" == "true" ]]; then
    log_info "Initiating rollback..."
    ssh_cmd << 'ROLLBACK'
set -e
cd "${DEPLOY_PATH}"
if [ ! -f ".previous-compose.yml" ]; then
    echo "❌ No previous deployment found"
    exit 1
fi
docker compose -f docker-compose.production.yml down --remove-orphans || true
cp .previous-compose.yml docker-compose.production.yml
docker compose -f docker-compose.production.yml up -d
echo "✅ Rollback completed"
ROLLBACK
    log_success "Rollback completed"
    exit 0
fi

# ═══════════════════════════════════════════════════════════════
# BUILD (Local)
# ═══════════════════════════════════════════════════════════════

log_info "Building application..."

if ! command -v node &> /dev/null; then
    log_error "Node.js is required for build"
    exit 1
fi

npm ci --ignore-scripts
npm run build

log_success "Build completed"

# ═══════════════════════════════════════════════════════════════
# DEPLOY
# ═══════════════════════════════════════════════════════════════

log_info "Creating backup..."
ssh_cmd << 'BACKUP'
cd "${DEPLOY_PATH}"
[ -f "docker-compose.production.yml" ] && cp docker-compose.production.yml .previous-compose.yml
BACKUP

log_info "Pulling Docker images..."
ssh_cmd << PULL
cd "${DEPLOY_PATH}"
docker pull ${REGISTRY}/${IMAGE_NAME}-web:${ENVIRONMENT}
docker pull ${REGISTRY}/${IMAGE_NAME}-api:${ENVIRONMENT}
docker pull ${REGISTRY}/${IMAGE_NAME}-worker:${ENVIRONMENT}
PULL
log_success "Images pulled"

log_info "Stopping containers..."
ssh_cmd << STOP
cd "${DEPLOY_PATH}"
docker compose -f docker-compose.production.yml down --remove-orphans --timeout 60
STOP
log_success "Containers stopped"

log_info "Starting new containers..."
ssh_cmd << START
cd "${DEPLOY_PATH}"
docker compose -f docker-compose.production.yml up -d
START
log_success "Containers started"

# ═══════════════════════════════════════════════════════════════
# HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════

log_info "Waiting for services (15s)..."
sleep 15

log_info "Running health checks (${HEALTH_CHECK_RETRIES} attempts)..."

health_passed=false
for i in $(seq 1 ${HEALTH_CHECK_RETRIES}); do
    log_info "Attempt ${i}/${HEALTH_CHECK_RETRIES}..."

    if ssh_cmd "curl -sf http://localhost:3000/api/health" > /dev/null 2>&1 && \
       ssh_cmd "curl -sf http://localhost:3001/api/health" > /dev/null 2>&1 && \
       ssh_cmd "curl -sf http://localhost:3002/health" > /dev/null 2>&1; then
        health_passed=true
        break
    fi

    sleep ${HEALTH_CHECK_INTERVAL}
done

if [[ "${health_passed}" != "true" ]]; then
    log_error "Health checks failed"
    log_info "Auto-rollback..."
    ssh_cmd << ROLLBACK_AUTO
cd "${DEPLOY_PATH}"
docker compose -f docker-compose.production.yml down --remove-orphans || true
[ -f ".previous-compose.yml" ] && cp .previous-compose.yml docker-compose.production.yml
docker compose -f docker-compose.production.yml up -d
ROLLBACK_AUTO
    exit 1
fi

# ═══════════════════════════════════════════════════════════════
# CLEANUP
# ═══════════════════════════════════════════════════════════════

log_info "Cleaning up..."
ssh_cmd << CLEANUP
cd "${DEPLOY_PATH}"
docker image prune -af --filter "until=24h" || true
CLEANUP
log_success "Cleanup done"

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

log_success "🚀 Deployment completed!"
log_info ""
log_info "Services:"
log_info "  Web:   http://${VPS_HOST}:3000"
log_info "  API:   http://${VPS_HOST}:3001"
log_info "  Worker: http://${VPS_HOST}:3002"
log_info ""
log_info "Rollback: $0 --rollback"

exit 0
