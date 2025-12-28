/**
 * Theme Components - Public API
 *
 * All theme-related exports for the application.
 *
 * Usage:
 *   import { ThemeProvider, useTheme, ColorModeToggle } from "@/components/theme";
 *   import type { ColorMode, ThemeOption } from "@/components/theme";
 */

// =============================================================================
// PROVIDER & HOOK
// =============================================================================

export { ThemeProvider, useTheme } from "./ThemeProvider";

// =============================================================================
// COMPONENTS
// =============================================================================

export { ColorModeToggle, ColorModeSelect } from "./ColorModeToggle";

// =============================================================================
// TYPES (re-exported from config for convenience)
// =============================================================================

export type {
  ColorMode,
  ResolvedColorMode,
  ThemeOption,
  ThemeColors,
  PersistedThemeState,
} from "@/config/themes";

// =============================================================================
// CONSTANTS (re-exported from config for convenience)
// =============================================================================

export {
  DEFAULT_THEME_NAME,
  DEFAULT_COLOR_MODE,
  THEME_STORAGE_KEY,
  THEME_NAMES,
  isValidThemeName,
} from "@/config/themes";
