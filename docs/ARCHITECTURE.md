# 🗏️ Dharma Calendar - Architecture Document

> **Versie:** 3.9
> **Laatst bijgewerkt:** 26 december 2025 - Drik Panchang Extended Fields Implementation

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
- Meerdere visuele thema's voor persoonlijke voorkeur

### 1.3 Scope & Beperkingen

| Aspect | Huidige Scope | Toekomstige Mogelijkheid |
|--------|---------------|--------------------------|
| Gebruikers | Single-user | Multi-user met authenticatie |
| Deployment | Homelab / Lokaal | VPS met Docker |
| Data source | Handmatige invoer + berekening | Panchang API integratie |
| Taal | Nederlands/Engels | Meertalig (i18n) |
| Locatie | Den Haag (standaard) | Instelbare locatie |

---

## 2. System Architecture

### 2.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Home      │  │   Almanac   │  │  Settings   │              │
│  │   Page      │  │    Page     │  │    Page     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Routes                            │    │
│  │   /api/events  /api/categories  /api/daily-info  ...    │    │
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
| **Frontend** | Next.js (App Router) | 16.0.x | Server-side rendering, routing |
| **UI Framework** | React | 19.2.x | Component-based UI |
| **Styling** | Tailwind CSS | 4.1.x | Utility-first CSS |
| **Kalender** | react-big-calendar | 1.19.x | Kalender weergave |
| **Database** | PostgreSQL | 17+ | Data opslag |
| **ORM** | Prisma | 7.0.x | Database toegang |
| **Validatie** | Zod | 4.2.x | Schema validatie |
| **Datum/Tijd** | date-fns, luxon | 4.1.x, 3.7.x | Datum manipulatie |
| **Astronomie** | Swiss Ephemeris (swisseph) | 0.5.x | Vedische astronomie (Tithi, Nakshatra, Yoga, Karana) |
| **Taal** | TypeScript | 5.9.x | Type safety (ES2022 target) |
| **Accessibility** | focus-trap-react | 11.0.x | Modal focus management |
| **Icons** | lucide-react | 0.562.x | UI iconen |
| **Utilities** | tailwind-merge, clsx | 3.4.x, 2.1.x | Class utilities |
| **Code Quality** | Husky, lint-staged | 9.x, 16.x | Pre-commit hooks |

### 2.3 Project Structuur

