# Sanatana Kalender

> Persoonlijke spirituele kalender voor het bijhouden van Sanatana Dharma events, festivals en maanfasen.

## Beschrijving

Een Next.js applicatie voor het beheren van Hindu festivals, puja's, ekadashi's en andere spirituele gebeurtenissen. De app biedt:

- Kalenderweergave (maand/week/dag/agenda)
- Maanfase tracking en zon/maan tijden
- Categorisatie per godheid (Ganesha, Shiva, Krishna, etc.)
- Geavanceerd filteren en zoeken
- Meerdere thema's met dark mode support
- Locatie-gebaseerde astronomische berekeningen (Swiss Ephemeris)
- Parent-child event series (bijv. Navratri → 9 Navadurga dagen)

## Installatie

### Optie 1: Docker

```bash
git clone <repo-url>
cd sanatana-kalender

# Maak een .env bestand aan (zie Configuratie hieronder)

# Development
docker-compose up -d --build

# Production
docker-compose -f docker-compose.prod.yml up -d --build
```

### Optie 2: Lokale Development

**Vereisten:** Node.js 24.x+, PostgreSQL 17+

```bash
git clone <repo-url>
cd sanatana-kalender

npm install

# Maak .env aan met DATABASE_URL (zie Configuratie)

npm run db:generate
npm run db:push
npm run db:seed
# Genereer events en occurrences (zie commando's hieronder)

npm run dev
```

## Configuratie

### Environment Variables

| Variabele | Verplicht | Beschrijving |
|-----------|-----------|--------------|
| `DATABASE_URL` | Ja | PostgreSQL connection string |
| `NODE_ENV` | Nee | `development` / `production` |
| `POSTGRES_USER` | Docker | Database gebruiker |
| `POSTGRES_PASSWORD` | Docker | Database wachtwoord |
| `POSTGRES_DB` | Docker | Database naam |

Connection string format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

## Commando's

### Development

```bash
npm run dev          # Start dev server op http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run unit tests
npm run validate     # Format check + lint + type check
```

### Database

```bash
npm run db:generate          # Regenereer Prisma client
npm run db:push              # Push schema changes naar database
npm run db:seed              # Seed database (categorieën)
npm run db:studio            # Open Prisma Studio GUI
npm run db:reset             # Reset en reseed database
```

### Events & Occurrences

```bash
# Genereer/update events uit de naming catalog (src/config/event-naming.ts)
npx tsx --tsconfig tsconfig.json src/scripts/generate-events-from-naming.ts

# Genereer occurrences voor alle events via API
curl -X POST http://localhost:3000/api/events/generate-occurrences \
  -H "Content-Type: application/json" \
  -d '{"replace": true}'
```

Zie [docs/DATABASE_PROCEDURES.md](docs/DATABASE_PROCEDURES.md) voor volledige procedures.

## Architectuur

### Event Naming Catalog

`src/config/event-naming.ts` is de single source of truth voor event definities. Elk event heeft een `key` (stable `namingKey` identifier) en een `ruleConfig` die bepaalt wanneer het event valt (tithi, nakshatra, maas, etc.).

Het script `generate-events-from-naming.ts` synchroniseert de catalog naar de database.

### Parent-Child Series

Events staan in een hiërarchie via de `EventSeriesEntry` junction table (many-to-many). Zo kunnen de 9 Navadurga-godinnen zowel bij Chaitra Navratri als Sharad Navratri horen. In de events-lijst worden child events direct onder hun parent getoond.

### Recurrence Engine

`src/services/recurrence.service.ts` genereert `EventOccurrence` records op basis van een event's `recurrenceType` en `ruleConfig`:

- `YEARLY_LUNAR` — jaarlijks op een specifieke tithi (bijv. Krishna Chaturdashi)
- `MONTHLY_LUNAR` — maandelijks op een tithi (bijv. alle Ekadashi's = 24x per jaar)
- `YEARLY_SOLAR` — jaarlijks op een Sankranti of vaste datum

### Panchanga

`src/services/panchanga.service.ts` berekent dagelijkse lunaire data (tithi, nakshatra, maas, paksha) via Swiss Ephemeris. De `DailyInfo` tabel slaat dit op als cache.

## Project Structuur

```
sanatana-kalender/
├── docs/                    # Documentatie & ADRs
├── prisma/
│   └── schema.prisma        # Database schema
├── scripts/                 # Shell scripts (backup)
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API endpoints
│   │   ├── events/          # Events overzichtspagina
│   │   └── settings/        # Instellingen
│   ├── components/          # React components
│   ├── config/              # Configuratie (events, categorieën, thema's)
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── scripts/             # TypeScript scripts (seed, generate, check)
│   ├── services/            # Business logic (recurrence, panchanga)
│   └── types/               # TypeScript types
├── docker-compose.yml
├── docker-compose.prod.yml
└── Dockerfile
```

## API

| Endpoint | Methode | Beschrijving |
|----------|---------|--------------|
| `/api/health` | GET | Health check + DB latency |
| `/api/events` | GET | Alle events met occurrences |
| `/api/events/[id]` | GET/PUT/DELETE | Individueel event |
| `/api/events/generate-occurrences` | POST | Genereer/vervang occurrences |
| `/api/categories` | GET | Alle categorieën |
| `/api/daily-info` | GET | Dagelijkse panchanga data |
| `/api/preferences` | GET/PUT | Gebruikersvoorkeuren |
| `/api/themes` | GET | Beschikbare thema's |

## Tech Stack

| Technologie | Versie | Doel |
|-------------|--------|------|
| Next.js | 16.x | Framework |
| React | 19.x | UI Library |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 4.x | Styling |
| Prisma | 7.x | ORM |
| PostgreSQL | 17+ | Database |
| Swiss Ephemeris | 0.5.x | Astronomische berekeningen |
| react-big-calendar | 1.x | Kalenderweergave |
| Zod | 4.x | Validatie |

## Documentatie

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technische architectuur
- [docs/DATABASE_PROCEDURES.md](docs/DATABASE_PROCEDURES.md) — Database procedures (seed, reset, generate)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — VPS deployment guide
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — Ontwikkelingsgeschiedenis
- [docs/TODO.md](docs/TODO.md) — Roadmap

## Licentie

Private project — Alle rechten voorbehouden.

---

**Versie:** 0.10.0 | **Laatst bijgewerkt:** 18 maart 2026
