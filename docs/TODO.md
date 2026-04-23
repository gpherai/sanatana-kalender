# 📋 Dharma Calendar - TODO / Roadmap

> **Status:** Production Ready
> **Laatst bijgewerkt:** 21 maart 2026

---

## ✅ Session 40 - Code Cleanup & Architectuur (21 maart 2026)

- [x] Repository pattern voor events filter-logica (`src/repositories/event.repository.ts`)
- [x] Strategy registry voor recurrence service (vervangt switch-statements)
- [x] Verwijder dode code: `useFetchMultiple`, `ColorModeSelect`, ongebruikte type re-exports
- [x] Verwijder ad-hoc dev scripts (`check_jan_simple.mjs`, `quick_check.mjs`)
- [x] ARCHITECTURE.md v4.0 bijgewerkt

---

## ✅ Session 39 - Code Review Fixes (maart 2026)

- [x] K1: Expliciete return types op alle public service functies
- [x] K2: `noUncheckedIndexedAccess` array-toegang verbetering
- [x] K3: Gedeelde Prisma-foutafhandeling utility
- [x] H1-H6: Diverse hardening fixes (transacties, validatie, error codes)
- [x] G3, G5, G6, G9-G11: Gemini review verbeteringen (moon phase drempelwaarden, logging, etc.)
- [x] Moon phase drempelwaarden gecorrigeerd naar astronomisch correcte 45/55%

---

## ✅ Session 38 - Datum Bereik Filter (maart 2026)

- [x] Datum bereik filter in filterzijbalk
- [x] Herindeling filterzijbalk

---

## ✅ Session 37 - Purnimanta Maas Fix (maart 2026)

- [x] Correcte Purnimanta maas berekening voor Krishna paksha

---

## ✅ Session 35 - Panchang Almanac Page (19 december 2025)

- [x] Split-view layout (details altijd zichtbaar)
- [x] Jaar navigatie + 12-maanden strip
- [x] Filter toggles (Maanfases, Speciale dagen, Events)
- [x] Moon phases timeline
- [x] Maand grid met zon/maan tijden per dag
- [x] Speciale lunaire dagen (Chaturthi, Ashtami, Ekadashi, Pradosham, Chaturdashi)
- [x] Kleurcodering dag-cellen

---

## ✅ Session 34 - Semantic Tokens & Ganesha Events (19 december 2025)

- [x] Semantic token systeem (bg-theme-*, text-theme-*, border-theme-*, etc.)
- [x] CSS generator (`generate-theme-css.ts`) destijds toegevoegd; inmiddels vervangen door Tailwind v4 native CSS, zie ADR-003
- [x] Semantic token migratie voltooid in alle componenten
- [x] Ganesha events (Ganesh Jayanti, Sakat Chauth, Angaraki, Vinayaka, Sankashti, Ganesha Visarjan)

---

## ✅ Eerdere Sessies — COMPLEET

<details>
<summary>📦 Phase 0-6: Foundation tot Deployment</summary>

- [x] Next.js 16, TypeScript, Tailwind CSS v4, PostgreSQL + Prisma 7
- [x] react-big-calendar integratie + event detail modal
- [x] Event CRUD, Zod validatie, Toast notificaties
- [x] Filter sidebar + URL state sync + debounced search
- [x] UserPreference model, astronomische berekeningen (Swiss Ephemeris)
- [x] TodayHero, MoonPhase SVG, Sanskrit dagnamen
- [x] Recurrence engine (YEARLY_LUNAR/SOLAR, MONTHLY_LUNAR/SOLAR, rule-based)
- [x] EventOccurrence startTime/endTime velden in database
- [x] Parent-child event series (bijv. Navratri → 9 Navadurga dagen)
- [x] Docker multi-stage build + health endpoint
- [x] Theme systeem v2 (TypeScript als single source of truth)
- [x] Environment validatie (Zod), gecentraliseerde patterns, API response helpers

</details>

---

## 📅 Backlog

Er zijn geen kritieke open punten. Mogelijke toekomstige verbeteringen indien gewenst:

- [ ] Panchang API integratie (vervanging voor Swiss Ephemeris seed-flow)
- [ ] Custom theme creator in-app

---

## 📊 Status Overview

| Area | Status |
|------|--------|
| Foundation | ✅ Compleet |
| Views & Navigatie | ✅ Compleet |
| CRUD Operaties | ✅ Compleet |
| Filters & Zoeken | ✅ Compleet |
| Instellingen | ✅ Compleet |
| Recurrence Engine | ✅ Compleet |
| Theme Systeem | ✅ Compleet |
| Panchang Almanac | ✅ Compleet |
| Code Kwaliteit | ✅ Compleet |
| Architectuur | ✅ Compleet |

---

## 🔧 Veelgebruikte Commando's

```bash
# Development
npm run dev              # Start dev server
npm run validate         # Format + lint + type-check
npm run test             # Unit tests

# Database
npm run db:seed          # Seed database
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio

# Events & Occurrences
npx tsx --tsconfig tsconfig.json src/scripts/generate-events-from-naming.ts
curl -X POST http://localhost:3000/api/events/generate-occurrences \
  -H "Content-Type: application/json" \
  -d '{"replace": true}'

# Theme
# Theme CSS is Tailwind v4 native: edit src/styles/** directly.
```

---

## 📚 Documentatie

| Document | Beschrijving |
|----------|-------------|
| ARCHITECTURE.md (v4.0) | Technische architectuur |
| DATABASE_PROCEDURES.md | Database procedures |
| DEPLOYMENT.md | VPS deployment handleiding |
| CHANGELOG.md | Ontwikkelingsgeschiedenis |
