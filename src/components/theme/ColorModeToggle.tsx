"use client";

/**
 * ColorModeToggle - Toggle between light/dark/system modes
 *
 * Provides two components:
 * - ColorModeToggle: Simple button for quick toggle
 * - ColorModeSelect: Dropdown for full control
 *
 * Both components use a "mounted" state to prevent hydration mismatches.
 * During SSR, a neutral placeholder is shown until the client mounts.
 */

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, type LucideIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import type { ColorMode } from "@/config/themes";

// =============================================================================
// CONSTANTS
// =============================================================================

interface ColorModeOption {
  readonly value: ColorMode;
  readonly label: string;
  readonly Icon: LucideIcon;
}

const COLOR_MODE_OPTIONS: readonly ColorModeOption[] = [
  { value: "light", label: "Licht", Icon: Sun },
  { value: "dark", label: "Donker", Icon: Moon },
  { value: "system", label: "Systeem", Icon: Monitor },
] as const;

// =============================================================================
// SIMPLE TOGGLE BUTTON
// =============================================================================

interface ColorModeToggleProps {
  readonly className?: string;
}

/**
 * Simple toggle button - switches between light and dark.
 * Does not expose "system" mode (use ColorModeSelect for that).
 *
 * Uses mounted state to prevent hydration mismatch - during SSR
 * we show a neutral placeholder (Monitor icon).
 */
export function ColorModeToggle({ className }: ColorModeToggleProps) {
  const { resolvedColorMode, toggleColorMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the actual color mode after mount to prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: hydration mismatch prevention pattern
    setMounted(true);
  }, []);

  // During SSR and initial hydration, show a neutral placeholder
  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "rounded-lg p-2 transition-colors",
          "bg-theme-surface-raised hover:bg-theme-surface-hover",
          "focus-visible:ring-theme-primary focus-visible:ring-2 focus-visible:outline-none",
          className
        )}
        aria-label="Kleurmodus wisselen"
        title="Kleurmodus"
        disabled
      >
        {/* Neutral icon during SSR - prevents hydration mismatch */}
        <Monitor className="h-5 w-5 text-theme-fg-muted" aria-hidden="true" />
      </button>
    );
  }

  const isDark = resolvedColorMode === "dark";

  return (
    <button
      type="button"
      onClick={toggleColorMode}
      className={cn(
        "rounded-lg p-2 transition-colors",
        "bg-theme-surface-raised hover:bg-theme-surface-hover",
        "focus-visible:ring-theme-primary focus-visible:ring-2 focus-visible:outline-none",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Lichte modus" : "Donkere modus"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-theme-icon-mode-sun" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-theme-icon-mode-moon" aria-hidden="true" />
      )}
    </button>
  );
}

// =============================================================================
// SELECT DROPDOWN
// =============================================================================

interface ColorModeSelectProps {
  readonly className?: string;
}

/**
 * Select dropdown for light/dark/system selection.
 * Shows all three options with icons.
 *
 * Uses mounted state to prevent hydration mismatch.
 */
export function ColorModeSelect({ className }: ColorModeSelectProps) {
  const { colorMode, setColorMode, resolvedColorMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: hydration mismatch prevention pattern
    setMounted(true);
  }, []);

  // During SSR, show a disabled placeholder
  if (!mounted) {
    return (
      <div className={cn("relative inline-block", className)}>
        <select
          disabled
          className={cn(
            "appearance-none rounded-lg py-2 pr-8 pl-9",
            "bg-theme-surface-raised",
            "border border-theme-border",
            "text-theme-fg-muted",
            "text-sm font-medium",
            "cursor-wait"
          )}
          aria-label="Kleurmodus laden..."
        >
          <option>Laden...</option>
        </select>
        <Monitor
          className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-theme-fg-muted"
          aria-hidden="true"
        />
      </div>
    );
  }

  const currentOption =
    COLOR_MODE_OPTIONS.find((o) => o.value === colorMode) ?? COLOR_MODE_OPTIONS[2];
  // Safety: currentOption is guaranteed by the nullish coalescing above, but TypeScript
  // with noUncheckedIndexedAccess doesn't know COLOR_MODE_OPTIONS[2] exists
  if (!currentOption) return null;
  const CurrentIcon = currentOption.Icon;

  return (
    <div className={cn("relative inline-block", className)}>
      <select
        value={colorMode}
        onChange={(e) => setColorMode(e.target.value as ColorMode)}
        className={cn(
          "appearance-none rounded-lg py-2 pr-8 pl-9",
          "bg-theme-surface-raised",
          "border border-theme-border",
          "text-theme-fg",
          "text-sm font-medium",
          "focus-visible:ring-theme-primary focus-visible:ring-2 focus-visible:outline-none",
          "cursor-pointer"
        )}
        aria-label="Kleurmodus selecteren"
      >
        {COLOR_MODE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Icon overlay */}
      <CurrentIcon
        className={cn(
          "pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2",
          resolvedColorMode === "dark" ? "text-theme-icon-mode-sun" : "text-theme-icon-mode-moon"
        )}
        aria-hidden="true"
      />

      {/* Dropdown arrow */}
      <svg
        className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-theme-fg-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
