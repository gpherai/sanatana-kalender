# 🗏️ Dharma Calendar - Architecture Document

> **Versie:** 4.8
> **Laatst bijgewerkt:** 17 april 2026

---

## 1. Project Overzicht

### 1.1 Beschrijving

Dharma Calendar is een persoonlijke web applicatie voor het bijhouden van Sanatana Dharma events, festivals en maanfasen. De app biedt een spirituele kalender met ondersteuning voor het Hindoe maankalender systeem (Tithi, Nakshatra, Paksha, Maas).

### 1.2 Doelstellingen

- Persoonlijke spirituele kalender voor dagelijks gebruik
- Bijhouden van festivals, puja's, ekadashi en andere belangrijke dagen
- Visualisatie van maanfasen en zon/maan tijden
- Panchang Almanac met speciale lunaire dagen
- Eenvoudig events beheren (toevoegen, bewerken, verwijderen)
- Sadhana tracker voor mantra japa, parayana en meditatie sessies
- Encyclopedie van Sanatana Dharma met MDX-artikelen en zoekmogelijkheid
- Meerdere visuele thema's voor persoonlijke voorkeur

### 1.3 Scope & Beperkingen

| Aspect | Huidige Scope | Toekomstige Mogelijkheid |
|--------|---------------|--------------------------|
| Gebruikers | Single-user | Multi-user met authenticatie |
| Deployment | VPS met Docker | Multi-instance / cloud |
| Data source | Handmatige invoer + berekening | Panchang API integratie |
| Taal | Nederlands/Engels | Meertalig (i18n) |
| Locatie | Den Haag (standaard) | Instelbare locatie |

---

## 2. System Architecture

### 2.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Home   │  │ Almanac  │  │ Settings │  │ Sadhana  │          │
│  │   Page   │  │   Page   │  │   Page   │  │  Tracker │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
└───────┼─────────────┼─────────────┼──────────────┼───────────────┘
        │             │             │              │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Routes                            │    │
│  │   /api/events  /api/categories  /api/daily-info          │    │
│  │   /api/sadhana/sessions  /api/sadhana/practices  ...    │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                   Service Layer                          │    │
│  │     panchangaService + recurrenceService                 │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                   Prisma ORM                             │    │
│  └──────────────────────────┬───────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │    Database     │
                    └─────────────────┘
```

### 2.2 Tech Stack

| Laag | Technologie | Versie | Doel |
|------|-------------|--------|------|
| **Runtime** | Node.js | 24+ LTS | Server runtime (v24.0.0+, LTS vanaf okt 2025) |
| **Frontend** | Next.js (App Router) | 16.2.x | Server-side rendering, routing |
| **UI Framework** | React | 19.2.x | Component-based UI |
| **Styling** | Tailwind CSS | 4.2.x | Utility-first CSS |
| **Kalender** | react-big-calendar | 1.19.x | Kalender weergave |
| **Database** | PostgreSQL | 17+ | Data opslag |
| **ORM** | Prisma (+ adapter-pg) | 7.5.x | Database toegang |
| **Validatie** | Zod | 4.3.x | Schema validatie |
| **Datum/Tijd** | date-fns, luxon | 4.1.x, 3.7.x | Datum manipulatie |
| **Astronomie** | Swiss Ephemeris (swisseph) | 0.5.x | Vedische astronomie (Tithi, Nakshatra, Yoga, Karana) |
| **Taal** | TypeScript | 5.x | Type safety (ES2022 target) |
| **Accessibility** | focus-trap-react | 12.0.x | Modal focus management |
| **Icons** | lucide-react | 0.577.x | UI iconen |
| **Utilities** | tailwind-merge, clsx | 3.5.x, 2.1.x | Class utilities |
| **Code Quality** | Husky, lint-staged | 9.x, 16.x | Pre-commit hooks |

### 2.3 Project Structuur

Tests staan **co-located** als `__tests__/` subfolder naast de source. Ze zijn hieronder weggelaten voor leesbaarheid; elke module heeft er één.

```
dharma-calendar/
├── _dev/                      # Lokale ad-hoc scripts (gitignored, inhoud wisselt)
├── docs/                      # Documentatie
│   ├── ARCHITECTURE.md        # Technische architectuur (dit document)
│   ├── CHANGELOG.md           # Ontwikkelingslog
│   ├── DEPENDENCIES.md        # Dependency documentatie
│   ├── DEPLOYMENT.md          # Deployment handleiding
│   └── TODO.md                # Roadmap en taken
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migraties
├── scripts/
│   ├── backup-db.sh           # Database backup (Linux/Mac)
│   ├── backup.bat             # Database backup (Windows batch)
│   ├── backup.ps1             # Database backup (Windows PowerShell)
│   ├── backup.sh              # Database backup wrapper script
│   └── docker-entrypoint.sh   # Docker container startup script
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout + theme init script + providers
│   │   ├── page.tsx           # Homepage (TodayHero + kalender + sidebar)
│   │   ├── globals.css        # Gegenereerde theme CSS + base styles
│   │   ├── api/               # API routes (/events, /daily-info, /weer, etc.)
│   │   │   └── sadhana/       # Sadhana CRUD API (/practices, /sessions, /goals, /stats/*)
│   │   ├── almanac/           # Almanac route (layout + page)
│   │   ├── events/            # Events routes (overview / new / [id])
│   │   ├── sadhana/           # Sadhana tracker route (layout + page)
│   │   ├── settings/          # Settings route (layout + page, auto-save)
│   │   ├── encyclopedie/      # Encyclopedie route (page + [slug] dynamische artikelen)
│   │   └── weer/              # Weer dashboard route (layout + page)
│   ├── components/            # React componenten
│   │   │   ├── almanac/           # AlmanacFilters, AlmanacHeader, DayDetailsPanel,
│   │   │   │                  #   MonthGrid, MoonPhasesTimeline + index.ts barrel
│   │   ├── calendar/          # DharmaCalendar, EventDetailModal, CalendarToolbar
│   │   ├── events/            # EventCard, EventForm
│   │   ├── filters/           # FilterSidebar + index.ts barrel
│   │   ├── layout/            # PageLayout + index.ts barrel
│   │   ├── sadhana/           # Sadhana Tracker module
│   │   │   ├── index.ts       # Barrel export (SadhanaTracker)
│   │   │   ├── types.ts       # Shared types + apiFetch + fetchDayInfoMap + helpers
│   │   │   ├── SadhanaTracker.tsx  # Root component (state, data fetching, layout)
│   │   │   ├── StatCard.tsx   # Statistiek kaart (waarde, sub, progress bar)
│   │   │   ├── Heatmap.tsx    # Activiteitsheatmap + buildHeatmap()
│   │   │   ├── SessionCard.tsx    # Sessie weergave (expand, edit, delete)
│   │   │   ├── SessionForm.tsx    # Sessie formulier (nieuw/bewerken)
│   │   │   ├── GoalPanel.tsx  # Doelen CRUD
│   │   │   └── PracticesPanel.tsx # Beoefeningen CRUD
│   │   ├── settings/          # ThemeSection, CalendarSection, LocationSection
│   │   │   │                  #   + index.ts barrel
│   │   ├── theme/             # ThemeProvider, ColorModeToggle
│   │   └── ui/                # Header, Toast, Section, MoonPhase, TodayHero
│   ├── config/                # Type-safe configuratie
│   │   ├── categories.ts
│   │   ├── event-naming.ts    # Eventcatalogus (164 entries)
│   │   ├── rule-config.types.ts  # Typed ruleConfig interfaces per ruleType
│   │   └── themes.ts          # ENIGE bron voor thema-definities
│   ├── engine/                # Pure recurrence helpers (geen DB-toegang)
│   │   ├── index.ts           # Barrel: exporteert types + helpers
│   │   ├── tithi-helpers.ts   # groupConsecutiveDays, computeTithiOccurrence,
│   │   │                      #   isPredecessorEndsAfterSunrise,
│   │   │                      #   isNishitakalDateShiftNeeded, selectFirstPerYear
│   │   └── types.ts           # DailyInfoRow, GeneratedOccurrence, PrevDayInfo
│   ├── hooks/                 # useFetch, useDebounce, useFilters
│   ├── lib/                   # Utilities + domeinconstanten
│   │   ├── api-response.ts    # Gestandaardiseerde API responses
│   │   ├── category-styles.ts # Kleur/icoon mapping voor categorieën
│   │   ├── date-utils.ts      # isSameDay, formatDateNL, parseCalendarDate, ...
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── encyclopedia.ts     # Encyclopedie: deity-entries, groepen, MDX artikelen
│   │   ├── domain.ts          # Single source of truth voor UI-domeinconstanten
│   │   ├── env.ts             # Zod environment validatie
│   │   ├── moon-phases.ts     # getMoonPhaseEmoji, getMoonPhaseName, ...
│   │   ├── panchanga-helpers.ts  # UI-transformaties voor panchanga data
│   │   ├── patterns.ts        # Gecentraliseerde regex patterns
│   │   ├── timing-utils.ts    # parseTimeToMinutes, calculateNishitaKaal, ...
│   │   ├── utils.ts           # logError/logWarn/logDebug, classNames
│   │   └── validations.ts     # Gedeelde Zod schemas
│   ├── repositories/          # Query-constructie voor complexe filters
│   │   └── event.repository.ts  # buildEventWhere, findEventOccurrences
│   ├── scripts/               # Applicatie build/seed scripts
│   │   ├── seed.ts                          # Infrastructuur: DailyInfo + categorieën
│   │   ├── seed-helpers.ts                  # Enum mapping helpers voor seed.ts
│   │   ├── generate-events-from-naming.ts   # Sync catalog → Event records
│   │   ├── generate-occurrences.ts          # CLI: genereer EventOccurrence records
│   │   ├── cleanup-legacy-events.ts         # Eenmalig: verwijder orphan events
│   │   └── generate-theme-css.ts            # Theme CSS generator
│   ├── server/panchanga/      # Swiss Ephemeris serverlaag (server-only)
│   │   ├── index.ts           # Barrel export
│   │   ├── constants.ts       # Ephemeris flags, ayanamsa, lokale constanten
│   │   ├── types.ts           # PanchangaResult, LocationConfig, BirthData, BirthChart, ...
│   │   ├── services/
│   │   │   ├── panchanga-swiss-service.ts  # Low-level Swiss Ephemeris wrapper (panchanga)
│   │   │   └── birth-chart-service.ts      # Jyotisha geboortehoroscoop (navagrahas, lagna)
│   │   └── utils/
│   │       └── astro.ts       # calculateSunriseSunset, findEventEnd, ...
│   ├── services/              # Businesslogica (server-only)
│   │   ├── index.ts           # Barrel export
│   │   ├── panchanga.service.ts   # LRU-cached wrapper voor PanchangaSwissService
│   │   └── recurrence.service.ts  # Recurrence generatie (strategy registry)
│   └── types/                 # Gedeelde TypeScript types
│       ├── index.ts           # Barrel export
│       ├── api.ts             # API response types
│       ├── calendar.ts        # Kalender-specifieke types
│       └── weather.ts         # Weerdata types
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
├── vitest.config.ts           # Test configuratie (Vitest, v8 coverage)
└── README.md
```

### 2.4 Script Directory Conventions

Het project heeft **drie verschillende script directories** met distinct purposes:

| Directory | Purpose | Git Tracked | Wanneer gebruiken |
|-----------|---------|-------------|-------------------|
| **`/_dev/`** | Tijdelijke development & debugging scripts | ❌ No (.gitignore) | Ad-hoc database audits, one-off migrations, local testing |
| **`/scripts/`** | DevOps & deployment scripts | ✅ Yes | Production backups, Docker entrypoints, deployment automation |
| **`/src/scripts/`** | Application build scripts | ✅ Yes | Theme CSS generation, database seeding, production builds |

**`/_dev/` - Development Sandbox (Not in Git)**

```bash
# Purpose: Tijdelijke ad-hoc scripts voor debugging en development
# ⚠️  Scripts hier kunnen onveilige database operaties uitvoeren
# ✅  Safe voor local development, NIET voor production

_dev/
├── check-events.ts        # Voorbeeld lokaal hulpscript
└── ...                    # Overige lokale scripts (niet in git)

# Gebruik:
npx tsx _dev/<script>.ts
node _dev/<script>.mjs
```

**`/scripts/` - DevOps Scripts (Production Safe)**

```bash
# Purpose: Production-ready deployment en backup scripts
# ✅  Safe voor production gebruik
# ✅  Version controlled (git)

scripts/
├── backup-db.sh           # PostgreSQL backup (Linux/Mac)
├── backup.bat             # PostgreSQL backup (Windows)
├── backup.ps1             # PostgreSQL backup (PowerShell)
└── docker-entrypoint.sh   # Docker container initialization

