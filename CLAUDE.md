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

## Bhairava Nocturne — Voltooid (gemerged naar main)

### Kleurenpalet
- Indigo aura: `oklch(0.62 0.22 275)`
- Ember vuur: `oklch(0.74 0.18 45)`
- Void (bijna-zwart): `oklch(0.09 0.025 278)`

Alle Bhairava Nocturne features zijn gemerged naar `main`. Backup branches bewaard voor referentie.

## Events Catalog

### Database bereik
- **2026-01-01 t/m 2029-12-31** — geen 2025 data

### Workflow bij catalog-wijzigingen
1. Bewerk `src/config/event-naming.ts`
2. Run `npm run db:events` — synchroniseert Event-tabel
3. Run `npm run db:occurrences -- --start 2026-01-01 --end 2029-12-31 --replace` — regenereert alle occurrences

### Chaturthi events architectuur
- **Sankashti Chaturthi** (Krishna Paksha): 12 benoemde maandspecifieke entries (commit `9c7ef83`)
  - Angarki suppression via tags in `almanac/page.tsx`: "sankashti"-events verborgen wanneer "angaraka" aanwezig, tenzij ook "sakat"
  - Bug gefixed: WEEKDAY_TITHI backshift nu vóór weekdag-filter (spanning-tithi Angarki)
- **Vinayaka Chaturthi** (Shukla Paksha): `monthly_vinayaka_chaturthi` vervangen door benoemde entries — zelfde patroon als Sankashti
  - Bhadrapada: `bhadrapada_ganesh_chaturthi` (al specifiek)
  - Magha: `magha_ganesh_jayanti` (al specifiek, Gauriganesha alias)
  - Chaitra + Ashwin: naast `navadurga_dag4_kushmanda` (aparte observances, beide tonen)
  - Adhika Jyeshtha: `adhika_jyeshtha_varada_chaturthi` (isAdhikaOnly) — Adhika = Varada
  - Regulier Jyeshtha: `jyeshtha_pradyumna_chaturthi` — altijd Pradyumna (zelfde als Sankashti-patroon)

## Ontwikkeling

```bash
npm run dev           # Ontwikkelserver starten
npm run generate:css  # globals.css regenereren na thema-edits
```

Geen Docker. SQLite database is lokaal.

## Belangrijke Afspraken

- **oklch kleurruimte** door de hele codebase — geen hex of hsl
- Donkermodus inline-style kaarten: opacity ≥ 0.65 om zichtbaar te zijn op bijna-zwarte achtergrond
- `bg-theme-surface-raised` gebruikt volledige glas-behandeling (gradient + border + box-shadow)
- Thema-specifieke CSS-class overrides via `.panchanga-*`, `.almanac-moon-timeline` etc. in `additionalCss`
