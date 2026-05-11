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
last_ai_date: '2026-05-11'
---

## Current State

In productie op VPS (v0.10.0). Volledig werkend: maand/week/dag/agenda kalenderweergaven, Panchang (tithi/nakshatra/yoga/karana) via Swiss Ephemeris, sadhana-tracker met routines en doelen, Kundali-geboortehoroscoop (Lahiri ayanamsa, hele-huizensysteem), encyclopedie met 41 MDX-artikelen, 5-daagse weersverwachting met kaart, iCal-export, multi-themesysteem. Recente bugfixes na Codex code review. Stabiel, op weg naar v0.11.0.

## Open Todos

- [ ] Encyclopedie uitbreiden: van 41-term array naar volledige MDX-structuur met /encyclopedie/[slug] routes (plan in conductor/encyclopedia-plan.md)
- [ ] Locatieflexibiliteit: DEFAULT_LOCATION hardcoded op Den Haag — configureerbaar maken
- [ ] Code review: src/lib/ (api-transformers, date-utils, domain, events, moon-phases, panchanga-helpers, sadhana-api, timing-utils, utils, weather, env, db)
- [ ] Code review: src/engine/ (panchanga Swiss Ephemeris wrapper, tithi-helpers)
- [ ] Code review: src/types/ + src/config/ (api.ts, calendar.ts, sadhana.ts, weather.ts, themes, categories, event-naming)
- [ ] Code review: src/hooks/ (useFetch, useFilters, useSadhanaData, useWeather, useOverlayHistory, useDebounce)
- [ ] Code review: src/components/ (~70 bestanden — calendar, almanac, sadhana, kundali, weather, ui, settings)
- [ ] Code review: src/app/ pages (almanac, events, sadhana, settings, kundali, encyclopedie, weer)

## AI Session Log
| Datum | Tool | Samenvatting |
|-------|------|-------------|
| 2026-05-11 | Claude Code | API-laag review ronde 2: 9 Codex bevindingen geimplementeerd (parseJsonBody migratie, routine active-bug, P2003 catch sessions/routines, sadhanaCalendar range-invariant, CUID-validatie sadhana routes, generieke P2002, weer map 503+NL, themes vaste timestamps, health version fallback). Reviewstatus gedocumenteerd in PROJECT.md. |

## Recent Git Activity

## Notities

Code review status (laag voor laag, binnen naar buiten): repositories DONE, services DONE, app/api DONE (2 rondes Codex). Open: lib, engine, types+config, hooks, components, app/pages.

Event pipeline: event-naming.ts (164 events) naar generate-events-from-naming.ts (sync naar DB) naar generate-occurrences.ts (CLI). Altijd in deze volgorde uitvoeren. Swiss Ephemeris berekeningen (~500ms/dag) zijn gescheiden van DB-queries om Prisma connection pool blokkering te voorkomen — parallel uitvoeren veroorzaakt 5000ms timeouts. Panchang LRU-cache met 24u TTL; vandaag altijd herberekend. Deploy via ./scripts/deploy-prod.sh (maakt automatisch backups), niet direct docker compose up.
