/**
 * Theme Configuration - Single Source of Truth
 *
 * ALL theme definitions live here. This file is the canonical source for:
 * - Theme colors and metadata
 * - Special theme visual effects
 * - CSS generation (via npm run generate:css)
 * - Runtime theme management (ThemeProvider)
 *
 * Architecture:
 * - TypeScript definitions → CSS generation → globals.css
 * - UserPreference stores theme name only
 * - No separate Theme database table needed
 *
 * @see src/scripts/generate-theme-css.ts - CSS generator
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
 * Background styles for special themes.
 */
export interface ThemeBackground {
  /** Light mode background CSS */
  readonly light: string;
  /** Dark mode background CSS */
  readonly dark: string;
}

/**
 * Moon visualization colors for theme customization.
 * Allows themes to have custom moon appearances.
 */
export interface MoonColors {
  /** Light moon surface colors (gradient stops) */
  readonly surface: {
    readonly light: string;
    readonly mid: string;
    readonly dark: string;
  };
  /** Dark moon shadow colors (gradient stops) */
  readonly shadow: {
    readonly light: string;
    readonly deep: string;
  };
  /** Glow effect color (used in radial gradient) */
  readonly glow: string;
  /** Rim light color (subtle stroke) */
  readonly rim: string;
}

/**
 * Special CSS customizations for premium themes.
 */
export interface ThemeSpecialStyles {
  /** Additional CSS custom properties */
  readonly customProperties?: Readonly<Record<string, string>>;
  /** Moon visualization colors */
  readonly moon?: MoonColors;
  /** Header styling override */
  readonly header?: ThemeBackground;
  /** Card styling override */
  readonly cards?: ThemeBackground;
  /** Button styling override */
  readonly buttons?: ThemeBackground;
  /** Input styling override */
  readonly inputs?: ThemeBackground;
  /** Heading styling override */
  readonly headings?: ThemeBackground;
  /** Custom keyframe animations */
  readonly animations?: ReadonlyArray<{
    readonly name: string;
    readonly keyframes: string;
  }>;
  /** Decorative elements (::after on body) */
  readonly decorations?: ThemeBackground;
  /** Raw additional CSS */
  readonly additionalCss?: string;
}

/**
 * Complete theme definition.
 * Used internally and for CSS generation.
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
  /** Special background styling */
  readonly background?: ThemeBackground;
  /** Special CSS customizations */
  readonly specialStyles?: ThemeSpecialStyles;
}

