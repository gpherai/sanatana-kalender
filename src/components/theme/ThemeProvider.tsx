"use client";

/**
 * ThemeProvider - Unified Theme & Color Mode Management
 *
 * Manages color themes and light/dark mode via React Context.
 *
 * Architecture:
 * - Source of truth: THEME_CATALOG in src/config/themes.ts
 * - Themes applied via [data-theme] attribute on <html>
 * - Dark mode via .dark class on <html>
 * - State persisted to localStorage only
 * - Database sync happens in Settings page, not here
 *
 * @see src/config/themes.ts - Theme definitions
 * @see src/app/layout.tsx - SSR initialization script
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  THEME_CATALOG,
  THEME_STORAGE_KEY,
  DEFAULT_THEME_NAME,
  DEFAULT_COLOR_MODE,
  isValidThemeName,
  toThemeOption,
  parseStoredThemeState,
  serializeThemeState,
  type ThemeOption,
  type ColorMode,
  type ResolvedColorMode,
  type PersistedThemeState,
} from "@/config/themes";

// =============================================================================
// CONTEXT TYPE
// =============================================================================

interface ThemeContextValue {
  /** Current theme name */
  readonly themeName: string;
  /** Current color mode preference */
  readonly colorMode: ColorMode;
  /** Resolved color mode (never "system") */
  readonly resolvedColorMode: ResolvedColorMode;
  /** Set theme by name */
  readonly setTheme: (themeName: string) => void;
  /** Set color mode preference */
  readonly setColorMode: (mode: ColorMode) => void;
  /** Toggle between light and dark */
  readonly toggleColorMode: () => void;
  /** All available themes */
  readonly themes: readonly ThemeOption[];
  /** Current theme data */
  readonly currentTheme: ThemeOption;
}

// =============================================================================
// CONSTANTS (computed once)
// =============================================================================

const THEME_OPTIONS: readonly ThemeOption[] = Object.freeze(
  THEME_CATALOG.map(toThemeOption)
);

// =============================================================================
// SYSTEM COLOR MODE DETECTION
// =============================================================================

function getSystemColorMode(): ResolvedColorMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToSystemColorMode(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

// Server-side snapshot for useSyncExternalStore
function getServerSnapshot(): ResolvedColorMode {
  return "light";
}

// =============================================================================
// DOM MANIPULATION
// =============================================================================

function applyThemeToDOM(themeName: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", themeName);
}

function applyColorModeToDOM(mode: ResolvedColorMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
}

// =============================================================================
// STORAGE
// =============================================================================

function loadFromStorage(): PersistedThemeState | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return parseStoredThemeState(stored);
  } catch {
    return null;
  }
}

function saveToStorage(state: PersistedThemeState): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, serializeThemeState(state));
  } catch {
    // Storage might be unavailable (private browsing, quota exceeded)
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface ThemeProviderProps {
  readonly children: ReactNode;
  /** Override default theme (useful for testing) */
  readonly defaultTheme?: string;
  /** Override default color mode (useful for testing) */
  readonly defaultColorMode?: ColorMode;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME_NAME,
  defaultColorMode = DEFAULT_COLOR_MODE,
}: ThemeProviderProps) {
  // Subscribe to system color mode changes via useSyncExternalStore
  const systemColorMode = useSyncExternalStore(
    subscribeToSystemColorMode,
    getSystemColorMode,
    getServerSnapshot
  );

  // Initialize state from localStorage or defaults
  const [themeName, setThemeNameState] = useState<string>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = loadFromStorage();
    return stored?.themeName ?? defaultTheme;
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    if (typeof window === "undefined") return defaultColorMode;
    const stored = loadFromStorage();
    return stored?.colorMode ?? defaultColorMode;
  });

  // Resolved color mode (never "system")
  const resolvedColorMode: ResolvedColorMode =
    colorMode === "system" ? systemColorMode : colorMode;

  // Apply theme to DOM on mount and changes
  useEffect(() => {
    applyThemeToDOM(themeName);
  }, [themeName]);

  // Apply color mode to DOM on mount and changes
  useEffect(() => {
    applyColorModeToDOM(resolvedColorMode);
  }, [resolvedColorMode]);

  // Persist to storage when state changes
  useEffect(() => {
    saveToStorage({ themeName, colorMode });
  }, [themeName, colorMode]);

  // Theme setter with validation
  const setTheme = useCallback((newThemeName: string) => {
    if (!isValidThemeName(newThemeName)) {
      console.warn(`[ThemeProvider] Invalid theme: "${newThemeName}"`);
      return;
    }
    setThemeNameState(newThemeName);
  }, []);

  // Color mode setter
  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
  }, []);

  // Toggle color mode (cycles through or flips based on current)
  const toggleColorMode = useCallback(() => {
    setColorModeState((current) => {
      if (current === "system") {
        // If system, switch to opposite of current system preference
        return systemColorMode === "dark" ? "light" : "dark";
      }
      return current === "light" ? "dark" : "light";
    });
  }, [systemColorMode]);

  // Current theme data
  const foundTheme = THEME_OPTIONS.find((t) => t.name === themeName);
  const fallbackTheme = THEME_OPTIONS[0];
  // Safety: THEME_OPTIONS is guaranteed to have at least one theme (defined in THEME_CATALOG)
  const currentTheme: ThemeOption = foundTheme ??
    fallbackTheme ?? {
      name: DEFAULT_THEME_NAME,
      displayName: "Default",
      description: "",
      colors: { primary: "", secondary: "", accent: "" },
      isDefault: true,
      category: "classic" as const,
    };

  // Context value (stable reference via individual deps)
  const value: ThemeContextValue = {
    themeName,
    colorMode,
    resolvedColorMode,
    setTheme,
    setColorMode,
    toggleColorMode,
    themes: THEME_OPTIONS,
    currentTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Access theme context.
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
