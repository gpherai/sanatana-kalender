// ============================================
// MOON PHASE UTILITIES
// Business logic for moon phase calculations
// ============================================

import type { MoonPhaseType } from "@prisma/client";

/**
 * Determine Moon Phase Type from illumination percentage.
 * Matches Prisma MoonPhaseType enum values.
 *
 * Thresholds (astronomical convention):
 *   0–3%   = New Moon (near-invisible)
 *   3–45%  = Crescent (growing/shrinking)
 *   45–55% = Quarter (~50% illuminated)
 *   55–97% = Gibbous (more than half lit)
 *   >97%   = Full Moon
 *
 * @param illuminationPct - Moon illumination percentage (0-100)
 * @param waxing - Whether the moon is waxing (growing) or waning (shrinking)
 * @returns Moon phase type string matching Prisma enum
 *
 * @example
 * getMoonPhaseType(50, true)  // "FIRST_QUARTER"
 * getMoonPhaseType(98, true)  // "FULL_MOON"
 * getMoonPhaseType(25, false) // "WANING_CRESCENT"
 */
export function getMoonPhaseType(
  illuminationPct: number,
  waxing: boolean
): MoonPhaseType {
  if (illuminationPct < 3) return "NEW_MOON";
  if (illuminationPct > 97) return "FULL_MOON";

  if (waxing) {
    if (illuminationPct < 45) return "WAXING_CRESCENT";
    if (illuminationPct < 55) return "FIRST_QUARTER";
    return "WAXING_GIBBOUS";
  } else {
    if (illuminationPct > 55) return "WANING_GIBBOUS";
    if (illuminationPct > 45) return "LAST_QUARTER";
    return "WANING_CRESCENT";
  }
}

/**
 * Get moon phase emoji based on illumination percentage and waxing/waning status.
 *
 * @param pct - Moon illumination percentage (0-100)
 * @param waxing - Whether the moon is waxing (growing) or waning (shrinking)
 * @returns Unicode emoji representing the moon phase
 *
 * @example
 * getMoonPhaseEmoji(0, true)   // "🌑" (new moon)
 * getMoonPhaseEmoji(100, true) // "🌕" (full moon)
 * getMoonPhaseEmoji(30, true)  // "🌒" (waxing crescent)
 */
export function getMoonPhaseEmoji(pct: number, waxing: boolean): string {
  if (pct < 3) return "🌑";
  if (pct > 97) return "🌕";

  if (waxing) {
    if (pct < 45) return "🌒";
    if (pct < 55) return "🌓";
    return "🌔";
  } else {
    if (pct > 55) return "🌖";
    if (pct > 45) return "🌗";
    return "🌘";
  }
}

/**
 * Get Dutch name for moon phase type.
 *
 * @param type - Moon phase type (matches Prisma MoonPhaseType enum)
 * @returns Dutch translation of the moon phase name
 *
 * @example
 * getMoonPhaseName("FULL_MOON")      // "Volle Maan"
 * getMoonPhaseName("WAXING_CRESCENT") // "Wassende Sikkel"
 */
export function getMoonPhaseName(type: string): string {
  const names: Record<string, string> = {
    NEW_MOON: "Nieuwe Maan",
    WAXING_CRESCENT: "Wassende Sikkel",
    FIRST_QUARTER: "Eerste Kwartier",
    WAXING_GIBBOUS: "Wassende Maan",
    FULL_MOON: "Volle Maan",
    WANING_GIBBOUS: "Afnemende Maan",
    LAST_QUARTER: "Laatste Kwartier",
    WANING_CRESCENT: "Afnemende Sikkel",
  };
  return names[type] ?? "Onbekend";
}