# Gebruik:
./scripts/backup-db.sh
docker run ... # Uses docker-entrypoint.sh
```

**`/src/scripts/` - Application Build Scripts**

```bash
# Purpose: Applicatie build en seeding scripts
# ✅  Part van applicatie codebase
# ✅  Called by npm scripts

src/scripts/
├── seed.ts                          # Infrastructuur: DailyInfo + categorieën + voorkeuren
├── seed-helpers.ts                  # Enum mapping helpers voor seed.ts
├── generate-events-from-naming.ts   # Sync event-naming catalog → database (db:events)
├── generate-occurrences.ts          # CLI: genereer EventOccurrence records (db:occurrences)
├── cleanup-legacy-events.ts         # Eenmalig: verwijder autoGenerated=false orphans (db:cleanup)
└── generate-theme-css.ts            # Theme CSS generation (prebuild)

# Gebruik (via package.json):
npm run db:seed          # Stap 1: infrastructuur
npm run db:events        # Stap 2: catalog → DB
npm run db:occurrences   # Stap 3: occurrences genereren (geen server nodig)
npm run db:setup         # Alles in één: seed + events + occurrences
npm run generate:css
```

**Waarom deze scheiding?**

- ✅ **Clear separation:** Development vs Production vs Build
- ✅ **Git hygiene:** Tijdelijke scripts niet in version control
- ✅ **Safety:** Production scripts zijn reviewed en safe
- ✅ **Discoverability:** Developers weten waar scripts te vinden/plaatsen

---

## 2.5 Event Pipeline

De event-pipeline bestaat uit drie onafhankelijke lagen:

```
┌─────────────────────────────────────────────────────────────────┐
│  src/config/event-naming.ts                                      │
│  Event Catalog — 164 entries, pure data                          │
│  Type-safe ruleConfig via rule-config.types.ts                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ npm run db:events
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/scripts/generate-events-from-naming.ts                      │
│  Sync catalog → Event records in database                        │
│  Stabiele namingKey voorkomt duplicaten bij hernoeming           │
└──────────────────────┬──────────────────────────────────────────┘
                       │ npm run db:occurrences
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/scripts/generate-occurrences.ts                             │
│  Genereer EventOccurrence records (CLI, geen HTTP-server nodig)  │
│  Roept recurrenceService aan via Prisma                          │
└─────────────────────────────────────────────────────────────────┘
```

### Recurrence Service + Pure Engine

`recurrence.service.ts` is verantwoordelijk voor de DB-queries en orchestratie.
De core matching-logica is geëxtraheerd naar `src/engine/` als **pure functies** zonder DB-toegang:

| Functie | Beschrijving |
|---------|-------------|
| `groupConsecutiveDays` | Groepeert opeenvolgende days met dezelfde tithi tot één window |
| `selectFirstPerYear` | Pikt de eerste dag per jaar (of per jaar+maas voor multi-maas events) |
| `computeTithiOccurrence` | Berekent startTime/endDate voor één tithi window, detecteert avondstart |
| `isPredecessorEndsAfterSunrise` | Kshaya-tithi detectie: eindigt vorige tithi na zonsopgang? |
| `isNishitakalDateShiftNeeded` | Nishitakal-regel: verschuift festivaldag naar de nacht waarvan de Nishitakal de tithi bevat (minimaal 1 muhurta voor aanvang); gebruikt door `nishitakalDateRule: true` events |
| `isConsecutiveDay` | UTC-correcte consecutiviteitscheck |

**Voordeel:** Engine-functies zijn unit-testbaar zonder database of Prisma.

**`PrevDayInfo` type (engine/types.ts):**

```typescript
interface PrevDayInfo {
  tithiEndTime: string | null;  // Wanneer vorige tithi eindigde (= start huidige tithi)
  sunrise: string | null;       // Zonsopgang van de vorige dag
  sunset?: string | null;       // Zonsondergang van de vorige dag (vereist voor Nishitakal-regel)
}
```

Het `sunset` veld is optioneel om terugwaartse compatibiliteit te bewaren; `isNishitakalDateShiftNeeded` retourneert `false` als het ontbreekt.

### Type-safe ruleConfig

`src/config/rule-config.types.ts` definieert TypeScript interfaces per `ruleType`:

```typescript
// EventNaming is een discriminated union:
// als ruleType = "TITHI"      → ruleConfig: TithiRuleConfig
// als ruleType = "SOLAR"      → ruleConfig: SolarRuleConfig
// als ruleType = "WEEKDAY_TITHI" → ruleConfig: WeekdayTithiRuleConfig
// etc.
```

De compiler checkt automatisch elke catalog-entry. Typo's in `tithi`, `maas`, of `sankranti` zijn compile-time errors.

### Geavanceerde ruleConfig flags

Buiten de getypeerde interfaces in `rule-config.types.ts` bestaan een aantal **runtime flags** die via `as Record<string, unknown>` worden gelezen door de recurrence service. Ze zijn opzettelijk uit de strict-typed interfaces gelaten omdat ze zelden voorkomen.

| Flag | Op welk ruleType | Beschrijving |
|------|-----------------|--------------|
| `nishitakalDateRule: true` | TITHI | Overschrijft de standaard VRAT-logica. Wijst het festival toe aan de dag waarvan de **Nishitakal** (Hindoe middernacht) de tithi bevat — maar alleen als de tithi minstens 1 muhurta (≈ nachtduur / 15 min) vóór Nishitakal begon. Voorbeeld: Vaikuntha Chaturdashi. |
| `maargazhiRule: true` | NAKSHATRA | Beperkt NAKSHATRA-matches tot het datumvenster **14 dec – 15 jan** (de Dhanu zonnemaand, "Maargazhi"). Geen per-jaar deduplicatie: sommige jaren hebben 0 of 2 occurrences. Voorbeeld: Arudra Darshan. |

**`includeAdhika` op EventNaming-niveau:**

```typescript
{
  key: "kartik_kartik_purnima",
  includeAdhika: true,   // Staat ook de Adhika-maas-variant toe bij het zoeken
  ruleConfig: { tithi: "PURNIMA", maas: "KARTIK" },
}
```

Standaard (`false`) filtert de recurrence service op `isAdhika=false` in DailyInfo. Met `true` worden Adhika-maas-rijen wél meegenomen zodat de vroegere occurrence (in de Adhika-KARTIK) wordt gevonden vóór de reguliere (Nija) maand.

**`PHASE_CORRECTION_TITHI` (interne kaart in recurrence.service.ts):**

Verschuift de occurrence-datum van tithidag naar astronomisch hoogtepunt (volle of nieuwe maan). Bevat bewust **geen** PURNIMA — DrikPanchang gebruikt voor Purnima de strikte tithi-at-sunrise-regel, niet de astronomische volle maan. Alleen `AMAVASYA` staat in de kaart.

---

## 3. Design Principes

### 3.1 Single Source of Truth

Alle configuratie en constanten komen uit één bron. Nooit hardcoded waarden in componenten.

```
✅ GOED: Waarde uit config/constants halen
❌ FOUT: Waarde direct in component typen
```

**Toepassingen:**
- Event types, recurrence, tithi/nakshatra/maas/sankranti en default locatie → `src/lib/domain.ts`
- Thema's → `THEME_CATALOG` in `src/config/themes.ts`
- Categoriecatalogus → `src/config/categories.ts`
- Eventcatalogus → `src/config/event-naming.ts`

### 3.2 Barrel Exports

Barrel exports worden **selectief** gebruikt, niet in elke map.

**Huidige barrels in de codebase:**
- `src/components/almanac/index.ts`
- `src/components/filters/index.ts`
- `src/components/layout/index.ts`
- `src/components/sadhana/index.ts`
- `src/components/settings/index.ts`
- `src/types/index.ts`

**Praktijk:**
- Waar een barrel bestaat: gebruik de module-import (bijv. `@/components/layout`)
- Waar geen barrel bestaat: importeer direct uit het bestand (bijv. `@/components/calendar/DharmaCalendar`)

### 3.3 Type Safety

TypeScript wordt strikt gebruikt. Geen `as any` casts die type checking omzeilen.

**Aanpak:**
- Zod schemas voor runtime validatie
- Prisma generated types voor database
- Dynamic TypeScript types vanuit constants
- Native Prisma enums voor database-level type safety

#### 3.3.1 Dynamic Type Generation

Types worden automatisch gegenereerd vanuit constants voor synchronisatie:

```typescript
// domain.ts - Single source of truth voor UI domeinconstanten
export const EVENT_TYPES = [
  { value: 'FESTIVAL', label: 'Festival', icon: '🎉' },
  { value: 'PUJA', label: 'Puja', icon: '🙏' },
  // ...
] as const

// Type automatisch gegenereerd
export type EventTypeValue = typeof EVENT_TYPES[number]['value']
// Result: 'FESTIVAL' | 'PUJA' | ...
```

#### 3.3.2 Zod 4 API

Zod 4 heeft nieuwe top-level validators:

```typescript
import { z } from "zod";

// Zod 4 - Nieuwe API
const emailSchema = z.email();           // Was: z.string().email()
const uuidSchema = z.uuidv4();           // Was: z.string().uuid()
const urlSchema = z.url();               // Was: z.string().url()

// Error handling
try {
  schema.parse(data);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log(err.issues);  // Let op: .issues niet .errors
  }
}
```

### 3.4 Conditional Logging

Logging alleen in development via utility functies:

```typescript
import { logError, logWarn, logDebug } from "@/lib/utils";

// Alleen output in NODE_ENV === "development"
logError("Failed to fetch", error);
logWarn("Deprecated API used");
logDebug("Loaded items", count);
```

### 3.5 Date Handling Strategy (Calendar Dates vs Timestamps)

**KRITIEK ONDERSCHEID:** Calendar events gebruiken **pure dates** (geen timezone conversie), timestamps gebruiken **UTC**.

#### 3.5.1 Centralized Date Utilities

Alle date operaties zijn gecentraliseerd in `src/lib/date-utils.ts` voor consistentie en herbruikbaarheid:

**Beschikbare functies:**

| Categorie | Functies | Gebruik |
|-----------|----------|---------|
| **Comparison** | `isSameDay()`, `isToday()`, `isWeekend()` | Date vergelijking (UTC-based) |
| **Calendar** | `getMonthDays()`, `getMonthStartPadding()` | Kalender grid berekeningen |
| **Formatting** | `formatDateISO()`, `formatDateNL()`, `formatTimeAgo()`, `formatDateLocal()` | Datum/tijd display |
| **Parsing** | `parseCalendarDate()`, `parseLocalDate()` | String → Date object |

Maanfase functies staan in `src/lib/moon-phases.ts` (zie sectie hieronder).

**Voordelen:**
- ✅ Single source of truth voor date operaties
- ✅ Consistent UTC handling
- ✅ Type-safe met JSDoc documentatie
- ✅ Tree-shakeable exports

**Gebruik:**
```typescript
import { isSameDay, getMonthDays, formatTimeAgo } from "@/lib/date-utils";

// Date comparison (UTC)
if (isSameDay(date1, date2)) { ... }

// Calendar grid
const days = getMonthDays(2025, 0); // January 2025

