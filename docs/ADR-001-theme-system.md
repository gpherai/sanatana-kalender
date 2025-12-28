# ADR-001: Theme System Architecture

**Status:** Updated  
**Date:** 2025-12-05 (Updated from 2025-12-03)  
**Deciders:** Gerald (Project Owner)

## Context

The Dharma Calendar application requires a theming system that allows users to customize the visual appearance. The system has evolved through several iterations:

### Initial Problem (v1)
Theme data was duplicated across multiple locations, violating DRY.

### First Solution (v1.1)
Database as single source of truth - but CSS still needed manual [data-theme="..."] selectors.

### Current Solution (v2)
TypeScript catalog + CSS generator - true single source of truth with generated CSS.

## Decision

**Single Source of Truth: `src/config/themes.ts`**

Theme definitions exist in ONE TypeScript file. All other locations (database, CSS, types) are derived from this source.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THEME DATA FLOW (v2)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  src/config/themes.ts                                           ││
│  │  THEME_CATALOG - SINGLE SOURCE OF TRUTH                         ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                      │
│         ┌────────────────────┼────────────────────┐                 │
│         ▼                    ▼                    ▼                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  seed.ts        │  │ generate-       │  │ ThemeProvider   │      │
│  │  imports →      │  │ theme-css.ts    │  │ imports →       │      │
│  │  Database       │  │ generates →     │  │ Emergency       │      │
│  │                 │  │ globals.css     │  │ Fallback        │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│         │                    │                    │                 │
│         ▼                    ▼                    ▼                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  PostgreSQL     │  │  CSS with       │  │  React Context  │      │
│  │  Theme table    │  │  [data-theme]   │  │  + API calls    │      │
│  │                 │  │  selectors      │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/config/themes.ts` | **SINGLE SOURCE OF TRUTH** - Theme definitions |
| `src/scripts/generate-theme-css.ts` | Generates globals.css from catalog |
| `src/scripts/seed.ts` | Seeds database from catalog |
| `src/app/globals.css` | **GENERATED** - Do not edit manually |
| `src/types/theme.ts` | Re-exports types from config |
| `src/components/ui/ThemeProvider.tsx` | Runtime theme management |

### Key Principles

1. **Config is the truth** - `src/config/themes.ts` defines all themes
2. **CSS is generated** - Run `npm run generate:css` after theme changes
3. **Database is synced** - Run `npm run db:seed` after theme changes
4. **Emergency fallback** - From config, not hardcoded elsewhere

## Consequences

### Positive

- **True DRY** - One file to edit for all theme changes
- **Type-safe** - TypeScript types generated from catalog
- **Generated CSS** - No manual CSS selectors to maintain
- **Consistent** - Database and CSS always match catalog

### Negative

- **Build step** - Must run `npm run generate:css` after changes
- **Re-seed required** - Must run `npm run db:seed` after changes

### Neutral

- Emergency fallback uses default theme from catalog (not a separate definition)

## Adding a New Theme

1. Edit `src/config/themes.ts`:
   ```typescript
   export const THEME_CATALOG: readonly ThemeDefinition[] = [
     // ... existing themes ...
     {
       name: "new-theme-name",
       displayName: "New Theme Display Name",
       description: "Description of the theme",
       isDefault: false,
       colors: {
         primary: "oklch(0.65 0.15 45)",
         secondary: "oklch(0.55 0.10 200)",
         accent: "oklch(0.70 0.12 85)",
       },
     },
   ];
   ```

2. Regenerate CSS: `npm run generate:css`

3. Re-seed database: `npm run db:seed`

4. Done! Changes propagate to CSS and database automatically.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run generate:css` | Generate globals.css from theme catalog |
| `npm run db:seed` | Seed database with themes (and events) |

## Migration from v1.1

If upgrading from the previous database-only approach:

1. Ensure `src/config/themes.ts` matches your database themes
2. Run `npm run generate:css`
3. Verify globals.css is correctly generated
4. Test theme switching in the UI

## References

- Theme Catalog: `src/config/themes.ts`
- CSS Generator: `src/scripts/generate-theme-css.ts`
- Seed Script: `src/scripts/seed.ts`
- Type Definitions: `src/types/theme.ts`
- Theme Provider: `src/components/ui/ThemeProvider.tsx`
