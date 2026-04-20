# 🗏️ Dharma Calendar - Architecture Document

> **Versie:** 4.9
> **Laatst bijgewerkt:** 20 april 2026

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
        ▼             ▼             ▼              ▼
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
│  │     panchangaService + recurrenceService + sadhanaService│    │
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
│   │   ├── tithi-helpers.ts   # groupConsecutiveDays, computeTithiOccurrence, ...
│   │   └── types.ts           # DailyInfoRow, GeneratedOccurrence, PrevDayInfo
│   ├── hooks/                 # useFetch, useDebounce, useFilters
│   ├── lib/                   # Utilities + domeinconstanten
│   │   ├── api-response.ts    # Gestandaardiseerde API responses
│   │   ├── category-styles.ts # Kleur/icoon mapping voor categorieën
│   │   ├── date-utils.ts      # isSameDay, formatDateNL, parseCalendarDate, ...
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── encyclopedia.ts     # Encyclopedie data + MDX artikelen
│   │   ├── domain.ts          # Single source of truth voor UI-domeinconstanten
│   │   ├── env.ts             # Zod environment validatie
│   │   ├── moon-phases.ts     # getMoonPhaseEmoji, getMoonPhaseName, ...
│   │   ├── panchanga-helpers.ts  # UI-transformaties voor panchanga data
│   │   ├── patterns.ts        # Gecentraliseerde regex patterns
│   │   ├── timing-utils.ts    # parseTimeToMinutes, calculateNishitaKaal, ...
│   │   ├── utils.ts           # logError/logWarn/logDebug, classNames
│   │   └── validations.ts     # Gedeelde Zod schemas
│   ├── repositories/          # Data Access Layer (Single Source of Truth voor DB queries)
│   │   ├── event.repository.ts
│   │   ├── category.repository.ts
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
│   ├── services/              # Businesslogica & Orchestratie (server-only)
│   │   ├── index.ts           # Barrel export
│   │   ├── panchanga.service.ts   # LRU-cached wrapper voor PanchangaSwissService
│   │   ├── recurrence.service.ts  # Recurrence generatie (strategy registry)
│   │   └── sadhana.service.ts     # Sadhana stats, streaks en aggregaties
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

### 3.3 Type Safety

TypeScript wordt strikt gebruikt. Geen `as any` casts die type checking omzeilen.

---

## 4. Backend Architecture

### 4.1 Layer Structure

Vanaf versie 4.9 hanteert het project een strikte scheiding tussen de datalaag en de presentatielaag via het **Repository & Service Pattern**.

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

(Zie §4.2 in vorige versie voor volledige lijst)

### 4.3 Service Layer

De service layer wordt gebruikt voor complexe business logica en orchestratie.

| Service | Locatie | Verantwoordelijkheden |
|---------|---------|----------------------|
| `panchangaService` | `/services/panchanga.service.ts` | Wrapper voor astronomische berekeningen, LRU caching |
| `recurrenceService` | `/services/recurrence.service.ts` | Event recurrence generation en rule dispatching |
| `sadhanaService` | `/services/sadhana.service.ts` | Berekenen van streaks, goals progress, en aggregatie van sessiedata naar statistieken |

### 4.4 Repository Layer (Data Access)

De Repository layer is de **enige** plek in de applicatie die direct communiceert met `prisma`. Dit zorgt voor herbruikbare queries en een cleanere presentatielaag.

| Repository | Verantwoordelijkheden |
|------------|-----------------------|
| `EventRepository` | Ophalen van occurrences met complexe datum-filters en event details |
| `SadhanaRepository` | CRUD operaties voor sessies, doelen, praktijken en routines (inclusief transactions) |
| `CategoryRepository` | Ophalen en beheren van Godheden/categorieën |
| `PreferenceRepository` | Beheren van de single-user voorkeuren (upsert pattern) |

### 4.3.1 API Routes vs Services: Decision Framework

Het project gebruikt een **pragmatisch gelaagd systeem**:

1. **Pages/API Routes**: Gebruiken repositories voor simpele data-ophaling en services voor acties die logica vereisen.
2. **Repositories**: Verplicht voor **alle** database queries. Geen `prisma.xxx` calls meer in UI componenten of API routes.
3. **Services**: Verplicht voor berekeningen (stats, streaks) of wanneer meerdere repositories gecoördineerd moeten worden.

**📋 Code Review Checklist**

```
□ Worden alle DB queries via een Repository gedaan? (Geen prisma.xxx in de route/page)
□ Is de business logica geëxtraheerd naar een Service? (Bijv. streak berekeningen)
□ Is de API route/Page dun en focust het op orchestratie?
```

---

## 5. Frontend Architecture

(Zie §5 in vorige versie voor volledige routing en component hiërarchie)

---

## 6. Theme System

(Zie §6 in vorige versie voor Tailwind v4 Native architecture)

---

## 7. Validation System

(Zie §7 in vorige versie voor Zod validatie lagen)

---

## 8. Database Design

(Zie §8 in vorige versie voor schema details)

---

## 9. Code Quality

(Zie §9 in vorige versie voor pre-commit hooks en test coverage)

---

## 10. Scripts

(Zie §10 in vorige versie voor NPM en Database scripts)

---

## 11. Lessons Learned

### 11.1 Key Design Decisions

1. **Decoupling via Repositories**: Het direct aanroepen van Prisma in UI components (Server Components) lijkt handig, maar leidt tot technische schuld en code duplicatie. Het Repository pattern zorgt voor een stabiele API naar je data.
2. **Service Layer voor Aggregatie**: Vooral bij de Sadhana tracker is een Service layer cruciaal voor het consistent berekenen van totalen en streaks over verschillende API endpoints.
3. **Tailwind v4 Native CSS**: De overstap naar een native `@import` structuur heeft de codebase met duizenden regels verminderd en de onderhoudbaarheid van thema's drastisch verbeterd.

---

## 12. Known Limitations

| Beperking | Reden | Workaround |
|-----------|-------|------------|
| Single user | Scope beperking | Uitbreidbaar met auth later |
| Handmatige event invoer | Geen externe Panchang API-integratie | Handmatig invoeren via EventForm |
| Locatie vast (Den Haag default) | Configureerbaar maar niet multi-locatie | Instelbaar via Settings → Locatie |
| Weerdata externe afhankelijkheid | OpenWeatherMap API key vereist | Degradeert graceful zonder weerdata |
