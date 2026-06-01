/**
 * Theme Configuration - Single Source of Truth
 *
 * ALL theme definitions live here. This file is the canonical source for:
 * - Theme colors and metadata
 * - Runtime theme management (ThemeProvider)
 *
 * Architecture:
 * - TypeScript definitions → Metadata for Settings UI
 * - CSS styling → src/styles/themes/*.css (native Tailwind v4 approach)
 * - UserPreference stores theme name only
 *
 * @see src/components/theme/ThemeProvider.tsx - Runtime management
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Theme color palette using oklch format.
 * oklch provides perceptually uniform colors across themes.
 */
export interface ThemeColors {
  /** Primary brand color */
  readonly primary: string;
  /** Secondary/supporting color */
  readonly secondary: string;
  /** Accent/highlight color */
  readonly accent: string;
}

/**
 * User's color mode preference.
 * "system" follows OS preference.
 */
export type ColorMode = "light" | "dark" | "system";

/**
 * Resolved color mode (never "system").
 * Used for actual styling decisions.
 */
export type ResolvedColorMode = "light" | "dark";

/**
 * Theme category for organization.
 * Used to group themes in the settings UI.
 */
export type ThemeCategory = "classic" | "revamped" | "special";

/**
 * Complete theme definition.
 * Used internally and for UI display.
 */
export interface ThemeDefinition {
  /** Unique identifier (slug) - used as data-theme value */
  readonly name: string;
  /** Human-readable name */
  readonly displayName: string;
  /** Short description */
  readonly description: string;
  /** Is this the default theme? */
  readonly isDefault: boolean;
  /** Color palette */
  readonly colors: ThemeColors;
  /** Theme category for UI organization */
  readonly category: ThemeCategory;
  /** Premium/special theme flag */
  readonly isSpecial?: boolean;
}

/**
 * Minimal theme data for UI components.
 * Subset of ThemeDefinition.
 */
export interface ThemeOption {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly colors: ThemeColors;
  readonly category: ThemeCategory;
  readonly isDefault: boolean;
  readonly isSpecial?: boolean;
}

/**
 * Persisted theme state structure.
 */
export interface PersistedThemeState {
  readonly themeName: string;
  readonly colorMode: ColorMode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** localStorage key for persisting theme state */
export const THEME_STORAGE_KEY = "dharma-theme-state" as const;

/** Default color mode when no preference is saved */
export const DEFAULT_COLOR_MODE: ColorMode = "system";

// =============================================================================
// THEME CATALOG - THE SOURCE OF TRUTH
// =============================================================================

export const THEME_CATALOG: readonly ThemeDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // ✨ REVAMPED THEMES (Enhanced with subtle gradient backgrounds)
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "spiritual-minimal-revamped",
    displayName: "Spiritual Minimal (Revamped)",
    description: "Warm sunrise gradient with golden and azure tones",
    isDefault: false,
    category: "revamped" as const,
    colors: {
      primary: "oklch(0.65 0.15 45)",
      secondary: "oklch(0.55 0.10 200)",
      accent: "oklch(0.70 0.12 85)",
    },
  },
  {
    name: "traditional-rich-revamped",
    displayName: "Traditional Rich (Revamped)",
    description: "Sacred temple atmosphere with golden warmth",
    isDefault: false,
    category: "revamped" as const,
    colors: {
      primary: "oklch(0.55 0.18 30)",
      secondary: "oklch(0.62 0.15 75)",
      accent: "oklch(0.75 0.15 85)",
    },
  },
  {
    name: "cosmic-purple-revamped",
    displayName: "Cosmic Purple (Revamped)",
    description: "Deep cosmic tones with aurora gradients",
    isDefault: false,
    category: "revamped" as const,
    colors: {
      primary: "oklch(0.45 0.20 280)",
      secondary: "oklch(0.55 0.15 300)",
      accent: "oklch(0.70 0.18 320)",
    },
  },
  {
    name: "forest-green-revamped",
    displayName: "Forest Green (Revamped)",
    description: "Natural earthy vibes with misty gradients",
    isDefault: false,
    category: "revamped" as const,
    colors: {
      primary: "oklch(0.50 0.15 145)",
      secondary: "oklch(0.45 0.12 160)",
      accent: "oklch(0.65 0.12 130)",
    },
  },
  {
    name: "sunrise-orange-revamped",
    displayName: "Sunrise Orange (Revamped)",
    description: "Energetic morning vibes with dawn gradients",
    isDefault: false,
    category: "revamped" as const,
    colors: {
      primary: "oklch(0.70 0.18 50)",
      secondary: "oklch(0.65 0.15 60)",
      accent: "oklch(0.80 0.12 70)",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ✨ SPECIAL THEMES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "bhairava-nocturne",
    displayName: "🗡️ Bhairava Nocturne",
    description:
      "Shmashana at midnight — the indigo aura of the Lord of Terror and Liberation",
    isDefault: false,
    category: "special" as const,
    isSpecial: true,
    colors: {
      primary: "oklch(0.62 0.22 275)",
      secondary: "oklch(0.72 0.10 210)",
      accent: "oklch(0.74 0.18 45)",
    },
  },
  {
    name: "shri-ganesha",
    displayName: "✨ Shri Ganesha",
    description: "Divine blessings of the Remover of Obstacles",
    isDefault: true,
    category: "special" as const,
    isSpecial: true,
    colors: {
      primary: "oklch(0.55 0.22 25)",
      secondary: "oklch(0.75 0.14 85)",
      accent: "oklch(0.55 0.15 145)",
    },
  },
  {
    name: "narasimha-jwala",
    displayName: "🦁 Narasimha Jwala",
    description:
      "Fierce divine fire of the lion-god emerging from the pillar at twilight",
    isDefault: false,
    category: "special" as const,
    isSpecial: true,
    colors: {
      primary: "oklch(0.68 0.22 52)",
      secondary: "oklch(0.45 0.20 32)",
      accent: "oklch(0.74 0.24 38)",
    },
  },
] as const;