```
dharma-calendar/
├── _dev/                      # Tijdelijke dev/test scripts (niet in git)
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
│   │   ├── layout.tsx         # Root layout + ThemeProvider
│   │   ├── page.tsx           # Homepage (kalender + sidebar)
│   │   ├── globals.css        # Globale styles + theme CSS
│   │   ├── api/               # API endpoints
│   │   │   ├── events/
│   │   │   │   ├── route.ts                    # GET (lijst), POST (aanmaken)
│   │   │   │   ├── [id]/route.ts               # GET, PUT, DELETE (specifiek event)
│   │   │   │   └── generate-occurrences/       # POST (genereer recurring occurrences)
│   │   │   │       └── route.ts
│   │   │   ├── categories/route.ts             # GET categorieën
│   │   │   ├── daily-info/route.ts             # GET zon/maan/dag info
│   │   │   ├── preferences/route.ts            # GET, PUT voorkeuren
│   │   │   ├── themes/route.ts                 # GET thema's
│   │   │   └── health/route.ts                 # GET health check
│   │   ├── almanac/
│   │   │   └── page.tsx       # Panchang Almanac (split-view)
│   │   ├── events/
│   │   │   ├── page.tsx       # Events overzicht
│   │   │   ├── new/page.tsx   # Nieuw event
│   │   │   └── [id]/page.tsx  # Event bewerken
│   │   └── settings/
│   │       └── page.tsx       # Instellingen (auto-save)
│   ├── components/            # React componenten
│   │   ├── calendar/
│   │   │   ├── index.ts               # Barrel export
│   │   │   ├── DharmaCalendar.tsx     # Hoofd kalender component
│   │   │   ├── CalendarToolbar.tsx    # Navigatie toolbar
│   │   │   ├── EventDetailModal.tsx   # Event details popup
│   │   │   └── calendar.css           # Kalender styling
│   │   ├── events/
│   │   │   ├── index.ts               # Barrel export
│   │   │   ├── EventCard.tsx          # Event card + compact variant
│   │   │   └── EventForm.tsx          # Event formulier
│   │   ├── filters/
│   │   │   ├── index.ts               # Barrel export
│   │   │   └── FilterSidebar.tsx      # Filter sidebar
│   │   ├── layout/
│   │   │   ├── index.ts               # Barrel export
│   │   │   └── PageLayout.tsx         # Standaard page wrapper component
│   │   ├── theme/
│   │   │   ├── index.ts               # Barrel export + type re-exports
│   │   │   ├── ThemeProvider.tsx      # Theme context + hook
│   │   │   └── ColorModeToggle.tsx    # Light/dark/system toggle
│   │   └── ui/
│   │       ├── index.ts               # Barrel export
│   │       ├── Header.tsx             # Navigatie header
│   │       ├── Toast.tsx              # ToastProvider + useToast
│   │       ├── MoonPhase.tsx          # SVG moon visualization
│   │       └── TodayHero.tsx          # Vandaag sectie homepage
│   ├── config/                # Configuratie (Single Source of Truth)
│   │   ├── index.ts           # Barrel export
│   │   ├── themes.ts          # Theme definities + helpers
│   │   └── categories.ts      # Categorie seed data
│   ├── generated/
│   │   └── prisma/            # Prisma client (generated)
│   ├── hooks/                 # Custom React hooks
│   │   ├── index.ts           # Barrel export
│   │   ├── useFetch.ts        # Data fetching with AbortController
│   │   ├── useDebounce.ts     # Debounce hook
│   │   └── useFilters.ts      # URL filter state hook
│   ├── lib/                   # Utilities
│   │   ├── api-response.ts    # Centralized API error responses
│   │   ├── constants.ts       # App constanten (EVENT_TYPES, TITHIS, etc.)
│   │   ├── date-utils.ts      # Centralized date/time utilities
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── env.ts             # Environment validation (Zod)
│   │   ├── moon-phases.ts     # Moon phase helpers
│   │   ├── panchanga-helpers.ts  # Panchanga calculation helpers
│   │   ├── patterns.ts        # Regex patterns voor validatie
│   │   ├── utils.ts           # Algemene utilities + logging
│   │   └── validations.ts     # Zod schemas + enum helpers
│   ├── scripts/               # Build/seed scripts
│   │   ├── generate-theme-css.ts  # Theme CSS generator
│   │   └── seed.ts                # Database seed
│   ├── server/                # Server-only code (niet bundelen in client)
│   │   └── panchanga/         # Swiss Ephemeris integratie
│   │       ├── index.ts               # Barrel export
│   │       ├── services/
│   │       │   └── PanchangaSwissService.ts  # Swiss Ephemeris calculations
│   │       ├── utils/
│   │       │   └── astro.ts           # Astronomische utilities
│   │       ├── constants.ts           # Panchanga constanten
│   │       └── types.ts               # Panchanga types
│   ├── services/              # Business logica (server-only)
│   │   ├── index.ts           # Barrel export (met server-only notes)
│   │   ├── panchanga.service.ts   # Panchanga calculations wrapper
│   │   └── recurrence.service.ts  # Event recurrence generation
│   └── types/                 # TypeScript types
│       ├── index.ts           # Barrel export
│       ├── api.ts             # API types
│       ├── calendar.ts        # Calendar/Event types
│       └── theme.ts           # Theme types
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
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
├── README.md              # Uitleg en waarschuwingen
├── audit-database.ts      # Database consistency checks
├── check-duplicates.mjs   # Find duplicate occurrences
├── test-api.mjs          # API smoke tests
└── ...                   # Andere tijdelijke helpers

# Gebruik:
npx tsx _dev/script-name.ts
node _dev/script-name.mjs
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
├── generate-theme-css.ts  # Theme CSS generation (prebuild)
└── seed.ts                # Database seeding (post-migrate)

# Gebruik (via package.json):
npm run generate:css
npm run db:seed
```

