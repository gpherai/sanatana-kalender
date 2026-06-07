# Dharma Calendar — Architecture Overview

> **Versie:** 6.2 | **Bijgewerkt:** 7 juni 2026
>
> Dit document is het startpunt. Gedetailleerde documentatie per domein:
> - [BACKEND.md](BACKEND.md) — API routes, services, repositories, validatie
> - [FRONTEND.md](FRONTEND.md) — Componenten, hooks, SSR hydration, tab navigatie
> - [THEME-SYSTEM.md](THEME-SYSTEM.md) — Theme CSS, tokens, nieuw theme toevoegen
> - [OPERATIONS.md](OPERATIONS.md) — Database schema, scripts, code quality, testing

---

## 1. Project Overzicht

### 1.1 Beschrijving

Dharma Calendar is een persoonlijke web applicatie voor het bijhouden van Sanatana Dharma events, festivals en maanfasen. De app biedt een spirituele kalender met ondersteuning voor het Hindoe maankalender systeem (Tithi, Nakshatra, Paksha, Maas).

### 1.2 Doelstellingen

- Persoonlijke spirituele kalender voor dagelijks gebruik
- Bijhouden van festivals, puja's, ekadashi en andere belangrijke dagen
- Visualisatie van maanfasen en zon/maan tijden
- Panchang Almanac met speciale lunaire dagen, maanfasen en muhurtas (Rahu Kalam, Yamagandam, Gulika Kalam, Abhijit, Vijay, Brahma Muhurta)
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
│  │   /api/sadhana/*  /api/kundali  /api/ical/export        │    │
│  │   /api/health  /api/preferences  /api/themes  /api/weer │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                   Service Layer                          │    │
│  │ panchanga + recurrence + event + sadhana + weather        │    │
│  │ home + sadhana-dashboard + preference                     │    │
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
| **Styling** | Tailwind CSS | 4.3.x | Utility-first CSS |
| **Kalender** | react-big-calendar | 1.19.x | Kalender weergave |
| **Kaart** | react-leaflet + leaflet | 5.x + 1.9.x | Weerkaart |
| **Database** | PostgreSQL | 17+ | Data opslag |
| **ORM** | Prisma (+ adapter-pg) | 7.7.x | Database toegang |
| **Validatie** | Zod | 4.4.x | Schema validatie |
| **Datum/Tijd** | date-fns, luxon | 4.2.x, 3.7.x | Datum manipulatie |
| **Astronomie** | Swiss Ephemeris (swisseph) | 0.5.x | Vedische astronomie (Tithi, Nakshatra, Yoga, Karana, Kundali) |
| **iCal export** | ical-generator | 10.1.x | .ics export |
| **MDX** | next-mdx-remote, gray-matter | 6.x, 4.x | Encyclopedie artikelen |
| **Taal** | TypeScript | 6.x | Type safety (ES2022 target) |
| **Accessibility** | focus-trap-react | 12.0.x | Modal focus management |
| **Icons** | lucide-react | 1.16.x | UI iconen |
| **Utilities** | tailwind-merge, clsx | 3.6.x, 2.1.x | Class utilities |
| **Code Quality** | Husky, lint-staged | 9.x, 17.x | Pre-commit hooks |

### 2.3 Project Structuur

Tests staan **co-located** als `__tests__/` subfolder naast de source.

```
dharma-calendar/
├── _dev/                      # Lokale ad-hoc scripts (gitignored)
├── docs/                      # Documentatie
│   └── reference/             # Referentiedata (events2026dp.md, eventscheck, research)
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/
├── scripts/                   # DevOps & deployment scripts (git tracked)
└── src/
    ├── app/                   # Next.js App Router
    │   ├── layout.tsx         # Root layout + theme init script + providers
    │   ├── page.tsx           # Homepage
    │   ├── globals.css        # Tailwind import hub
    │   ├── api/               # API routes
    │   │   ├── categories/
    │   │   ├── daily-info/
    │   │   ├── events/
    │   │   ├── health/        # Health check endpoint
    │   │   ├── ical/          # .ics export
    │   │   ├── kundali/
    │   │   ├── preferences/   # User preferences CRUD
    │   │   ├── sadhana/       # Sadhana CRUD API
    │   │   ├── themes/        # Theme listing
    │   │   └── weer/          # Weerdata + kaarttegels (map/)
    │   ├── almanac/
    │   ├── encyclopedie/
    │   ├── events/
    │   ├── kundali/           # Jyotisha geboortehoroscoop
    │   ├── sadhana/           # Sadhana tracker (SSR via getSadhanaDashboardInit)
    │   ├── settings/
    │   └── weer/
    ├── components/            # React componenten per feature
    │   ├── almanac/
    │   ├── calendar/
    │   ├── encyclopedia/
    │   ├── events/
    │   ├── filters/
    │   ├── home/              # CategoriesSection, TodayHeroSection, UpcomingEventsSection
    │   ├── kundali/           # Jyotisha charts, graha tables, dasha (geen DB)
    │   ├── layout/            # PageLayout + barrel
    │   ├── sadhana/           # SadhanaTracker + tabs/ + widgets/charts
    │   ├── settings/
    │   ├── theme/             # ThemeProvider, ColorModeToggle
    │   ├── weather/
    │   └── ui/                # Header, Toast, Section, MoonPhase
    ├── config/
    │   ├── categories.ts
    │   ├── event-naming.ts    # Eventcatalogus (158 entries)
    │   ├── rule-config.types.ts
    │   └── themes.ts          # Theme catalog + metadata
    ├── content/
    │   └── encyclopedia/      # MDX artikelen
    ├── engine/                # Pure computation engines (geen DB, geen HTTP)
    │   ├── index.ts           # Barrel export voor recurrence helpers
    │   ├── types.ts
    │   ├── tithi-helpers.ts   # Tithi helpers (gedeeld door recurrence + panchanga engine)
    │   └── panchanga/         # Swiss Ephemeris wrapper (server-only)
    │       ├── index.ts       # Runtime guard: gooit als client importeert
    │       ├── constants.ts
    │       ├── types.ts
    │       ├── services/
    │       │   ├── panchanga-swiss-service.ts
    │       │   ├── birth-chart-service.ts
    │       │   └── modules/               # 9 domain modules (split uit swiss-service)
    │       │       ├── anga-computer.ts
    │       │       ├── inauspicious-times.ts
    │       │       ├── maas-detector.ts
    │       │       ├── moon-illumination.ts
    │       │       ├── moon-phase-detector.ts
    │       │       ├── panchanga-utils.ts
    │       │       ├── rashi-computer.ts
    │       │       ├── samvat-computer.ts
    │       │       └── sankranti-detector.ts
    │       └── utils/astro.ts
    ├── hooks/
    │   ├── useAutoSave.ts
    │   ├── useDebounce.ts
    │   ├── useFetch.ts
    │   ├── useFilters.ts
    │   ├── useOverlayHistory.ts
    │   ├── useSadhanaData.ts  # Laadt sadhana-data; accepteert SSR-hydration
    │   └── useWeather.ts
    ├── lib/                   # Utilities + domein-constanten
    │   ├── api-response.ts    # Gestandaardiseerde API responses
    │   ├── api-transformers.ts  # Wire-format transformers (gedeeld door routes én SSR services)
    │   ├── category-styles.ts
    │   ├── date-utils.ts
    │   ├── db.ts              # Prisma client singleton
    │   ├── domain.ts          # DEFAULT_LOCATION + alle domein-constanten
    │   ├── encyclopedia.ts    # server-only (gebruikt Node.js fs)
    │   ├── env.ts             # Zod environment validatie
    │   ├── events.ts
    │   ├── mdx-headings.ts    # MDX heading extractie
    │   ├── moon-phases.ts
    │   ├── panchanga-client.ts  # Client-side panchanga helpers
    │   ├── panchanga-helpers.ts
    │   ├── panchanga-timing-constants.ts  # Empirisch afgestelde timing-drempelwaarden (gedeeld door recurrence + timing-utils)
    │   ├── patterns.ts
    │   ├── sadhana-api.ts     # Client-side fetch helpers voor sadhana API
    │   ├── sadhana-formatters.ts  # DTO formatters (Prisma → service types)
    │   ├── sadhana-utils.ts   # SADHANA_START_DATE, goal logica, display utils
    │   ├── timing-utils.ts
    │   ├── utils.ts
    │   ├── validations/       # Zod schemas per domein (event, sadhana, preferences, shared)
    │   └── weather.ts
    ├── repositories/          # Enige plek met directe Prisma queries
    │   ├── event.repository.ts
    │   ├── category.repository.ts
    │   ├── daily-info.repository.ts
    │   ├── preference.repository.ts
    │   └── sadhana.repository.ts
    ├── scripts/               # Build/seed scripts
    ├── services/              # Business logica & SSR orchestratie (server-only)
    │   ├── event.service.ts
    │   ├── home.service.ts            # SSR aggregatie voor home page
    │   ├── panchanga.service.ts       # LRU-cached wrapper voor engine/panchanga
    │   ├── preference.service.ts
    │   ├── recurrence/                # Recurrence engine (gesplitst in domein-modules)
    │   │   ├── index.ts
    │   │   ├── types.ts
    │   │   ├── helpers.ts             # Gedeelde recurrence helpers
    │   │   ├── tithi.ts
    │   │   ├── nakshatra.ts
    │   │   ├── solar.ts
    │   │   └── special.ts
    │   ├── sadhana-dashboard.service.ts  # SSR aggregatie voor sadhana pagina
    │   ├── sadhana.service.ts
    │   └── weather.service.ts
    ├── styles/                # Tailwind v4 CSS modules
    │   ├── base.css
    │   ├── utilities.css
    │   └── themes/
    │       ├── standard.css
    │       └── special/       # Bijzondere thema's (9): bhairava-nocturne, ganga-pravaha,
    │                          #   jyotsna-purnima, krishna-mayura, narasimha-jwala,
    │                          #   saraswati-shubhra, shri-ganesha (golden template),
    │                          #   shri-lakshmi, vasanta-ritu
    └── types/
        ├── index.ts      # Barrel
        ├── api.ts        # DailyInfoData + DailyInfoResponse
        ├── calendar.ts
        ├── sadhana.ts    # Sadhana domein types (DayInfo, Goal, Practice, ...)
        └── weather.ts
```

### 2.4 Script Directory Conventions

| Directory | Purpose | Git Tracked | Wanneer gebruiken |
|-----------|---------|-------------|-------------------|
| **`/_dev/`** | Tijdelijke development & debugging scripts | ❌ | Ad-hoc audits, one-off migrations |
| **`/scripts/`** | DevOps & deployment scripts | ✅ | Backups, Docker entrypoints, deployment |
| **`/src/scripts/`** | Application build scripts | ✅ | Database seeding, event generatie |

---

## 3. Design Principes

### 3.1 Single Source of Truth

Alle configuratie en constanten komen uit één bron. Nooit hardcoded waarden in componenten.

| Wat | Bron |
|-----|------|
| Event types, recurrence, tithi/nakshatra/maas/sankranti, default locatie | `src/lib/domain.ts` |
| Sadhana constanten (startdatum heatmap, mala tellergrootte) | `src/lib/sadhana-utils.ts` |
| Thema's | `THEME_CATALOG` in `src/config/themes.ts` |
| Categoriecatalogus | `src/config/categories.ts` |
| Eventcatalogus | `src/config/event-naming.ts` |

### 3.2 Barrel Exports

Barrel exports worden **selectief** gebruikt, niet in elke map. Huidige barrels:
`src/components/almanac/`, `filters/`, `layout/`, `sadhana/`, `settings/`, `src/types/`

### 3.3 Type Safety

TypeScript strict mode. Geen `as any` casts. `[string, unknown]` is nooit een acceptabele type-grens — gebruik concrete types.

---

## 4. Event Pipeline

```
src/config/event-naming.ts   (164 entries, pure data)
         │
         │  npm run db:events
         ▼
src/scripts/generate-events-from-naming.ts
         │  (namingKey voorkomt duplicaten bij hernoeming)
         │  npm run db:occurrences
         ▼
src/scripts/generate-occurrences.ts
         (CLI — genereert EventOccurrence records via recurrenceService)
```

---

## 5. Known Limitations

| Beperking | Reden | Workaround |
|-----------|-------|------------|
| Single user | Scope beperking | Uitbreidbaar met auth later |
| Handmatige event invoer | Geen externe Panchang API | Handmatig invoeren via EventForm |
| Locatie vast (Den Haag) | Bewuste single-user scope | Wijzig `DEFAULT_LOCATION` en hergenereer |
| Weerdata externe afhankelijkheid | OpenWeather API key vereist | Degradeert graceful zonder key |
| OpenWeather Alerts optioneel product | Alerts API toegang kan ontbreken op dezelfde key | Dashboard blijft werken; alarmen blijven leeg |
| Weerdata kort gecached | Next.js `fetch` revalidate: dashboard 10 minuten, kaarttegels 1 uur | TTL aanpassen in `weather.service.ts` of map route |
| Sadhana heatmap start op 2025-01-01 | App launch datum (`SADHANA_START_DATE`) | Aanpassen in `sadhana-utils.ts` |