// =============================================================================
// DERIVED VALUES (computed from catalog)
// =============================================================================

/** All theme names as a readonly array */
export const THEME_NAMES = THEME_CATALOG.map((t) => t.name) as readonly string[];

/** Default theme definition — exactly one entry in THEME_CATALOG must have isDefault: true */
export const DEFAULT_THEME: ThemeDefinition =
  THEME_CATALOG.find((t) => t.isDefault) ?? THEME_CATALOG[0]!;

/** Default theme name */
export const DEFAULT_THEME_NAME: string = DEFAULT_THEME.name;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the default theme definition.
 */
export function getDefaultTheme(): ThemeDefinition {
  return DEFAULT_THEME;
}

/**
 * Get a theme by name.
 */
export function getThemeByName(name: string): ThemeDefinition | undefined {
  return THEME_CATALOG.find((t) => t.name === name);
}

/**
 * Get all theme names.
 */
export function getThemeNames(): readonly string[] {
  return THEME_NAMES;
}

/**
 * Get all special themes.
 */
export function getSpecialThemes(): readonly ThemeDefinition[] {
  return THEME_CATALOG.filter((t) => t.category === "special");
}

/**
 * Get all standard (classic + revamped) themes.
 */
export function getStandardThemes(): readonly ThemeDefinition[] {
  return THEME_CATALOG.filter(
    (t) => t.category === "classic" || t.category === "revamped"
  );
}

/**
 * Get themes by category.
 */
export function getThemesByCategory(category: ThemeCategory): readonly ThemeDefinition[] {
  return THEME_CATALOG.filter((t) => t.category === category);
}

/**
 * Convert ThemeDefinition to ThemeOption (minimal data for UI).
 */
export function toThemeOption(theme: ThemeDefinition): ThemeOption {
  return {
    name: theme.name,
    displayName: theme.displayName,
    description: theme.description,
    colors: theme.colors,
    category: theme.category,
    isDefault: theme.isDefault,
    isSpecial: theme.isSpecial,
  };
}

/**
 * Get all themes as ThemeOptions.
 */
export function getAllThemeOptions(): readonly ThemeOption[] {
  return THEME_CATALOG.map(toThemeOption);
}

/**
 * Validate if a theme name exists.
 */
export function isValidThemeName(name: string): boolean {
  return THEME_NAMES.includes(name);
}

/**
 * Parse stored theme state from localStorage.
 * Returns null if invalid or missing.
 */
export function parseStoredThemeState(stored: string | null): PersistedThemeState | null {
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;

    const obj = parsed as Record<string, unknown>;

    // Validate themeName
    if (typeof obj.themeName !== "string" || !isValidThemeName(obj.themeName)) {
      return null;
    }

    // Validate colorMode
    if (
      obj.colorMode !== "light" &&
      obj.colorMode !== "dark" &&
      obj.colorMode !== "system"
    ) {
      return null;
    }

    return {
      themeName: obj.themeName,
      colorMode: obj.colorMode,
    };
  } catch {
    return null;
  }
}

/**
 * Serialize theme state for localStorage.
 */
export function serializeThemeState(state: PersistedThemeState): string {
  return JSON.stringify({
    themeName: state.themeName,
    colorMode: state.colorMode,
  });
}
