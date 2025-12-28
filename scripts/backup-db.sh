#!/bin/sh
# =============================================================================
# DHARMA CALENDAR - Database Backup Script
# =============================================================================
# Creates timestamped PostgreSQL backups
# Usage: 
#   Manual:   docker-compose --profile backup run backup
#   Cron:     0 2 * * * cd /path/to/dharma-calendar && docker-compose --profile backup run backup
# =============================================================================

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dharma_calendar_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

echo "🗄️ Dharma Calendar - Database Backup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Timestamp: ${TIMESTAMP}"
echo "📁 Backup file: ${BACKUP_FILE}"
echo ""

# Create backup directory if not exists
mkdir -p ${BACKUP_DIR}

# Create backup
echo "⏳ Creating backup..."
pg_dump --clean --if-exists --no-owner --no-privileges | gzip > ${BACKUP_FILE}

# Verify backup
if [ -f "${BACKUP_FILE}" ]; then
  SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
  echo "✅ Backup created successfully!"
  echo "   Size: ${SIZE}"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Cleanup old backups
echo ""
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -name "dharma_calendar_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# List remaining backups
echo ""
echo "📋 Current backups:"
ls -lh ${BACKUP_DIR}/dharma_calendar_*.sql.gz 2>/dev/null || echo "   (no backups found)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup complete!"