// Time formatting
const timeStr = formatTimeAgo("14:30", now); // "over 4u 30m"
```

#### 3.5.1b Moon Phase Utilities

Alle maanfase logica is gecentraliseerd in `src/lib/moon-phases.ts`:

| Categorie | Functies | Gebruik |
|-----------|----------|---------|
| **Exact mapping helpers** | `getMoonPhaseEmoji(pct, waxing)`, `getMoonPhaseType()`, `getMoonPhaseName(type)` | Server-side transformatie van Swiss Ephemeris output (o.a. `/api/daily-info`) |

```typescript
// Server-side: transformatie van exacte Swiss Ephemeris data
import { getMoonPhaseEmoji, getMoonPhaseName } from "@/lib/moon-phases";
const emoji = getMoonPhaseEmoji(illuminationPct, panchanga.moon.waxing);
```

Clientcomponenten (zoals `DharmaCalendar`) gebruiken de maanfase-data uit `/api/daily-info` in plaats van aparte approximatiefuncties.

#### 3.5.2 Calendar Dates (voor Events)

**Gebruik:** EventOccurrence.date, DailyInfo.date - dagen waarop iets plaatsvindt

**Best Practice:**
```typescript
// ✅ CORRECT: parseCalendarDate voor kalender events
import { parseCalendarDate } from "@/lib/date-utils";
date: parseCalendarDate("2025-01-01")  // → UTC-midnight voor stabiele @db.Date opslag
```

**Waarom UTC-midnight + geen locale date parsing:**
- Kalenderdagen moeten stabiel blijven (bijv. "2025-01-01" blijft "2025-01-01")
- Locale parsing + timezone-conversie kan dagverschuiving geven (31 dec ↔ 1 jan)
- PostgreSQL `DATE` heeft geen timezone; daarom is consistente normalisatie cruciaal

**Database:** `@db.Date` (pure date, YYYY-MM-DD)

#### 3.5.3 Timestamps (voor Exacte Momenten)

**Gebruik:** Sunrise/sunset tijden, tithi eindtijden, server logs

**Best Practice:**
```typescript
// Voor exacte momenten MET tijd
sunrise: "06:30"  // Opgeslagen als string (HH:mm) + location context
```

**Toekomstig:** Voor volledige timestamps: ISO 8601 met timezone

#### 3.5.4 Implementatie Regels

| Scenario | Type | Functie | Database Type |
|----------|------|---------|---------------|
| Event op datum | Calendar Date | `parseCalendarDate()` | `@db.Date` |
| Lokale "vandaag" / API stats | Local Date | `parseLocalDate()` / `formatDateLocal()` | N/A |
| Date comparison | UTC Date | `isSameDay()` uit date-utils | N/A |
| Exact moment | Timestamp | ISO string | `DateTime` |
| Display ISO | Format | `formatDateISO()` uit date-utils | N/A |
| Display NL | Format | `formatDateNL()` uit date-utils | N/A |
| Seed data | Calendar Date | `calendarDate(y,m,d)` | `@db.Date` |

**Vermijd:**
- ❌ `new Date("YYYY-MM-DD")` in display-context — dit geeft UTC midnight, niet lokale dag
- ❌ `new Date().toISOString().slice(0,10)` voor "vandaag" — geeft UTC datum, afwijkend bij tijdzone-offsets
- ❌ Locale date functions in components (gebruik date-utils)

### 3.6 Date Library Strategy: Luxon vs date-fns

Het project gebruikt **beide** Luxon en date-fns voor verschillende doeleinden:

**Waarom beide libraries?**

| Library | Gebruik | Locatie | Reden |
|---------|---------|---------|-------|
| **Luxon** | Server-side timezone-aware calculations | `/server/panchanga/*`, `/services/*`, `/app/api/*` | Swiss Ephemeris requires precise timezone handling for astronomical calculations |
| **date-fns** | Client-side calendar UI formatting | `/components/calendar/*` | **Required** by react-big-calendar's `dateFnsLocalizer` |

**Kan één library worden verwijderd?**

❌ **Nee** - beide hebben legitieme, niet-overlappende use cases:

1. **Luxon is essentieel voor:**
   - Timezone-aware date parsing in API routes (`DateTime.fromISO(date, { zone: timezone })`)
   - Panchanga calculations die exacte local time vereisen
   - Swiss Ephemeris integratie (astronomical calculations)

2. **date-fns is essentieel voor:**
   - React Big Calendar vereist een localizer: `dateFnsLocalizer()`, `momentLocalizer()`, of `luxonLocalizer()`
   - Wij gebruiken `dateFnsLocalizer` met Dutch locale support
   - Kalender-toolbar/header formatting in de calendar UI

**Alternatief overwogen:** Migratie naar `luxonLocalizer` zou date-fns elimineren, maar:
- Vereist refactoring van alle calendar components
- date-fns is kleiner dan Luxon voor simple formatting
- Clear separation of concerns: server (Luxon) vs client (date-fns)

**Conclusie:** Beide libraries behouden - geen duplicatie, complementaire use cases.

### 3.7 Semantic Token System

Alle componenten gebruiken theme-onafhankelijke CSS custom properties (semantic tokens) in plaats van hardcoded kleuren. Deze tokens zijn gedefinieerd in `globals.css` en worden automatisch gegenereerd door het theme systeem.

**Voordelen:**
- ✅ Theme-switching zonder component wijzigingen
- ✅ Consistente kleuren door hele app
- ✅ Light/dark mode support automatisch
- ✅ Makkelijker onderhoud en refactoring
- ✅ Type-safe theme definitions in TypeScript

**Beschikbare Tokens:**

```css
/* Surface layers */
--theme-surface           /* Basis achtergrond (page background) */
--theme-surface-overlay   /* Overlay met transparantie (modals, dropdowns) */
--theme-surface-raised    /* Verhoogd oppervlak (cards, panels) */
--theme-surface-hover     /* Hover state achtergrond (buttons, links) */

/* Foreground (text colors) */
--theme-fg                /* Primaire text kleur (headings, body) */
--theme-fg-secondary      /* Secundaire text (descriptions, labels) */
--theme-fg-muted          /* Gedempte text (hints, placeholders, disabled) */
--theme-fg-subtle         /* Zeer subtiele text (timestamps, metadata) */

/* Interactive states */
--theme-border            /* Border kleur (inputs, dividers) */
--theme-hover             /* Hover state (same as surface-hover) */
--theme-active            /* Active/pressed state */

/* Theme brand colors */
--theme-primary           /* Primaire theme kleur */
--theme-primary-10        /* Primary met 10% opacity */
--theme-primary-15        /* Primary met 15% opacity */
--theme-primary-20        /* Primary met 20% opacity */
--theme-primary-30        /* Primary met 30% opacity */
--theme-secondary         /* Secundaire theme kleur */
--theme-accent            /* Accent kleur */
```

**Migratierichtlijnen:**

Bij het maken van nieuwe componenten of refactoren van bestaande code:

```tsx
// ❌ FOUT: Hardcoded Tailwind colors
<div className="bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400" />
<button className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800" />
<h1 className="text-zinc-800 dark:text-zinc-100" />
<p className="text-zinc-500 dark:text-zinc-400" />

// ✅ GOED: Semantic tokens
<div className="bg-theme-surface text-theme-fg-secondary" />
<button className="bg-theme-surface-raised hover:bg-theme-surface-hover" />
<h1 className="text-theme-fg" />
<p className="text-theme-fg-muted" />
```

**Veelvoorkomende Vervangingen:**

| Hardcoded Class | Semantic Token | Gebruik |
|----------------|----------------|---------|
| `bg-white dark:bg-zinc-900` | `bg-theme-surface-raised` | Cards, panels |
| `bg-zinc-50 dark:bg-zinc-800` | `bg-theme-surface` | Page backgrounds |
| `bg-zinc-100 dark:bg-zinc-700` | `bg-theme-surface-raised` | Elevated surfaces |
| `text-zinc-800 dark:text-zinc-100` | `text-theme-fg` | Primary text |
| `text-zinc-600 dark:text-zinc-400` | `text-theme-fg-secondary` | Secondary text |
| `text-zinc-500 dark:text-zinc-400` | `text-theme-fg-muted` | Muted/hint text |
| `hover:bg-zinc-100 dark:hover:bg-zinc-700` | `hover:bg-theme-surface-hover` | Hover states |
| `border-zinc-200 dark:border-zinc-700` | `border-theme-border` | Borders |

**Status (april 2026):**

Het grootste deel van de core UI gebruikt semantic tokens. Er zijn nog gerichte uitzonderingen met expliciete kleuren/`dark:` classes, met name in de weerpagina en enkele status/error states.

**Best Practices:**

1. **Gebruik nooit hardcoded zinc/gray/slate kleuren** - altijd semantic tokens
2. **Gebruik `dark:` alleen waar nodig** - semantic tokens eerst, uitzonderingen bewust en beperkt
3. **Test beide color modes** - verifieer dat componenten werken in light én dark mode
4. **Gebruik specifieke tokens** - kies `text-theme-fg-muted` ipv generic `text-theme-fg` voor hints

### 3.8 Error Handling

Uniforme error handling via `lib/api-response.ts`:

```typescript
// Success
NextResponse.json(data)
NextResponse.json(data, { status: 201 })

// Error (consistent structuur)
{
  error: "VALIDATION_ERROR",  // Machine-readable code
  message: "Validatiefout",   // User-friendly bericht (NL)
  details: [...]              // Optioneel: veld-specifieke errors
}
```

**Error Types:**
- `VALIDATION_ERROR` (400) - Ongeldige input (Zod)
- `NOT_FOUND` (404) - Resource niet gevonden
- `INTERNAL_ERROR` (500) - Onverwachte fout

### 3.9 Design System

Het project gebruikt een consistent design system voor visuele hiërarchie en interactie. Deze patronen zijn gebaseerd op Tailwind CSS en worden consequent toegepast door de hele applicatie.

#### 3.9.1 Shadow Hierarchy

Shadows worden gebruikt om visuele hiërarchie en depth te creëren:

| Shadow Class | Gebruik | Voorbeelden | Frequentie |
|--------------|---------|-------------|------------|
| `shadow-lg` | **Primaire elevation** - Major sections, cards, modals | Main calendar containers, event modals, raised panels | 21× |
| `shadow-md` | **Secundaire elevation** - Elevated interactive elements | Dropdowns, popovers, floating elements | 7× |
| `shadow-sm` | **Tertiaire elevation** - Subtle depth | Badges, pills, small interactive elements | 6× |

**Best Practices:**
- ✅ Gebruik `shadow-lg` voor primaire content containers (calendar sections, modals)
- ✅ Gebruik `shadow-md` voor interactieve elementen die boven content zweven
- ✅ Gebruik `shadow-sm` voor subtiele depth op kleine elementen
- ❌ Gebruik geen custom shadow values tenzij absoluut noodzakelijk

**Voorbeelden:**

```tsx
// Primaire content container
<div className="rounded-2xl bg-theme-surface-raised p-6 shadow-lg">
  {/* Calendar grid */}
</div>

// Elevated interactive element
<div className="rounded-lg bg-theme-surface-raised shadow-md">
  {/* Dropdown menu */}
</div>

// Subtle depth element
<span className="rounded-full px-3 py-1 shadow-sm">
  {/* Badge */}
</span>
```

#### 3.9.2 Border Radius Scale

Border radius wordt gebruikt voor consistent afgeronde hoeken:

| Radius Class | Gebruik | Voorbeelden | Frequentie |
|--------------|---------|-------------|------------|
| `rounded-2xl` | **Major containers** - Page sections, primary containers | Calendar sections, page-level panels | 20× |
| `rounded-xl` | **Cards & panels** - Secondary containers | Event cards, info panels, sidebar sections | 27× |
| `rounded-lg` | **Buttons & inputs** - Interactive elements | Buttons, calendar cells, form inputs | 44× |
| `rounded-full` | **Pills & circular** - Pills, badges, avatars | Category pills, moon phase visual, circular icons | 44× |

**Rationale:**
- Grotere containers krijgen grotere radius voor zachtere, vriendelijkere uitstraling
- Kleinere elementen krijgen kleinere radius voor preciezere, compactere vormgeving
- `rounded-full` voor puur decoratieve circulaire elementen

**Best Practices:**
- ✅ Gebruik `rounded-2xl` voor page-level sections en major containers
- ✅ Gebruik `rounded-xl` voor cards, panels, en modals
- ✅ Gebruik `rounded-lg` voor buttons, inputs, en calendar cells
- ✅ Gebruik `rounded-full` voor badges, pills, avatars, en circulaire decoratie
- ❌ Gebruik geen custom radius values (`rounded-[12px]`) tenzij specifieke design requirement

**Voorbeelden:**

```tsx
// Major page section
<section className="rounded-2xl bg-theme-surface-raised p-6 shadow-lg">
  {/* Calendar */}
</section>

// Event card
<article className="rounded-xl bg-theme-surface-raised p-4">
  {/* Event details */}
</article>

// Button
<button className="rounded-lg bg-theme-primary px-4 py-2">
  Save
</button>

// Badge
<span className="rounded-full bg-theme-primary-15 px-3 py-1">
  Festival
</span>
```

#### 3.9.3 Spacing System

Spacing volgt Tailwind's 4px increment scale met semantische betekenis:

| Spacing | Pixels | Gebruik | Frequentie |
|---------|--------|---------|------------|
| `gap-2` | 8px | **Default spacing** - Standard gap tussen elementen | 67× |
| `gap-3` | 12px | **Medium spacing** - Iets meer ruimte tussen gerelateerde elementen | 16× |
| `gap-4` | 16px | **Large spacing** - Spacing tussen major sections | 14× |
| `gap-6` | 24px | **Extra large** - Spacing tussen distinct page sections | 8× |

**Padding Pattern:**
- `p-4` (16px): Default padding voor cards en containers (20× gebruikt)
- `p-5` (20px): Padding voor grotere panels en sections
- `p-6` (24px): Padding voor major page sections

**Best Practices:**
- ✅ Gebruik `gap-2` als default voor flex/grid layouts
- ✅ Gebruik `gap-4` voor spacing tussen major sections binnen een container
- ✅ Gebruik `gap-6` voor spacing tussen distinct page sections
- ✅ Gebruik `p-4` als default container padding
- ✅ Gebruik `p-6` voor major page sections
- ❌ Voorkom inconsistente spacing (`gap-5`, `gap-7`) zonder specifieke reden

**Rationale:**
De spacing scale is gebaseerd op Tailwind's 4px increment systeem, wat zorgt voor:
- Visuele consistentie door voorspelbare spacing
- Betere alignment op 8px grid (gap-2, gap-4, gap-6 zijn veelvouden van 8)
- Makkelijker maintainability (developers weten welke waarden te gebruiken)

**Voorbeelden:**

```tsx
// Default element spacing
<div className="flex gap-2">
  <button>Cancel</button>
  <button>Save</button>
