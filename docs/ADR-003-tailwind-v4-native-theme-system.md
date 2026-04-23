# ADR-003: Tailwind v4 Native Theme System

**Status:** Accepted  
**Date:** 2026-04-23  
**Decision Maker:** Gerald

## Context

The previous theme system used `src/config/themes.ts` as a TypeScript source of
truth and generated a large `src/app/globals.css` file. That approach made
theme styling harder to inspect, harder to hot-reload, and easy to drift when
the generated file was manually edited.

The application now uses Tailwind CSS v4 and benefits from native CSS imports,
CSS custom properties, and explicit `@theme inline` integration.

## Decision

Use a Tailwind v4 native, modular CSS theme architecture.

### Source Responsibilities

| File | Responsibility |
|------|----------------|
| `src/config/themes.ts` | Theme metadata, names, categories, preview colors, runtime validation |
| `src/app/globals.css` | Tailwind import hub, CSS module imports, `@theme inline` mappings for semantic `theme-*` utilities |
| `src/styles/base.css` | Root variables, semantic tokens, dark mode, base element styles, app-level theme hooks |
| `src/styles/utilities.css` | Custom gradients, category utilities, forms, buttons, animations |
| `src/styles/themes/standard.css` | Classic and revamped `[data-theme]` theme variables |
| `src/styles/themes/special/*.css` | Special theme tokens and effect tokens |
| `src/components/theme/ThemeProvider.tsx` | Runtime state, validation, localStorage persistence |
| `src/app/layout.tsx` | Inline pre-hydration theme initialization script |

### Runtime Flow

```
THEME_CATALOG metadata
        ↓
ThemeProvider validates themeName/colorMode
        ↓
localStorage persists the preference
        ↓
<html data-theme="..." class="dark?">
        ↓
CSS variables in src/styles/** drive rendering
```

There is no generated CSS step. `npm run generate:css` is intentionally not part
of the project.

## Consequences

### Positive

- CSS is directly editable, searchable, and reviewable.
- Theme styling hot-reloads during development.
- `themes.ts` is smaller and focused on runtime/UI metadata.
- Semantic theme classes are native Tailwind utilities, so variants and slash
  opacity work consistently.
- Build and validation do not require a generator step.
- Special themes can be split into dedicated files.
- Global and recurring theme effects are explicit variables consumed by stable
  app hooks (`.app-body`, `.app-page-shell`, `.app-header`, semantic surface
  utilities, primary actions, form controls, and headings) instead of ad-hoc
  broad selectors in individual theme files.

### Negative

- Metadata and CSS must be kept in sync manually when adding or renaming themes.
- `@theme inline` must be kept in sync with the semantic `--theme-*` token
  contract when new token families are introduced.

### Neutral

- `/api/themes` may expose the catalog, but runtime theming does not depend on
  the API or database.
- User preferences may be stored in the database elsewhere, but the active theme
  state used by the provider is persisted in localStorage.

## Styling Contract

1. Add or rename themes in `src/config/themes.ts`.
2. Add corresponding CSS variables/selectors in `src/styles/themes/standard.css`
   or `src/styles/themes/special/*.css`.
3. Import new special theme CSS files from `src/app/globals.css`.
4. Use semantic Tailwind utilities in components: `bg-theme-surface`,
   `text-theme-fg-muted`, `hover:bg-theme-hover`, `border-theme-primary/20`,
   `ring-theme-primary/50`, or arbitrary `var(--theme-*)` values for one-off
   cases.
5. Keep runtime theme values in CSS variables. Theme selectors override
   `--theme-*`; `@theme inline` maps those variables to Tailwind's
   `--color-theme-*` utility namespace.
6. Use app-level hook tokens for global visual effects:
   `--theme-app-background`, `--theme-page-shell-background`,
   `--theme-header-background`, `--theme-header-border`,
   `--theme-body-decoration-*`, `--theme-brand-*-animation`, and
   `--theme-surface-*-backdrop-filter`.
7. Use component effect hook tokens when a theme needs richer treatment than a
   simple color utility can express: `--theme-surface-*-background`,
   `--theme-surface-*-border-rule`, `--theme-surface-*-shadow`,
   `--theme-primary-action-*`, `--theme-control-*`,
   `--theme-heading-*`, and `--theme-primary-text-animation`.
8. Use `src/styles/utilities.css` for category utilities, complex gradients,
   forms, buttons, and animations that are not simple color-token utilities.
9. Keep standard and special theme files selector-light: set tokens under
   `[data-theme="..."]`; do not target `body`, `header`, `h1`, `.min-h-screen`,
   `.bg-theme-*`, form elements, or other broad selectors from theme files.

## Supersedes

- [ADR-001: Theme System Architecture](ADR-001-theme-system.md)
- [ADR-002: Theme System Refactoring](ADR-002-theme-system-refactor.md)
