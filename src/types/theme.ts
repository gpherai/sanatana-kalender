/**
 * Theme Types
 *
 * All theme-related types are defined in and exported from:
 *   @/config/themes.ts
 *
 * This file provides re-exports for convenience and backwards compatibility.
 * For new code, prefer importing directly from @/config/themes or @/components/theme.
 *
 * Architecture:
 * - Source of truth: THEME_CATALOG in @/config/themes.ts
 * - Runtime management: ThemeProvider in @/components/theme
 * - CSS generation: npm run generate:css
 * - Persistence: localStorage (client) + UserPreference.currentTheme (database)
 *
 * NOTE: There is no Theme database table. Themes are defined purely in TypeScript.
 * The UserPreference table stores only the theme NAME as a string reference.
 */

// =============================================================================
// RE-EXPORTS FROM CONFIG (canonical source)
// =============================================================================

export type {
  ThemeColors,
  ThemeDefinition,
  ThemeOption,
  ColorMode,
  ResolvedColorMode,
  PersistedThemeState,
  ThemeBackground,
  ThemeSpecialStyles,
} from "@/config/themes";

export {
  THEME_CATALOG,
  THEME_NAMES,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  DEFAULT_THEME_NAME,
  DEFAULT_COLOR_MODE,
  getDefaultTheme,
  getThemeByName,
  getThemeNames,
  getSpecialThemes,
  getStandardThemes,
  getAllThemeOptions,
  toThemeOption,
  isValidThemeName,
  parseStoredThemeState,
  serializeThemeState,
} from "@/config/themes";
