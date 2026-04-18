#!/usr/bin/env bash
# Haalt een database dump op van de VPS en slaat hem lokaal op.
#
# Vereiste omgevingsvariabele:
#   VPS_HOST      SSH alias of adres van de VPS (bv. "mijnvps" of "user@1.2.3.4")
#
# Optionele omgevingsvariabelen (met standaardwaarden):
#   VPS_SSH_PORT  SSH poort van de VPS                (standaard: 22)
#   VPS_PATH      Pad naar de app op de VPS           (standaard: ~/app)
#   DB_USER       PostgreSQL gebruiker                 (standaard: postgres)
#   DB_NAME       Naam van de database                 (standaard: uitgelezen uit .env)
#
# Gebruik:
#   VPS_HOST=1.2.3.4 VPS_SSH_PORT=2222 npm run db:pull-prod
#
# Of zet het eenmalig in je shell profile (~/.zshrc of ~/.bashrc):
#   export VPS_HOST=1.2.3.4
#   export VPS_SSH_PORT=2222

set -euo pipefail

VPS_HOST="${VPS_HOST:-}"
VPS_SSH_PORT="${VPS_SSH_PORT:-22}"
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
  echo "    Voorbeeld (poort 22 is standaard):"
  echo "      export VPS_HOST=1.2.3.4"
  echo "      export VPS_SSH_PORT=2222        # alleen nodig als SSH niet op poort 22 staat"
  echo "      npm run db:pull-prod"
  echo ""
  echo "    Of zet een alias in ~/.ssh/config:"
  echo "      Host mijnvps"
  echo "        HostName 1.2.3.4"
  echo "        Port 2222"
  echo "        User ubuntu"
  echo "    Dan: export VPS_HOST=mijnvps"
  echo ""
  exit 1
fi

DUMP_FILE="sadhana-prod-$(date +%Y%m%d-%H%M).sql"

echo "📦  Dump maken op VPS ($VPS_HOST:$VPS_SSH_PORT) — database: $DB_NAME"
ssh -p "$VPS_SSH_PORT" "$VPS_HOST" \
  "cd ${VPS_PATH} && docker compose exec -T db pg_dump -U ${DB_USER} --no-owner --no-acl --clean --if-exists ${DB_NAME}" \
  > "$DUMP_FILE"

SIZE=$(du -sh "$DUMP_FILE" | cut -f1)
echo "✅  Opgeslagen: $DUMP_FILE ($SIZE)"
echo ""
echo "Importeer lokaal met:"
echo "  npm run db:import-dump -- $DUMP_FILE"
