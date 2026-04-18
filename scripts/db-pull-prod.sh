#!/usr/bin/env bash
# Haalt een database dump op van de VPS en slaat hem lokaal op.
#
# Vereiste omgevingsvariabele:
#   VPS_HOST   SSH alias of adres van de VPS (bv. "mijnvps" of "user@1.2.3.4")
#
# Optionele omgevingsvariabelen (met standaardwaarden):
#   VPS_PATH   Pad naar de app op de VPS           (standaard: ~/app)
#   DB_USER    PostgreSQL gebruiker                 (standaard: postgres)
#   DB_NAME    Naam van de database                 (standaard: wordt uitgelezen uit .env)
#
# Gebruik:
#   VPS_HOST=mijnvps npm run db:pull-prod
#   # of permanent instellen in je shell profile

set -euo pipefail

VPS_HOST="${VPS_HOST:-}"
VPS_PATH="${VPS_PATH:-~/app}"
DB_USER="${DB_USER:-postgres}"

# Lees DB_NAME uit lokale .env als niet opgegeven
if [ -z "${DB_NAME:-}" ]; then
  if [ -f ".env" ]; then
    DB_NAME=$(grep -E "^DATABASE_URL=" .env | sed 's/.*\/\([^?]*\).*/\1/' | head -1)
  fi
  DB_NAME="${DB_NAME:-dharma_db}"
fi

if [ -z "$VPS_HOST" ]; then
  echo ""
  echo "❌  Stel VPS_HOST in voordat je dit script uitvoert."
  echo ""
  echo "    Eenmalig:"
  echo "      export VPS_HOST=mijnvps          # SSH alias uit ~/.ssh/config"
  echo "      export VPS_HOST=user@1.2.3.4     # of direct adres"
  echo ""
  echo "    Of als prefix:"
  echo "      VPS_HOST=mijnvps npm run db:pull-prod"
  echo ""
  exit 1
fi

DUMP_FILE="sadhana-prod-$(date +%Y%m%d-%H%M).sql"

echo "📦  Dump maken op VPS ($VPS_HOST) — database: $DB_NAME"
ssh "$VPS_HOST" \
  "cd ${VPS_PATH} && docker compose exec -T db pg_dump -U ${DB_USER} --no-owner --no-acl --clean --if-exists ${DB_NAME}" \
  > "$DUMP_FILE"

SIZE=$(du -sh "$DUMP_FILE" | cut -f1)
echo "✅  Opgeslagen: $DUMP_FILE ($SIZE)"
echo ""
echo "Importeer lokaal met:"
echo "  npm run db:import-dump -- $DUMP_FILE"
