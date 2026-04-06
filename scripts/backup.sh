#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# UPSC CSE Master - VPS Backup Script
# Run via cron: 0 2 * * * /opt/upsc-master/scripts/backup.sh
# ═══════════════════════════════════════════════════════════════

set -e

# Configuration
BACKUP_DIR="/opt/upsc-master/backups"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup_${DATE}.log"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "═══════════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "Starting backup: ${DATE}" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# ═══════════════════════════════════════════════════════════════
# 1. PostgreSQL Database Backup
# ═══════════════════════════════════════════════════════════════
echo "[1/4] Backing up PostgreSQL..." | tee -a "$LOG_FILE"

docker exec upsc-postgres pg_dump \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-upsc_db}" \
    --format=custom \
    --file=/tmp/db_backup.dump

docker cp upsc-postgres:/tmp/db_backup.dump "${BACKUP_DIR}/postgres_${DATE}.dump"

echo "✅ PostgreSQL backup complete: postgres_${DATE}.dump" | tee -a "$LOG_FILE"

# ═══════════════════════════════════════════════════════════════
# 2. Redis RDB Snapshot
# ═══════════════════════════════════════════════════════════════
echo "[2/4] Backing up Redis..." | tee -a "$LOG_FILE"

docker exec upsc-redis redis-cli -a "${REDIS_PASSWORD}" BGSAVE
sleep 5  # Wait for save to complete

docker cp upsc-redis:/data/dump.rdb "${BACKUP_DIR}/redis_${DATE}.rdb"

echo "✅ Redis backup complete: redis_${DATE}.rdb" | tee -a "$LOG_FILE"

# ═══════════════════════════════════════════════════════════════
# 3. MinIO Data (Optional - Large files)
# ═══════════════════════════════════════════════════════════════
echo "[3/4] Backing up MinIO metadata..." | tee -a "$LOG_FILE"

# Only backup critical metadata, not all video files
docker exec upsc-minio mc ls /data > "${BACKUP_DIR}/minio_manifest_${DATE}.txt"

echo "✅ MinIO manifest saved: minio_manifest_${DATE}.txt" | tee -a "$LOG_FILE"

# ═══════════════════════════════════════════════════════════════
# 4. Docker Volumes List
# ═══════════════════════════════════════════════════════════════
echo "[4/4] Documenting Docker volumes..." | tee -a "$LOG_FILE"

docker volume ls > "${BACKUP_DIR}/volumes_${DATE}.txt"

echo "✅ Volume list saved: volumes_${DATE}.txt" | tee -a "$LOG_FILE"

# ═══════════════════════════════════════════════════════════════
# 5. Cleanup Old Backups
# ═══════════════════════════════════════════════════════════════
echo "Cleaning up backups older than ${RETENTION_DAYS} days..." | tee -a "$LOG_FILE"

find "${BACKUP_DIR}" -type f -mtime +${RETENTION_DAYS} -delete

echo "✅ Cleanup complete" | tee -a "$LOG_FILE"

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

echo "═══════════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "Backup complete!" | tee -a "$LOG_FILE"
echo "Location: ${BACKUP_DIR}" | tee -a "$LOG_FILE"
echo "Total size: ${BACKUP_SIZE}" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# Optional: Send notification
# curl -X POST https://your-webhook-url -d "Backup complete: ${DATE}"

exit 0
