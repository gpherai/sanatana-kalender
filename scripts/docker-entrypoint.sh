#!/bin/sh
# =============================================================================
# DHARMA CALENDAR - Docker Entrypoint Script
# =============================================================================
# This script runs before the application starts to:
# 1. Wait for database to be ready
# 2. Run Prisma migrations (if needed)
# 3. Start the application
# =============================================================================

set -e

echo "🕉️ Dharma Calendar - Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# -----------------------------------------------------------------------------
# Wait for Database
# -----------------------------------------------------------------------------
echo "⏳ Waiting for database connection..."

# Extract host and port from DATABASE_URL
# Format: postgresql://user:pass@host:port/db
DB_HOST=$(echo $DATABASE_URL | sed -e 's/.*@//' -e 's/:.*//')
DB_PORT=$(echo $DATABASE_URL | sed -e 's/.*@[^:]*://' -e 's/\/.*//')

# Default port if not specified
DB_PORT=${DB_PORT:-5432}

# Wait for database with timeout
RETRIES=30
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null || [ $RETRIES -eq 0 ]; do
  echo "   Waiting for $DB_HOST:$DB_PORT... ($RETRIES retries left)"
  RETRIES=$((RETRIES-1))
  sleep 2
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Database not available after 60 seconds"
  exit 1
fi

echo "✅ Database is ready!"

# -----------------------------------------------------------------------------
# Run Prisma Migrations
# -----------------------------------------------------------------------------
echo ""
echo "📦 Running database migrations..."

# Deploy pending migrations to production database
# This applies all migrations that haven't been applied yet
npx prisma migrate deploy 2>&1 || {
  echo "❌ Migration deployment failed"
  exit 1
}

echo "✅ Database schema is up to date!"

# -----------------------------------------------------------------------------
# Start Application
# -----------------------------------------------------------------------------
echo ""
echo "🚀 Starting Dharma Calendar..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Execute the main command (passed as arguments)
exec "$@"
