import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================================
// Class Name Utilities
// ============================================================================

/**
 * Combines clsx and tailwind-merge for conditional class names
 * Usage: cn("base-class", conditional && "conditional-class", "override-class")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Development-only logging flag.
 * Console output is suppressed in production.
 */
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/**
 * Log error message in all environments.
 * Errors always need to be visible — silencing them in production hides real failures.
 *
 * @example
 * logError("Failed to fetch", error);
 */
export function logError(message: string, ...args: unknown[]): void {
  console.error(`[Error] ${message}`, ...args);
}

/**
 * Log warning message in all environments.
 * Warnings indicate unexpected but non-fatal situations that should be visible.
 *
 * @example
 * logWarn("Deprecated API used");
 */
export function logWarn(message: string, ...args: unknown[]): void {
  console.warn(`[Warn] ${message}`, ...args);
}

/**
 * Log debug message only in development.
 *
 * @example
 * logDebug("Fetched events", events.length);
 */
export function logDebug(message: string, ...args: unknown[]): void {
  if (IS_DEVELOPMENT) {
    console.log(`[Debug] ${message}`, ...args);
  }
}

// ============================================================================
// Misc Utilities
// ============================================================================

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
