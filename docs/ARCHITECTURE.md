# Dharma Calendar — Architecture Document

> **Versie:** 5.3
> **Laatst bijgewerkt:** 26 april 2026

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
- Sadhana tracker voor mantra japa, parayana, meditatie sessies en gepersonaliseerde routines
- Encyclopedie van Sanatana Dharma met MDX-artikelen en zoekmogelijkheid
- Jyotisha Kundali — geboortehoroscoop met D1/D9/D10 charts en Vimshottari Dasha
- Meerdere visuele thema's voor persoonlijke voorkeur

### 1.3 Scope & Beperkingen

| Aspect | Huidige Scope | Toekomstige Mogelijkheid |
|--------|---------------|--------------------------|
| Gebruikers | Single-user | Multi-user met authenticatie |
| Deployment | VPS met Docker | Multi-instance / cloud |
| Data source | Handmatige invoer + berekening | Panchang API integratie |
| Taal | Nederlands/Engels | Meertalig (i18n) |
| Locatie | Vaste Den Haag-locatie via `DEFAULT_LOCATION` | Instelbare locatie |

---

## 2. System Architecture

### 2.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────┐ │
│  │   Home   │  │ Almanac  │  │ Settings │  │ Sadhana  │  │Kun-│ │
│  │   Page   │  │   Page   │  │   Page   │  │ Tracker  │  │dali│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬─┘ │
└───────┼─────────────┼─────────────┼──────────────┼───────────┼───┘
        │             │             │              │           │
        ▼             ▼             ▼              ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Routes                            │    │
