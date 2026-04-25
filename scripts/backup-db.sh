#!/bin/sh
# =============================================================================
# DHARMA CALENDAR - Database Backup Script
# =============================================================================
# Creates timestamped PostgreSQL backups
# Usage: 
#   Manual:   docker compose --profile backup run --rm backup
#   Cron:     0 2 * * * cd /path/to/dharma-calendar && docker compose --profile backup run --rm backup
# =============================================================================

set -eu

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dharma_calendar_${TIMESTAMP}.sql.gz"
TEMP_FILE="${BACKUP_FILE%.gz}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

cleanup_temp_file() {
  rm -f "${TEMP_FILE}"
}

trap cleanup_temp_file EXIT INT TERM

echo "🗄️ Dharma Calendar - Database Backup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Timestamp: ${TIMESTAMP}"
echo "📁 Backup file: ${BACKUP_FILE}"
echo "🧹 Retention: ${RETENTION_DAYS} days"
echo ""

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Create backup.
# Do not pipe directly to gzip: POSIX sh has no pipefail, so pg_dump failures
# could otherwise leave a misleading empty or broken backup artifact.
echo "⏳ Creating backup..."
if ! pg_dump --clean --if-exists --no-owner --no-privileges > "${TEMP_FILE}"; then
  echo "❌ pg_dump failed; no backup was created."
  exit 1
fi

if [ ! -s "${TEMP_FILE}" ]; then
  echo "❌ pg_dump produced an empty file; refusing to create backup."
  exit 1
fi

gzip -f "${TEMP_FILE}"

# Verify backup
if [ -s "${BACKUP_FILE}" ] && gzip -t "${BACKUP_FILE}"; then
  SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "✅ Backup created successfully!"
  echo "   Size: ${SIZE}"
else
  echo "❌ Backup verification failed!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Cleanup old backups
echo ""
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "dharma_calendar_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true

# List remaining backups
echo ""
echo "📋 Current backups:"
ls -lh "${BACKUP_DIR}"/dharma_calendar_*.sql.gz 2>/dev/null || echo "   (no backups found)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup complete!"
