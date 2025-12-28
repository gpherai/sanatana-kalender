/**
 * Panchanga Module - Server-only Entry Point
 *
 * This module must NEVER be imported by client-side code.
 * The Swiss Ephemeris engine should only be accessed via:
 * - API routes (/api/daily-info)
 * - Server-side services
 * - Seed scripts
 *
 * UI components must get all Panchanga data via API responses.
 *
 * Note: server-only import is conditionally applied only in Next.js runtime,
 * allowing seed scripts to import this module.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "Panchanga module cannot be imported in client-side code. Use API endpoints instead."
  );
}

export { PanchangaSwissService } from "./services/PanchangaSwissService";
export type { DailyPanchangaFull, LocationConfig } from "./types";
export {
  TITHI_NAMES,
  NAKSHATRA_NAMES,
  YOGA_NAMES,
  KARANA_NAMES,
  VARA_NAMES,
  LUNAR_MASA_NAMES,
  SOLAR_MASA_NAMES,
} from "./constants";
export type {
  TithiName,
  NakshatraName,
  YogaName,
  KaranaName,
  VaraName,
  LunarMasaName,
  SolarMasaName,
} from "./constants";