**Waarom deze scheiding?**

- ✅ **Clear separation:** Development vs Production vs Build
- ✅ **Git hygiene:** Tijdelijke scripts niet in version control
- ✅ **Safety:** Production scripts zijn reviewed en safe
- ✅ **Discoverability:** Developers weten waar scripts te vinden/plaatsen

---

## 3. Design Principes

### 3.1 Single Source of Truth

Alle configuratie en constanten komen uit één bron. Nooit hardcoded waarden in componenten.

```
✅ GOED: Waarde uit config/constants halen
❌ FOUT: Waarde direct in component typen
```

**Toepassingen:**
- Event types → `EVENT_TYPES` in lib/constants.ts
- Categorieën → `CATEGORIES` in lib/constants.ts  
- Tithi's en Nakshatra's → lib/constants.ts
- Thema's → `THEME_CATALOG` in config/themes.ts
- Standaard locatie → `DEFAULT_LOCATION` in lib/constants.ts

### 3.2 Barrel Exports

Elke folder met meerdere bestanden heeft een `index.ts` barrel export:

```typescript
// components/calendar/index.ts
export { DharmaCalendar } from "./DharmaCalendar";
export { CalendarToolbar } from "./CalendarToolbar";
export { EventDetailModal } from "./EventDetailModal";
```

**Voordelen:**
- Cleane imports: `import { DharmaCalendar } from "@/components/calendar"`
- Expliciete public API per module
- Makkelijker refactoring

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
// constants.ts - Single source of truth
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
| **Formatting** | `formatDateISO()`, `formatDateNL()`, `formatTimeAgo()` | Datum/tijd display |
| **Moon Phase** | `getMoonPhaseEmoji()`, `getMoonPhaseIllumination()`, `getMoonPhaseInfo()` | Maanfase berekeningen |

**Voordelen:**
- ✅ Single source of truth voor date operaties
- ✅ Consistent UTC handling
- ✅ Geen duplicatie van moon phase constants (LUNAR_CYCLE_DAYS, KNOWN_NEW_MOON)
- ✅ Type-safe met JSDoc documentatie
- ✅ Tree-shakeable exports

**Gebruik:**
```typescript
import {
  isSameDay,
  getMonthDays,
  formatTimeAgo,
  getMoonPhaseInfo
} from "@/lib/date-utils";

// Date comparison (UTC)
if (isSameDay(date1, date2)) { ... }

// Calendar grid
const days = getMonthDays(2025, 0); // January 2025

// Time formatting
const timeStr = formatTimeAgo("14:30", now); // "over 4u 30m"

// Moon phase (complete info)
const moon = getMoonPhaseInfo(date);
// => { emoji: "🌕", isSpecial: "full", percent: 98, isWaxing: true }
```

#### 3.5.2 Calendar Dates (voor Events)

**Gebruik:** EventOccurrence.date, DailyInfo.date - dagen waarop iets plaatsvindt

**Best Practice:**
```typescript
// ✅ CORRECT: parseCalendarDate voor kalender events
import { parseCalendarDate } from "@/lib/utils";
date: parseCalendarDate("2025-01-01")  // → 1 jan 2025 lokaal
```

**Waarom GEEN UTC:**
- "Nieuwjaar 2025" moet op 1 januari vallen, ongeacht timezone
- UTC conversie kan dag verschuiven (31 dec ↔ 1 jan)
- PostgreSQL `DATE` type heeft geen timezone info

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
| Date comparison | UTC Date | `isSameDay()` uit date-utils | N/A |
| Exact moment | Timestamp | ISO string | `DateTime` |
| Display ISO | Format | `formatDateISO()` uit date-utils | N/A |
| Display NL | Format | `formatDateNL()` uit date-utils | N/A |
| Seed data | Calendar Date | `calendarDate(y,m,d)` | `@db.Date` |

