/**
 * Services Module - Public API
 *
 * This file exports all public functions and types from the services layer.
 * Internal implementation details (like cache instances) are not exposed.
 *
 * @module services
 */

// =============================================================================
// NOTE: PANCHANGA SERVICE (SERVER-ONLY)
// =============================================================================
//
// The panchanga service is NOT exported here because it uses Swiss Ephemeris (server-only).
// Import directly from "./panchanga.service" in API routes/seed scripts:
//
//   import { panchangaService } from "@/services/panchanga.service";
//
// =============================================================================

// =============================================================================
// NOTE: RECURRENCE SERVICE (SERVER-ONLY)
// =============================================================================
//
// The recurrence service is NOT exported here because it uses Prisma (server-only).
// Import directly from "./recurrence.service" in server components/API routes:
//
//   import { generateOccurrences } from "@/services/recurrence.service";
//
// =============================================================================

// =============================================================================
// TYPE EXPORTS (for client-side components)
// =============================================================================
//
// These types are used by components that call the API endpoints.
// The actual service implementations are server-only.
//

/**
 * Daily astronomical and panchanga information
 * Returned by /api/daily-info endpoint
 */
export interface DailyInfoData {
  date: string; // YYYY-MM-DD
  locationName: string;
  locationLat: number;
  locationLon: number;
  sunrise: string | null; // HH:mm
  sunset: string | null;
  moonrise: string | null;
  moonset: string | null;
  moonPhasePercent: number;
  moonPhaseType: string | null;
  isWaxing: boolean;
  tithi: string | null;
  tithiEndTime: string | null;
  nakshatra: string | null;
  nakshatraEndTime: string | null;
  yogaName: string | null;
  yogaEndTime: string | null;
  karanaName: string | null;
  karanaType: string | null;
  karanaEndTime: string | null;
  maas: string | null;
  paksha: string | null;
}
