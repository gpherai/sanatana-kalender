#!/usr/bin/env bash
# Importeert een lokale SQL dump in de lokale Docker database.
#
# Gebruik:
#   npm run db:import-dump -- sadhana-prod-20260418-1230.sql
#   npm run db:import-dump              # pakt automatisch de nieuwste dump

set -euo pipefail

DUMP_FILE="${1:-}"

# Lees DB_USER uit lokale .env als niet opgegeven
if [ -z "${DB_USER:-}" ]; then
  if [ -f ".env" ]; then
    DB_USER=$(grep -E "^POSTGRES_USER=" .env | cut -d= -f2 | tr -d '"')
  fi
  DB_USER="${DB_USER:-postgres}"
fi

# Lees DB_NAME uit lokale .env als niet opgegeven
if [ -z "${DB_NAME:-}" ]; then
  if [ -f ".env" ]; then
    DB_NAME=$(grep -E "^DATABASE_URL=" .env | sed 's/.*\/\([^?]*\).*/\1/' | head -1)
  fi
  DB_NAME="${DB_NAME:-dharma_db}"
fi

# Auto-detecteer nieuwste dump als geen bestand opgegeven
if [ -z "$DUMP_FILE" ]; then
  DUMP_FILE=$(ls -t sadhana-prod-*.sql 2>/dev/null | head -1 || true)
fi

if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo ""
  echo "❌  Geen dump gevonden."
  echo "    Download eerst: npm run db:pull-prod"
  echo "    Of geef een bestand op: npm run db:import-dump -- bestand.sql"
  echo ""
  exit 1
fi

if [ ! -s "$DUMP_FILE" ]; then
  echo ""
  echo "❌  Dumpbestand is leeg: $DUMP_FILE"
  echo "    Import afgebroken om dataverlies door een kapotte dump te voorkomen."
  echo ""
  exit 1
fi

echo ""
echo "⚠️   Dit overschrijft de lokale database ($DB_NAME) met:"
echo "    $DUMP_FILE"
echo ""
read -rp "Doorgaan? [j/N] " confirm
if [[ "$confirm" != "j" && "$confirm" != "J" ]]; then
  echo "Geannuleerd."
  exit 0
fi

echo ""
echo "📥  Importeren..."
if command -v docker &>/dev/null && docker compose ps db &>/dev/null 2>&1; then
  docker compose exec -T db psql -U "$DB_USER" "$DB_NAME" < "$DUMP_FILE"
else
  psql -h localhost -U "$DB_USER" "$DB_NAME" < "$DUMP_FILE"
fi

echo ""
echo "✅  Import klaar!"
echo "    Start de app: npm run dev"
