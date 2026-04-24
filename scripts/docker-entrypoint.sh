#!/bin/sh
# =============================================================================
# DHARMA CALENDAR - Docker Entrypoint Script
# =============================================================================
# Database readiness is handled by Docker Compose (depends_on + healthcheck).
# This script only starts the application.
# =============================================================================

set -e

echo "🕉️ Dharma Calendar - Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exec "$@"