</div>

// Section spacing
<div className="space-y-6">
  <section>Calendar</section>
  <section>Events</section>
</div>

// Container padding
<div className="rounded-2xl bg-theme-surface-raised p-6">
  {/* Content */}
</div>
```

#### 3.9.4 Glassmorphism Pattern

Glassmorphism wordt gebruikt voor moderne, semi-transparante overlays en decoratieve elementen:

**Standard Pattern:**
```css
backdrop-blur-sm + bg-{color}/60 (interactive)
backdrop-blur-sm + bg-{color}/10 (decorative)
```

| Opacity | Gebruik | Voorbeelden |
|---------|---------|-------------|
| **60%** | Interactive elements | Hoverable cards, clickable panels |
| **10%** | Decorative backgrounds | Gradient overlays, subtle backgrounds |

**Gevonden Instanties:** 12× gebruikt door de applicatie

**Best Practices:**
- ✅ Gebruik **altijd** `backdrop-blur-sm` voor consistente blur
- ✅ Gebruik `bg-theme-surface-raised/60` voor interactieve glassmorphism
- ✅ Gebruik `bg-white/10` of `bg-black/10` voor decoratieve glassmorphism
- ❌ Voorkom inconsistente blur values (`backdrop-blur`, `backdrop-blur-md`)
- ❌ Voorkom te hoge opacity (>70%) - vernietigt glassmorphism effect

**Voorbeelden:**

```tsx
// Interactive glassmorphism card
<div className="rounded-xl bg-theme-surface-raised/60 backdrop-blur-sm p-4 hover:bg-theme-surface-raised">
  {/* Hoverable event card */}
</div>

// Decorative glassmorphism background
<div className="bg-gradient-subtle border-theme-primary-20 rounded-2xl border backdrop-blur-sm">
  {/* Major events section with subtle gradient */}
</div>

// Modal overlay
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm">
  {/* Modal background */}
</div>
```

**Accessibility Note:**
Zorg ervoor dat glassmorphism elementen voldoende contrast hebben met de achtergrond voor leesbaarheid. Test altijd met verschillende color modes (light/dark).

---

## 4. Backend Architecture

### 4.1 Layer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes                                  │
│  Verantwoordelijk voor:                                         │
│  - HTTP request/response handling                               │
│  - Input validatie (Zod)                                        │
│  - Response formatting                                          │
│  - Direct Prisma queries (simple CRUD)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (alleen complexe logica)
┌─────────────────────────────────────────────────────────────────┐
│                   Service Layer                                 │
│  Verantwoordelijk voor:                                         │
│  - Complexe business logica                                     │
│  - Swiss Ephemeris integratie (Vedische astronomie)            │
│  - Recurrence generation en berekeningen                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Prisma ORM                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 API Endpoints

| Endpoint | Methods | Beschrijving |
|----------|---------|--------------|
| `/api/events` | GET, POST | Events ophalen (met filters) en aanmaken |
| `/api/events/[id]` | GET, PUT, DELETE | Specifiek event ophalen, bewerken, verwijderen |
| `/api/events/[id]/occurrences/[occurrenceId]` | PUT | Individuele occurrence bewerken (datum, tijd, notities) |
| `/api/events/generate-occurrences` | POST | Genereer recurring event occurrences op basis van recurrence type |
| `/api/categories` | GET | Alle categorieën ophalen |
| `/api/daily-info` | GET | Zon/maan/dag informatie voor datumbereik (via Swiss Ephemeris) |
| `/api/preferences` | GET, PUT | Gebruikersvoorkeuren ophalen en bijwerken |
| `/api/themes` | GET | Beschikbare thema's ophalen |
| `/api/weer` | GET | Actuele weerdata (current, hourly, daily, luchtkwaliteit) via OpenWeatherMap — gecached 10 min (`revalidate: 600`) |
| `/api/health` | GET | Health check voor monitoring (database connectivity) |
| `/api/sadhana/practices` | GET, POST | Beoefeningen ophalen en aanmaken |
| `/api/sadhana/practices/[id]` | PATCH, DELETE | Beoefening bewerken of verwijderen |
| `/api/sadhana/sessions` | GET, POST | Sessies ophalen (`?from=YYYY-MM-DD`) en aanmaken |
| `/api/sadhana/sessions/[id]` | PATCH, DELETE | Sessie bewerken of verwijderen |
| `/api/sadhana/goals` | GET, POST | Doelen ophalen en aanmaken |
| `/api/sadhana/goals/[id]` | PATCH, DELETE | Doel bewerken of verwijderen |
| `/api/sadhana/stats/today` | GET | Vandaag stats (malas, mantras, minuten, goal progress, per beoefening) |
| `/api/sadhana/stats/streak` | GET | Huidige en langste streak |
| `/api/sadhana/stats/calendar` | GET | Dagdata voor heatmap (datum, malas, minuten, sessies) |
| `/api/sadhana/stats/overview` | GET | All-time statistieken + per-beoefening breakdown |
| `/api/kundali` | POST | Jyotisha geboortehoroscoop: alle 9 navagrahas + lagna (Lahiri ayanamsa, Whole Sign huizen, topocentrische Maan) |

### 4.3 Service Layer

De service layer wordt alleen gebruikt voor complexe business logica. Alle services zijn **server-only** en mogen niet in client-side code gebundeld worden.

| Service | Locatie | Verantwoordelijkheden |
|---------|---------|----------------------|
| `PanchangaSwissService` | `/server/panchanga/services/panchanga-swiss-service.ts` | Swiss Ephemeris integratie voor Vedische astronomie (Tithi, Nakshatra, Yoga, Karana met exacte eindtijden) + astronomische berekeningen (sunrise/sunset, moonrise/moonset) |
| `BirthChartService` | `/server/panchanga/services/birth-chart-service.ts` | Jyotisha geboortehoroscoop: alle 9 navagrahas (geocentrisch) + topocentrische Maan (SEFLG_TOPOCTR, parallax tot ~57'), lagna via Whole Sign huizen, Lahiri ayanamsa, Mean Node voor Rahu/Ketu |
| `panchangaService` | `/services/panchanga.service.ts` | Wrapper voor PanchangaSwissService, exposeert high-level API voor daily info calculations, LRU caching (365 dagen, 24h TTL) |
| `recurrenceService` | `/services/recurrence.service.ts` | Event recurrence generation via strategy registry (YEARLY_*, MONTHLY_*) + rule-based dispatch (SOLAR, TITHI, NAKSHATRA, TITHI_NAKSHATRA, WEEKDAY_TITHI, PRADOSH). |
| `/api/weer` route | `/src/app/api/weer/route.ts` | Stateless route: haalt current + hourly + daily weerdata + luchtkwaliteit op via OpenWeatherMap API v2.5 (geen aparte service-laag nodig). Next.js `revalidate: 600` voor server-side caching. |

**Architectuur Principes:**

1. **Server-Only Code:** Alle services gebruiken Node.js-specific libraries (swisseph native addon, Prisma) en zijn gemarkeerd met `"server-only"` import
2. **Layered Approach:**
   - `/server/panchanga/` = Low-level Swiss Ephemeris wrapper
   - `/services/` = High-level business logic die server modules gebruikt
3. **Thin Controllers Pattern:** API routes fungeren als "thin controllers" - HTTP handling, validatie, error responses
4. **Targeted Repository Pattern:** Voor complexe query-constructie (meerdere filters, conditionals) wordt een repository gebruikt om de controller dun te houden. Simpele Prisma-queries blijven direct in de route.
5. **Pragmatic Over Pure:** Architectuur dient de code, niet andersom - YAGNI principle

#### 4.3.1 API Routes vs Services: Decision Framework

Het project gebruikt een **hybride pattern** waarbij simpele operaties direct in API routes gebeuren en complexe business logica in services. Dit vereist expliciete criteria om te voorkomen dat business logica langzaam in routes lekt.

**✅ API Routes (Thin Controllers) - Toegestaan:**

| Pattern | Max Regels | Voorbeeld |
|---------|-----------|-----------|
| **Simple CRUD** | ~50 | `GET /api/categories` - Direct `prisma.category.findMany()` |
| **CRUD met validatie** | ~150 | `PUT /api/preferences` - Zod validatie + upsert |
| **Complex CRUD** | ~200 | `GET /api/events` - Query building, filters, joins, transformatie |

**Wat API routes MOGEN doen:**
- ✅ HTTP handling (request parsing, response formatting)
- ✅ Input validatie met Zod schemas
- ✅ Direct Prisma queries (SELECT, INSERT, UPDATE, DELETE)
- ✅ Simple query building (WHERE clauses, filters, joins)
- ✅ Data transformatie voor API responses (object mapping)
- ✅ Transactions voor gerelateerde CRUD (event + occurrence)
- ✅ Prisma error handling (P2002, P2003, P2025)
- ✅ Simple business rules (e.g., start < end validatie)

**Wat API routes NIET mogen doen:**
- ❌ Multi-step business logica (meerdere stappen met tussentijdse beslissingen)
- ❌ Complexe berekeningen (astronomie, recurrence patterns)
- ❌ External API calls (toekomstig: third-party integraties)
- ❌ Heavy computations (native addons, CPU-intensive werk)
- ❌ Logica die herbruikbaar is over meerdere endpoints

**🔧 Services - Verplicht wanneer:**

| Criterium | Voorbeeld | Service |
|-----------|-----------|---------|
| **Native addons** | Swiss Ephemeris astronomie | `panchangaService` |
| **Complex algorithms** | Lunar recurrence patterns | `recurrenceService` |
| **External APIs** | (toekomstig) third-party calendar sync | `syncService` |
| **Herbruikbaar** | Logica gebruikt in >1 endpoint | Extract naar service |
| **Route > 200 regels** | Te veel logica in één handler | Refactor naar service |
| **Testing isolation** | Moet gemocked worden in tests | Service met interface |

**📋 Code Review Checklist**

Wanneer je een API route schrijft of reviewt, check:

```
□ Is de route < 200 regels? (anders: extract logica naar service/utility)
□ Doet de route alleen HTTP + CRUD? (geen complexe business logica)
□ Wordt de logica alleen hier gebruikt? (anders: extract naar service voor herbruik)
□ Is de code leesbaar en maintainable? (anders: refactor ongeacht regels)
□ Gebruikt het alleen Prisma queries? (geen native addons, external APIs)
```

**Voorbeeld: Events API**

De `/api/events` route delegeert filterbouw naar `src/repositories/event.repository.ts`:
- **Repository:** `buildEventWhere()` + `findEventOccurrences()` — WHERE-clausule constructie, joins, sortering
- **Route:** validatie, aanroep repository, response transformatie (database → calendar format)

**Wanneer naar repository:**
- Filter-logica > ~40 regels of conditionals
- Query-patronen die in meerdere endpoints herbruikt kunnen worden
- Onafhankelijk testbaar moeten zijn

**Wanneer direct in route (geen repository):**
- Enkelvoudige Prisma-queries (`findMany`, `findUnique`, `upsert`) zonder complexe filters
- CRUD met validatie maar zonder multi-filter WHERE-constructie

**Waarom NIET alles via services?**

Moderne architectuur (2025) is **pragmatisch**, niet **dogmatisch**:

| Anti-pattern | Modern Pattern |
|--------------|----------------|
| Repository voor elke entity | Repository alleen voor complexe query-constructie |
| Service voor elke entity | Services voor business logica |
| Altijd 3-layer architectuur | Vertical slice waar nodig |
| Abstractie "just in case" | YAGNI - build when needed |

**Voordelen van thin controllers + gerichte repository:**
- ✅ **Minder boilerplate** - Enkelvoudige Prisma-queries blijven direct in de route
- ✅ **Sneller ontwikkelen** - Direct van validatie naar database voor eenvoudige CRUD
- ✅ **Eenvoudiger debugging** - Complexe filter-logica geïsoleerd in repository, niet verstopt in een lange handler
- ✅ **Duidelijke grens** - Filter-logica > ~40 regels → naar repository

#### 4.3.2 Service Pattern Design Decisions

Het project gebruikt **verschillende patterns** voor verschillende services, gekozen op basis van hun requirements:

**PanchangaService - Class-based Singleton Pattern**

```typescript
// src/services/panchanga.service.ts
export class PanchangaService {
  private swissService = new PanchangaSwissService();
  private cache = new PanchangaCache(); // Stateful LRU cache

  async calculateDaily(date, location, timezone) {
    // Check cache first, then calculate
  }
}

// globalThis singleton: cache overleeft Next.js hot-reload in development
const globalForPanchanga = globalThis as unknown as {
  panchangaService: PanchangaService | undefined;
};
export const panchangaService =
  globalForPanchanga.panchangaService ?? new PanchangaService();