**Deprecated:**
- ❌ `parseToUTCDate()` voor calendar events (veroorzaakt timezone bugs)
- ❌ `createUTCDate()` voor calendar events
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
   - Event formatting in modals (formatDistanceToNow, isPast, isToday, etc.)

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
--theme-primary-15        /* Primary met 15% opacity */
--theme-primary-20        /* Primary met 20% opacity */
--theme-primary-25        /* Primary met 25% opacity */
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

**Migratie Status (v0.11.0):**

Alle core componenten zijn gemigreerd naar semantic tokens:
- ✅ almanac/page.tsx
- ✅ events/page.tsx
- ✅ events/new/page.tsx
- ✅ events/[id]/page.tsx
- ✅ page.tsx (homepage)
- ✅ EventDetailModal.tsx
- ✅ ColorModeToggle.tsx
- ✅ TodayHero.tsx
- ✅ MoonPhase.tsx

**Best Practices:**

1. **Gebruik nooit hardcoded zinc/gray/slate kleuren** - altijd semantic tokens
2. **Voorkom dark: modifiers** - semantic tokens handelen dit automatisch af
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
| `/api/events/generate-occurrences` | POST | Genereer recurring event occurrences op basis van recurrence type |
| `/api/categories` | GET | Alle categorieën ophalen |
| `/api/daily-info` | GET | Zon/maan/dag informatie voor datumbereik (via Swiss Ephemeris) |
| `/api/preferences` | GET, PUT | Gebruikersvoorkeuren ophalen en bijwerken |
| `/api/themes` | GET | Beschikbare thema's ophalen |
| `/api/health` | GET | Health check voor monitoring (database + pool stats) |

### 4.3 Service Layer

De service layer wordt alleen gebruikt voor complexe business logica. Alle services zijn **server-only** en mogen niet in client-side code gebundeld worden.

| Service | Locatie | Verantwoordelijkheden |
|---------|---------|----------------------|
| `PanchangaSwissService` | `/server/panchanga/` | Swiss Ephemeris integratie voor Vedische astronomie (Tithi, Nakshatra, Yoga, Karana met exacte eindtijden) + astronomische berekeningen (sunrise/sunset, moonrise/moonset) |
| `panchangaService` | `/services/panchanga.service.ts` | Wrapper voor PanchangaSwissService, exposeert high-level API voor daily info calculations, LRU caching (365 dagen, 24h TTL) |
| `recurrenceService` | `/services/recurrence.service.ts` | Event recurrence generation (YEARLY_LUNAR, YEARLY_SOLAR, MONTHLY_LUNAR, MONTHLY_SOLAR) |

**Architectuur Principes:**

1. **Server-Only Code:** Alle services gebruiken Node.js-specific libraries (swisseph native addon, Prisma) en zijn gemarkeerd met `"server-only"` import
2. **Layered Approach:**
   - `/server/panchanga/` = Low-level Swiss Ephemeris wrapper
   - `/services/` = High-level business logic die server modules gebruikt
3. **Thin Controllers Pattern:** API routes fungeren als "thin controllers" - HTTP handling, validatie, error responses
4. **No Repository Pattern:** Prisma IS al een repository/DAL layer - extra abstractie is needless overhead
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

**Voorbeeld: Events API (grensgeval)**

De `/api/events` route heeft ~250 regels met:
- Complex query building (WHERE clauses, filters)
- Data transformatie (database → calendar format)
- Prisma joins (occurrences + category)

**Is dit OK?** ✅ Ja, omdat:
- Het is specifiek voor dit endpoint (niet herbruikbaar)
- Het is vooral Prisma orchestratie, geen business logica
- Het is nog leesbaar en maintainable

**Extract naar service als:**
- Route groeit > 300 regels
- Query building wordt hergebruikt in andere endpoints
- Complexe business rules worden toegevoegd (bijv. "hide events during Rahu Kalam")

**Waarom NIET alles via services?**

Moderne architectuur (2025) is **pragmatisch**, niet **dogmatisch**:

| Anti-pattern (2015) | Modern Pattern (2025) |
|---------------------|----------------------|
| Repository over Prisma | Prisma IS het repository |
| Service voor elke entity | Services voor business logica |
| Altijd 3-layer architectuur | Vertical slice waar nodig |
| Abstractie "just in case" | YAGNI - build when needed |

