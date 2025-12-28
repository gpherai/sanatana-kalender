# ADR-002: Theme System Refactoring

**Status:** Accepted  
**Date:** 2025-12-10  
**Decision Maker:** Gerald

## Context

The original theme system had several architectural issues:

1. **Triple Redundancy**: Themes were defined in three places (TypeScript THEME_CATALOG, Database, Generated CSS) that needed to stay in sync
2. **CSS Drift**: The `globals.css` was manually edited after generation, causing the generated CSS to differ from the TypeScript definitions
3. **Unnecessary Database Dependency**: ThemeProvider fetched themes from API at runtime, even though CSS styling came from a static file
4. **Duplicate Types**: Types were defined in both `config/themes.ts` and `types/theme.ts`
5. **Complex Fallback Logic**: Required emergency fallback themes and isFallback states

## Decision

Refactor the theme system to follow **TypeScript as Single Source of Truth** architecture:

### 1. Single Source of Truth
- `src/config/themes.ts` contains ALL theme definitions including colors, backgrounds, and special effects
- CSS is 100% generated from TypeScript definitions
- Database is optional (for preference backup only)

### 2. CSS Generator Generates Everything
- `src/scripts/generate-theme-css.ts` generates ALL CSS including special theme effects
- No manual CSS editing should ever be needed
- Run `npm run generate:css` to regenerate

### 3. Simplified ThemeProvider
- Uses `THEME_CATALOG` directly - no API fetch required
- Themes always available instantly (no loading state needed)
- localStorage for persistence
- Optional database sync for preference backup

### 4. Consolidated Types
- `src/config/themes.ts` exports all types
- `src/types/theme.ts` is a pure re-export file
- API-specific types (ThemeDbRecord, ThemeApiResponse) only where needed

## Consequences

### Positive
- **Offline-First**: Themes work without database connection
- **Instant Loading**: No API fetch delay for theme display
- **Single Source**: Only one place to update theme definitions
- **Reproducible CSS**: Running generator always produces same output
- **Simpler Code**: ThemeProvider reduced from ~200 lines to ~100 lines

### Negative
- Must run `npm run generate:css` after changing themes.ts
- Database themes are essentially backup/sync data, not authoritative

### Neutral
- API `/api/themes` endpoint still works but is optional
- Settings page unchanged (uses ThemeProvider hook)

## File Changes

```
src/config/themes.ts         # UPDATED: Added ThemeSpecialStyles, all theme CSS definitions
src/scripts/generate-theme-css.ts  # UPDATED: Generates 100% of CSS
src/components/ui/ThemeProvider.tsx  # SIMPLIFIED: Uses THEME_CATALOG directly
src/types/theme.ts           # SIMPLIFIED: Pure re-export + API types only
src/app/layout.tsx           # UPDATED: Better theme initialization script
src/app/settings/page.tsx    # UPDATED: Removed isFallback/isLoading handling
src/app/globals.css          # REGENERATED: Now matches themes.ts exactly
src/app/api/themes/route.ts  # UPDATED: Fallback to THEME_CATALOG if DB empty
```

## How to Add a New Theme

1. Add theme definition to `THEME_CATALOG` in `src/config/themes.ts`
2. Run `npm run generate:css`
3. (Optional) Run `npm run db:seed` to sync to database
4. Done!

## How to Modify Special Theme Effects

1. Edit the `specialStyles` object in the theme definition
2. Run `npm run generate:css`
3. Changes appear immediately in the regenerated CSS