/**
 * Minimal theme data for UI components.
 * Subset of ThemeDefinition without CSS generation details.
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
  // STANDARD THEMES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "spiritual-minimal",
    displayName: "Spiritual Minimal",
    description: "Clean and peaceful design with soft colors",
    isDefault: true,
    category: "classic" as const,
    colors: {
      primary: "oklch(0.65 0.15 45)",
      secondary: "oklch(0.55 0.10 200)",
      accent: "oklch(0.70 0.12 85)",
    },
  },
  {
    name: "traditional-rich",
    displayName: "Traditional Rich",
    description: "Warm temple colors with golden accents",
    isDefault: false,
    category: "classic" as const,
    colors: {
      primary: "oklch(0.55 0.18 30)",
      secondary: "oklch(0.45 0.12 45)",
      accent: "oklch(0.75 0.15 85)",
    },
  },
  {
    name: "cosmic-purple",
    displayName: "Cosmic Purple",
    description: "Deep cosmic tones for meditation",
    isDefault: false,
    category: "classic" as const,
    colors: {
      primary: "oklch(0.45 0.20 280)",
      secondary: "oklch(0.35 0.15 300)",
      accent: "oklch(0.70 0.18 320)",
    },
  },
  {
    name: "forest-green",
    displayName: "Forest Green",
    description: "Natural and earthy vibes",
    isDefault: false,
    category: "classic" as const,
    colors: {
      primary: "oklch(0.50 0.15 145)",
      secondary: "oklch(0.40 0.10 160)",
      accent: "oklch(0.65 0.12 130)",
    },
  },
  {
    name: "sunrise-orange",
    displayName: "Sunrise Orange",
    description: "Energetic morning vibes",
    isDefault: false,
    category: "classic" as const,
    colors: {
      primary: "oklch(0.70 0.18 50)",
      secondary: "oklch(0.60 0.15 40)",
      accent: "oklch(0.80 0.12 70)",
    },
  },

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
    background: {
      light: `
        radial-gradient(circle at 20% 20%, oklch(0.78 0.12 60 / 0.35) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, oklch(0.70 0.08 200 / 0.25) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, oklch(0.85 0.06 85 / 0.20) 0%, transparent 60%),
        linear-gradient(135deg,
          oklch(0.97 0.02 60) 0%,
          oklch(0.96 0.03 80) 25%,
          oklch(0.95 0.02 200) 50%,
          oklch(0.96 0.02 220) 75%,
          oklch(0.97 0.01 240) 100%)
      `,
      dark: `
        radial-gradient(circle at 20% 20%, oklch(0.45 0.15 45 / 0.40) 0%, transparent 45%),
        radial-gradient(circle at 80% 80%, oklch(0.35 0.12 200 / 0.35) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 0%, oklch(0.50 0.10 70 / 0.25) 0%, transparent 55%),
        linear-gradient(135deg,
          oklch(0.15 0.03 45) 0%,
          oklch(0.13 0.04 60) 25%,
          oklch(0.12 0.03 180) 50%,
          oklch(0.13 0.03 200) 75%,
          oklch(0.14 0.02 220) 100%)
      `,
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
    background: {
      light: `
        radial-gradient(circle at 18% 18%, oklch(0.68 0.18 35 / 0.40) 0%, transparent 48%),
        radial-gradient(circle at 82% 82%, oklch(0.75 0.16 65 / 0.32) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, oklch(0.72 0.14 50 / 0.24) 0%, transparent 58%),
        linear-gradient(135deg,
          oklch(0.94 0.06 30) 0%,
          oklch(0.93 0.07 40) 20%,
          oklch(0.92 0.06 55) 40%,
          oklch(0.93 0.05 70) 60%,
          oklch(0.94 0.04 80) 80%,
          oklch(0.95 0.03 90) 100%)
      `,
      dark: `
        radial-gradient(circle at 18% 18%, oklch(0.40 0.20 25 / 0.48) 0%, transparent 45%),
        radial-gradient(circle at 82% 82%, oklch(0.50 0.18 60 / 0.40) 0%, transparent 48%),
        radial-gradient(ellipse at 50% 0%, oklch(0.45 0.16 40 / 0.30) 0%, transparent 52%),
        linear-gradient(135deg,
          oklch(0.16 0.06 25) 0%,
          oklch(0.15 0.07 35) 20%,
          oklch(0.13 0.06 50) 40%,
          oklch(0.14 0.05 60) 60%,
          oklch(0.15 0.04 70) 80%,
          oklch(0.16 0.03 80) 100%)
      `,
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
    background: {
      light: `
        radial-gradient(circle at 20% 20%, oklch(0.45 0.20 280 / 0.18) 0%, transparent 55%),
        radial-gradient(circle at 80% 80%, oklch(0.70 0.18 320 / 0.14) 0%, transparent 52%),
        radial-gradient(ellipse at 50% 100%, oklch(0.55 0.15 300 / 0.10) 0%, transparent 60%),
        linear-gradient(135deg,
          oklch(0.97 0.03 270) 0%,
          oklch(0.96 0.04 285) 25%,
          oklch(0.95 0.04 300) 50%,
          oklch(0.96 0.03 315) 75%,
          oklch(0.97 0.02 330) 100%)
      `,
      dark: `
        radial-gradient(circle at 20% 20%, oklch(0.45 0.20 280 / 0.30) 0%, transparent 52%),
        radial-gradient(circle at 80% 80%, oklch(0.70 0.18 320 / 0.22) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 0%, oklch(0.55 0.15 300 / 0.18) 0%, transparent 55%),
        linear-gradient(135deg,
          oklch(0.13 0.04 270) 0%,
          oklch(0.12 0.05 285) 25%,
          oklch(0.11 0.04 300) 50%,
          oklch(0.12 0.03 315) 75%,
          oklch(0.13 0.02 330) 100%)
      `,
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
    background: {
      light: `
        radial-gradient(circle at 14% 10%, oklch(0.50 0.15 145 / 0.15) 0%, transparent 55%),
        radial-gradient(circle at 86% 90%, oklch(0.65 0.12 130 / 0.12) 0%, transparent 52%),
        radial-gradient(ellipse at 50% 100%, oklch(0.55 0.10 155 / 0.10) 0%, transparent 60%),
        linear-gradient(135deg,
          oklch(0.97 0.03 140) 0%,
          oklch(0.96 0.04 145) 25%,
          oklch(0.95 0.04 155) 50%,
          oklch(0.96 0.03 160) 75%,
          oklch(0.97 0.02 165) 100%)
      `,
      dark: `
        radial-gradient(circle at 14% 10%, oklch(0.50 0.15 145 / 0.25) 0%, transparent 52%),
        radial-gradient(circle at 86% 90%, oklch(0.65 0.12 130 / 0.20) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 0%, oklch(0.55 0.10 155 / 0.15) 0%, transparent 55%),
        linear-gradient(135deg,
          oklch(0.14 0.03 140) 0%,
          oklch(0.13 0.04 145) 25%,
          oklch(0.12 0.04 155) 50%,
          oklch(0.13 0.03 160) 75%,
          oklch(0.14 0.02 165) 100%)
      `,
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
    background: {
      light: `
        radial-gradient(circle at 16% 8%, oklch(0.70 0.18 50 / 0.16) 0%, transparent 55%),
        radial-gradient(circle at 84% 92%, oklch(0.80 0.12 70 / 0.14) 0%, transparent 52%),
        radial-gradient(ellipse at 50% 100%, oklch(0.75 0.14 60 / 0.10) 0%, transparent 60%),
        linear-gradient(135deg,
          oklch(0.97 0.03 45) 0%,
          oklch(0.96 0.04 50) 25%,
          oklch(0.95 0.04 60) 50%,
          oklch(0.96 0.03 70) 75%,
          oklch(0.97 0.02 80) 100%)
      `,
      dark: `
        radial-gradient(circle at 16% 8%, oklch(0.70 0.18 50 / 0.26) 0%, transparent 52%),
        radial-gradient(circle at 84% 92%, oklch(0.80 0.12 70 / 0.22) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 0%, oklch(0.75 0.14 60 / 0.16) 0%, transparent 55%),
        linear-gradient(135deg,
          oklch(0.15 0.04 45) 0%,
          oklch(0.14 0.05 50) 25%,
          oklch(0.13 0.04 60) 50%,
          oklch(0.14 0.03 70) 75%,
          oklch(0.15 0.02 80) 100%)
      `,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ✨ SPECIAL THEMES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "bhairava-nocturne",
    displayName: "🗡️ Bhairava Nocturne",
    description: "Midnight temple glow with indigo aurora and ember accents",
    isDefault: false,
    category: "special" as const,
    isSpecial: true,
    colors: {
      primary: "oklch(0.62 0.22 275)", // Neon indigo
      secondary: "oklch(0.72 0.10 210)", // Cold moonlight cyan
      accent: "oklch(0.74 0.18 45)", // Ritual ember
    },
    background: {
      light: `
        radial-gradient(900px 520px at 18% 12%, oklch(0.80 0.10 275 / 0.22) 0%, transparent 62%),
        radial-gradient(760px 520px at 82% 18%, oklch(0.74 0.18 45 / 0.14) 0%, transparent 60%),
        radial-gradient(900px 560px at 50% 110%, oklch(0.72 0.10 210 / 0.10) 0%, transparent 62%),
        linear-gradient(180deg, oklch(0.985 0.02 90) 0%, oklch(0.955 0.03 85) 100%)
      `,
      dark: `
        radial-gradient(1000px 600px at 16% 18%, oklch(0.40 0.18 275 / 0.35) 0%, transparent 62%),
        radial-gradient(760px 520px at 86% 22%, oklch(0.60 0.22 320 / 0.14) 0%, transparent 58%),
        radial-gradient(900px 580px at 50% 115%, oklch(0.74 0.18 45 / 0.12) 0%, transparent 62%),
        radial-gradient(circle at 50% 45%, oklch(0.18 0.04 275 / 0.30) 0%, transparent 55%),
        linear-gradient(180deg, oklch(0.09 0.02 275) 0%, oklch(0.07 0.02 270) 100%)
      `,
    },
    specialStyles: {
      customProperties: {
        "--bhairava-indigo": "oklch(0.62 0.22 275)",
        "--bhairava-ember": "oklch(0.74 0.18 45)",
        "--bhairava-ash": "oklch(0.82 0.01 280 / 0.12)",
      },
      moon: {
        surface: {
          light: "oklch(0.920 0.045 285)", // Pale indigo-silver
          mid: "oklch(0.850 0.055 280)", // Soft lavender
          dark: "oklch(0.780 0.065 275)", // Deep lilac
        },
        shadow: {
          light: "oklch(0.180 0.030 275)", // Dark indigo
          deep: "oklch(0.095 0.022 270)", // Near-black purple
        },
        glow: "oklch(0.720 0.18 285 / 0.65)", // Indigo moonlight glow
        rim: "oklch(0.82 0.12 280 / 0.15)", // Ethereal purple rim
      },
      header: {
        light: `
          background: linear-gradient(180deg, oklch(0.99 0.02 90 / 0.94) 0%, oklch(0.97 0.03 85 / 0.90) 100%) !important;
          border-bottom: 1px solid oklch(0.62 0.22 275 / 0.25) !important;
          box-shadow: 0 2px 20px oklch(0.62 0.22 275 / 0.10), 0 1px 0 oklch(0.74 0.18 45 / 0.10) inset;
        `,
        dark: `
          background: linear-gradient(180deg, oklch(0.14 0.03 275 / 0.92) 0%, oklch(0.10 0.02 270 / 0.88) 100%) !important;
          border-bottom: 1px solid oklch(0.62 0.22 275 / 0.28) !important;
          box-shadow: 0 2px 24px oklch(0.62 0.22 275 / 0.18), 0 1px 0 oklch(0.74 0.18 45 / 0.08) inset;
        `,
      },
      cards: {
        light: `
          background: linear-gradient(180deg, oklch(0.995 0.01 90 / 0.86) 0%, oklch(0.98 0.02 88 / 0.80) 100%) !important;
          border: 1px solid oklch(0.62 0.22 275 / 0.16) !important;
          box-shadow: 0 10px 30px oklch(0 0 0 / 0.06), 0 0 0 1px oklch(0.74 0.18 45 / 0.06) inset !important;
        `,
        dark: `
          background: linear-gradient(180deg, oklch(0.15 0.03 275 / 0.78) 0%, oklch(0.12 0.03 270 / 0.72) 100%) !important;
          border: 1px solid oklch(0.62 0.22 275 / 0.18) !important;
          box-shadow: 0 14px 40px oklch(0 0 0 / 0.45), 0 0 28px oklch(0.62 0.22 275 / 0.10) !important;
          backdrop-filter: blur(10px);
        `,
      },
      buttons: {
        light: `
          background: linear-gradient(145deg, oklch(0.62 0.22 275) 0%, oklch(0.55 0.20 290) 100%) !important;
          border: 1px solid oklch(0.62 0.22 275 / 0.30) !important;
          box-shadow: 0 10px 28px oklch(0.62 0.22 275 / 0.18), 0 0 22px oklch(0.74 0.18 45 / 0.10) !important;
        `,
        dark: `
          background: linear-gradient(145deg, oklch(0.54 0.22 275) 0%, oklch(0.45 0.20 290) 100%) !important;
          border: 1px solid oklch(0.62 0.22 275 / 0.28) !important;
          box-shadow: 0 12px 34px oklch(0 0 0 / 0.55), 0 0 26px oklch(0.62 0.22 275 / 0.22) !important;
        `,
      },
      inputs: {
        light: `
          background: linear-gradient(180deg, oklch(0.995 0.01 90 / 0.92) 0%, oklch(0.98 0.02 88 / 0.86) 100%) !important;
          border: 1px solid oklch(0.62 0.22 275 / 0.16) !important;
        `,
        dark: `
          background: linear-gradient(180deg, oklch(0.13 0.02 275 / 0.92) 0%, oklch(0.11 0.02 270 / 0.88) 100%) !important;
          border: 1px solid oklch(0.62 0.22 275 / 0.20) !important;
        `,
      },
      headings: {
        light: `
          color: oklch(0.24 0.06 275) !important;
          text-shadow: 0 0 24px oklch(0.62 0.22 275 / 0.14);
        `,
        dark: `
          color: oklch(0.93 0.03 275) !important;
          text-shadow: 0 0 32px oklch(0.62 0.22 275 / 0.22);
        `,
      },
    },
  },
  {
    name: "shri-ganesha",
    displayName: "✨ Shri Ganesha",
    description: "Divine blessings of the Remover of Obstacles",
    isDefault: false,
    category: "special" as const,
    isSpecial: true,
    colors: {
      primary: "oklch(0.55 0.22 25)",
      secondary: "oklch(0.75 0.14 85)",
      accent: "oklch(0.55 0.15 145)",
    },
    background: {
      light: `
        radial-gradient(ellipse 150% 60% at 50% -10%, oklch(0.92 0.10 80 / 0.8) 0%, oklch(0.95 0.06 70 / 0.4) 40%, transparent 70%),
        radial-gradient(ellipse 80% 70% at -10% 110%, oklch(0.85 0.12 25 / 0.4) 0%, oklch(0.90 0.08 30 / 0.2) 40%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 110% 100%, oklch(0.88 0.10 145 / 0.25) 0%, transparent 50%),
        linear-gradient(180deg, oklch(0.97 0.02 80) 0%, oklch(0.95 0.03 70) 50%, oklch(0.93 0.04 60) 100%)
      `,
      dark: `
        radial-gradient(ellipse 120% 50% at 50% -5%, oklch(0.30 0.15 25 / 0.7) 0%, oklch(0.20 0.10 30 / 0.4) 40%, transparent 65%),
        radial-gradient(ellipse 70% 60% at -5% 105%, oklch(0.35 0.12 85 / 0.5) 0%, oklch(0.25 0.08 80 / 0.3) 40%, transparent 60%),
        radial-gradient(ellipse 50% 45% at 105% 95%, oklch(0.25 0.10 145 / 0.35) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, oklch(0.18 0.04 85 / 0.2) 0%, transparent 50%),
        linear-gradient(180deg, oklch(0.12 0.03 25) 0%, oklch(0.10 0.02 30) 50%, oklch(0.08 0.02 35) 100%)
      `,
    },
    specialStyles: {
      customProperties: {
        "--ganesha-sindoor": "oklch(0.55 0.25 30)",
        "--ganesha-gold": "oklch(0.78 0.14 85)",
        "--ganesha-durva": "oklch(0.55 0.18 145)",
        "--ganesha-mooladhara": "oklch(0.45 0.22 25)",
      },
      moon: {
        surface: {
          light: "oklch(0.990 0.028 85)", // Brilliant golden-cream
          mid: "oklch(0.950 0.035 80)", // Rich champagne
          dark: "oklch(0.880 0.042 75)", // Deep honey
        },
        shadow: {
          light: "oklch(0.220 0.028 35)", // Warm dark brown
          deep: "oklch(0.125 0.020 30)", // Rich earth-black
        },
        glow: "oklch(0.880 0.12 85 / 0.75)", // Divine golden glow
        rim: "oklch(0.95 0.10 85 / 0.18)", // Blessed gold rim
      },
      header: {
        light: `
          background: linear-gradient(180deg, oklch(0.98 0.03 80 / 0.95) 0%, oklch(0.96 0.04 70 / 0.90) 100%) !important;
          border-bottom: 2px solid oklch(0.78 0.14 85 / 0.5) !important;
          box-shadow: 0 2px 20px oklch(0.78 0.14 85 / 0.2), 0 1px 0 oklch(0.78 0.14 85 / 0.3) inset;
        `,
        dark: `
          background: linear-gradient(180deg, oklch(0.15 0.04 30 / 0.95) 0%, oklch(0.12 0.03 25 / 0.92) 100%) !important;
          border-bottom: 2px solid oklch(0.50 0.12 85 / 0.4) !important;
          box-shadow: 0 2px 25px oklch(0.50 0.12 85 / 0.15), 0 1px 0 oklch(0.50 0.12 85 / 0.2) inset;
        `,
      },
      cards: {
        light: `
          background: linear-gradient(145deg, oklch(1 0 0 / 0.92) 0%, oklch(0.98 0.02 80 / 0.88) 100%) !important;
          border: 1px solid oklch(0.78 0.14 85 / 0.3) !important;
          box-shadow: 0 4px 20px oklch(0.78 0.14 85 / 0.15), 0 0 0 1px oklch(0.78 0.14 85 / 0.1), inset 0 1px 0 oklch(1 0 0 / 0.5) !important;
        `,
        dark: `
          background: linear-gradient(145deg, oklch(0.18 0.03 30 / 0.92) 0%, oklch(0.14 0.02 25 / 0.88) 100%) !important;
          border: 1px solid oklch(0.50 0.12 85 / 0.25) !important;
          box-shadow: 0 4px 25px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(0.50 0.12 85 / 0.1), inset 0 1px 0 oklch(0.25 0.04 85 / 0.2) !important;
        `,
      },
      buttons: {
        light: `
          background: linear-gradient(145deg, oklch(0.55 0.22 30) 0%, oklch(0.48 0.20 25) 100%) !important;
          box-shadow: 0 4px 15px oklch(0.50 0.20 25 / 0.4), 0 0 20px oklch(0.78 0.14 85 / 0.3), inset 0 1px 0 oklch(0.65 0.18 35 / 0.5) !important;
          border: 1px solid oklch(0.78 0.14 85 / 0.4) !important;
        `,
        dark: `
          background: linear-gradient(145deg, oklch(0.50 0.20 25) 0%, oklch(0.42 0.18 30) 100%) !important;
          box-shadow: 0 4px 20px oklch(0.45 0.18 25 / 0.5), 0 0 25px oklch(0.50 0.12 85 / 0.25), inset 0 1px 0 oklch(0.60 0.15 30 / 0.4) !important;
        `,
      },
      inputs: {
        light: `
          border: 1px solid oklch(0.78 0.14 85 / 0.3) !important;
          background: linear-gradient(180deg, oklch(1 0 0 / 0.95) 0%, oklch(0.98 0.01 80 / 0.95) 100%) !important;
        `,
        dark: `
          background: linear-gradient(180deg, oklch(0.18 0.02 30 / 0.95) 0%, oklch(0.15 0.02 25 / 0.95) 100%) !important;
          border: 1px solid oklch(0.50 0.12 85 / 0.3) !important;
        `,
      },
      headings: {
        light: `
          background: linear-gradient(135deg, oklch(0.45 0.20 25) 0%, oklch(0.55 0.22 30) 30%, oklch(0.70 0.14 85) 70%, oklch(0.55 0.22 30) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        `,
        dark: `
          background: linear-gradient(135deg, oklch(0.60 0.18 25) 0%, oklch(0.70 0.20 30) 30%, oklch(0.80 0.14 85) 70%, oklch(0.70 0.20 30) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        `,
      },
      animations: [
        {
          name: "divine-pulse",
          keyframes: `
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px oklch(0.78 0.14 85 / 0.6)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 15px oklch(0.78 0.14 85 / 0.9)); }
          `,
        },
        {
          name: "gold-shimmer",
          keyframes: `
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.15); }
          `,
        },
      ],
      decorations: {
        light: `
          content: 'ॐ';
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 120px;
          font-weight: 300;
          color: oklch(0.78 0.14 85 / 0.08);
          pointer-events: none;
          z-index: 0;
          line-height: 1;
          font-family: serif;
        `,
        dark: `
          content: 'ॐ';
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 120px;
          font-weight: 300;
          color: oklch(0.65 0.12 85 / 0.06);
          pointer-events: none;
          z-index: 0;
          line-height: 1;
          font-family: serif;
        `,
      },
      additionalCss: `
/* Golden decorative line under header */
[data-theme="shri-ganesha"] header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, oklch(0.78 0.14 85) 20%, oklch(0.85 0.16 85) 50%, oklch(0.78 0.14 85) 80%, transparent 100%);
  border-radius: 2px;
}

