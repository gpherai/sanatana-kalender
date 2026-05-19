#!/usr/bin/env bash
# Safe production deploy: create a database backup before rebuilding containers.
#
# Usage:
#   ./scripts/deploy-prod.sh
#   ./scripts/deploy-prod.sh --no-cache
#   ./scripts/deploy-prod.sh --pull

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

on_error() {
  echo ""
  echo "ERROR: Deploy mislukt."
  echo "──────────────────────────────────────────────────────"
  echo "Migrate logs (laatste 30 regels):"
  "${COMPOSE[@]}" logs --tail=30 migrate 2>/dev/null || true
  echo ""
  echo "App logs (laatste 30 regels):"
  "${COMPOSE[@]}" logs --tail=30 app 2>/dev/null || true
  echo ""
  echo "Status:"
  "${COMPOSE[@]}" ps 2>/dev/null || true
}

show_help() {
  cat <<'EOF'
Safe production deploy for Dharma Calendar.

Runs in this order:
  1. Start/health-check the database service
  2. Create a mandatory PostgreSQL backup in ./backups
  3. Rebuild and restart the app stack

Usage:
  ./scripts/deploy-prod.sh
  ./scripts/deploy-prod.sh --no-cache
  ./scripts/deploy-prod.sh --pull
  ./scripts/deploy-prod.sh app        (herbouw alleen de app-service)

Options:
  --no-cache   Build Docker images without cache after the backup succeeds
  --pull       Pull newer base images during build
  -h, --help   Show this help

Environment:
  ENV_FILE=/path/to/.env.production  Optional docker compose env-file override
EOF
}

NO_CACHE=false
PULL=false
SERVICES=()

for arg in "$@"; do
  case "$arg" in
    -h | --help)
      show_help
      exit 0
      ;;
    --no-cache)
      NO_CACHE=true
      ;;
    --pull)
      PULL=true
      ;;
    -v | --volumes | down)
      echo "ERROR: Refusing destructive Docker Compose argument: ${arg}" >&2
      echo "Use this script instead of docker compose down -v on production." >&2
      exit 2
      ;;
    *)
      if [[ "$arg" == --* ]]; then
        echo "ERROR: Onbekende optie: $arg" >&2
        echo "Gebruik --help voor een overzicht." >&2
        exit 2
      fi
      SERVICES+=("$arg")
      ;;
  esac
done

COMPOSE=(docker compose)
if [[ -n "${ENV_FILE:-}" ]]; then
  COMPOSE+=(--env-file "$ENV_FILE")
fi

trap on_error ERR

if [[ ! -f docker-compose.yml ]]; then
  echo "ERROR: docker-compose.yml not found. Run this from the project root." >&2
  exit 1
fi

echo "Starting database service..."
"${COMPOSE[@]}" up -d db

echo ""
echo "Creating mandatory pre-deploy database backup..."
"${COMPOSE[@]}" --profile backup run --rm backup

echo ""
# Remove the old migrate container so Docker Compose always runs it fresh.
# Without this, Compose sees the previous Exited(0) container and skips the
# migrate service entirely — meaning new migrations are never applied.
"${COMPOSE[@]}" rm -f migrate 2>/dev/null || true

if [[ "$NO_CACHE" == true || "$PULL" == true ]]; then
  BUILD_ARGS=()
  [[ "$NO_CACHE" == true ]] && BUILD_ARGS+=(--no-cache)
  [[ "$PULL" == true ]] && BUILD_ARGS+=(--pull)

  echo "Building Docker images..."
  "${COMPOSE[@]}" build "${BUILD_ARGS[@]}" "${SERVICES[@]}"

  echo ""
  echo "Starting application stack..."
  "${COMPOSE[@]}" up -d --wait --wait-timeout 120 "${SERVICES[@]}"
else
  echo "Rebuilding and starting application stack..."
  "${COMPOSE[@]}" up -d --build --wait --wait-timeout 120 "${SERVICES[@]}"
fi

echo ""
echo "Deployment status:"
"${COMPOSE[@]}" ps

echo ""
echo "Latest database backups:"
ls -lh backups/dharma_calendar_*.sql.gz 2>/dev/null | tail -n 5 || echo "No database backups found."

echo ""
echo "Deploy succesvol!"