**Voordelen van thin controllers:**
- ✅ **Minder boilerplate** - Geen needless `EventService.findAll()` wrapper om `prisma.event.findMany()`
- ✅ **Sneller ontwikkelen** - Direct van validatie naar database, geen extra lagen
- ✅ **Eenvoudiger debugging** - Minder files om door te navigeren
- ✅ **Duidelijke grens** - 200 regels = tijd om te refactoren

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

export const panchangaService = new PanchangaService(); // Singleton export
```

**Waarom class-based:**
- ✅ **Caching vereist:** Swiss Ephemeris calculations zijn CPU-intensive (astronomical calculations)
- ✅ **Stateful design:** LRU cache met 365 entries, 24h TTL
- ✅ **Safe caching:** Panchanga berekeningen zijn deterministisch (zelfde input = zelfde output)
- ✅ **Singleton pattern:** Eén cache instance delen across alle requests
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
/events                 → Events overzicht (card grid + filters)
/events/new             → Nieuw event aanmaken
/events/[id]            → Event bewerken + verwijderen
/settings               → Instellingen (theme, locatie, voorkeuren)
```

### 5.2 Component Hierarchy

```
RootLayout
├── ThemeProvider (context)
├── ToastProvider (context)
├── Header (navigatie, color mode toggle)
└── PageLayout (standaard wrapper voor alle pages)
    │
    ├── HomePage (spacing enabled)
    │   ├── TodayHero (zon/maan info, real-time klok)
    │   ├── DharmaCalendar (kalender grid met maanfase per dag)
    │   │   └── EventDetailModal (event details → knop naar bewerken)
    │   └── Sidebar (upcoming events, categorieën)
    │
    ├── AlmanacPage (full width, split-view layout)
    │   ├── Year/Month Navigation (jaar selector, 12-maand strip)
    │   ├── Filter Toggles (maanfases, speciale dagen, events)
    │   ├── Moon Phases Timeline (4 fasen: nieuw, 1e kwartier, vol, laatste kwartier)
    │   ├── Month Grid (7x6, met zon/maan tijden per cel)
    │   └── Day Details Panel (sticky rechts)
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
    ├── EventFormPage (narrow width)
    │   └── EventForm (formulier met lunar dropdowns)
    │
    └── SettingsPage (medium width, met loading state)
        ├── ThemeSelector (grid met preview)
        ├── ColorModeSelector (light/dark/system)
        ├── CalendarPreferences (default view, week start)
        └── LocationSettings (preset + handmatig + zon/maan preview)
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

### 5.3.2 Drik Panchang Extended Fields (v1.4.0+)

Vanaf versie 1.4.0 bevat de DailyInfo API response uitgebreide Vedische kalender velden volgens Drik Panchang standaarden:

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
const vikramaYear = gregorianYear + 57 - (isBeforeNewYear ? 1 : 0);
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
- ✅ Mounted state tracking (voorkomt state updates na unmount)

**Signature:**

```typescript
function useFetch<T>(
  url: string | null,
  options?: {
    skip?: boolean;              // Skip initial fetch
    onSuccess?: (data: T) => void;
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

**useFetchMultiple Variant:**

Voor parallel fetching van meerdere endpoints:

```typescript
const { data, loading } = useFetchMultiple<Preferences | DailyInfo>(
  ["/api/preferences", "/api/daily-info"]
);

// data[0] = Preferences
// data[1] = DailyInfo
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
- `EventForm.tsx` - Load categories (was 22 regels → nu 7 regels)
- Toekomstige refactors kunnen ~50+ regels boilerplate elimineren

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

### 5.6 Request Deduplication

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

### 6.1 Architecture

Het theme systeem is volledig TypeScript-driven:

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  config/themes.ts   │────▶│  generate-theme-css │────▶│   globals.css       │
│  (Source of Truth)  │     │  (build script)     │     │   (CSS output)      │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│   ThemeProvider     │────▶│   data-theme attr   │
│   (runtime)         │     │   + .dark class     │
└─────────────────────┘     └─────────────────────┘
```

**Key files:**
- `src/config/themes.ts` - Theme definities (THEME_CATALOG)
- `src/scripts/generate-theme-css.ts` - CSS generator
- `src/components/theme/ThemeProvider.tsx` - Runtime context
- `src/app/globals.css` - Generated CSS + base styles

### 6.2 Theme Definition

```typescript
// config/themes.ts
export interface ThemeDefinition {
  name: string;              // Unique slug (data-theme value)
  displayName: string;       // Human-readable name
  description: string;       // Short description
  isDefault: boolean;        // Default theme?
  colors: {
    primary: string;         // oklch format
    secondary: string;
    accent: string;
  };
  isSpecial?: boolean;       // Premium theme flag
  background?: ThemeBackground;
  specialStyles?: ThemeSpecialStyles;
}
```

### 6.3 Beschikbare Thema's

| Thema | Type | Beschrijving |
|-------|------|--------------|
| `spiritual-minimal` | Standard | Clean, peaceful design (default) |
| `traditional-rich` | Standard | Warm temple colors |
| `cosmic-purple` | Standard | Deep cosmic tones |
| `forest-green` | Standard | Natural, earthy vibes |
| `sunrise-orange` | Standard | Energetic morning vibes |
| `bhairava-nocturne` | ✨ Special | Midnight temple glow with indigo aurora |
| `shri-ganesha` | ✨ Special | Divine blessings with animations |

**Totaal: 7 thema's (5 standard + 2 special)**

### 6.4 Color Mode

Color mode werkt onafhankelijk van theme via:
- `.dark` class op `<html>`
- `system` volgt OS preference
- Persisted in localStorage

### 6.5 Theme Utility Classes

```css
/* Background met opacity */
.bg-theme-primary      /* 100% */
.bg-theme-primary-15   /* 15% opacity */
.bg-theme-primary-25   /* 25% opacity */

/* Text color */
.text-theme-primary
.text-theme-secondary
.text-theme-accent

/* Gradients */
.bg-theme-gradient-subtle
```

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
┌─────────────────┐         ┌─────────────────┐
│    Category     │         │  UserPreference │
│  (categorieën)  │         │  (instellingen) │
└────────┬────────┘         └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐         ┌─────────────────┐
│      Event      │         │    DailyInfo    │
│  (beschrijving) │         │ (zon/maan/dag)  │
└────────┬────────┘         └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ EventOccurrence │
│  (wanneer)      │
└─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│   LunarEvent    │         │    MoonPhase    │
│   (reserved)    │         │   (reserved)    │
└─────────────────┘         └─────────────────┘
```

### 8.2 Key Tables

| Model | Beschrijving |
|-------|--------------|
| **Event** | Wat een event is (naam, type, categorie, lunar info) |
| **EventOccurrence** | Wanneer het plaatsvindt (datum, begintijd, eindtijd, notities) |
| **Category** | Categorieën met kleuren en iconen |
| **DailyInfo** | Astronomische data per dag (Swiss Ephemeris - Tithi, Nakshatra, Yoga, Karana met eindtijden) + **Drik Panchang Extended Fields** (v1.4.0+): Maas (Amanta/Purnimanta), Vikrama/Shaka Samvat jaren, Samvatsara (60-year cycle), Sun/Moon Signs (Rashi), Pravishte/Gate, meervoudige transities per dag |
| **UserPreference** | Gebruikersinstellingen (theme, locatie, etc.) |
| **LunarEvent** | Reserved voor toekomstige eclips/speciale events |
| **MoonPhase** | Reserved voor toekomstige maanfase cache |

### 8.3 Native Prisma Enums

| Enum | Waarden | Gebruik |
|------|---------|---------|
| `EventType` | FESTIVAL, PUJA, VRAT, JAYANTI, TITHI, SANKRANTI, ECLIPSE, OTHER | Type event |
| `RecurrenceType` | NONE, YEARLY_LUNAR, YEARLY_SOLAR, MONTHLY_LUNAR, MONTHLY_SOLAR | Herhaling |
| `Importance` | MAJOR, MODERATE, MINOR | Belangrijkheid |
| `CalendarView` | month, week, day, agenda | Kalender weergave |
| `Paksha` | SHUKLA (wassend), KRISHNA (afnemend) | Maanfortnight |
| `Tithi` | 30 waarden (PRATIPADA_SHUKLA t/m AMAVASYA) | Lunar dag |
| `Nakshatra` | 27 waarden (ASHWINI t/m REVATI) | Maansterrenbeeld |
| `Maas` | 12 waarden (CHAITRA t/m PHALGUNA) | Hindu maand |
| `MoonPhaseType` | NEW_MOON, WAXING_CRESCENT, FIRST_QUARTER, etc. | Maanfase |

---

## 9. Code Quality

### 9.1 Pre-commit Hooks

Via Husky + lint-staged:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md,yml,yaml,css}": ["prettier --write"]
  }
}
```

### 9.2 Validation Command

```bash
npm run validate  # format:check + lint + type-check
```

### 9.3 Environment Validation

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
| `npm run db:migrate` | Database schema migratie (development) |
| `npm run db:seed` | Database seeden met initial data |
| `npm run generate:css` | Theme CSS genereren vanuit config/themes.ts |

### 10.2 Database Scripts

```bash
npm run db:generate        # Prisma client genereren
npm run db:migrate         # Migratie maken en uitvoeren (development)
npm run db:migrate:deploy  # Migraties deployen (production)
npm run db:migrate:reset   # Reset database met migraties
npm run db:seed            # Seed data invoegen
npm run db:studio          # Prisma Studio openen
npm run db:reset           # Reset + seed (convenience script)
```

**Huidige migraties:**
- `20251224214939_init` - Initial schema (comprehensive database setup)
- `20251225215951_add_panchanga_end_times` - Added Panchanga end times (Tithi, Nakshatra, Yoga, Karana)

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

### 11.2 UI/UX Patterns

1. **Semantic Tokens Over Hardcoded Colors:**
   - ✅ Gebruik `text-theme-fg` ipv `text-zinc-600 dark:text-zinc-400`
   - ✅ Gebruik `bg-theme-surface-raised` ipv `bg-white dark:bg-zinc-900`
   - ✅ Voorkom alle `dark:` modifiers - semantic tokens handelen dit automatisch af
   - ✅ Test altijd in beide color modes (light/dark)
   - Zie sectie 3.7 voor volledige migratierichtlijnen

2. **Flexbox over Grid Arbitrary Values:** In Tailwind v4, gebruik `flex lg:flex-row` i.p.v. `grid lg:grid-cols-[1fr,380px]`

3. **Split-view Layout:** Sticky panel met `lg:sticky lg:top-20 lg:self-start`

4. **Conditional Logging:** `logError/logWarn/logDebug` voor development-only output

5. **Component Consistency:** Nieuwe componenten moeten semantic tokens gebruiken vanaf het begin - geen hardcoded kleuren toevoegen

### 11.3 Database Strategy

1. **Calendar Dates vs Timestamps:** KRITIEK - Gebruik `parseCalendarDate()` voor kalender events (geen UTC conversie), niet `parseToUTCDate()`. UTC conversie veroorzaakt timezone bugs waar "2025-01-01" kan verschuiven naar "2024-12-31"
2. **PostgreSQL DATE Type:** `@db.Date` slaat pure dates op (YYYY-MM-DD) zonder tijd/timezone - perfect voor kalender events
3. **Form vs API Schemas:** Separate Zod schemas voor HTML inputs (geen null) vs database (null toegestaan)
4. **AbortController:** Altijd gebruiken voor fetch cleanup en request deduplication
5. **Prisma Migrate:** Gebruik `prisma migrate` voor production, niet `db push` - migrations worden getrackt in version control

---

## 12. Known Limitations

| Beperking | Reden | Workaround |
|-----------|-------|------------|
| Single user | Scope beperking | Uitbreidbaar met auth later |
| Handmatige lunar data | Geen Panchang API | Handmatig invoeren + berekening |
| Tithi berekening approximatief | Echte Panchang is complex | Acceptabel voor indicatie |
| Geen automated tests | Development focus | Test handmatig, CI/CD later |