if (process.env.NODE_ENV !== "production") {
  globalForPanchanga.panchangaService = panchangaService;
}
```

**Waarom class-based:**
- ✅ **Caching vereist:** Swiss Ephemeris calculations zijn CPU-intensive (astronomical calculations)
- ✅ **Stateful design:** LRU cache met 365 entries, 24h TTL
- ✅ **Safe caching:** Panchanga berekeningen zijn deterministisch (zelfde input = zelfde output)
- ✅ **Singleton pattern:** Eén cache instance delen across alle requests (globalThis overleeft hot-reload)
- ✅ **Private state:** Cache en Swiss service instance zijn internal implementation details

**RecurrenceService - Functional Pattern**

```typescript
// src/services/recurrence.service.ts
export async function generateOccurrences(event, options) {
  // Query database, calculate occurrences, return results
}

export async function deleteOccurrencesForEvent(eventId) {
  // Simple database operation
}
```

**Waarom functional:**
- ✅ **Stateless:** Geen caching nodig (database queries zijn snel)
- ✅ **Simple CRUD:** Queries database, doet berekeningen, returned resultaten
- ✅ **No shared state:** Elke functie is independent
- ✅ **Easier testing:** Pure functions zijn makkelijker te testen
- ✅ **Clear API:** Exported functions zijn direct bruikbaar

**Conclusie:**

Beide patterns zijn **intentioneel gekozen** op basis van requirements:
- Use **class-based** when you need stateful caching or complex initialization
- Use **functional** when operations are stateless and simple

Dit is **niet** inconsistent - het is **context-appropriate design**.

#### 4.3.3 Astronomische Berekeningen met Swiss Ephemeris

De applicatie gebruikt Swiss Ephemeris voor alle astronomische berekeningen. Deze berekeningen zijn geïmplementeerd in `/server/panchanga/utils/astro.ts`.

**Beschikbare Berekeningen:**

| Functie | Beschrijving | Swiss Ephemeris API |
|---------|--------------|---------------------|
| `calculateSunriseSunset()` | Berekent sunrise en sunset voor een datum en locatie | `swe_rise_trans` met `SE_SUN` |
| `calculateMoonriseMoonset()` | Berekent moonrise en moonset voor een datum en locatie | `swe_rise_trans` met `SE_MOON` |
| `swe_calc_ut()` | Berekent positie van hemellichamen (zon, maan) | `swe_calc_ut` |
| `swe_pheno_ut()` | Berekent maanfase percentage (illumination) | `swe_pheno_ut` |
| `findEventEnd()` | Zoekt eindtijd van Vedische events (Tithi, Nakshatra, etc.) | Bracket + Binary search algoritme |

**Implementatie Details:**

```typescript
// Voorbeeld: Moonrise/Moonset berekening
export async function calculateMoonriseMoonset(
  dateStr: string,      // YYYY-MM-DD
  loc: LocationConfig   // { lat, lon, tz }
): Promise<MoonRiseSetResult> {
  // 1. Convert date to Julian Day
  const jdStart = await swe_julday(...);

  // 2. Calculate moonrise using swe_rise_trans
  const riseTimeJD = await swe_rise_trans(
    jdStart,
    swisseph.SE_MOON,  // Moon (not Sun!)
    "",
    EPHE_FLAG,
    swisseph.SE_CALC_RISE | swisseph.SE_BIT_DISC_CENTER,
    loc.lon, loc.lat, 0
  );

  // 3. Calculate moonset
  const setTimeJD = await swe_rise_trans(..., SE_CALC_SET);

  // 4. Convert JD back to DateTime in local timezone
  return {
    moonriseJD, moonsetJD,
    moonriseTime: jdToDateTime(riseTimeJD),
    moonsetTime: jdToDateTime(setTimeJD)
  };
}
```

**Precisie:**

- ✅ Sunrise/Sunset: Exact tot op de seconde (topocentric calculation)
- ✅ Moonrise/Moonset: Exact tot op de seconde (topocentric calculation)
- ✅ Tithi/Nakshatra eindtijden: Bracket + Binary search (20 iteraties, ~second-level accuracy)
- ✅ Maanfase percentage: 0-100% met 1 decimaal precisie
- ✅ Kundali Maan: topocentrisch (`SEFLG_TOPOCTR`) — parallax-correctie tot ~57 boogminuten. Alle overige graha's geocentrisch (parallax verwaarloosbaar voor planeten)

**Performance:**

- Berekeningen worden gecached in `PanchangaService` (365 dagen, 24h TTL)
- Zware berekeningen (find event ends) gebruiken optimized search algoritmes
- Parallel berekeningen waar mogelijk (sunrise + moonrise simultaneously)

---

## 5. Frontend Architecture

### 5.1 Routing Structure

```
/                       → Homepage (kalender + sidebar + TodayHero)
/almanac                → Panchang Almanac (split-view maandkalender)
/encyclopedie           → Encyclopedie overzicht (zoeken, groepen, artikelen)
/encyclopedie/[slug]    → Individueel encyclopedie-artikel (MDX)
/events                 → Events overzicht (card grid + filters)
/events/new             → Nieuw event aanmaken
/events/[id]            → Event detail/weergave (read-only)
/events/[id]/edit       → Event bewerken + verwijderen
/kundali                → Jyotisha geboortehoroscoop (invoer geboortedatum/-tijd/-locatie)
/sadhana                → Sadhana Tracker (sessies, stats, heatmap, doelen, beoefeningen)
/settings               → Instellingen (theme, locatie, voorkeuren)
/weer                   → Weerdetails (OpenWeatherMap — current, uurlijks, dagelijks, luchtkwaliteit)
```

### 5.1.1 Pagina Metadata

Elke route heeft een eigen `layout.tsx` die de browsertab-titel instelt. De root layout definieert een **title template**:

```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "Dharma Calendar",
    template: "%s | Dharma Calendar",
  },
};
```

Per route:

| Route | layout.tsx | Browsertab |
|-------|-----------|------------|
| `/` | root layout (default) | `Dharma Calendar` |
| `/almanac` | `title: "Almanak"` | `Almanak \| Dharma Calendar` |
| `/encyclopedie` | `title: "Encyclopedie"` | `Encyclopedie \| Dharma Calendar` |
| `/encyclopedie/[slug]` | `generateMetadata` → artikelnaam | `<naam> \| Dharma Calendar` |
| `/events` | `title: "Events"` | `Events \| Dharma Calendar` |
| `/events/new` | — (via events layout) | `Events \| Dharma Calendar` |
| `/events/[id]` | `generateMetadata` → eventnaam | `<naam> \| Dharma Calendar` |
| `/events/[id]/edit` | — (via events/[id] layout) | `<naam> \| Dharma Calendar` |
| `/kundali` | `title: "Kundali"` | `Kundali \| Dharma Calendar` |
| `/sadhana` | `title: "Sadhana"` | `Sadhana \| Dharma Calendar` |
| `/settings` | `title: "Instellingen"` | `Instellingen \| Dharma Calendar` |
| `/weer` | `title: "Weer"` | `Weer \| Dharma Calendar` |

`/events/[id]/page.tsx` en `/encyclopedie/[slug]/page.tsx` gebruiken `generateMetadata` om namen dynamisch op te halen.

### 5.2 Component Hierarchy

```
RootLayout
├── ThemeProvider (context)
├── ToastProvider (context)
├── Header (navigatie, color mode toggle)
└── PageLayout (standaard wrapper voor alle pages)
    │
    ├── HomePage (spacing enabled)
    │   ├── TodayHero (zon/maan info, real-time klok, weer-snippet via /api/weer)
    │   │   ├── Datum + Vedische kalenderinfo (Tithi, Nakshatra, Vara)
    │   │   ├── Klok + locatie + weersnippet (temperatuur, conditie, min/max)
    │   │   ├── Glass cards: Zon (opkomst/ondergang), Maan (fase + visueel), Maantijden
    │   │   ├── Yoga / Karana / Rahu Kalam grid
    │   │   ├── Speciale lunaire dag banner (indien van toepassing)
    │   │   └── Vandaag-events (pills met link naar event)
    │   ├── DharmaCalendar (kalender grid met maanfase per dag)
    │   │   └── EventDetailModal (event details → knop naar bewerken)
    │   └── Sidebar (upcoming events, categorieën)
    │
    ├── AlmanacPage (full width, split-view layout)
    │   ├── AlmanacHeader (paginatitel + locatie badge)
    │   ├── AlmanacFilters (jaar/maand navigatie + filter toggles)
    │   ├── MoonPhasesTimeline (4 fasen: nieuw, 1e kwartier, vol, laatste kwartier)
    │   ├── MonthGrid (7×6, met zon/maan tijden per cel)
    │   └── DayDetailsPanel (sticky rechts)
    │       ├── Sanskrit Day Header
    │       ├── Sun/Moon Times Cards
    │       ├── Moon Phase Visual
    │       ├── Special Lunar Days (Chaturthi, Ekadashi, etc.)
    │       └── Events List
    │
    ├── EventsPage (full width, met loading state)
    │   ├── FilterSidebar (zoeken, filters, sortering)
    │   └── EventCard[] (klikbaar → modal of bewerken)
    │
    ├── EventFormPage (narrow width) — /events/new
    │   └── EventForm (formulier met lunar dropdowns)
    │
    ├── EventViewPage (narrow width) — /events/[id]
    │   └── Read-only event weergave (naam, type, datum, categories, series)
    │       └── Link naar /events/[id]/edit
    │
    ├── EventEditPage (narrow width) — /events/[id]/edit
    │   └── EventForm (bewerken + verwijderen)
    │
    ├── EncyclopediePage (full width) — /encyclopedie
    │   ├── Zoekbalk (client-side filter op naam/beschrijving)
    │   ├── Groepen overzicht (hiërarchische deity-groepen)
    │   └── Artikel-kaarten met link naar [slug]
    │
    ├── EncyclopedieArticlePage (medium width) — /encyclopedie/[slug]
    │   └── MDX artikel (uitgebreide beschrijving, attributen, iconografie)
    │
    ├── SettingsPage (medium width, met loading state)
    │   ├── ThemeSection (thema-kiezer grid met preview)
    │   ├── ColorModeToggle (light/dark/system)
    │   ├── CalendarSection (standaard kalenderweergave)
    │   └── LocationSection (preset + handmatig + zon/maan preview)
    │
    ├── KundaliPage (medium width)
    │   ├── Formulier (datum, tijd, tijdzone, locatie) → BirthChartService
    │   └── Resultaat (view toggle: tabel ↔ Zuid-Indiaas 4×4 chart)
    │       ├── Tabelweergave: 9 navagrahas + lagna (rashi, nakshatra, pada, retrograde)
    │       └── KundaliChart: Zuid-Indiaas 4×4 grid, graha-kleuren per planeet
    │
    ├── SadhanaPage (full width, geen spacing prop)
    │   └── SadhanaTracker (client component)
    │       ├── StatCards (vandaag malas/mantras/minuten, streak, week totaal)
    │       ├── Vandaag per beoefening (altijd zichtbaar, lege staat)
    │       ├── Heatmap (desktop 52 wkn / mobiel 22 wkn, DayInfo markers)
    │       ├── SessionCard[] (expand/edit/delete, Tithi/specialDay badge)
    │       ├── All-time overzicht (OverviewStats + PracticeStat breakdown)
    │       ├── GoalPanel (CRUD, dagelijks/wekelijks/lifetime, progress_malas + progress_minutes)
    │       └── PracticesPanel (CRUD, mantra_japa / parayana / other)
    │
    └── WeerPage (full width)
        ├── Current weather (temperatuur, windsnelheid, vochtigheid, UV-index, etc.)
        ├── Uurlijkse verwachting (24 uur)
        ├── Dagelijkse verwachting (7 dagen)
        └── Luchtkwaliteitsindex (AQI + componenten)

```

#### 5.2.1 PageLayout Component

Het `PageLayout` component biedt een consistente wrapper voor alle pages met flexibele configuratie:

**Props:**

| Prop | Type | Default | Gebruik |
|------|------|---------|---------|
| `children` | ReactNode | - | Page content |
| `width` | `"full"` \| `"medium"` \| `"narrow"` | `"full"` | Max-width constraint |
| `spacing` | boolean | `false` | Vertical spacing (space-y-8) |
| `loading` | boolean | `false` | Show loading state |
| `loadingMessage` | string | `"Laden..."` | Loading message text |
| `className` | string | - | Custom className voor main |

**Width Options:**
- `full`: Geen max-width (content pages zoals home, events, almanac)
- `medium`: `max-w-4xl` (settings page)
- `narrow`: `max-w-2xl` (form pages: new event, edit event)

**Features:**
- ✅ Consistent `min-h-screen bg-theme-bg-subtle` wrapper
- ✅ Responsive container met padding (`container mx-auto px-4 py-6`)
- ✅ Built-in loading state (spinner + message)
- ✅ Optional vertical spacing voor multi-section layouts
- ✅ Type-safe props met TypeScript

**Gebruik:**

```tsx
// Full width content page
<PageLayout spacing>
  <TodayHero />
  <Calendar />
