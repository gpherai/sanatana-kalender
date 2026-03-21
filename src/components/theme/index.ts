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

export { ColorModeToggle } from "./ColorModeToggle";

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
