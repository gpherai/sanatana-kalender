# Dharma Calendar — Theme System

> Onderdeel van de technische documentatie. Zie [ARCHITECTURE.md](ARCHITECTURE.md) voor het overzicht.

---

## 1. Bronnen En Verantwoordelijkheden

| Bestand | Verantwoordelijkheid |
|---------|----------------------|
| `src/config/themes.ts` | Type-safe catalog met theme namen, metadata, categorieën en preview-kleuren voor Settings/runtime validatie |
| `src/app/globals.css` | Importhub voor Tailwind, base CSS, utilities en theme CSS; bevat `@theme inline` mappings voor semantic `theme-*` utilities |
| `src/styles/base.css` | Root variables, default theme tokens, dark mode tokens, semantic UI tokens, stabiele theme hook consumers |
| `src/styles/utilities.css` | Custom utilities: gradients, category colors, forms, buttons, animaties — wat niet puur via `@theme` kan |
| `src/styles/themes/standard.css` | Alle standaard themes via `[data-theme="..."]` selectors |
| `src/styles/themes/special/*.css` | Special theme tokens en effect-tokens per theme (bhairava-nocturne, narasimha-jwala, shri-ganesha) |
| `src/components/theme/ThemeProvider.tsx` | Runtime theme/color-mode context, validatie, localStorage persistence |
| `src/app/layout.tsx` | Inline init script dat `data-theme` en `.dark` zet vóór hydration (voorkomt theme flash) |

---

## 2. Runtime Flow

```
THEME_CATALOG (themes.ts)
        ↓
ThemeProvider validates selected theme
        ↓
localStorage persists { themeName, colorMode }
        ↓
<html data-theme="..." class="dark?">
        ↓
CSS variables uit src/styles/** sturen de rendering
```

`ThemeProvider` haalt thema's niet uit de database. `/api/themes` kan de catalog tonen maar is niet nodig voor runtime theming.

---

## 3. Styling Contract

### Verplichte regels

1. **Theme metadata in TypeScript, styling in CSS**: voeg naam/label/categorie/preview toe in `themes.ts`, en CSS variables/selectors in de juiste CSS-bestanden.
2. **Geen generator workflow**: geen `npm run generate:css`. Wijzig CSS direct in de modulaire CSS-bestanden.
3. **Theme utilities komen uit `@theme inline`**: gebruik Tailwind utilities zoals `bg-theme-surface`, `text-theme-fg-muted`, `hover:bg-theme-hover`, `border-theme-primary/20`, `ring-theme-primary/50`.
4. **CSS variables zijn de runtime truth**: `[data-theme]` selectors wijzigen `--theme-*`; Tailwind utilities verwijzen via `--color-theme-*` naar die runtime variabelen.
5. **SVG kleuren altijd inline**: `stroke="var(--theme-xxx)"` of `fill="var(--theme-xxx)"` — CSS classes werken niet op SVG attributen. `color-mix()` is toegestaan in SVG strokes.
6. **Theme CSS blijft selector-arm**: tokens worden gezet onder `[data-theme="theme-name"]`. Geen directe overrides op `body`, `header`, `h1`, `.min-h-screen`, inputs of andere brede selectors.

### Reusable primitives (theme-neutraal)

Gebruik stabiele classes in plaats van ad-hoc combinaties:

| Class | Gebruik |
|-------|---------|
| `theme-card` | Standaard kaart (surface + border + shadow) |
| `theme-card-raised` | Verhoogde kaart |
| `theme-interactive` | Klikbaar element met hover/focus states |
| `theme-interactive-selected` | Geselecteerde variant |
| `theme-chip` | Pill/tag element |
| `theme-chip-primary` | Primaire kleur pill |
| `theme-overlay` | Modal/overlay achtergrond |
| `theme-focus-ring` | Focus indicator |

Classes staan in `base.css`; themes vullen de bijbehorende tokens in.

### Beschikbare tint classes

`bg-theme-primary-{10,15,20,25,30,40,50,80}`, `bg-theme-accent-{10,15,20}`, `bg-theme-fg-{4,8}`, `text-theme-stat-value`

### App-level theme hooks

Globale effecten lopen via tokens: `--theme-app-background`, `--theme-page-shell-background`, `--theme-header-background`, `--theme-surface-backdrop-filter`.

### Special theme animaties

Gebruik `animation-duration: 0.01ms` + `iteration-count: 1` (niet `animation: none`) zodat `animationend` events blijven werken. Geen handmatige `@media (prefers-reduced-motion)` blokken — dit staat globaal in `base.css`.

---

## 4. Nieuw Theme Toevoegen

1. Voeg metadata toe aan `THEME_CATALOG` in `src/config/themes.ts` (naam, label, categorie, previewkleuren).
2. Voeg CSS variables toe:
   - Standaard theme: `src/styles/themes/standard.css` onder `[data-theme="jouw-theme-naam"]`
   - Special theme: nieuw bestand `src/styles/themes/special/jouw-theme.css`
3. Importeer een nieuw special theme bestand in `src/app/globals.css`.
4. Test: theme switching, light/dark mode, Settings preview, een pagina met kaarten en forms.

---

## 5. Bekende Special Themes

| Theme | Bestand | Kenmerken |
|-------|---------|-----------|
| Bhairava Nocturne | `bhairava-nocturne.css` | Donkere achtergrond, krachtige gradients, complexe animaties. **Niet aanpassen** — expliciet goedgekeurd design. |
| Narasimha Jwala | `narasimha-jwala.css` | Vuur-geïnspireerd, warme tinten |
| Shri Ganesha | `shri-ganesha.css` | Gedempte gouden tonen |