</PageLayout>

// Settings with max-width
<PageLayout width="medium" loading={isLoading}>
  <SettingsForm />
</PageLayout>

// Form page with narrow width
<PageLayout width="narrow">
  <EventForm />
</PageLayout>
```

**Voordelen:**
- Single source of truth voor page structure
- Consistent theming (altijd `bg-theme-bg-subtle`)
- Makkelijk nieuwe pages toevoegen met consistente styling
- Vermindert code duplicatie (~45 regels verwijderd across 6 pages)

### 5.3 Almanac Special Features

De Almanac pagina bevat geavanceerde lunaire berekeningen via Swiss Ephemeris:

**Speciale Lunaire Dagen (gedetecteerd via Tithi nummer):**

| Tithi | Naam | Beschrijving |
|-------|------|--------------|
| 4 (Shukla) | Vinayaka Chaturthi | Ganesha puja dag |
| 4 (Krishna) | Sankashti Chaturthi | Ganesha vastendag |
| 8 | Ashtami | Durga dag |
| 11 | Ekadashi | Vishnu vastendag |
| 13 | Pradosham | Shiva vereringsdag |
| 14 | Chaturdashi | Dag voor Purnima/Amavasya |

**Tithi Berekening (Swiss Ephemeris Methode):**

Tithi wordt berekend via de **elongatie tussen Zon en Maan** (niet via maanfase percentage!):

```typescript
/**
 * CORRECTE METHODE: Elongation-based Tithi calculation
 * Tithi = Angular distance between Moon and Sun divided by 12 degrees
 *
 * Range: 0° - 360° → 30 Tithis (1-30)
 * Each Tithi spans exactly 12 degrees
 */
function getTithiProgress(sunLongitude: number, moonLongitude: number): number {
  let diff = moonLongitude - sunLongitude;
  if (diff < 0) diff += 360;  // Normalize to 0-360

  return diff / 12;  // Result: 0.0 to 29.999
}

// At sunrise:
const tithiProgress = getTithiProgress(sunPos.longitude, moonPos.longitude);
const tithiNumber = Math.floor(tithiProgress) + 1;  // 1-30

// Determine Paksha (fortnight)
const paksha = tithiNumber <= 15 ? "Shukla" : "Krishna";

// Adjust to 1-15 range
const tithiInPaksha = tithiNumber <= 15 ? tithiNumber : tithiNumber - 15;
```

**Waarom NIET maanfase percentage gebruiken?**

❌ **FOUT**: `tithi = Math.ceil((moonPercent / 100) * 15)`
- Maanfase percentage is een **westerse astronomische maat** (0-100%)
- Correleert NIET perfect met Vedische Tithi (elongation-based)
- Kan leiden tot off-by-one errors bij fasen overgangen

✅ **CORRECT**: Elongatie tussen Zon en Maan / 12°
- Dit is de **traditionele Vedische definitie** van Tithi
- Swiss Ephemeris gebruikt sidereal longitudes (Lahiri ayanamsa)
- Exacte eindtijden via bracket + binary search algoritme

**Eindtijd Berekening:**

Tithi eindtijden worden berekend door te zoeken wanneer de elongatie de volgende 12° boundary kruist:

```typescript
const tithiEndJD = await findEventEnd(
  sunriseJD,
  async (jd) => {
    const sun = await swe_calc_ut(jd, SE_SUN, flags);
    const moon = await swe_calc_ut(jd, SE_MOON, flags);
    return getTithiProgress(sun.longitude, moon.longitude);
  },
  tithiNumber % 30,  // Target: next tithi boundary
  30                 // Wrap at 30 tithis
);
```

Dit algoritme garandeert **second-level accuracy** voor alle Panchanga elementen.

### 5.3.2 Drik Panchang Extended Fields

De DailyInfo API response bevat uitgebreide Vedische kalender velden volgens Drik Panchang standaarden:

**Lunar Month (Maas) - Amanta/Purnimanta Systeem:**
- `maasName`: Sanskrit maand naam (bijv. "Pausha", "Magha")
- `maasType`: "Amanta" (eindigt bij nieuwe maan) of "Purnimanta" (eindigt bij volle maan)
- `lunarDay`: Dag nummer binnen de lunar month (1-30)
- `paksha`: "Shukla" (wassend) of "Krishna" (afnemend)

**Hindu Kalender Jaren:**
- `vikramaSamvatYear`: Vikrama Samvat jaar (Gregorian + ~57)
- `vikramaSamvatName`: Jaar naam uit 60-jarige cyclus
- `shakaSamvatYear`: Shaka Samvat jaar (Gregorian - ~78)
- `shakaSamvatName`: Jaar naam uit 60-jarige cyclus
- `samvatsaraName`: Samvatsara naam (60-year cycle, bijv. "Kalayukta")
- `samvatsaraNumber`: Positie in 60-jarige cyclus (1-60)

**Rashi (Zodiac Signs) - Sidereal:**
- `sunSignNumber`: Zon teken nummer (1-12: Mesha tot Meena)
- `sunSignName`: Sanskrit naam (bijv. "Mesha", "Vrishabha")
- `sunSignUpto`: Tijdstip wanneer zon naar volgende teken gaat (HH:mm:ss)
- `moonSignNumber`: Maan teken nummer (1-12)
- `moonSignName`: Sanskrit naam
- `moonSignUpto`: Tijdstip wanneer maan naar volgende teken gaat

**Pravishte/Gate:**
- `daysSinceSankranti`: Aantal dagen sinds laatste Sankranti (zon ingress)
- `currentRashi`: Huidige solar rashi
- `lastSankrantiDate`: Datum van laatste Sankranti (YYYY-MM-DD)

**Meervoudige Transities per Dag:**

Als een Panchanga element (Tithi/Nakshatra/Yoga/Karana) eindigt vóór de volgende zonsopgang, bevat de API ook informatie over het **volgende** element:

- `nextTithi`: { number, name, paksha, endLocal, endUtcIso }
- `nextNakshatra`: { number, name, pada, endLocal, endUtcIso }
- `nextYoga`: { number, name, endLocal, endUtcIso }
- `nextKarana`: { number, name, type, endLocal, endUtcIso }

**Implementatie Details:**

```typescript
// Sun/Moon Rashi berekening (sidereal longitude)
const sunSignIdx = Math.floor(sunPos.longitude / 30); // 0-11
const sunSignName = SOLAR_MASA_NAMES[sunSignIdx];

// Sankranti detectie (backwards search)
for (let i = 0; i < 35; i++) {
  const testSunPos = await swe_calc_ut(sunriseJD - i, SE_SUN, flags);
  if (Math.floor(testSunPos.longitude / 30) !== sunSignIdx) {
    // Binary search voor exacte Sankranti tijd
    lastSankrantiJD = findExactBoundary(testJD, testJD + 1);
    break;
  }
}