/* Divine pulsing glow on logo */
[data-theme="shri-ganesha"] header a:first-child span:first-child {
  animation: divine-pulse 3s ease-in-out infinite;
}

/* Subtle shimmer on gold text */
[data-theme="shri-ganesha"] .text-theme-primary {
  animation: gold-shimmer 4s ease-in-out infinite;
}

/* Title text shadows */
[data-theme="shri-ganesha"] h1,
[data-theme="shri-ganesha"] h2 {
  text-shadow: 0 0 30px oklch(0.78 0.14 85 / 0.3);
}

/* Focus states for special theme */
[data-theme="shri-ganesha"] input:focus,
[data-theme="shri-ganesha"] select:focus,
[data-theme="shri-ganesha"] textarea:focus {
  border-color: oklch(0.78 0.14 85) !important;
  box-shadow: 0 0 0 3px oklch(0.78 0.14 85 / 0.2), 0 0 15px oklch(0.78 0.14 85 / 0.15) !important;
}

/* Special badge glow */
[data-theme="shri-ganesha"] .bg-gradient-to-r.from-amber-500 {
  animation: divine-pulse 2s ease-in-out infinite;
}
`,
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
      primary: "oklch(0.68 0.22 52)", // Golden amber-fire — the lion's mane
      secondary: "oklch(0.42 0.18 228)", // Deep twilight sapphire — Vaishnava sky at dusk
      accent: "oklch(0.74 0.24 38)", // Sacred flame — fierce orange-red
    },
    background: {
      // Light mode: blazing golden fire radiates from above, twilight blue in the corner
      light: `
        radial-gradient(ellipse 80% 65% at 50% -8%, oklch(0.88 0.18 60 / 0.80) 0%, oklch(0.82 0.14 52 / 0.45) 40%, transparent 70%),
        radial-gradient(ellipse 55% 45% at -5% 110%, oklch(0.75 0.20 42 / 0.38) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 105% 100%, oklch(0.48 0.18 228 / 0.18) 0%, transparent 50%),
        linear-gradient(180deg, oklch(0.97 0.04 62) 0%, oklch(0.95 0.05 56) 40%, oklch(0.93 0.04 50) 100%)
      `,
      // Dark mode: sandhyakala (dusk) — fiery pillar breaks through twilight blue sky
      dark: `
        radial-gradient(ellipse 25% 75% at 50% 35%, oklch(0.65 0.22 52 / 0.28) 0%, transparent 58%),
        radial-gradient(ellipse 100% 55% at 50% 108%, oklch(0.62 0.24 40 / 0.42) 0%, transparent 55%),
        radial-gradient(ellipse 90% 60% at 0% 60%, oklch(0.32 0.16 228 / 0.36) 0%, transparent 55%),
        radial-gradient(ellipse 80% 50% at 100% 40%, oklch(0.28 0.14 232 / 0.30) 0%, transparent 50%),
        linear-gradient(180deg, oklch(0.11 0.03 42) 0%, oklch(0.09 0.04 48) 40%, oklch(0.08 0.03 228) 100%)
      `,
    },
    specialStyles: {
      customProperties: {
        "--narasimha-fire": "oklch(0.68 0.22 52)",
        "--narasimha-flame": "oklch(0.74 0.24 38)",
        "--narasimha-dusk": "oklch(0.42 0.18 228)",
      },
      moon: {
        surface: {
          light: "oklch(0.990 0.022 72)", // Brilliant warm-gold cream
          mid: "oklch(0.952 0.032 64)", // Rich champagne-gold
          dark: "oklch(0.902 0.042 58)", // Deep warm honey
        },
        shadow: {
          light: "oklch(0.195 0.032 228)", // Twilight blue-dark
          deep: "oklch(0.108 0.022 222)", // Deep dusk indigo
        },
        glow: "oklch(0.860 0.18 58 / 0.70)",
        rim: "oklch(0.95 0.14 65 / 0.18)",
      },
      header: {
        light: `
          background: linear-gradient(180deg, oklch(0.98 0.04 65 / 0.94) 0%, oklch(0.96 0.05 58 / 0.90) 100%) !important;
          border-bottom: 2px solid oklch(0.68 0.22 52 / 0.32) !important;
          box-shadow: 0 2px 20px oklch(0.68 0.22 52 / 0.16), 0 1px 0 oklch(0.74 0.24 38 / 0.18) inset;
        `,
        dark: `
          background: linear-gradient(180deg, oklch(0.14 0.04 42 / 0.93) 0%, oklch(0.10 0.03 228 / 0.90) 100%) !important;
          border-bottom: 2px solid oklch(0.68 0.22 52 / 0.32) !important;
          box-shadow: 0 2px 24px oklch(0.68 0.22 52 / 0.18), 0 1px 0 oklch(0.74 0.24 38 / 0.10) inset;
        `,
      },
      cards: {
        light: `
          background: linear-gradient(145deg, oklch(1 0 0 / 0.90) 0%, oklch(0.98 0.02 65 / 0.86) 100%) !important;
          border: 1px solid oklch(0.68 0.22 52 / 0.20) !important;
          box-shadow: 0 4px 20px oklch(0.68 0.22 52 / 0.12), 0 0 0 1px oklch(0.74 0.24 38 / 0.07), inset 0 1px 0 oklch(1 0 0 / 0.5) !important;
        `,
        dark: `
          background: linear-gradient(145deg, oklch(0.18 0.04 45 / 0.90) 0%, oklch(0.13 0.03 40 / 0.86) 100%) !important;
          border: 1px solid oklch(0.68 0.22 52 / 0.20) !important;
          box-shadow: 0 4px 28px oklch(0 0 0 / 0.50), 0 0 20px oklch(0.68 0.22 52 / 0.10) !important;
          backdrop-filter: blur(10px);
        `,
      },
      buttons: {
        light: `
          background: linear-gradient(145deg, oklch(0.68 0.22 52) 0%, oklch(0.62 0.20 42) 100%) !important;
          border: 1px solid oklch(0.74 0.24 38 / 0.40) !important;
          box-shadow: 0 4px 18px oklch(0.68 0.22 52 / 0.35), 0 0 18px oklch(0.74 0.24 38 / 0.15) !important;
        `,
        dark: `
          background: linear-gradient(145deg, oklch(0.65 0.22 52) 0%, oklch(0.58 0.20 42) 100%) !important;
          border: 1px solid oklch(0.68 0.22 52 / 0.30) !important;
          box-shadow: 0 4px 22px oklch(0 0 0 / 0.55), 0 0 22px oklch(0.68 0.22 52 / 0.22) !important;
        `,
      },
      inputs: {
        light: `
          border: 1px solid oklch(0.68 0.22 52 / 0.28) !important;
          background: linear-gradient(180deg, oklch(1 0 0 / 0.95) 0%, oklch(0.98 0.01 65 / 0.95) 100%) !important;
        `,
        dark: `
          background: linear-gradient(180deg, oklch(0.18 0.03 42 / 0.95) 0%, oklch(0.14 0.02 40 / 0.95) 100%) !important;
          border: 1px solid oklch(0.68 0.22 52 / 0.28) !important;
        `,
      },
      headings: {
        light: `
          background: linear-gradient(135deg, oklch(0.48 0.22 32) 0%, oklch(0.60 0.24 45) 30%, oklch(0.72 0.20 62) 70%, oklch(0.60 0.24 45) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        `,
        dark: `
          background: linear-gradient(135deg, oklch(0.68 0.22 38) 0%, oklch(0.74 0.22 52) 40%, oklch(0.82 0.18 66) 75%, oklch(0.74 0.22 52) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        `,
      },
      animations: [
        {
          name: "jwala-flicker",
          keyframes: `
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px oklch(0.68 0.22 52 / 0.65)); }
            35% { transform: scale(1.04); filter: drop-shadow(0 0 14px oklch(0.74 0.24 38 / 0.85)); }
            70% { transform: scale(0.98); filter: drop-shadow(0 0 10px oklch(0.68 0.22 52 / 0.75)); }
          `,
        },
        {
          name: "gold-fire",
          keyframes: `
            0%, 100% { filter: brightness(1) saturate(1); }
            50% { filter: brightness(1.12) saturate(1.15); }
          `,
        },
      ],
      decorations: {
        light: `
          content: 'नृसिंह';
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 70px;
          font-weight: 300;
          color: oklch(0.68 0.22 52 / 0.07);
          pointer-events: none;
          z-index: 0;
          line-height: 1;
          font-family: serif;
        `,
        dark: `
          content: 'नृसिंह';
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 70px;
          font-weight: 300;
          color: oklch(0.68 0.22 52 / 0.10);
          pointer-events: none;
          z-index: 0;
          line-height: 1;
          font-family: serif;
        `,
      },
      additionalCss: `
