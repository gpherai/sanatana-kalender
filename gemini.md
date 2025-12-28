# Gemini Task: Sanskrit Definitions Page

## Goal
Create a new page to list definitions of Sanskrit words used in the application.

## Status
- **Completed**: `src/lib/dictionary.ts` created with comprehensive definitions (including Sanskrit/Devanagari).
- **Completed**: `src/app/woordenboek/page.tsx` created displaying the definitions.
- **Refined**: Visual design updated to match `TodayHero` and `PageLayout` standards (gradients, glass effects, typography).
- **Corrected**: Styling now strictly follows project semantic tokens (replaced invalid `ring` classes with `border` classes).
- **Navigation**: "Terug naar Home" link removed.
- **Verified**: Type safety checked and confirmed.

## Files Created/Modified
- `src/lib/dictionary.ts`: Data source.
- `src/app/woordenboek/page.tsx`: Page component with enhanced styling.

## Implementation Details
- **Header**: Matches `TodayHero` style with a subtle gradient background and glass-like effect.
- **Content**: Wrapped in `PageLayout` and `Section` components.
- **Typography**: Uses theme-aware colors (`text-theme-fg`, `text-theme-fg-secondary`).
- **Sorting**: Alphabetical sorting for both categories and terms.
- **Design**: Uses a staggered grid layout for terms with decorative accents.

## Next Steps (for Claude/Architect)
- Add a link to `/woordenboek` in the main navigation or footer.
