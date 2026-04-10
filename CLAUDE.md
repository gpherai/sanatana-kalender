# Sanatana Kalender

Hindu panchanga calendar app met zon/maan-standen, maanfases, almanac en event-beheer.

## Tech Stack

- **Next.js 16**, React 19, TypeScript
- **Tailwind 4** — CSS-first config, `@theme` blocks, geen `tailwind.config.js`
- **Prisma 7** — lokale SQLite database
- **Zod 4** — validatie
- **Luxon** — datumverwerking
- **Lucide React** — iconen (geen emoji's als UI-iconen)

## Projectstructuur

```
src/
  app/           — Next.js app router pagina's (almanac, events, kalender)
  components/
    almanac/     — MonthGrid, DayDetailsPanel, AlmanacFilters, MoonPhasesTimeline
    calendar/    — DharmaCalendar, EventDetailModal, EventCard
    events/      — EventCard, EventCardCompact
    ui/          — TodayHero, MoonPhase, gedeelde componenten
  config/
    themes.ts    — ENIGE bron voor thema-definities (niet globals.css)
  app/
    globals.css  — GEGENEREERD — nooit handmatig aanpassen
  scripts/
    generate-theme-css.ts — CSS-generator
```

## Theming Systeem

**Nooit `globals.css` direct aanpassen.** Altijd:
1. Bewerk `src/config/themes.ts`
2. Voer `npm run generate:css` uit

### Thema-structuur per thema-object

```typescript
{
  name: "thema-naam",
  colors: { primary, secondary, accent },       // oklch kleurruimte
  background: { light, dark },                  // pagina-achtergrondgradiënten
  specialStyles: {
    customProperties: { "--theme-*": "waarde" }, // CSS-vars lichtmodus
    additionalCss: `
      /* CSS-overrides inclusief donkermodus: */
      .dark[[t]], [[t]].dark { --theme-*: waarde; }
    `,
  }
}
```

### CSS-var naamgeving

| Prefix | Gebruik |
|--------|---------|
| `--theme-almanac-*` | Almanac-componenten (maanfases, speciale dagen, events) |
| `--theme-calendar-*` | DharmaCalendar |
| `--theme-icon-*` | TodayHero iconen |
| `--theme-panchanga-*` | Panchanga Details kaarten (yoga, karana, rahu) |
| `--theme-glass-*` | Glas/frosted elementen |

### `[[t]]` placeholder

In `additionalCss` wordt `[[t]]` vervangen door `[data-theme="thema-naam"]` door de CSS-generator.

## Database

- **PostgreSQL** (lokaal, geen Docker) — `postgresql://gerald:password@localhost:5432/dharma_db`
- Tabel: `Event` (kolom `namingKey`), `EventOccurrence` (kolom `date`)
- **Verificatie via psql:**
  ```bash
  PGPASSWORD=password psql -h localhost -U gerald -d dharma_db -c "
  SELECT e.name, o.date::date
  FROM \"EventOccurrence\" o
  JOIN \"Event\" e ON o.\"eventId\" = e.id
  WHERE e.\"namingKey\" = '<key>'
  ORDER BY o.date;"
  ```
- **Nooit** inline `tsx -e` of `require()` gebruiken voor db-queries — schrijf een script of gebruik psql
- Prisma Studio: `npm run db:studio`

## Events Catalog

### Database bereik
- **2026-01-01 t/m 2029-12-31** — geen 2025 data

### Workflow bij catalog-wijzigingen
1. Bewerk `src/config/event-naming.ts`
2. Run `npm run db:events` — synchroniseert Event-tabel
3. Run `npm run db:occurrences -- --start 2026-01-01 --end 2029-12-31 --replace` — regenereert alle occurrences

## Vishnu Events — In Bespreking


## Sadhana Tracker — Status

### Geïmplementeerd

**Backend API** (`src/app/api/sadhana/`)
- `GET/POST /practices`, `PATCH/DELETE /practices/[id]`
- `GET/POST /sessions` (met `?from=` query param), `PATCH/DELETE /sessions/[id]`
- `GET /stats/today` — incl. goal progress + per-practice stats
- `GET /stats/streak`, `GET /stats/calendar`, `GET /stats/overview`
- `GET/POST /goals`, `PATCH/DELETE /goals/[id]`

**UI** (`src/components/sadhana/SadhanaTracker.tsx`)
- Volledige CRUD: sessies, beoefeningen, doelen
- 4 StatCards: vandaag (met `X / Y malas` bij actief doel), deze week, deze maand, streak
- Vandaag per beoefening — altijd zichtbaar, lege staat
- Activiteitsheatmap — desktop 52 wkn / mobiel 22 wkn, gelabelde legende (0, 1–3, 4–7, 8–11, ≥12), tap-feedback op mobiel
- Sessieslijst met "Laad meer" (+30 dagen per klik), verborgen als alles geladen
- All-time overzicht + per-practice breakdown + gem. min/sessie
- GoalPanel + PracticesPanel naast elkaar (lg:grid-cols-2), goal type pills
- Toast notificaties bij opslaan/verwijderen
- WCAG touch targets (44×44px), aria-labels, htmlFor/id via useId(), inputMode numeric
- `motion-safe:` prefix op alle transitions (prefers-reduced-motion)
- Light + dark mode contrast (Bhairava Nocturne getest)
- Mobiel layout geoptimaliseerd voor 412px (OnePlus 8T)
- Kalender-integratie: tithi + specialDay per sessie, heatmap-dots op heilige dagen

### Paginavolgorde (huidig)
1. Header
2. 4 StatCards
3. Sessieslijst + "Toevoegen" + Laad meer
4. Vandaag per beoefening
5. Activiteitsheatmap
6. All-time overzicht
7. Goals + Practices naast elkaar

### Wat ontbreekt t.o.v. Python referentie-backend
- `/sessions/{id}/items` sub-routes — **niet nodig**: UI doet hele-sessie replace
- `GET /sessions/{id}` enkel ophalen — **niet nodig**: UI laadt altijd de lijst

## Ontwikkeling

```bash
npm run dev           # Ontwikkelserver starten
npm run generate:css  # globals.css regenereren na thema-edits
```

## Deployment (app-VPS)

App draait in Docker op de VPS. Na een `git pull` op de VPS:

```bash
git pull && docker compose up -d --build
```

## Belangrijke Afspraken

- **oklch kleurruimte** door de hele codebase — geen hex of hsl
- Donkermodus inline-style kaarten: opacity ≥ 0.65 om zichtbaar te zijn op bijna-zwarte achtergrond
- `bg-theme-surface-raised` gebruikt volledige glas-behandeling (gradient + border + box-shadow)
- Thema-specifieke CSS-class overrides via `.panchanga-*`, `.almanac-moon-timeline` etc. in `additionalCss`
