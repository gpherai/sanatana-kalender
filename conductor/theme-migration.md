# Theme System Migration Plan (Tailwind v4 Native)

## Objective
Migrate the existing TypeScript-driven CSS generator to a modern, robust Tailwind v4 native setup. This will drastically improve Developer Experience (DX), enable hot-reloading, separate metadata from styling, and ensure better maintainability by writing raw CSS instead of stringified CSS in TypeScript.

## Scope & Impact
This is a significant architectural refactor affecting the global styling mechanism. It will simplify the build process and remove redundant generator scripts while preserving all existing visual details and special themes.

## Key Files & Context
- `src/config/themes.ts`: Contains the current metadata AND styling (to be stripped of styling).
- `src/scripts/generate-theme-css.ts`: The generator script (to be deleted).
- `src/app/globals.css`: The massive generated CSS file (to be cleaned up and modularized).
- `src/styles/themes/`: New directory to house the extracted modular CSS files.
- `package.json`: Contains the `generate:css` script (to be removed).

## Proposed Solution (Tailwind v4 Native)
Instead of generating one massive 4000+ line CSS file during the build process, we will separate the styling into logical CSS partials imported via standard `@import` statements. `themes.ts` will strictly serve as the metadata source for the Settings UI.

## Implementation Steps

### Phase 1: Establish New CSS Structure
1. Create the `src/styles/themes/` directory structure.
2. Extract the base semantic tokens, color utilities, dark mode base, and animations from the generator script into distinct modular files:
   - `src/styles/base.css` (CSS Custom Properties & Semantic Tokens)
   - `src/styles/utilities.css` (Category utilities, semantic background/text classes, animations)

### Phase 2: Migrate Themes to Native CSS
3. Translate the standard themes (Classic) into `src/styles/themes/classic.css`.
4. Translate the revamped themes (with gradients and glassmorphism) into `src/styles/themes/revamped.css`.
5. Extract each special theme into its own dedicated file:
   - `src/styles/themes/special/bhairava-nocturne.css`
   - `src/styles/themes/special/shri-ganesha.css`
   - `src/styles/themes/special/narasimha-jwala.css`

### Phase 3: Clean Up Global Styles
6. Rewrite `src/app/globals.css` to only contain Tailwind imports (`@import "tailwindcss";`), Tailwind theme configurations (`@theme inline`), and `@import` statements for the modular files created in Phases 1 & 2.

### Phase 4: Refactor TypeScript Configuration
7. Strip `src/config/themes.ts` of all styling-related types (`GlassConfig`, `ThemeSpecialStyles`, `ThemeBackground`) and inline CSS strings. Retain only the metadata (`name`, `displayName`, `colors`, etc.) needed for the frontend.

### Phase 5: Remove Deprecated Code
8. Delete `src/scripts/generate-theme-css.ts`.
9. Remove the `generate:css` script from `package.json`.

## Verification
- Verify that hot module replacement (HMR) works instantaneously when changing a CSS variable in one of the new CSS files.
- Verify that toggling themes in the settings page successfully switches the visual appearance.
- Verify that standard, revamped, and special themes render identically to the old generated setup.
- Verify that `npm run build` succeeds without the `generate:css` step.