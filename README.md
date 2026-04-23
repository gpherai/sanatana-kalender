# Sanatana Kalender

> Persoonlijke spirituele kalender voor het bijhouden van Sanatana Dharma events, festivals en maanfasen.

## Beschrijving

Een Next.js applicatie voor het bijhouden van Hindu festivals, puja's, ekadashi's en andere spirituele gebeurtenissen. De app biedt:

- Kalenderweergave (maand/week/dag/agenda)
- Almanac maandoverzicht met maanfases, speciale dagen en events
- Volledig Vedisch panchanga (tithi, nakshatra, yoga, karana, vara) via Swiss Ephemeris
- Eerstvolgende maanopkomst en -ondergang op basis van huidige tijd
- **Kundali** — Jyotisha geboortehoroscoop met alle 9 navagrahas, lagna en nakshatra (Lahiri ayanamsa, Whole Sign huizen, Mean Node)
- iCal export — abonneer op de kalender vanuit Google Calendar, Apple Calendar etc.
- Categorisatie per godheid (Ganesha, Shiva, Krishna, etc.)
- Geavanceerd filteren en zoeken
- Meerdere thema's met dark mode — waaronder Bhairava Nocturne
- Locatie-gebaseerde astronomische berekeningen (Swiss Ephemeris)
- Parent-child event series (bijv. Navratri → 9 Navadurga dagen)

## Installatie

### Optie 1: Docker

```bash
git clone <repo-url>
cd sanatana-kalender

# Maak een .env bestand aan (zie Configuratie hieronder)
# Voeg toe voor prod-overrides (resource limits, log rotation, gesloten DB-poort):
#   COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml

docker compose up -d --build
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
npm run db:migrate           # Run Prisma migrations
npm run db:seed              # Seed: DailyInfo + categorieën + voorkeuren
npm run db:events            # Sync event-naming catalog → database
npm run db:occurrences       # Genereer EventOccurrence records (CLI, geen server nodig)
npm run db:cleanup           # Verwijder legacy events zonder namingKey
npm run db:setup             # Alles in één: seed + events + occurrences
npm run db:reset             # Hard reset + db:setup
npm run db:studio            # Open Prisma Studio GUI
```

Zie [docs/DATABASE_PROCEDURES.md](docs/DATABASE_PROCEDURES.md) voor volledige procedures.

## Architectuur

### Event Naming Catalog

`src/config/event-naming.ts` is de single source of truth voor event definities. Elk event heeft een `key` (stable `namingKey` identifier) en een `ruleConfig` die bepaalt wanneer het event valt (tithi, nakshatra, maas, etc.).

Het script `generate-events-from-naming.ts` synchroniseert de catalog naar de database.

### Parent-Child Series

Events staan in een hiërarchie via de `EventSeriesEntry` junction table (many-to-many). Zo kunnen de 9 Navadurga-godinnen zowel bij Chaitra Navratri als Sharad Navratri horen. In de events-lijst worden child events direct onder hun parent getoond.

### Event Pipeline (3 lagen)

```
src/config/event-naming.ts   ← catalog (pure data, type-safe ruleConfig)
        ↓ npm run db:events
src/scripts/generate-events-from-naming.ts  ← sync naar DB
        ↓ npm run db:occurrences
src/scripts/generate-occurrences.ts         ← genereer EventOccurrence records
```

Elke laag is onafhankelijk uitvoerbaar. Geen HTTP-server nodig.

### Recurrence Engine

`src/services/recurrence.service.ts` genereert `EventOccurrence` records op basis van een event's `recurrenceType` en `ruleConfig`:

- `YEARLY_LUNAR` — jaarlijks op een specifieke tithi (bijv. Krishna Chaturdashi)
- `MONTHLY_LUNAR` — maandelijks op een tithi (bijv. alle Ekadashi's = 24x per jaar)
- `YEARLY_SOLAR` — jaarlijks op een Sankranti
- `MONTHLY_SOLAR` — elke Sankranti (~12x per jaar)

De service delegeert core logica aan `src/engine/` — pure functies zonder DB-toegang (`computeTithiOccurrence`, `groupConsecutiveDays`, `selectFirstPerYear`). Die zijn unit-testbaar zonder database.

### Type-safe ruleConfig

`src/config/rule-config.types.ts` definieert TypeScript interfaces per `ruleType` (`TithiRuleConfig`, `SolarRuleConfig`, `NakshatraRuleConfig`, `WeekdayTithiRuleConfig`, etc.). `EventNaming` is een gediscrimineerde unie — de compiler checkt catalog-entries automatisch.

### Panchanga

`src/services/panchanga.service.ts` berekent dagelijkse Vedische data (tithi, nakshatra, yoga, karana, vara, maas, ayanamsa) via Swiss Ephemeris. Resultaten worden gecached in een in-memory LRU-cache — historische datums 24 uur, vandaag altijd vers berekend (maantijden zijn tijdgevoelig).

### Thema-systeem

Het theme system is Tailwind v4 native en gebruikt modulaire CSS:

- `src/config/themes.ts` bevat theme metadata voor Settings/runtime validatie.
- `src/app/globals.css` importeert Tailwind, base styles, utilities en theme CSS, en mappt semantic tokens naar Tailwind v4 `theme-*` utilities via `@theme inline`.
- `src/styles/base.css` bevat root variables, semantic tokens en dark-mode tokens.
- `src/styles/utilities.css` bevat aanvullende custom utilities zoals gradients,
  category utilities, forms, buttons en animaties.
- `src/styles/themes/standard.css` en `src/styles/themes/special/*.css` bevatten de echte theme styling.

Er is geen `generate:css` workflow meer. Wijzig theme styling direct in `src/styles/**` en houd metadata in `src/config/themes.ts` synchroon wanneer namen, labels of preview-kleuren veranderen.

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
│   │   ├── almanac/         # Almanac maandoverzicht
│   │   ├── events/          # Events overzichtspagina
│   │   ├── kundali/         # Jyotisha geboortehoroscoop
│   │   ├── settings/        # Instellingen
│   │   └── weer/            # Weerpagina
│   ├── components/
│   │   ├── almanac/         # MonthGrid, DayDetailsPanel, AlmanacFilters, MoonPhasesTimeline
│   │   ├── calendar/        # DharmaCalendar, EventDetailModal, EventCard
│   │   ├── events/          # EventCard, EventCardCompact
│   │   └── ui/              # TodayHero, MoonPhase, gedeelde componenten
│   ├── config/              # Configuratie (events, categorieën, thema's)
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── repositories/        # Data access layer (complexe query-constructie)
│   ├── scripts/             # TypeScript scripts (seed, generate, check)
│   ├── server/panchanga/    # Swiss Ephemeris engine + services
│   ├── services/            # Business logic (recurrence, panchanga service)
│   ├── styles/              # Tailwind v4 native theme CSS modules
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
| `/api/kundali` | POST | Jyotisha geboortehoroscoop (alle 9 navagrahas + lagna) |
| `/api/ical/export` | GET | iCal export van alle events (.ics) |

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

**Versie:** 0.12.0 | **Laatst bijgewerkt:** 11 april 2026
