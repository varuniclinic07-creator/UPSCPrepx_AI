#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Content Seeding Script — triggers cron jobs in sequence
# Usage: CRON_SECRET=your-secret SITE_URL=https://your-domain ./scripts/seed-content.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SITE_URL="${SITE_URL:-https://upscbyvarunsh.aimasteryedu.in}"
CRON_SECRET="${CRON_SECRET:?CRON_SECRET env var is required}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

call_cron() {
  local name="$1"
  local endpoint="$2"

  echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} Starting: ${name}..."

  HTTP_CODE=$(curl -s -o /tmp/cron_response.json -w "%{http_code}" \
    -X POST "${SITE_URL}${endpoint}" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    --max-time 120)

  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} ${name}: OK (${HTTP_CODE})"
    cat /tmp/cron_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/cron_response.json
    echo ""
  else
    echo -e "${RED}[$(date +%H:%M:%S)]${NC} ${name}: FAILED (${HTTP_CODE})"
    cat /tmp/cron_response.json 2>/dev/null
    echo ""
  fi
}

echo "═══════════════════════════════════════════════════════"
echo " UPSC PrepX AI — Content Seeding"
echo " Target: ${SITE_URL}"
echo " Time:   $(date)"
echo "═══════════════════════════════════════════════════════"
echo ""

# Step 1: Ingest current affairs from news sources
call_cron "CA Ingestion" "/api/cron/ca-ingestion"

# Step 2: Scrape current affairs from multiple sources
call_cron "CA Scraping" "/api/cron/scrape-current-affairs"

# Step 3: Run syllabus coverage — generates notes+quizzes for uncovered topics
call_cron "Syllabus Coverage" "/api/cron/syllabus-coverage"

# Step 4: Quality sweep — score newly generated content
call_cron "Quality Sweep" "/api/cron/quality-sweep"

# Step 5: Freshness check — flag stale content
call_cron "Freshness Check" "/api/cron/freshness-check"

# Step 6: Generate daily study plans for active users
call_cron "Daily Plans" "/api/cron/daily-plans"

# Step 7: Send mastery notifications
call_cron "Mastery Notifications" "/api/cron/mastery-notifications"

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN} Content seeding complete!${NC}"
echo "═══════════════════════════════════════════════════════"
