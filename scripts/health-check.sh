#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# HEALTH CHECK SCRIPT
# Comprehensive health checks for all services
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
WEB_URL="${WEB_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:3001}"
WORKER_URL="${WORKER_URL:-http://localhost:3002}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-upsc_db}"

# Counters
PASSED=0
FAILED=0
WARNINGS=0

log_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

log_info() {
    echo -e "ℹ️  $1"
}

# ═══════════════════════════════════════════════════════════════
# HTTP HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════

check_http() {
    local url=$1
    local name=$2
    local timeout=${3:-5}

    if curl -sf --max-time "$timeout" "$url" > /dev/null 2>&1; then
        log_pass "$name is healthy ($url)"
        return 0
    else
        log_fail "$name is not responding ($url)"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════
# REDIS CHECK
# ═══════════════════════════════════════════════════════════════

check_redis() {
    if command -v redis-cli > /dev/null 2>&1; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
            log_pass "Redis is responding"
            return 0
        else
            log_fail "Redis is not responding"
            return 1
        fi
    else
        log_warn "redis-cli not installed, skipping Redis check"
        return 0
    fi
}

# ═══════════════════════════════════════════════════════════════
# POSTGRESQL CHECK
# ═══════════════════════════════════════════════════════════════

check_postgres() {
    if command -v pg_isready > /dev/null 2>&1; then
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
            log_pass "PostgreSQL is ready"
            return 0
        else
            log_fail "PostgreSQL is not ready"
            return 1
        fi
    else
        log_warn "pg_isready not installed, skipping PostgreSQL check"
        return 0
    fi
}

# ═══════════════════════════════════════════════════════════════
# DOCKER CONTAINER CHECK
# ═══════════════════════════════════════════════════════════════

check_container() {
    local container=$1

    if command -v docker > /dev/null 2>&1; then
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            if [[ "$status" == "healthy" ]]; then
                log_pass "Container $container is healthy"
                return 0
            elif [[ "$status" == "unknown" ]]; then
                # No health check defined
                if docker ps --format '{{.Status}}' | grep -q "^Up"; then
                    log_pass "Container $container is running"
                    return 0
                fi
            fi
        fi
        log_fail "Container $container is not running"
        return 1
    else
        log_warn "Docker not available, skipping container check"
        return 0
    fi
}

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════╗"
echo "║          UPSC CSE Master - Health Check               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# HTTP Service Checks
log_info "Checking HTTP Services..."
check_http "${WEB_URL}/api/health" "Web Service"
check_http "${API_URL}/api/health" "API Service"
check_http "${WORKER_URL}/health" "Worker Service"
echo ""

# Infrastructure Checks
log_info "Checking Infrastructure..."
check_redis
check_postgres
echo ""

# Container Checks (if running locally)
log_info "Checking Docker Containers..."
check_container "upsc-web"
check_container "upsc-api"
check_container "upsc-worker"
check_container "upsc-redis"
check_container "upsc-postgres"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════╗"
echo "║                    Health Summary                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
if [[ ${WARNINGS} -gt 0 ]]; then
    echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
fi
if [[ ${FAILED} -gt 0 ]]; then
    echo -e "${RED}Failed: ${FAILED}${NC}"
fi
echo ""

if [[ ${FAILED} -gt 0 ]]; then
    echo -e "${RED}❌ Overall Status: UNHEALTHY${NC}"
    exit 1
elif [[ ${WARNINGS} -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Overall Status: HEALTHY WITH WARNINGS${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Overall Status: HEALTHY${NC}"
    exit 0
fi