│  │   /api/events  /api/categories  /api/daily-info          │    │
│  │   /api/sadhana/*  /api/kundali  /api/ical/export  ...   │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                   Service Layer                          │    │
│  │ panchanga + recurrence + event + sadhana + weather        │    │
│  │ home + sadhana-dashboard + sadhana-formatters             │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                  Repository Layer                        │    │
│  │     eventRepo + sadhanaRepo + categoryRepo + ...         │    │
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
| **Runtime** | Node.js | 24+ LTS | Server runtime |
| **Frontend** | Next.js (App Router) | 16.2.x | Server-side rendering, routing |
| **UI Framework** | React | 19.2.x | Component-based UI |
| **Styling** | Tailwind CSS | 4.2.x | Utility-first CSS |
| **Kalender** | react-big-calendar | 1.19.x | Kalender weergave |
| **Kaart** | react-leaflet + leaflet | 5.x + 1.9.x | Weerkaart |
| **Database** | PostgreSQL | 17+ | Data opslag |
| **ORM** | Prisma (+ adapter-pg) | 7.7.x | Database toegang |
| **Validatie** | Zod | 4.3.x | Schema validatie |
| **Datum/Tijd** | date-fns, luxon | 4.1.x, 3.7.x | Datum manipulatie |
| **Astronomie** | Swiss Ephemeris (swisseph) | 0.5.x | Vedische astronomie (Tithi, Nakshatra, Yoga, Karana, Kundali) |
| **iCal export** | ical-generator | 10.1.x | .ics export |
| **MDX** | next-mdx-remote, gray-matter | 6.x, 4.x | Encyclopedie artikelen |
| **Taal** | TypeScript | 5.x | Type safety (ES2022 target) |
| **Accessibility** | focus-trap-react | 12.0.x | Modal focus management |
| **Icons** | lucide-react | 0.577.x | UI iconen |
| **Utilities** | tailwind-merge, clsx | 3.5.x, 2.1.x | Class utilities |
| **Code Quality** | Husky, lint-staged | 9.x, 16.x | Pre-commit hooks |

### 2.3 Project Structuur

Tests staan **co-located** als `__tests__/` subfolder naast de source. Ze zijn hieronder weggelaten voor leesbaarheid.

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
│   │   ├── globals.css        # Tailwind import hub + CSS module imports
│   │   ├── api/               # API routes (/events, /daily-info, /weer, etc.)
│   │   │   └── sadhana/       # Sadhana CRUD API (/practices, /sessions, /goals, /stats/*)
│   │   ├── almanac/           # Almanac route (layout + page)
│   │   ├── encyclopedie/      # Encyclopedie route (page + [slug] dynamische artikelen)
│   │   ├── events/            # Events routes (overview / new / [id])
│   │   ├── kundali/           # Jyotisha geboortehoroscoop (D1/D9/D10 charts + Vimshottari Dasha)
│   │   ├── sadhana/           # Sadhana tracker (SSR init via getSadhanaDashboardInit)
│   │   ├── settings/          # Settings route (layout + page, auto-save)
│   │   └── weer/              # Weer dashboard route (layout + page)
│   ├── components/            # React componenten
│   │   ├── almanac/           # AlmanacFilters, AlmanacHeader, DayDetailsPanel,
│   │   │                      #   MonthGrid, MoonPhasesTimeline + index.ts barrel
│   │   ├── calendar/          # DharmaCalendar, EventDetailModal, CalendarToolbar
│   │   ├── events/            # EventCard, EventForm
│   │   ├── filters/           # FilterSidebar + index.ts barrel
│   │   ├── layout/            # PageLayout + index.ts barrel
│   │   ├── sadhana/           # SadhanaTracker + tabs/ (Tracker, Dashboard, Analytics, Instellingen)
│   │   │                      #   + AnalyticsWidgets, MalasChart, StackedPracticeChart, ...
│   │   ├── settings/          # ThemeSection, CalendarSection, LocationSection + barrel
│   │   ├── theme/             # ThemeProvider, ColorModeToggle
│   │   ├── weather/           # CurrentWeatherCard, TemperatureChart, DailyForecastSection,
│   │   │                      #   HourlyCards, WeatherMap, AirQualityCard, WeatherAstronomyCards, ...
│   │   └── ui/                # Header, Toast, Section, MoonPhase, TodayHero
│   ├── config/                # Type-safe configuratie
│   │   ├── categories.ts
│   │   ├── event-naming.ts    # Eventcatalogus (164 entries)
│   │   ├── rule-config.types.ts  # Typed ruleConfig interfaces per ruleType
│   │   └── themes.ts          # Theme catalog + metadata voor runtime/UI
│   ├── content/               # Statische content (MDX)
│   │   └── encyclopedia/      # Encyclopedie artikelen
│   ├── engine/                # Pure recurrence helpers (geen DB-toegang)
│   │   ├── index.ts           # Barrel: exporteert types + helpers
│   │   ├── tithi-helpers.ts   # groupConsecutiveDays, computeTithiOccurrence, ...
│   │   └── types.ts           # DailyInfoRow, GeneratedOccurrence, PrevDayInfo
│   ├── hooks/                 # Custom React hooks
│   │   ├── useSadhanaData.ts  # Laadt alle sadhana-data; accepteert SSR-hydration via SadhanaInitialData
│   │   ├── useWeather.ts      # Weerdata ophalen + locatiestate
│   │   ├── useFilters.ts      # Filterstate (types, categories, search)
│   │   ├── useFetch.ts        # Generieke loading/error/data state voor REST-calls
│   │   ├── useDebounce.ts     # Debounce voor input-gedreven API calls
│   │   └── useOverlayHistory.ts  # Browser history integratie voor modals/overlays
│   ├── lib/                   # Utilities + domein-constanten
│   │   ├── api-response.ts    # Gestandaardiseerde API responses
│   │   ├── api-transformers.ts  # Wire-format transformers: DailyPanchangaFull → API response,
│   │   │                        #   EventOccurrence → CalendarEventResponse (gedeeld door API routes
│   │   │                        #   en SSR services)
│   │   ├── category-styles.ts # Kleur/icoon mapping voor categorieën
│   │   ├── date-utils.ts      # isSameDay, formatDateNL, parseCalendarDate, addDayForDisplay, ...
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── default-location-date.ts  # Datum formatting in default locatie-timezone
│   │   ├── domain.ts          # Single source of truth voor UI-domeinconstanten en DEFAULT_LOCATION
│   │   ├── encyclopedia.ts    # Encyclopedie data + MDX artikelen laden
│   │   ├── env.ts             # Zod environment validatie
│   │   ├── events.ts          # Event-specifieke utilities (calendar event parsing)
│   │   ├── moon-phases.ts     # getMoonPhaseEmoji, getMoonPhaseName, getMoonPhaseType
│   │   ├── panchanga-helpers.ts  # UI-transformaties voor panchanga data
│   │   ├── patterns.ts        # Gecentraliseerde regex patterns
│   │   ├── sadhana-api.ts     # Client-side fetch helpers voor sadhana API endpoints
│   │   ├── sadhana-utils.ts   # Sadhana-constanten (SADHANA_START_DATE, MALA_BEAD_COUNT),
│   │   │                      #   goal logica, datum helpers, formatters
│   │   ├── timing-utils.ts    # parseTimeToMinutes, calculateNishitaKaal, ...
│   │   ├── utils.ts           # logError/logWarn/logDebug, classNames
│   │   ├── validations.ts     # Gedeelde Zod schemas
│   │   └── weather.ts         # Weerdata types en helpers
│   ├── repositories/          # Data Access Layer (Single Source of Truth voor DB queries)
│   │   ├── event.repository.ts
│   │   ├── category.repository.ts
│   │   ├── daily-info.repository.ts
│   │   ├── preference.repository.ts
│   │   └── sadhana.repository.ts
│   ├── scripts/               # Applicatie build/seed scripts
│   ├── server/panchanga/      # Swiss Ephemeris serverlaag (server-only)
│   │   ├── index.ts           # Barrel export
│   │   ├── constants.ts       # Ephemeris flags, ayanamsa, lokale constanten
│   │   ├── types.ts           # PanchangaResult, LocationConfig, BirthData, ...
│   │   ├── services/
│   │   │   ├── panchanga-swiss-service.ts  # Low-level Swiss Ephemeris wrapper
│   │   │   └── birth-chart-service.ts      # Jyotisha geboortehoroscoop
│   │   └── utils/
│   │       └── astro.ts       # calculateSunriseSunset, findEventEnd, ...
│   ├── styles/                # Tailwind v4 native theme CSS modules
│   │   ├── base.css           # Root tokens, semantic tokens, base styling
│   │   ├── utilities.css      # Custom theme/category utilities + animaties
│   │   └── themes/            # Standard + special theme CSS
│   ├── services/              # Businesslogica & Orchestratie (server-only)
│   │   ├── index.ts           # Barrel export
│   │   ├── event.service.ts            # Event mutations, occurrence ownership, category validatie
│   │   ├── home.service.ts             # SSR data aggregatie voor home page
│   │   ├── panchanga.service.ts        # LRU-cached wrapper voor PanchangaSwissService
│   │   ├── recurrence.service.ts       # Recurrence generatie (strategy registry)
│   │   ├── sadhana-dashboard.service.ts  # SSR data aggregatie voor Sadhana pagina
│   │   ├── sadhana-formatters.ts       # DTO-formatting voor sadhana (formatSession, formatGoal, ...)
│   │   ├── sadhana.service.ts          # Sadhana stats, streaks en aggregaties
│   │   └── weather.service.ts          # OpenWeather orchestratie en dashboard-response mapping
│   └── types/                 # Gedeelde TypeScript types
│       ├── index.ts           # Barrel export
│       ├── api.ts             # API response types
│       ├── calendar.ts        # Kalender-specifieke types (CalendarEventResponse, CalendarEvent)
│       └── weather.ts         # Weerdata types
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
├── vitest.config.ts           # Test configuratie (Vitest, v8 coverage)
└── README.md
```

### 2.4 Script Directory Conventions

| Directory | Purpose | Git Tracked | Wanneer gebruiken |
|-----------|---------|-------------|-------------------|
| **`/_dev/`** | Tijdelijke development & debugging scripts | ❌ No (.gitignore) | Ad-hoc database audits, one-off migrations, local testing |
| **`/scripts/`** | DevOps & deployment scripts | ✅ Yes | Production backups, Docker entrypoints, deployment automation |
| **`/src/scripts/`** | Application build scripts | ✅ Yes | Database seeding, production builds |

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

---

## 3. Design Principes

### 3.1 Single Source of Truth

Alle configuratie en constanten komen uit één bron. Nooit hardcoded waarden in componenten.

**Toepassingen:**
- Event types, recurrence, tithi/nakshatra/maas/sankranti en default locatie → `src/lib/domain.ts`
- Sadhana constanten (startdatum heatmap, mala tellergrootte) → `src/lib/sadhana-utils.ts`
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

### 3.3 Type Safety

TypeScript wordt strikt gebruikt. Geen `as any` casts die type checking omzeilen.

---

## 4. Backend Architecture

### 4.1 Layer Structure

Het project hanteert een strikte scheiding tussen de datalaag en de presentatielaag via het **Repository & Service Pattern**.

```
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes / Pages                          │
│  Verantwoordelijk voor:                                         │
│  - HTTP request/response handling                               │
│  - Input validatie (Zod)                                        │
│  - Orchestratie van Services of Repositories                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Service Layer                                 │
│  Verantwoordelijk voor:                                         │
│  - Business logica (bijv. berekenen van streaks of stats)        │
│  - Orchestratie over meerdere Repositories                      │
│  - Swiss Ephemeris integratie                                   │
│  - SSR data aggregatie voor complexe pagina's                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Repository Layer                               │
│  Verantwoordelijk voor:                                         │
│  - Directe Prisma queries (Single Source of Truth voor queries)  │
│  - Encapsulatie van complexe WHERE-clausules                    │
│  - Database-level integriteit (transactions)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Prisma ORM                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 API Endpoints

| Endpoint | Methoden | Verantwoordelijkheid |
|----------|----------|----------------------|
| `/api/health` | GET | Health check + DB latency |
| `/api/events` | GET | Events met occurrences (gefilterd op datum, categorie, type, tithi) |
| `/api/events/[id]` | GET / PUT / DELETE | Individueel event |
| `/api/events/generate-occurrences` | POST | Genereer/vervang EventOccurrence records |
| `/api/categories` | GET | Alle categorieën |
| `/api/daily-info` | GET | Dagelijkse panchanga data (tithi, nakshatra, etc.) |
| `/api/preferences` | GET / PUT | Single-user voorkeuren (upsert) |
| `/api/themes` | GET | Theme catalog voor externe callers |
| `/api/kundali` | POST | Jyotisha geboortehoroscoop (9 navagrahas + lagna, Lahiri ayanamsa) |
| `/api/ical/export` | GET | iCal export (.ics) van alle events |
| `/api/weer` | GET | Weerdashboard (huidig, uurlijks, dagelijks, lucht, astronomie) |
| `/api/weer/map/[layer]/[z]/[x]/[y]` | GET | Proxy voor OpenWeatherMap kaarttegels |
| `/api/sadhana/sessions` | GET / POST | Sadhana sessies lijst + aanmaken |
| `/api/sadhana/sessions/[id]` | GET / PATCH / DELETE | Individuele sessie |
| `/api/sadhana/practices` | GET / POST | Praktijken (mantra, parayana, overig) |
| `/api/sadhana/practices/[id]` | GET / PATCH / DELETE | Individuele praktijk |
| `/api/sadhana/goals` | GET / POST | Doelen (dagelijks, wekelijks, lifetime) |
| `/api/sadhana/goals/[id]` | GET / PATCH / DELETE | Individueel doel |
| `/api/sadhana/routines` | GET / POST | Routines met geordende items |
| `/api/sadhana/routines/[id]` | GET / PATCH / DELETE | Individuele routine (atomair update via transactie) |
| `/api/sadhana/stats/today` | GET | Statistieken voor vandaag |
| `/api/sadhana/stats/streak` | GET | Huidige + langste streak |
| `/api/sadhana/stats/overview` | GET | Totale aggregaten (malas, minuten, sessies) |
| `/api/sadhana/stats/calendar` | GET | Dagelijkse heatmap data voor het huidige jaar |

Alle routes gebruiken gecentraliseerde response helpers (`serverError`, `validationError`, `notFoundError` uit `src/lib/api-response.ts`) en Zod schemas uit `src/lib/validations.ts`.

### 4.3 Service Layer

| Service | Locatie | Verantwoordelijkheden |
|---------|---------|----------------------|
| `panchangaService` | `panchanga.service.ts` | Wrapper voor astronomische berekeningen, LRU caching |
| `recurrenceService` | `recurrence.service.ts` | Event recurrence generation en rule dispatching |
| `eventService` | `event.service.ts` | Event mutations, occurrence ownership, category validatie en conflictregels |
| `sadhanaService` | `sadhana.service.ts` | Berekenen van streaks, goals progress, en aggregatie van sessiedata naar statistieken |
| `weatherService` | `weather.service.ts` | OpenWeather orchestratie, foutnormalisatie en dashboard-response mapping |
| `sadhanaFormatters` | `sadhana-formatters.ts` | DTO-formatting: `formatSession`, `formatGoal`, `formatPractice`, `computePracticeStats` |
| `getHomePageData` | `home.service.ts` | SSR data aggregatie voor de home page: upcomingEvents, categories, panchanga en weather parallel; timezone-aware todayEvents |
| `getSadhanaDashboardInit` | `sadhana-dashboard.service.ts` | SSR data aggregatie voor Sadhana pagina: DB queries parallel, daarna panchanga berekeningen gescheiden om connection pool timeouts te voorkomen |

### 4.4 Repository Layer (Data Access)

De Repository layer is de **enige** plek in de applicatie die direct communiceert met `prisma`.

| Repository | Verantwoordelijkheden |
|------------|-----------------------|
| `EventRepository` | Ophalen van occurrences met complexe datum-filters en event details |
| `SadhanaRepository` | CRUD operaties voor sessies, doelen, praktijken en routines (inclusief transactions) |
| `CategoryRepository` | Ophalen en beheren van Godheden/categorieën |
| `DailyInfoRepository` | Batch queries voor DailyInfo/tithi/nakshatra/sankranti data voor recurrence-regels |
| `PreferenceRepository` | Beheren van de single-user voorkeuren (upsert pattern) |

### 4.5 API Routes vs Services: Decision Framework

1. **Pages/API Routes**: Gebruiken repositories voor simpele data-ophaling en services voor acties die logica vereisen.
2. **Repositories**: Verplicht voor **alle** database queries. Geen `prisma.xxx` calls in UI componenten of API routes.
3. **Services**: Verplicht voor berekeningen (stats, streaks) of wanneer meerdere repositories gecoördineerd moeten worden.
4. **Transformers (`lib/api-transformers.ts`)**: Zetten rijke interne domeinmodellen om in gestandaardiseerde HTTP API responses. Worden gedeeld door API routes én SSR services om duplicatie te voorkomen.

**Code Review Checklist**

```
□ Worden alle DB queries via een Repository gedaan? (Geen prisma.xxx in de route/page)
□ Is de business logica geëxtraheerd naar een Service? (Bijv. streak berekeningen)
□ Is de API route/Page dun en focust het op orchestratie?
□ Gebruikt de transformer in api-transformers.ts en niet een inline kopie?
```

---

## 5. Frontend Architecture

De frontend gebruikt de Next.js App Router met Server Components als default en Client Components alleen waar browser-state of interactie nodig is.

### 5.1 Layout Layers

| Layer | Bestand/Map | Verantwoordelijkheid |
|-------|-------------|----------------------|
| Root layout | `src/app/layout.tsx` | Fonts, global providers, theme init script, globale documentstructuur |
| Page shell | `src/components/layout/PageLayout.tsx` | Consistente pagina-achtergrond, containerbreedtes en verticale spacing |
| Shared UI | `src/components/ui/` | Herbruikbare UI-bouwstenen zoals `Header`, `Section`, `Toast`, `TodayHero` |
| Feature UI | `src/components/{feature}/` | Almanac, Calendar, Events, Sadhana, Weather, Settings, etc. |
| Feature routes | `src/app/{route}/` | Route-specifieke data orchestration en compositie |

### 5.2 Custom Hooks

| Hook | Verantwoordelijkheid |
|------|----------------------|
| `useSadhanaData` | Laadt alle sadhana-data parallel (`Promise.allSettled`). Accepteert optionele `SadhanaInitialData` voor SSR hydration — als die aanwezig is wordt de loading spinner overgeslagen en wordt `loadAll` niet automatisch aangeroepen bij mount. `loadAll` werkt altijd (ook na SSR init) voor de refresh-knop. |
| `useWeather` | Weerdata ophalen + locatiestate; WeatherDashboard is puur renderlogica |
| `useFilters` | Filterstate (types, categories, search) voor kalender en events |
| `useFetch` | Generieke loading/error/data state voor REST-calls |
| `useDebounce` | Debounce voor input-gedreven API calls |
| `useOverlayHistory` | Browser history integratie voor modals/overlays |

**Patroon**: hooks retourneren data + callbacks; componenten ontvangen deze als props of via de hook — nooit directe `fetch()` in componenten.

### 5.3 SSR Hydration Pattern

Voor pagina's met veel data (Home, Sadhana) wordt SSR hydration gebruikt om de eerste loading spinner te vermijden. De Server Component fetcht alle data voor render, de Client Component neemt de data over zonder extra roundtrip.

**Sadhana pagina:**

```
page.tsx (Server Component)
  └─ getSadhanaDashboardInit()    ← alle DB queries parallel, daarna panchanga
       └─ returns SadhanaInitialData
  └─ <SadhanaTracker initialData={initData} />

SadhanaTracker (Client Component)
  └─ useSadhanaData(initialData)  ← hydrateert useState direct vanuit SSR data
       ├─ loading = false (geen spinner)
       └─ loadAll() werkt nog steeds voor handmatige refresh
```

**Tab navigatie**: de Sadhana pagina gebruikt `window.history.replaceState` + `useSearchParams` voor tab-switches. Dit is een client-only URL update — `router.replace` zou een SSR roundtrip triggeren en de panchanga berekeningen opnieuw aanroepen.

### 5.4 Error Boundaries

Elke major route heeft een `error.tsx` (`"use client"`) als Next.js error boundary:

- `src/app/error.tsx` (home route — vangt DB/panchanga fouten op)
- `src/app/events/error.tsx`
- `src/app/sadhana/error.tsx`
- `src/app/weer/error.tsx`
- `src/app/kundali/error.tsx`

Ze tonen een Dutch-language foutmelding met een retry-knop (`reset()` vanuit Next.js error boundary API).

### 5.5 Component Boundary Rules

1. **Pages composeren, componenten renderen**: route files houden data-ophaling/orchestratie zo dun mogelijk en delegeren UI naar componenten.
2. **Client Components zijn expliciet**: gebruik `"use client"` alleen voor local state, effects, browser APIs of event handlers.
3. **Gedeelde layout eerst**: nieuwe pagina's gebruiken standaard `PageLayout` voordat ze eigen spacing/background patronen introduceren.
4. **Theme tokens boven hardcoded kleuren**: UI gebruikt `bg-theme-*`, `text-theme-*`, `border-theme-*` of `var(--theme-*)` tenzij een domeinkleur bewust buiten het thema valt.
5. **Mobiele layout expliciet ontwerpen**: globale navigatie mag niet afhankelijk zijn van toevallig passende desktop-ruimte.

---

## 6. Theme System

Het theme system is **CSS-native**. Er is geen CSS generator en `globals.css` wordt niet gegenereerd.

### 6.1 Bronnen En Verantwoordelijkheden

| Bestand | Verantwoordelijkheid |
|---------|----------------------|
| `src/config/themes.ts` | Type-safe catalog met theme namen, metadata, categorieën en preview-kleuren voor Settings/runtime validatie |
| `src/app/globals.css` | Importhub voor Tailwind, base CSS, utilities en theme CSS; bevat `@theme inline` mappings voor semantic `theme-*` utilities |
| `src/styles/base.css` | Root variables, default theme tokens, dark mode tokens, semantic UI tokens, domeintokens en stabiele theme hook consumers |
| `src/styles/utilities.css` | Aanvullende custom utilities zoals gradients, category colors, forms, buttons en animaties die niet puur uit `@theme` komen |
| `src/styles/themes/standard.css` | Classic en revamped themes via `[data-theme="..."]` selectors |
| `src/styles/themes/special/*.css` | Special theme tokens en effect-tokens per theme |
| `src/components/theme/ThemeProvider.tsx` | Runtime theme/color-mode context, validatie en localStorage persistence |
| `src/app/layout.tsx` | Inline init script dat `data-theme` en `.dark` zet voor hydration om theme flash te beperken |

### 6.2 Runtime Flow

```
THEME_CATALOG metadata
        ↓
ThemeProvider validates selected theme
        ↓
localStorage persists { themeName, colorMode }
        ↓
<html data-theme="..." class="dark?">
        ↓
CSS variables from src/styles/** control rendering
```

`ThemeProvider` haalt thema's niet uit de database. De `/api/themes` route kan de catalog tonen aan externe callers, maar is niet nodig voor runtime theming.

### 6.3 Styling Contract

1. **Theme metadata in TypeScript**: voeg nieuwe theme namen, labels, categorieën en preview-kleuren toe in `src/config/themes.ts`.
2. **Theme styling in CSS**: voeg de bijbehorende CSS variables/selectors toe in `src/styles/themes/standard.css` of een bestand onder `src/styles/themes/special/`.
3. **Geen generator workflow**: er is geen `npm run generate:css`; wijzig CSS direct in de modulaire CSS-bestanden.
4. **Theme utilities komen uit `@theme inline`**: componenten gebruiken Tailwind utilities zoals `bg-theme-surface`, `text-theme-fg-muted`, `hover:bg-theme-hover`, `border-theme-primary/20` en `ring-theme-primary/50`.
5. **CSS variables blijven de runtime truth**: `[data-theme]` selectors wijzigen `--theme-*` waarden; Tailwind utilities verwijzen via `--color-theme-*` naar die runtime variabelen.
6. **SVG kleuren altijd inline**: `stroke="var(--theme-xxx)"` of `fill="var(--theme-xxx)"` — CSS classes werken niet op SVG attributen.
7. **Reusable primitives blijven theme-neutraal**: veelvoorkomende patronen gebruiken stabiele classes zoals `theme-card`, `theme-card-raised`, `theme-interactive`, `theme-interactive-selected`, `theme-chip`, `theme-overlay` en `theme-focus-ring`.
8. **Theme CSS blijft selector-arm**: standard en special themes zetten tokens onder `[data-theme="theme-name"]`; geen directe overrides op `body`, `header`, `h1`, inputs of andere brede selectors.
9. **Animaties in special themes**: gebruik `animation-duration: 0.01ms` + `iteration-count: 1` (niet `animation: none`) zodat `animationend` events blijven werken. Geen handmatige `@media (prefers-reduced-motion)` blokken — dit staat globaal in `base.css`.

### 6.4 Nieuwe Theme Toevoegen

1. Voeg metadata toe aan `THEME_CATALOG` in `src/config/themes.ts`.
2. Voeg CSS variables toe aan `src/styles/themes/standard.css`, of maak een nieuw bestand in `src/styles/themes/special/`.
3. Importeer een nieuw special theme bestand in `src/app/globals.css`.
4. Test minimaal theme switching, light/dark mode, Settings preview, en een pagina met kaarten/forms.

---

## 7. Validation System

Alle Zod schemas zijn gecentraliseerd in `src/lib/validations.ts`. Nooit inline `z.object({...})` in routes.

### 7.1 Schema Lagen

| Schema | Gebruik |
|--------|---------|
| `eventFormSchema` | Client-side formulier validatie (leeg string toegestaan) |
| `createEventSchema` / `updateEventSchema` | Server-side API validatie (strikt) |
| `eventQuerySchema` | GET /api/events query parameters |
| `generateOccurrencesSchema` | POST /api/events/generate-occurrences |
| `updatePreferencesSchema` | PUT /api/preferences |
| `updateOccurrenceSchema` | PATCH occurrence |
| `createSadhanaSessionSchema` / `patchSadhanaSessionSchema` | Sadhana sessies |
| `createSadhanaPracticeSchema` / `patchSadhanaPracticeSchema` | Sadhana praktijken |
| `createSadhanaGoalSchema` / `patchSadhanaGoalSchema` | Sadhana doelen |
| `createSadhanaRoutineSchema` / `patchSadhanaRoutineSchema` | Sadhana routines |

### 7.2 Enum Schemas

Enum schemas worden dynamisch gegenereerd vanuit de constanten in `src/lib/domain.ts` via `createEnumFromConstants()`. Dit garandeert dat validatie en UI-opties altijd synchroon zijn.

### 7.3 Cross-Field Validatie

`withEventRecurrenceValidation()` is een `superRefine` wrapper die controleert:
- `YEARLY_LUNAR` / `MONTHLY_LUNAR` → tithi is verplicht
- `YEARLY_SOLAR` → sankranti is verplicht

### 7.4 Form → API Transform

`transformFormToApi(data: EventFormData)` converteert formulierdata naar API payload:
- Leeg strings → `null`
- Tags string → `string[]` (split, trim, lowercase)

---

## 8. Database Design

### 8.1 Models

| Model | Beschrijving |
|-------|--------------|
| `Category` | Godheden/categorieën met kleur, icoon en sortOrder. Definitie-bron is `src/config/categories.ts`. |
| `Event` | Master event definitie. Bevat recurrenceType, tithi, nakshatra, maas, sankranti, ruleType/ruleConfig voor automatische generatie, en een unieke `namingKey` die hernoeming overleeft. |
| `EventCategory` | Many-to-many join tabel Event ↔ Category. `sortOrder=0` is de primaire categorie (kleur/icoon op kalender). |
| `EventSeriesEntry` | Junction tabel voor parent-child series (bijv. Navratri-dagen). Een event kan child zijn van meerdere parent series. |
| `EventOccurrence` | Concrete occurrence op een datum. Elke combinatie `(eventId, date)` is uniek. |
| `DailyInfo` | Astronomische/lunaire data per dag. Bron voor tithi, nakshatra, yoga, karana, maas, sankranti, samvat-jaren, zon/maan tijden. Wordt gebruikt door de recurrence engine. |
| `UserPreference` | Single-user instellingen (huidig thema, default kalenderweergave, filterstatus). Wordt geüpsert op id `"default"`. |
| `SadhanaPractice` | Beoefening definitie (naam, type, mantra tekst, teller-grootte). |
| `SadhanaSession` | Sessie per dag met totaal-minuten en optionele notities. |
| `SadhanaSessionItem` | Lijn in een sessie: practice + quantity + unit (malas/count). |
| `SadhanaGoal` | Doel (dagelijks/wekelijks/lifetime) met target in malas en/of minuten. Gekoppeld aan nul of meer practices. |
| `SadhanaRoutine` | Herbruikbare template voor een sessie: geordende lijst van practices met hoeveelheden. |

### 8.2 Belangrijke Indexen

- `Event`: `eventType`, `recurrenceType`, `tags` (GIN voor array-zoekopdrachten)
- `EventOccurrence`: `date`, `endDate` — primaire query-as voor de kalender
- `DailyInfo`: `tithi`, `sankranti`, `(sankranti, date)` — recurrence engine queries
- `SadhanaSession`: `date` — heatmap en streak berekeningen

### 8.3 Enums

Vedische enums (`Tithi`, `Nakshatra`, `Maas`, `Sankranti`, `Paksha`) zijn volledig uitgeschreven in het schema en gespiegeld in `src/lib/domain.ts` voor runtime gebruik. `EventType`, `RecurrenceType`, `RuleType` en `TimingType` sturen de event-logica.

---

## 9. Code Quality

### 9.1 Pre-commit Hooks (Husky + lint-staged)

Bij elke commit worden automatisch uitgevoerd:
- **Prettier**: formatteert `.ts`, `.tsx`, `.json`, `.md`, `.yml`, `.css`
- **ESLint** (`eslint-config-next`): lint + auto-fix `.ts`, `.tsx`

Commits falen als ESLint fouten niet auto-fixable zijn.

### 9.2 TypeScript

- Strict mode actief (`tsconfig.json`)
- ES2022 target
- `tsc --noEmit` (commando: `npm run type-check`) als CI-achtige check — ook lokaal te draaien

### 9.3 Testing

| Tool | Gebruik |
|------|---------|
| **Vitest** | Unit + integration tests (`npm test`) |
| **@testing-library/react** | React component tests |
| **jsdom** | Browser environment simulatie |
| **@vitest/coverage-v8** | Code coverage rapportage (`npm run test:coverage`) |
| **Playwright** | End-to-end browser tests (`@playwright/test`) |

Tests staan co-located als `__tests__/` in de module die ze testen.

### 9.4 Tooling

- **Knip** (`npm run knip`): detecteert ongebruikte exports, bestanden en dependencies
- **`npm run validate`**: voert `format:check` + `lint` + `type-check` in één commando uit

---

## 10. Scripts

### 10.1 Development

| Script | Commando | Beschrijving |
|--------|----------|--------------|
| `dev` | `next dev --turbopack` | Development server met Turbopack |
| `build` | `next build` | Productie build |
| `start` | `next start` | Start productie build lokaal |
| `lint` | `eslint` | Linting |
| `lint:fix` | `eslint --fix` | Linting met auto-fix |
| `type-check` | `tsc --noEmit` | TypeScript controle zonder output |
| `format` | `prettier --write .` | Formattering |
| `format:check` | `prettier --check .` | Formattering check (CI) |
| `validate` | format:check + lint + type-check | Volledige kwaliteitscontrole |

### 10.2 Database

| Script | Beschrijving |
|--------|--------------|
| `db:generate` | Prisma client genereren na schema wijziging |
| `db:push` | Schema naar DB pushen (development, geen migratie) |
| `db:migrate` | Nieuwe migratie aanmaken en uitvoeren |
| `db:migrate:deploy` | Bestaande migraties uitvoeren (productie) |
| `db:migrate:reset` | DB resetten en alle migraties opnieuw uitvoeren |
| `db:seed` | Categorieën en basis data inladen |
| `db:cleanup` | Legacy events opschonen |
| `db:events` | Event catalog synchroniseren naar DB (`generate-events-from-naming.ts`) |
| `db:occurrences` | EventOccurrence records genereren (CLI; `--start`, `--end`, `--replace` flags) |
| `db:setup` | Volledig opnieuw opzetten: seed + events + occurrences 2026–2029 |
| `db:reset` | Hard reset: migrate reset --force + db:setup |
| `db:studio` | Prisma Studio (visuele DB browser) |
| `db:pull-prod` | Database dump van VPS ophalen |
| `db:import-dump` | Prod dump importeren in lokale DB |

### 10.3 Deployment & Backup

| Script | Beschrijving |
|--------|--------------|
| `deploy:prod` | Deploy naar VPS |
| `backup` | Database backup (Linux/Mac) |
| `backup:db` | Database backup via Docker compose backup profile |
| `backup:windows` | Database backup (Windows PowerShell) |

### 10.4 Tests

| Script | Beschrijving |
|--------|--------------|
| `test` | Alle tests eenmalig uitvoeren |
| `test:watch` | Tests in watch mode |
| `test:coverage` | Tests met coverage rapport |
| `knip` | Detecteer ongebruikte code |

---

## 11. Lessons Learned

### 11.1 Key Design Decisions

1. **Decoupling via Repositories**: Het direct aanroepen van Prisma in UI components (Server Components) lijkt handig, maar leidt tot technische schuld en code duplicatie. Het Repository pattern zorgt voor een stabiele API naar je data.
2. **Service Layer voor Aggregatie**: Vooral bij de Sadhana tracker is een Service layer cruciaal voor het consistent berekenen van totalen en streaks over verschillende API endpoints.
3. **SSR Hydration voor complexe pagina's**: `getSadhanaDashboardInit` en `getHomePageData` laden alle data server-side zodat de client geen loading spinner toont. DB queries en CPU-zware panchanga berekeningen worden gescheiden uitgevoerd om Prisma connection pool timeouts te vermijden.
4. **Client-only tab navigatie**: `window.history.replaceState` + `useSearchParams` is het correcte patroon voor tab-switches zonder SSR roundtrip. `router.replace` triggert een volledige server re-render en is daarvoor ongeschikt.
5. **Tailwind v4 Native CSS**: De overstap naar een native `@import` structuur heeft de codebase met duizenden regels verminderd en de onderhoudbaarheid van thema's drastisch verbeterd.
6. **Wire-format transformers in `lib/`**: `api-transformers.ts` bevat de transformatie van interne domeinmodellen naar HTTP response shapes. Door zowel API routes als SSR services dezelfde transformer te laten gebruiken, is er één definitie van het wire format.

---

## 12. Known Limitations

| Beperking | Reden | Workaround |
|-----------|-------|------------|
| Single user | Scope beperking | Uitbreidbaar met auth later |
| Handmatige event invoer | Geen externe Panchang API-integratie | Handmatig invoeren via EventForm |
| Locatie vast (Den Haag default) | Bewuste single-user scope | Wijzig `DEFAULT_LOCATION` en hergenereer locatie-afhankelijke data |
| Weerdata externe afhankelijkheid | OpenWeatherMap API key vereist | Degradeert graceful zonder weerdata |
| Geen server-side caching voor weer | Elke request roept OpenWeatherMap aan | Uitbreidbaar met Redis/ISR later |
| Sadhana heatmap start vast op 2025-01-01 | App launch datum (`SADHANA_START_DATE` in `sadhana-utils.ts`) | Aanpassen bij behoefte aan eerdere data |