// Vikrama/Shaka Samvat jaren
// Nieuwjaar = Chaitra Shukla Pratipada (niet: eerste dag van maand 4)
// isNewYearOpen = de nieuwjaarstithi is al gepasseerd dit Gregoriaans jaar
const isNewYearOpen = maasIdx !== 11 && !(maasIdx === 0 && isAdhika);
const vikramaYear = gregorianYear + 57 - (isNewYearOpen ? 0 : 1);
const shakaYear = gregorianYear - 78 - (isNewYearOpen ? 0 : 1);
const samvatsaraIdx = (vikramaYear - 1) % 60;
const samvatsaraName = SAMVATSARA_NAMES[samvatsaraIdx];
```

**Caching:**

Alle Drik velden worden server-side berekend en gecached in `PanchangaService` (365 dagen, 24h TTL). Dit vermijdt herhaalde zware astronomische berekeningen.

### 5.4 State Management

```
┌─────────────────────────────────────────────────────────────────┐
│ Server State      │ Data van de API (events, categories)       │
│                   │ → Fetchen bij page load (via useFetch)     │
│                   │ → Refetch na mutaties                       │
├───────────────────┼─────────────────────────────────────────────┤
│ URL State         │ Filters, zoekterm                           │
│                   │ → Shareable, bookmarkable                   │
│                   │ → Browser back/forward werkt                │
├───────────────────┼─────────────────────────────────────────────┤
│ Local Storage     │ Theme + color mode (via ThemeProvider)     │
│                   │ → Instant loading, geen flash               │
├───────────────────┼─────────────────────────────────────────────┤
│ React Context     │ Theme (ThemeProvider)                       │
│                   │ Toast notificaties (ToastProvider)          │
└───────────────────┴─────────────────────────────────────────────┘
```

### 5.5 Custom Hooks

Het project bevat herbruikbare custom hooks voor gemeenschappelijke patterns:

#### useFetch Hook

**Locatie:** `src/hooks/useFetch.ts`

Een type-safe hook voor data fetching met automatisch AbortController management. Elimineert ~30-40 regels boilerplate code per component.

**Features:**
- ✅ Automatische AbortController setup en cleanup
- ✅ Loading/error state management
- ✅ TypeScript generics voor type-safe data
- ✅ Manual refetch capability
- ✅ AbortError filtering (geen console errors bij unmount)

**Signature:**

```typescript
function useFetch<T>(
  url: string | null,
  options?: {
    skip?: boolean;              // Skip initial fetch
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
    errorMessage?: string;
  }
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Gebruik:**

```typescript
// Simple fetch
const { data: categories, loading, error } = useFetch<Category[]>("/api/categories");

// With callbacks
const { data, loading, refetch } = useFetch<User[]>("/api/users", {
  onSuccess: (users) => console.log(`Loaded ${users.length} users`),
  onError: (err) => logError("Failed to load users", err),
  errorMessage: "Kon gebruikers niet laden"
});

// Conditional fetch
const { data } = useFetch<Event[]>(
  shouldFetch ? "/api/events" : null,
  { skip: !shouldFetch }
);
```

**Wanneer WEL gebruiken:**
- ✅ Statische URLs (bv. `/api/categories`, `/api/preferences`)
- ✅ Eenmalige fetch bij component mount
- ✅ Simpele data transformaties
- ✅ Standaard error handling

**Wanneer NIET gebruiken:**
- ❌ Parameterized fetches (bv. `fetchByMonth(year, month)`)
- ❌ Dynamic query strings gebaseerd op state (bv. filters)
- ❌ Conditional refetching logic
- ❌ Auto-save of debounced save patterns
- ❌ Complexe data transformaties na fetch

**Voorbeelden in codebase:**
- `EventForm.tsx` - Laden van categorieën via `useFetch`
- Hetzelfde patroon is bruikbaar voor andere eenvoudige endpoint-fetches

#### useFilters Hook

**Locatie:** `src/hooks/useFilters.ts`

Synchroniseert filter state met URL searchParams voor shareable/bookmarkable filter states.

**Features:**
- URL state management (via `useSearchParams`)
- Type-safe filter state
- Query string builder voor API calls
- Active filter count tracking

**Gebruik:**

```typescript
const {
  filters,              // Current filter state
  setFilter,            // Update single filter
  toggleFilter,         // Toggle boolean filter
  clearFilters,         // Reset all filters
  activeFilterCount,    // Number of active filters
  buildQueryString,     // Build API query string
} = useFilters();
```

#### useDebounce Hook

**Locatie:** `src/hooks/useDebounce.ts`

Debounce waarde voor performance (bv. search inputs).

```typescript
const debouncedSearch = useDebounce(searchTerm, 300);
```

### 5.6 Sadhana Tracker Module

De Sadhana Tracker is een zelfstandig subsysteem voor het bijhouden van spirituele beoefening (mantra japa, parayana, meditatie). Het volgt de almanac-component-architectuur: barrel export, gesplitste bestanden, gedeelde `types.ts`.

#### 5.6.1 Component Structuur

```
src/components/sadhana/
├── index.ts           # Barrel: exporteert SadhanaTracker
├── types.ts           # Alle types, apiFetch, fetchDayInfoMap, formatters
├── SadhanaTracker.tsx # Root: state, data fetching, layout, toast
├── StatCard.tsx       # Herbruikbaar statistiek kaartje
├── Heatmap.tsx        # Activiteitsheatmap (buildHeatmap + component)
├── SessionCard.tsx    # Sessie kaart (expand/edit/delete)
├── SessionForm.tsx    # Sessie formulier (nieuw + bewerken)
├── GoalPanel.tsx      # Doelen CRUD
└── PracticesPanel.tsx # Beoefeningen CRUD
```

**Client boundary:** Alle componenten zijn `"use client"` behalve `StatCard.tsx` (geen hooks). De pagina (`src/app/sadhana/page.tsx`) heeft geen `"use client"` — die is server-component.

#### 5.6.2 Data Flow

```
SadhanaTracker (loadAll)
  ├── /api/sadhana/stats/today       → TodayStats (StatCards, per-practice)
  ├── /api/sadhana/stats/streak      → StreakStats (StatCard streak)
  ├── /api/sadhana/stats/overview    → OverviewStats (all-time sectie)
  ├── /api/sadhana/stats/calendar    → CalendarDay[] (heatmap)
  ├── /api/sadhana/sessions?from=X   → SessionData[] (sessieslijst)
  ├── /api/sadhana/practices         → Practice[] (forms + panels)
  ├── /api/sadhana/goals             → Goal[] (GoalPanel)
  └── /api/daily-info?start=X&end=Y → DayInfoMap (kalender-integratie)
```

Alle fetches lopen parallel via `Promise.all`. Na elke mutatie (toevoegen/bewerken/verwijderen) wordt `loadAll()` opnieuw aangeroepen.

#### 5.6.3 Kalender-Integratie

De tracker haalt voor het volledige heatmap-bereik (364 dagen) panchanga-data op via `/api/daily-info`. Dit levert per dag:
- `tithi`: Tithi naam en paksha (Shukla/Krishna)
- `specialDay`: Festival/puja naam en emoji
- `moonPhaseEvent`: Maanfase type

**Gebruik:**
- **SessionCard**: Toont Tithi of specialDay onder de malas/duur regel
- **Heatmap**: Toont een witte stip (2-3px) op cellen met specialDay of moonPhaseEvent; tooltip en tapped-state tonen de Tithi-naam

```typescript
// types.ts
export interface DayInfo {
  tithi?: { name: string; paksha: "Shukla" | "Krishna" };
  specialDay?: { name: string; emoji: string; type: string } | null;
  moonPhaseEvent?: { type: "new" | "first_quarter" | "full" | "last_quarter" } | null;
}
export type DayInfoMap = Map<string, DayInfo>;
```

#### 5.6.4 Goal Types

GoalPanel ondersteunt drie typen:

| Type | Bereik | Progress |
|------|--------|---------|
| `daily` | Vandaag | `progress_malas` + `progress_minutes` uit `/api/sadhana/stats/today` |
| `weekly` | Ma–zo | `progress_malas` + `progress_minutes` uit `/api/sadhana/goals` |
| `lifetime` | Alle tijd | `progress_malas` + `progress_minutes` uit `/api/sadhana/goals` |

Progress omvat alle practice types:
- `malas`-eenheid: telt mee voor alle practice types
- `count`-eenheid voor `mantra_japa`: omgerekend naar malas (÷ 108)
- `durationMinutes` van de sessie: telt altijd mee voor `progress_minutes`

#### 5.6.5 Pagina Volgorde

1. StatCards (vandaag + streak + week)
2. Vandaag per beoefening
3. Activiteitsheatmap
4. Sessieslijst — gegroepeerd per maand in uitklapbare accordeons (met "Laad meer" +30 dagen)
5. All-time overzicht
6. GoalPanel + PracticesPanel (naast elkaar op lg:)

#### 5.6.5 UX Details

- **Toast**: Interne toast (geen ToastProvider) — `showToast(msg)` met 2500ms auto-dismiss
- **Laad meer**: Verborgen zodra `noMoreSessions` true is (gedetecteerd via sessie-count vergelijking)
- **Heatmap mobiel**: 22 weken (~154 dagen) i.p.v. 52 weken — past op 375px
- **inputMode="numeric"**: Op alle number inputs voor mobiel numeriek toetsenbord
- **motion-safe**: `motion-safe:transition-*` op progress bar en heatmap cellen

### 5.7 Encyclopedie Module

De Encyclopedie is een statische, client-side doorzoekbare kennisbank over Sanatana Dharma. Ze vervangt het eerdere Sanskrit woordenboek (woordenboek → encyclopedie) en biedt uitgebreide MDX-artikelen per deity, groep en concept.

#### 5.7.1 Architectuur

```
src/lib/encyclopedia.ts         # Alle artikeldata + groepshiërarchie
src/app/encyclopedie/page.tsx   # Overzichtspagina (zoeken, groepen)
src/app/encyclopedie/[slug]/page.tsx  # Individueel artikel (MDX rendering)
```

**Datamodel (in `encyclopedia.ts`):**

```typescript
export interface EncyclopediaEntry {
  slug: string;          // URL-friendly ID
  name: string;          // Weergavenaam (bijv. "Gaṇeśa")
  group: string;         // Groep-ID (bijv. "ganesha")
  summary: string;       // Korte beschrijving (voor zoeken en overzicht)
  content: string;       // MDX-inhoud (volledig artikel)
  icon?: string;         // Optioneel emoji of SVG-naam
}
```

**Groepen (hiërarchisch):**
- Top-level groepen: Ganesha & 32 Gaṇapati, Shiva & Shiva-families, Vishnu & Avatars, Dasha Mahavidya, 64 Bhairavas, Navagraha, en meer
- Elke groep heeft leader-artikelen en sub-member artikelen
- Groepen zijn los gedefinieerd naast entries — geen separate DB-tabel

#### 5.7.2 Zoekfunctionaliteit

Client-side zoeken op naam en beschrijving. Geen backend-query nodig; de volledige dataset is klein genoeg voor in-memory filtering.

#### 5.7.3 MDX Artikelen

Elk artikel is geschreven in MDX (Markdown + JSX). Ze bevatten:
- Uitgebreide mythologische beschrijving
- Iconografie en attributen
- Verwante graha's, mantras, festivals

**Schaal (april 2026):** 200+ artikelen covering Ganesha (32 Gaṇapati), Dasha Mahavidya (10 artikelen), 64 Bhairavas, Ekādaśa Rudra, Vishnu-avatars, Navagraha, en meer.

### 5.8 Request Deduplication

Alle fetch operaties gebruiken AbortController voor proper cleanup:

**Via useFetch hook (aanbevolen):**

```typescript
const { data, loading } = useFetch<User[]>("/api/users");
// AbortController automatisch managed
```

**Handmatige implementatie (voor complexe scenarios):**

```typescript
useEffect(() => {
  const controller = new AbortController();

  async function fetchData() {
    const response = await fetch(url, { signal: controller.signal });
    // ... handle response
  }

  fetchData();

  return () => controller.abort();
}, [dependencies]);
```

**Waarom AbortController?**
- ✅ Voorkomt race conditions
- ✅ Geen onnodige state updates bij unmount
- ✅ Geen geheugen lekken
- ✅ Betere error handling

---

## 6. Theme System

### 6.1 Architecture (Tailwind v4 Native)

Het theme systeem draait volledig op Tailwind v4's native CSS-variabelen (oklch) en `@import` structuur. Er is geen CSS-generator script meer nodig.

```text
┌─────────────────────┐     ┌────────────────────────┐
│  config/themes.ts   │     │  src/styles/themes/*.css│
│  (Metadata voor UI) │     │  (Styling definities)  │
└─────────────────────┘     └────────┬───────────────┘
                                     │ @import
                                     ▼
┌─────────────────────┐     ┌────────────────────────┐
│   ThemeProvider     │────▶│   globals.css          │
│   (runtime context) │     │   (Main entrypoint)    │
└─────────────────────┘     └────────────────────────┘
```

**Key files:**
- `src/config/themes.ts` - Theme metadata (naam, basiskleuren). Enige bron voor de Settings UI.
- `src/styles/themes/*` - Losse CSS bestanden per thema (classic, revamped, special).
- `src/app/globals.css` - Hoofdbestand dat de `@import` statements bevat.
- `src/components/theme/ThemeProvider.tsx` - Runtime context die het `data-theme` attribuut zet op `<html>`.

### 6.2 Theme Types & Categories

| Categorie | Beschrijving | Bestand |
|-----------|--------------|---------|
| **Classic** | Basis thema's met effen achtergrondkleuren | `src/styles/themes/standard.css` |
| **Revamped** | Zelfde basis, maar met subtiele gradient achtergronden en glassmorphism | `src/styles/themes/standard.css` |
| **Special** | Premium thema's met complexe visuele effecten, animaties en custom overrides | `src/styles/themes/special/*.css` |

### 6.3 Theme CSS Structuur

Elk thema wordt gedefinieerd onder een specifieke data-attribuut selector. Voor de `dark` mode wordt de `.dark` class (volgens Tailwind v4 conventies) toegevoegd.

Voorbeeld van een schoon theme-bestand (`shri-ganesha.css`):
```css
/* Basis variabelen */
[data-theme="shri-ganesha"] {
  --theme-primary: oklch(0.55 0.22 25);
  --theme-secondary: oklch(0.75 0.14 85);
  /* Custom overrides */
  --ganesha-sindoor: oklch(0.55 0.25 30);
}

/* Dark mode overrides */
.dark[data-theme="shri-ganesha"],
[data-theme="shri-ganesha"].dark {
  --theme-primary: oklch(0.45 0.20 25);
}

/* Component overrides in CSS */
[data-theme="shri-ganesha"] header::after {
  content: '';
  background: linear-gradient(90deg, transparent, var(--ganesha-sindoor), transparent);
}
```

### 6.4 Color Mode

Color mode werkt onafhankelijk van het geselecteerde theme:
- `.dark` class op `<html>` stuurt de thema-overrides en de `dark:` Tailwind classes aan.
- `system` mode volgt OS preference (via `matchMedia`).
- Status is persisted in `localStorage`.

### 6.5 Theme Utility Classes

Alle utility classes zijn vooraf gedefinieerd en theme-aware in `src/styles/utilities.css`.

```css
/* Backgrounds met opacity (let op de hyphen-notatie!) */
.bg-theme-primary      /* 100% */
.bg-theme-primary-10   /* 10% opacity (oklch mix) */
.bg-theme-primary-15   /* 15% opacity */
.bg-theme-primary-20   /* 20% opacity */

/* Text colors */
.text-theme-primary
.text-theme-secondary
.text-theme-accent
```

### 6.6 Semantic Token System

Zie sectie 3.7. De architectuur schrijft voor dat je altijd de semantische tokens gebruikt (`var(--theme-surface)`, `.bg-theme-surface`) in plaats van hardcoded Tailwind kleuren (`bg-zinc-100`). Dit garandeert dat alle componenten automatisch mee-kleuren met élk (nieuw) thema.

### 6.7 Theme Toevoegen

Om een nieuw thema toe te voegen:

**Classic/Revamped theme:**
1. Voeg een metadata-entry toe aan `THEME_CATALOG` in `src/config/themes.ts`.
2. Voeg de bijbehorende CSS-regels toe in `src/styles/themes/standard.css`.

**Special theme:**
1. Voeg een metadata-entry toe aan `THEME_CATALOG` in `src/config/themes.ts` (`category: "special"`).
2. Maak een nieuw CSS-bestand aan (bijv. `src/styles/themes/special/mijn-thema.css`).
3. Importeer dit nieuwe bestand in `src/app/globals.css` (`@import "../styles/themes/special/mijn-thema.css";`).

---

## 7. Validation System

### 7.1 Validation Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Client-side (React/Zod)                                      │
│    - Formulier validatie voor directe feedback                  │
│    - Zod schemas (formTimeStringSchema voor inputs)             │
├─────────────────────────────────────────────────────────────────┤
│ 2. API Route (Server/Zod)                                       │
│    - Input validatie voor alle requests                         │
│    - Zod schemas (optionalTimeStringSchema met null)            │
├─────────────────────────────────────────────────────────────────┤
│ 3. Database (PostgreSQL)                                        │
│    - Native enums voor geldige waarden                          │
│    - Foreign keys voor relaties                                 │
│    - Constraints voor data integriteit                          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Centralized Patterns

Regex patterns in `lib/patterns.ts`:

```typescript
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;           // YYYY-MM-DD
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;     // HH:mm
export const DATE_PREFIX_REGEX = /^\d{4}-\d{2}-\d{2}/;     // Lenient for API
```

### 7.3 Form vs API Schemas

```typescript
// Forms: geen null (HTML inputs accepteren geen null)
const formTimeStringSchema = z.string()...  // string | ""

// API: null toegestaan voor database
const optionalTimeStringSchema = z.string()...  // string | null
```

---

## 8. Database Design

### 8.1 Schema Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│    Category     │◀────▶│  EventCategory   │◀────▶│      Event      │
│  (catalogus)    │      │   (M:N join)     │      │ (definitie)     │
└─────────────────┘      └──────────────────┘      └────────┬────────┘
                                                             │ 1:N
                                                             ▼
                                                    ┌─────────────────┐
                                                    │ EventOccurrence │
                                                    │   (datums)      │
                                                    └─────────────────┘

┌──────────────────────┐
│   EventSeriesEntry   │   Parent/child series-relaties tussen events
│   (M:N self-join)    │   (bijv. Navratri dag-events)
└──────────────────────┘

┌─────────────────┐         ┌─────────────────┐
│    DailyInfo    │         │  UserPreference │
│ (panchanga/day) │         │  (single-row)   │
└─────────────────┘         └─────────────────┘

┌─────────────────┐      ┌──────────────────┐
│    Practice     │◀────▶│  SadhanaItem     │
│ (beoefening)   │      │  (sessie-item)   │
└─────────────────┘      └──────┬───────────┘
                                │ N:1
                                ▼
                        ┌───────────────────┐
                        │  SadhanaSession   │
                        │  (datum, duur)    │
                        └───────────────────┘

┌─────────────────┐
│   SadhanaGoal  │   Dagelijks/wekelijks doel (malas/minuten)
└─────────────────┘
```

### 8.2 Key Tables

| Model | Beschrijving |
|-------|--------------|
| **Event** | Event-definitie (naam, type, recurrence, ruleType/ruleConfig, timing, tags, maas/tithi/nakshatra/sankranti, series-relaties) |
| **EventOccurrence** | Concrete event-instanties op datum (eventId + date uniek), optionele tijden/notities |
| **Category** | Categoriecatalogus met icon/color/colorDark/sortering |
| **EventCategory** | M:N join tussen event en categorie (met `sortOrder`, waarbij `0` primary category is) |
| **EventSeriesEntry** | Parent-child serie-relaties tussen events (optioneel `dayNumber`) |
| **DailyInfo** | Astronomische dagdata (Swiss Ephemeris) + uitgebreide Vedische velden (maas, samvat, rashi, sankranti/next transitions) |
| **UserPreference** | Single-user voorkeuren (theme, view, locatie, zichtbaarheid, notificaties) |
| **Practice** | Beoefening-definitie (naam, type mantra_japa/parayana/other, mantra_count, actief) |
| **SadhanaSession** | Sessie per dag (datum, started_at, duration_minutes, notes, totals via computed fields) |
| **SadhanaItem** | Item binnen een sessie (practice_id, quantity, unit malas/count) |
| **SadhanaGoal** | Doel (type daily/weekly, target_malas, target_minutes, actief) |

### 8.3 Native Prisma Enums

| Enum | Waarden | Gebruik |
|------|---------|---------|
| `EventType` | FESTIVAL, PUJA, VRAT, JAYANTI, TITHI, SANKRANTI, ECLIPSE, OTHER | Type event |
| `RecurrenceType` | NONE, YEARLY_LUNAR, YEARLY_SOLAR, MONTHLY_LUNAR, MONTHLY_SOLAR | Herhaling |
| `RuleType` | TITHI, SOLAR, NAKSHATRA, TITHI_NAKSHATRA, WEEKDAY_TITHI, PRADOSH, CUSTOM | Rule-engine dispatch |
| `TimingType` | NISHITA_KAAL, PRADOSH_KAAL, SUNRISE, SUNSET, MADHYAHNA | Dynamische tijdvensters |
| `CalendarView` | month, week, day, agenda | Kalender weergave |
| `Paksha` | SHUKLA (wassend), KRISHNA (afnemend) | Maanfortnight |
| `Tithi` | 30 waarden (PRATIPADA_SHUKLA t/m AMAVASYA) | Lunar dag |
| `Nakshatra` | 27 waarden (ASHWINI t/m REVATI) | Maansterrenbeeld |
| `Maas` | 12 waarden (CHAITRA t/m PHALGUNA) | Hindu maand |
| `PracticeType` | mantra_japa, parayana, other | Type beoefening (Sadhana) |
| `ItemUnit` | malas, count | Eenheid van sessie-item (Sadhana) |
| `GoalType` | daily, weekly | Type doel (Sadhana) |
| `Sankranti` | 12 solar ingress enums (MESHA..MEENA) | Solar transities |
| `MoonPhaseType` | NEW_MOON, WAXING_CRESCENT, FIRST_QUARTER, etc. | Maanfase |

---

## 9. Code Quality

### 9.1 Pre-commit Hooks

Via Husky + lint-staged, aangevuld met een eigen hook voor theme CSS:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.{js,mjs,cjs}": ["prettier --write", "eslint --fix"],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "*.css": ["prettier --write"]
  }
}
```

**Theme CSS auto-regeneratie (`.husky/pre-commit`):**

```sh
# Als themes.ts of categories.ts gestagd is → regenereer globals.css automatisch
if git diff --cached --name-only | grep -qE "src/config/(themes|categories)\.ts$"; then
  npm run generate:css
  git add src/app/globals.css
fi
```

Dit garandeert dat `globals.css` altijd gesynchroniseerd is met de config. Je hoeft `generate:css` niet handmatig te draaien bij een commit.

### 9.2 Validation Command

```bash
npm run validate  # format:check + lint + type-check
```

### 9.3 Test Coverage

Het project gebruikt **Vitest** (v8 provider) met een gelaagde test-aanpak waarbij elke laag onafhankelijk 100% line coverage nastreeft.

**Lagenmodel:**

| Laag | Inhoud | Coverage-doel |
|------|--------|---------------|
| Layer 1 | `src/lib/`, `src/engine/` (pure utils) | 100% |
| Layer 2 | `src/services/` (business logica) | 100% |
| Layer 3 | `src/server/panchanga/` (Swiss Ephemeris wrapper) | >80% |
| Layer 4 | `src/app/api/**` (API routes) | 100% |
| Layer 5 | `src/components/ui/`, core UI components | 100% |
| Layer 6 | Page-niveau components (Almanac, Events, Weather, Settings) | >80% |

**Configuratie (`vitest.config.ts`):**
```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "html"],
  exclude: [
    "src/scripts/**",     // Build scripts
    "src/generated/**",   // Prisma generated code
    "src/types/**",       // Pure type declarations
    "src/config/**",      // Catalog data (geen logica)
    "*.config.{ts,mjs}",
    "vitest.setup.ts",
    "prisma/**",
  ],
}
```

**Run:**
```bash
npm run test              # Alle tests
npm run test:coverage     # Met coverage rapport
```

**Waarom engine-functies apart testen:**
`src/engine/` bevat pure functies zonder DB-afhankelijkheid. Dit maakt deterministische unit tests mogelijk met expliciete tijdstip-data, zodat edge cases als kshaya-tithi, avondstart-tithi en Nishitakal-grensgeval (1 muhurta check) afdoende gedekt zijn.

### 9.4 Environment Validation

Zod schema voor environment variables in `lib/env.ts`:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
```

---

## 10. Scripts

### 10.1 NPM Scripts

| Script | Beschrijving |
|--------|--------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run validate` | Format + lint + type-check (pre-deployment check) |
| `npm run test` | Alle unit tests éénmalig uitvoeren (Vitest) |
| `npm run test:watch` | Tests in watch-mode (tijdens development) |
| `npm run test:coverage` | Tests + coverage rapport (v8, HTML + text) |
| `npm run db:migrate` | Database schema migratie (development) |
| `npm run db:seed` | Seed infrastructuurdata (DailyInfo/categorieën/voorkeuren) |
| `npm run db:events` | Sync eventcatalogus (`event-naming`) naar database |
| `npm run db:occurrences` | Genereer `EventOccurrence` records via recurrence engine |
| `npm run db:setup` | Volledige setup: seed + events + occurrences |
| `npm run db:cleanup` | Cleanup legacy/orphan eventdata |
| `npm run generate:css` | Theme CSS genereren vanuit config/themes.ts |

### 10.2 Database Scripts

```bash
npm run db:generate        # Prisma client genereren
npm run db:push            # Direct schema push (development-only)
npm run db:migrate         # Migratie maken en uitvoeren (development)
npm run db:migrate:deploy  # Migraties deployen (production)
npm run db:migrate:reset   # Reset database met migraties
npm run db:seed            # Seed data invoegen
npm run db:events          # Event catalog -> Event records
npm run db:occurrences     # Occurrences genereren
npm run db:setup           # Volledige initialisatie pipeline
npm run db:cleanup         # Legacy cleanup script
npm run db:studio          # Prisma Studio openen
npm run db:reset           # Reset + seed (convenience script)
```

**Huidige migraties:**
- `20251224214939_init`
- `20251225215951_add_panchanga_end_times`
- `20251226222328_fix_user_preference_id`
- `20251226224428_add_drik_panchang_fields`
- `20251227104409_add_adhika_maas_support`
- `20251227114940_add_sankranti_support`
- `20251227120542_add_rule_engine_fields`
- `20251227161859_add_event_series_parent_child`
- `20260319000000_indexes_check_constraint_dailyinfo_cleanup`
- `20260319120000_remove_rashi_enum`
- `20260324120000_event_category_m2m`
- `20260403000000_add_missing_event_timing_and_moon_iso_columns`
- `20260403000001_add_event_series_entry_table`

**Migratie strategie:**
- **Development:** Gebruik `prisma migrate dev` voor schema wijzigingen - creëert migration files en past database aan
- **Production (Docker):** `docker-entrypoint.sh` draait automatisch `prisma migrate deploy` bij container start
- **Clean Slate:** v0.10.0 heeft comprehensive init migration die alle eerdere `db push` operaties vervangt
- **Migration Files:** Alle migrations worden getrackt in `/prisma/migrations/` voor version control en rollback support

---

## 11. Lessons Learned

### 11.1 Key Design Decisions

1. **TypeScript over JSON:** Theme definities in TypeScript zijn type-safe en genereren CSS
2. **Barrel Exports:** Cleane imports en expliciete public API per module
3. **Thin Controllers Pattern:** API routes als thin controllers (max ~200 regels), services voor complexe business logica - zie §4.3.1 voor expliciete criteria
4. **Clean Slate Migrations:** Bij schema drift door `db push`, reset en maak comprehensive init migratie
5. **Server-Only Code:** Native Node.js addons (swisseph) en Prisma code worden gescheiden in `/server/` directory
6. **Pragmatic Over Pure:** Architectuur dient de code - YAGNI principle over dogmatische layering
7. **Split View/Edit Pages:** `/events/[id]` is read-only weergave; `/events/[id]/edit` is het bewerkformulier. Scheiding voorkomt onbedoeld muteren bij navigatie naar een event-detail.
8. **colorDark als DB-veld:** Categorie dark-mode kleuren staan in de database (niet alleen in CATEGORY_CATALOG), zodat elk component dat inline styles gebruikt dezelfde `colorDark` kan ophalen. Gebruik altijd `resolveCategoryColor(color, colorDark, isDark)` voor inline category-kleuren.
9. **Auto-generated reduced-motion:** Gebruik nooit handmatige `@media (prefers-reduced-motion)` in theme `additionalCss`. De CSS-generator voegt dit volledig en correct toe voor elk special theme. Het `0.01ms / iteration-count: 1` patroon garandeert dat `animationend` events blijven vuren.

### 11.2 UI/UX Patterns

1. **Semantic Tokens Over Hardcoded Colors:**
   - ✅ Gebruik `text-theme-fg` ipv `text-zinc-600 dark:text-zinc-400`
   - ✅ Gebruik `bg-theme-surface-raised` ipv `bg-white dark:bg-zinc-900`
   - ✅ Gebruik semantic tokens als default; `dark:` alleen voor gerichte uitzonderingen
   - ✅ Test altijd in beide color modes (light/dark)
   - Zie sectie 3.7 voor volledige migratierichtlijnen

2. **Flexbox over Grid Arbitrary Values:** In Tailwind v4, gebruik `flex lg:flex-row` i.p.v. `grid lg:grid-cols-[1fr,380px]`

3. **Split-view Layout:** Sticky panel met `lg:sticky lg:top-20 lg:self-start`

4. **Conditional Logging:** `logError/logWarn/logDebug` voor development-only output

5. **Component Consistency:** Nieuwe componenten moeten semantic tokens gebruiken vanaf het begin - geen hardcoded kleuren toevoegen

### 11.3 Database Strategy

1. **Calendar Dates vs Timestamps:** KRITIEK - Gebruik `parseCalendarDate()` voor kalender events (UTC midnight). Lokale midnight veroorzaakt timezone bugs waar "2025-01-01 00:00 CET" verschuift naar "2024-12-31" in de database
2. **PostgreSQL DATE Type:** `@db.Date` slaat pure dates op (YYYY-MM-DD) zonder tijd/timezone - perfect voor kalender events
3. **Form vs API Schemas:** Separate Zod schemas voor HTML inputs (geen null) vs database (null toegestaan)
4. **AbortController:** Altijd gebruiken voor fetch cleanup en request deduplication
5. **Prisma Migrate:** Gebruik `prisma migrate` voor production, niet `db push` - migrations worden getrackt in version control

---

## 12. Known Limitations

| Beperking | Reden | Workaround |
|-----------|-------|------------|
| Single user | Scope beperking | Uitbreidbaar met auth later |
| Handmatige event invoer | Geen externe Panchang API-integratie | Handmatig invoeren via EventForm |
| Locatie vast (Den Haag default) | Configureerbaar maar niet multi-locatie | Instelbaar via Settings → Locatie |
| Weerdata externe afhankelijkheid | OpenWeatherMap API key vereist | Degradeert graceful zonder weerdata |
