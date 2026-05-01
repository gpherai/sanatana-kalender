# Dharma Calendar — Frontend Architecture

> Onderdeel van de technische documentatie. Zie [ARCHITECTURE.md](ARCHITECTURE.md) voor het overzicht.

---

## 1. Layout Layers

| Layer | Bestand/Map | Verantwoordelijkheid |
|-------|-------------|----------------------|
| Root layout | `src/app/layout.tsx` | Fonts, global providers, theme init script, globale documentstructuur |
| Page shell | `src/components/layout/PageLayout.tsx` | Consistente pagina-achtergrond, containerbreedtes, verticale spacing |
| Shared UI | `src/components/ui/` | `Header`, `Section`, `Toast`, `TodayHero`, `MoonPhase` |
| Feature UI | `src/components/{feature}/` | Almanac, Calendar, Events, Kundali, Sadhana, Weather, Settings, etc. |
| Feature routes | `src/app/{route}/` | Data orchestration + compositie; zo dun mogelijk |

---

## 2. Custom Hooks

Data-fetching logica is gescheiden van UI-logica via hooks in `src/hooks/`.

| Hook | Verantwoordelijkheid |
|------|----------------------|
| `useSadhanaData` | Laadt alle sadhana-data parallel (`Promise.allSettled`). Accepteert optionele `SadhanaInitialData` voor SSR hydration — loading spinner en auto-loadAll worden dan overgeslagen. `loadAll` werkt altijd (ook na SSR init) voor de refresh-knop. |
| `useWeather` | Weerdata ophalen + locatiestate |
| `useFilters` | Filterstate (types, categories, search) voor kalender en events |
| `useFetch` | Generieke loading/error/data state voor REST-calls |
| `useDebounce` | Debounce voor input-gedreven API calls |
| `useOverlayHistory` | Browser history integratie voor modals/overlays |

**Patroon**: hooks retourneren data + callbacks. Componenten ontvangen deze als props of via de hook. Nooit directe `fetch()` in componenten.

---

## 3. SSR Hydration Pattern

Voor pagina's met veel data (Home, Sadhana) wordt SSR hydration gebruikt om de eerste loading spinner te vermijden.

### Home Page

`getHomePageData()` in `home.service.ts` haalt upcomingEvents, categories, panchanga en weerdata parallel op. De Server Component geeft dit als props door aan Client Components.

### Sadhana Pagina

```
src/app/sadhana/page.tsx  (Server Component, force-dynamic)
  └─ getSadhanaDashboardInit()
       ├─ DB queries parallel (Promise.all)     ← eerst: snel
       └─ panchangaService.calculateRange()     ← daarna: CPU-zwaar
       └─ returns SadhanaInitialData

<SadhanaTracker initialData={initData} />

SadhanaTracker  (Client Component)
  └─ useSadhanaData(initialData)
       ├─ hydrateert useState direct vanuit SSR data
       ├─ loading = false (geen spinner op eerste render)
       └─ loadAll() werkt nog steeds voor handmatige refresh
```

DB queries en Swiss Ephemeris berekeningen worden **bewust gescheiden** uitgevoerd: als ze parallel lopen blokkeren de ~500ms CPU-berekeningen de Prisma connection pool en veroorzaken 5000ms timeouts.

### Tab Navigatie (Sadhana)

De sadhana tabs gebruiken `window.history.replaceState` + `useSearchParams`, **niet** `router.replace`. URL params: `?tab=tracker|dashboard|analytics|settings`.

```ts
// ✅ Client-only URL update — geen server roundtrip
const setTab = useCallback(
  (id: TabId) => window.history.replaceState(null, "", `/sadhana?tab=${id}`),
  []
);

// ❌ Triggert SSR — herberekent ~500 panchanga dagen bij elke tab-switch
const setTab = (id) => router.replace(`/sadhana?tab=${id}`, { scroll: false });
```

`router.replace` zou bij elke tab-switch `getSadhanaDashboardInit()` opnieuw aanroepen inclusief alle panchanga berekeningen. Dit is de gedocumenteerde Next.js 16 aanpak voor client-only URL updates.

---

## 4. Error Boundaries

Elke major route heeft een `error.tsx` (`"use client"`) als Next.js error boundary:

- `src/app/error.tsx`
- `src/app/events/error.tsx`
- `src/app/sadhana/error.tsx`
- `src/app/weer/error.tsx`
- `src/app/kundali/error.tsx`

Ze tonen een Nederlandse foutmelding met een retry-knop via de `reset()` callback van de Next.js error boundary API.

---

## 5. Component Boundary Rules

1. **Pages composeren, componenten renderen**: route files delegeren UI aan componenten en houden data-orchestratie zo dun mogelijk.
2. **Client Components zijn expliciet**: gebruik `"use client"` alleen voor local state, effects, browser APIs of event handlers.
3. **Gedeelde layout eerst**: nieuwe pagina's gebruiken standaard `PageLayout` voordat ze eigen spacing/background patronen introduceren.
4. **Theme tokens boven hardcoded kleuren**: UI gebruikt `bg-theme-*`, `text-theme-*`, `border-theme-*` of `var(--theme-*)`. Zie [THEME-SYSTEM.md](THEME-SYSTEM.md).
5. **SVG kleuren altijd inline**: `stroke="var(--theme-xxx)"` — CSS utility classes werken niet op SVG attributen.
6. **Mobiele layout expliciet ontwerpen**: navigatie mag niet afhankelijk zijn van toevallig passende desktop-ruimte.

---

## 6. Sadhana Pagina Structuur

De Sadhana pagina heeft 4 tabs via URL param `?tab=tracker|dashboard|analytics|instellingen`.

```
SadhanaTracker (Client Component)
  ├─ useSadhanaData(initialData)      ← alle data één keer geladen
  ├─ TrackerTab          (props)
  ├─ DashboardTab        (props)      ← heatmap + charts, year selector
  ├─ AnalyticsTab        (props)      ← donut chart, weekpatroon, trends
  └─ SettingsTab         (props)      ← practices, goals, routines CRUD
```

Alle tab-componenten zijn gewrapt in `React.memo`. Data wordt eenmalig geladen in `SadhanaTracker` en als stabiele props doorgegeven — memo is effectief.

**DayInfoMap**: `Map<string, DayInfo>` met tithi/specialDay/moonPhaseEvent per datum. Wordt gevuld via SSR init (panchanga data) of via `fetchDayInfoMap` client-side. Typed als `[string, DayInfo][]` op de SSR boundary — nooit als `unknown`. Type `DayInfo` en `DayInfoMap` zijn gedefinieerd in `src/types/sadhana.ts`.
