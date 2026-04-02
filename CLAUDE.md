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

## Bhairava Nocturne — Status

**Actieve branch:** `feat/bhairava-card-colors`

### Kleurenpalet
- Indigo aura: `oklch(0.62 0.22 275)`
- Ember vuur: `oklch(0.74 0.18 45)`
- Void (bijna-zwart): `oklch(0.09 0.025 278)`

### Voltooid
- Hero gradient (multi-radiaal: indigo + ember + crimson)
- Almanac: moon/special/event cel+kaart+badge+icoon vars (licht + donker)
- Filterpillen: indigo actieve staat (in `feat/bhairava-almanac-fixes`)
- MoonPhasesTimeline donkermodus (in `feat/bhairava-almanac-fixes`)
- TodayHero iconen: ember zon, indigo maan
- DharmaCalendar: indigo-zilver volle maan, void nieuwe maan
- Rechter panel kaarten: zichtbaar in licht én donker (opacity 0.22→0.72)
- Panchanga yoga/karana: indigo + ember in plaats van grijs
- Rahu Kalam: rook-indigo (Rahu als eclips/as) in plaats van generiek rood
- Events in DayDetailsPanel: EventCard-stijl met kleurstrip en hover

### Veiligheidsbranches
- `backup/bhairava-pre-update` — originele staat
- `save/bhairava-v1` / `save/bhairava-v2` — mijlpalen
- `feat/bhairava-almanac-fixes` — filterpillen + MoonPhasesTimeline donker

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
