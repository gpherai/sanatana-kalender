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
 * Base fields shared by all /api/daily-info responses.
 * The full response shape (with structured tithi, nakshatra, etc.) is in DailyInfoResponse (src/types/api.ts).
 * This interface covers only the scalar fields that DailyInfoResponse does not override.
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
  moonriseUtcIso: string | null;
  moonsetUtcIso: string | null;
  moonPhasePercent: number;
  moonPhaseType: string | null;
  isWaxing: boolean;
  // Note: tithi, nakshatra, yoga, karana, maas are structured objects in DailyInfoResponse.
  // They are omitted here and overridden there via Omit<DailyInfoData, ...>.
}
