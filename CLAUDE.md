# Dharma Calendar — Claude Context

## Stack
- Next.js 16, React 19, Prisma 7, Tailwind 4, Zod 4, Luxon
- PostgreSQL via Docker lokaal (ontwikkeling)
- VPS deployment via Docker Compose, app op poort 53100

## Deployment conventions
- VPS app poort: 53100 (app VPN range)
- `docker compose` (v2 syntax, geen koppelteken)
- Migrate service via builder stage vóór app start
- `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` staat in `.env` op VPS — prod-overrides (geen extern DB-poort, log rotation, resource limits) worden zo automatisch geladen

## Docker build
- Node gepind op `24.14.1-alpine` — niet upgraden zonder recompilatie te budgetteren (swisseph native ~300s)
- Floating tags (`node:24-alpine`) invalideren de deps-laag bij elke Docker Hub update

## Migrate troubleshooting
- Fout `42710 type already exists` of `42P07 table already exists`: schema bestaat al via `db push`. Fix: `docker compose run --rm migrate npx prisma migrate resolve --applied <migration_name>`, daarna `docker compose up -d`
