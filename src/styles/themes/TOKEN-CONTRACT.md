# Special Theme Token Contract

Every theme in the **`special`** category must drive the full design-system identity, in **both** light and dark mode. This is enforced by `src/config/__tests__/theme-coverage.test.ts`.

## The rule

`shri-ganesha` is the **golden template** — the most complete theme. The contract is defined *by* it:

- **Rule 1 — light completeness:** a theme's light block (`[data-theme="<name>"]`) must define every `--theme-*` token that Ganesha's light block defines (`LIGHT_REQ`, 171 tokens).
- **Rule 2 — dark completeness:** a theme's dark block (`.dark[data-theme="<name>"], [data-theme="<name>"].dark`) must define every `--theme-*` token that Ganesha's dark block defines (`DARK_REQ`, 147 tokens).

`DARK_REQ ⊂ LIGHT_REQ`: the ~24 tokens Ganesha sets only in light are **mode-agnostic** (body-decoration glyph, header-accent geometry, `*-animation` names, `ring`, `primary-fg`, `page-shell-background`, `*-focus`, etc.). They are inherited into dark on purpose, so dark is not required to redeclare them. Every *color/background* token Ganesha changes for dark must be redeclared by every theme — this is what prevents light values leaking into dark (`feedback-css-dark-mode-specificity`).

The required sets are derived at test time from `shri-ganesha.css`, so they self-track: improving the golden template raises the bar for all.

## In scope (identity — themes own these)

Core (`primary`/`secondary`/`accent`/`primary-fg`); foundation (`bg*`, `surface*`, `fg*`, `border*`, `divider`, `hover`/`active`/`disabled`, `ring`, `stat-value`, `glass-*`); app hooks (`app-background*`, `page-shell`, `header-*`, `body-decoration-*`, brand/heading/primary-text `*-animation`, `primary-action-*`, `surface-*` rules, `control-*`, `heading-*`); component primitives (`card-*`, `interactive-*`, `chip-*`, `overlay-*`, `focus-ring`); `hero-bg` + `hero-blob-color`; `icon-*`; `moon-*` (phase viz); `calendar-*`; `almanac-*` (moon/special/event/sun/warning + pills + day-header + moon-timeline + event-time); `panchanga-*`; `heatmap-*`.

## Out of scope (semantic-fixed — stay on `base.css`)

Tinting these per-theme would break shared meaning, so themes leave them to base:

- Status: `--theme-success* / -warning* / -error* / -info*`
- Navagraha planet colors: `--theme-almanac-planet-*` (Vedic color-coded)
- Weather chart: `--theme-weather-*`
- Encyclopedia categories: `--theme-encyl-*`
- `--theme-spinner-*`, `--theme-modal-backdrop`
- Structural non-color: `--theme-card-radius`, `--theme-body-decoration-right/-bottom`, `--theme-control-shadow`, `*-backdrop-filter` aliases, `--theme-primary-action-color`, `--theme-overlay-backdrop-filter`

## Adding a new special theme

1. **Clone `shri-ganesha.css`** → `src/styles/themes/special/<slug>.css`; rename the selector; re-hue every token to the new palette (keep the same token *names*).
2. Add a `ThemeDefinition` (`category: "special"`, `isSpecial: true`, oklch swatches) to `THEME_CATALOG` in `src/config/themes.ts`.
3. Add `@import "../styles/themes/special/<slug>.css";` to `src/app/globals.css`.
4. Give it one signature `@keyframes`, wrapped by a `@media (prefers-reduced-motion: reduce)` block that sets the `*-animation` tokens to `none`.
5. Run `npx vitest run src/config` — the guard verifies completeness + dark parity, and that catalog ↔ file ↔ import all agree.
6. Check WCAG AA (4.5:1) text contrast in both modes — especially pale themes.
