---
name: sanatana-kalender
silo: practice
status: production-ready
stack: >-
  Next.js 16.2.3, TypeScript, Prisma 7, PostgreSQL 17, Swiss Ephemeris,
  react-big-calendar, Tailwind CSS 4, Zod 4, Playwright
business_value: >-
  Vedische kalender met Panchang-berekeningen (Swiss Ephemeris), sadhana-tracker
  met streaks en analytics, Kundali-horoscoop, encyclopedie en weersmodule.
last_ai_tool: Claude Code
last_ai_date: '2026-05-12'
---

## Current State

In productie op VPS (v0.10.0). Volledig werkend: maand/week/dag/agenda kalenderweergaven, Panchang (tithi/nakshatra/yoga/karana) via Swiss Ephemeris, sadhana-tracker met routines en doelen, Kundali-geboortehoroscoop (Lahiri ayanamsa, hele-huizensysteem), encyclopedie met 41 MDX-artikelen, 5-daagse weersverwachting met kaart, iCal-export, multi-themesysteem. Recente bugfixes na Codex code review. Stabiel, op weg naar v0.11.0.

## Open Todos

- [ ] Encyclopedie uitbreiden: van 41-term array naar volledige MDX-structuur met /encyclopedie/[slug] routes (plan in conductor/encyclopedia-plan.md)
- [ ] Locatieflexibiliteit: DEFAULT_LOCATION hardcoded op Den Haag — configureerbaar maken
- [x] Code review: src/lib/ — DONE (9 fixes: taalconsistentie, JSDoc, cuidSchema Zod4, formatShortDate rename, calculationDate→generatedAt, OPENWEATHER env, sync-comments)
- [x] Code review: src/engine/ — DONE (13 fixes: panchanga Swiss Ephemeris wrapper, tithi-helpers)
- [x] Code review: src/types/ + src/config/ — DONE (7 fixes: Omit non-existent keys api.ts, snake_case→camelCase sadhana domein (32 files), type predicate→boolean themes.ts, dead fallback themes.ts, PRADOSH comment event-naming.ts, navadurga tag event-naming.ts, originalEndDate test format)
- [x] Code review: src/hooks/ — DONE (6 fixes: 'use client' 4 bestanden, loading-flash useFetch, activePractices Omit, AbortController useWeather, stale closure useOverlayHistory, pushState→replaceState useFilters)
- [x] Code review: src/components/ — DONE (16 fixes: MoonPhasesTimeline maandnaam-bug, Toast setTimeout cleanup, SessionForm stabiele keys, ColorModeToggle NL aria-label, Header sr-only patroon, LocationSection theme-tokens, type="button" overal (~20 knoppen), ThemeSection NL labels + ThemeCard refactor, ThemeProvider useMemo, EventDetailModal interface + NL foutmelding, DharmaCalendar useMemo IIFE, SadhanaTracker globale toast, graha-dignity duplicaten verwijderd)
- [ ] Code review: src/app/ pages (almanac, events, sadhana, settings, kundali, encyclopedie, weer)
## AI Session Log
| Datum | Tool | Samenvatting |
|-------|------|-------------|
| 2026-05-12 | Claude Code | src/hooks code review — 6 bevindingen geverifieerd en opgelost: 'use client' 4 hooks, loading-flash useFetch, activePractices Omit, AbortController useWeather, stale closure useOverlayHistory, pushState→replaceState useFilters |
| 2026-05-11 | Claude Code | src/types + src/config code review — 7 bevindingen opgelost: Omit non-existent keys, snake_case→camelCase sadhana domein (32 bestanden), type predicate fix, dead fallback, PRADOSH comment, navadurga tag, originalEndDate test |
| 2026-05-11 | Claude Code | src/engine code review — 13 bevindingen geverifieerd en 13 opgelost |
| 2026-05-11 | Claude Code | src/lib code review — 9 bevindingen geverifieerd en opgelost (moon-phases, date-utils, category-styles, panchanga-helpers, api-transformers, sadhana-utils rename, validations cuid Zod4, env OPENWEATHER) |
| 2026-05-11 | Claude Code | Database credentials fix en db:setup na schema drift reset |
| 2026-05-11 | Claude Code | API-laag review ronde 2: 9 Codex bevindingen geimplementeerd (parseJsonBody migratie, routine active-bug, P2003 catch sessions/routines, sadhanaCalendar range-invariant, CUID-validatie sadhana routes, generieke P2002, weer map 503+NL, themes vaste timestamps, health version fallback). Reviewstatus gedocumenteerd in PROJECT.md. |

## Recent Git Activity

## Notities

Code review status (laag voor laag, binnen naar buiten): repositories DONE, services DONE, app/api DONE (2 rondes Codex), lib DONE, engine DONE, types+config DONE, hooks DONE, components DONE (16 fixes). Open: app/pages.

Lib review bevindingen (2026-05-11): moon-phases "Unknown"→"Onbekend", isSameDay comment gecorrigeerd, category-styles JSDoc swap, panchanga-helpers null-guard + sync-comment TITHI tables, api-transformers calculationDate→generatedAt, sadhana-utils formatDate→formatShortDate (naambotsing), validations practice_id z.string().min(1)→cuidSchema + cuidSchema→z.cuid() (Zod4 top-level), env.ts OPENWEATHER_API_KEY toegevoegd aan schema (weather.service + map route gebruiken nu env.*).

Event pipeline: event-naming.ts (164 events) naar generate-events-from-naming.ts (sync naar DB) naar generate-occurrences.ts (CLI). Altijd in deze volgorde uitvoeren. Swiss Ephemeris berekeningen (~500ms/dag) zijn gescheiden van DB-queries om Prisma connection pool blokkering te voorkomen — parallel uitvoeren veroorzaakt 5000ms timeouts. Panchang LRU-cache met 24u TTL; vandaag altijd herberekend. Deploy via ./scripts/deploy-prod.sh (maakt automatisch backups), niet direct docker compose up.
