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

## Theme system
- Single source of truth: `src/config/themes.ts` → `npm run generate:css` → `src/app/globals.css`
- Pre-commit hook regenereert CSS automatisch als `themes.ts` of `categories.ts` gestaged is
- Special themes: animaties worden volledig gedekt door auto-gegenereerde `prefers-reduced-motion` blok in de generator — gebruik NOOIT handmatige `@media (prefers-reduced-motion)` blokken in `additionalCss`
- Pattern: `animation-duration: 0.01ms + iteration-count: 1` (niet `none`) zodat `animationend` events blijven werken
- Categorieën met donkere kleur (L < 0.55) krijgen verplicht `colorDark` voor dark mode zichtbaarheid
- Nieuwe utility classes toevoegen aan `src/scripts/generate-theme-css.ts`, daarna `npm run generate:css` — globals.css nooit handmatig editen
- SVG stroke/fill kleuren ALTIJD als inline `stroke="var(--theme-xxx)"` — CSS classes werken niet op SVG attributen
- `color-mix()` mag in SVG strokes; div/span backgrounds moeten theme classes gebruiken (`bg-theme-primary-30` etc.)
- Beschikbare tint classes: `bg-theme-primary-{10,15,20,30,50}`, `bg-theme-accent-{10,15,20}`, `bg-theme-fg-{4,8}`, `text-theme-stat-value`

## Dev-AI omgeving (dev-ai VM)
- Geen Docker — PostgreSQL draait native; gebruik `psql -h localhost` (niet via docker compose exec)
- VPS bereikbaar via WireGuard VPN: `gerald@10.0.0.30` poort `53001`, app in `/opt/dharma-calendar`
- DB op VPS: user `dharma`, database `dharma_calendar`
- `npm run db:pull-prod` — dump van VPS; `npm run db:import-dump` — importeer lokaal

## Sadhana pagina (`src/app/sadhana/`)
- 4 tabs via URL param `?tab=tracker|dashboard|analytics|instellingen` — state via `useSearchParams` + `router.push`
- Tab componenten in `src/components/sadhana/tabs/` — data wordt eenmalig geladen in `SadhanaTracker` en als props doorgegeven
- Heatmap `buildHeatmap(calDays, days, fromDate?)` — met `fromDate=jan1` toont het volledig kalenderjaar (toekomstige datums = null)
- Charts tonen huidig kalenderjaar (jan t/m huidige maand), niet rolling 12 maanden

## Encyclopedie (`src/content/encyclopedia/`)
- Entries zijn MDX-bestanden met YAML-frontmatter: `title`, `sanskrit`, `category`, `shortDescription`, optioneel `parent`, `isGroup`, `priority`, `devanagari`
- Categorieën: `"Speciale dagen"` | `"Devatās"` | `"Tijd"` | `"Astronomie"` | `"Navagraha"` | `"Algemeen"`
- Content is **Nederlands**; Sanskriet-termen in cursief (_Japa_), koppen in Sentence case
- Interne links: `[Tithi](/encyclopedie/tithi)` — slug = bestandsnaam zonder `.mdx`
- Workflow Drik Panchang-verrijking: gebruiker plakt ruwe Engelse tekst; Claude schrijft Nederlandse MDX-entry aan de hand van die data + bestaande codebase-context. Nieuw bestand aanmaken als slug ontbreekt, bestaand bestand aanvullen als slug al bestaat.

## Migrate troubleshooting
- Fout `42710 type already exists` of `42P07 table already exists`: schema bestaat al via `db push`. Fix: `docker compose run --rm migrate npx prisma migrate resolve --applied <migration_name>`, daarna `docker compose up -d`

## Kundali pagina (`src/app/kundali/`)
- **Geen DB** — pure berekening via `POST /api/kundali` → `BirthChartService` → Swiss Ephemeris
- **BirthChart**: `julianDay`, `ayanamsa` (Lahiri), `lagna`, `grahas: Record<GrahaKey, GrahaPosition>`
  - `GrahaPosition`: `longitude` (siderisch 0-360°), `speed` (°/dag, negatief = retrograde), `rashi`, `degreeInRashi`, `nakshatra`
  - Birth UTC uit Julian Day: `new Date((chart.julianDay - 2440587.5) * 86400000)`
- **KundaliChart.tsx**: D1 South Indian 4×4 CSS grid; exporteert `SOUTH_INDIAN_POS`, `RASHI_NAMES`, `GRAHA_*` constanten, `RashiCell`, `CellGraha` voor hergebruik in D9
- **NavamshaChart.tsx**: D9 chart — `navamshaRashi(longitude)` berekent rashi via element-triplicity + pada offset; geen extra API-call nodig
- **dasha-utils.ts**: Vimshottari 120-jaar cyclus; `calcVimshottari(moon, birthDate)` geeft 9 periodes (eerste is resterend deel nakshatra); `calcAntardasha(period)` geeft 9 sub-periodes proportioneel aan `totalMs * (antarYears / 120)`
- **VimshottariDasha.tsx**: Accordion met `useState<Set<number>>`; huidige mahadasha standaard open; alle andere uitklapbaar; antardashas tonen `◀` markering voor huidige
- **ResultView**: `"d1-chart" | "d1-table" | "d9-chart" | "d9-table"` — VimshottariDasha altijd zichtbaar onder de view
- **Nog niet geïmplementeerd**: graha aspecten, sterkte (Shadbala), D10+ charts, geboortegegevens opslaan