/* Fiery accent line under header */
[data-theme="narasimha-jwala"] header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, oklch(0.74 0.24 38) 15%, oklch(0.82 0.22 58) 50%, oklch(0.74 0.24 38) 85%, transparent 100%);
  border-radius: 2px;
}

/* Flame flicker on logo icon */
[data-theme="narasimha-jwala"] header a:first-child span:first-child {
  animation: jwala-flicker 2.5s ease-in-out infinite;
}

/* Fierce golden glow on primary text */
[data-theme="narasimha-jwala"] .text-theme-primary {
  animation: gold-fire 3.5s ease-in-out infinite;
}

/* Fire glow on headings */
[data-theme="narasimha-jwala"] h1,
[data-theme="narasimha-jwala"] h2 {
  text-shadow: 0 0 28px oklch(0.68 0.22 52 / 0.28);
}

/* Focus states */
[data-theme="narasimha-jwala"] input:focus,
[data-theme="narasimha-jwala"] select:focus,
[data-theme="narasimha-jwala"] textarea:focus {
  border-color: oklch(0.68 0.22 52) !important;
  box-shadow: 0 0 0 3px oklch(0.68 0.22 52 / 0.22), 0 0 15px oklch(0.74 0.24 38 / 0.15) !important;
}
`,
    },
  },
] as const;

// =============================================================================
// DERIVED VALUES (computed from catalog)
// =============================================================================

/** All theme names as a readonly array */
export const THEME_NAMES = THEME_CATALOG.map((t) => t.name) as readonly string[];

/** Default theme definition */
const foundDefault = THEME_CATALOG.find((t) => t.isDefault);
const firstTheme = THEME_CATALOG[0];
// Safety: THEME_CATALOG is guaranteed to have at least one theme
export const DEFAULT_THEME: ThemeDefinition = foundDefault ??
  firstTheme ?? {
    name: "spiritual-minimal",
    displayName: "Spiritual Minimal",
    description: "Default fallback theme",
    isDefault: true,
    category: "classic" as const,
    colors: {
      primary: "oklch(0.65 0.15 45)",
      secondary: "oklch(0.55 0.10 200)",
      accent: "oklch(0.70 0.12 85)",
    },
  };

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
export function isValidThemeName(name: string): name is string {
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
