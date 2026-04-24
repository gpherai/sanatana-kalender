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
      SERVICES+=("$arg")
      ;;
  esac
done

COMPOSE=(docker compose)
if [[ -n "${ENV_FILE:-}" ]]; then
  COMPOSE+=(--env-file "$ENV_FILE")
fi

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
if [[ "$NO_CACHE" == true || "$PULL" == true ]]; then
  BUILD_ARGS=()
  [[ "$NO_CACHE" == true ]] && BUILD_ARGS+=(--no-cache)
  [[ "$PULL" == true ]] && BUILD_ARGS+=(--pull)

  echo "Building Docker images..."
  "${COMPOSE[@]}" build "${BUILD_ARGS[@]}" "${SERVICES[@]}"

  echo ""
  echo "Starting application stack..."
  "${COMPOSE[@]}" up -d "${SERVICES[@]}"
else
  echo "Rebuilding and starting application stack..."
  "${COMPOSE[@]}" up -d --build "${SERVICES[@]}"
fi

echo ""
echo "Deployment status:"
"${COMPOSE[@]}" ps

echo ""
echo "Latest database backups:"
ls -lh backups/dharma_calendar_*.sql.gz 2>/dev/null | tail -n 5 || echo "No database backups found."
