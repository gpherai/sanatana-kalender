"use client";

/**
 * ColorModeToggle - Toggle between light and dark mode
 *
 * Simple button that switches between light and dark.
 * Uses a "mounted" state to prevent hydration mismatches.
 * During SSR, a neutral placeholder is shown until the client mounts.
 */

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

// =============================================================================
// TOGGLE BUTTON
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
        suppressHydrationWarning
      >
        {/* Neutral icon during SSR - prevents hydration mismatch */}
        <Monitor className="text-theme-fg-muted h-5 w-5" aria-hidden="true" />
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
        <Sun className="text-theme-icon-mode-sun h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="text-theme-icon-mode-moon h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
