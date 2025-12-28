/**
 * Panchanga Service - Service Layer
 *
 * Architecture:
 * - Called by: API routes (/api/daily-info, seed scripts)
 * - Calls: PanchangaSwissService (Swiss Ephemeris engine)
 * - Features: LRU caching, timezone handling, batch calculations
 *
 * Layer boundary:
 * - UI → API → Service → Engine
 * - UI never imports from this service directly
 */

import { PanchangaSwissService, type DailyPanchangaFull, type LocationConfig } from "@/server/panchanga";
import type { Location } from "@/lib/constants";
import { DateTime } from "luxon";

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEBUG_LOGGING = process.env.NODE_ENV === "development";

const CACHE_CONFIG = {
  maxSize: 365, // Cache up to 1 year of data
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// =============================================================================
// CACHE IMPLEMENTATION
// =============================================================================

interface CacheEntry {
  data: DailyPanchangaFull;
  timestamp: number;
}

/**
 * Simple LRU cache for Panchanga calculations
 * Swiss Ephemeris calculations are deterministic, so caching is safe
 */
class PanchangaCache {
  private cache = new Map<string, CacheEntry>();

  private createKey(date: string, location: Location): string {
    // Use date string + location coordinates as cache key
    return `${date}:${location.lat.toFixed(4)}:${location.lon.toFixed(4)}`;
  }

  get(date: string, location: Location): DailyPanchangaFull | null {
    const key = this.createKey(date, location);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > CACHE_CONFIG.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(date: string, location: Location, data: DailyPanchangaFull): void {
    const key = this.createKey(date, location);

    // Evict oldest entry if cache is full (LRU)
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

/**
 * Panchanga Service
 *
 * Provides high-level interface for Panchanga calculations with caching.
 * This is the layer between API routes and the Swiss Ephemeris engine.
 */
export class PanchangaService {
  private swissService = new PanchangaSwissService();
  private cache = new PanchangaCache();

  /**
   * Calculate Panchanga for a single date
   *
   * @param date - JavaScript Date object (treated as calendar day in timezone)
   * @param location - Location with name, lat, lon
   * @param timezone - IANA timezone (e.g., "Europe/Amsterdam")
   * @returns Complete Panchanga data
   */
  async calculateDaily(
    date: Date,
    location: Location,
    timezone: string
  ): Promise<DailyPanchangaFull> {
    // Convert Date to YYYY-MM-DD string in the given timezone
    // IMPORTANT: Do NOT use date.toISOString().split('T')[0] as it can shift days!
    const dt = DateTime.fromJSDate(date, { zone: timezone });
    const dateStr = dt.toISODate(); // YYYY-MM-DD in local timezone

    if (!dateStr) {
      throw new Error(`Invalid date: ${date}`);
    }

    // Check cache first
    const cached = this.cache.get(dateStr, location);
    if (cached) {
      if (DEBUG_LOGGING) {
        console.log(`[PanchangaService] Cache hit for ${dateStr}`);
      }
      return cached;
    }

    // Convert to LocationConfig for Swiss Ephemeris
    const locConfig: LocationConfig = {
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      tz: timezone,
    };

    // Calculate using Swiss Ephemeris engine
    if (DEBUG_LOGGING) {
      console.log(`[PanchangaService] Computing Panchanga for ${dateStr} at ${location.name}`);
    }

    const result = await this.swissService.computeDaily(dateStr, locConfig);

    // Cache the result
    this.cache.set(dateStr, location, result);

    return result;
  }

  /**
   * Calculate Panchanga for a date range
   *
   * @param startDate - Start of range (inclusive)
   * @param endDate - End of range (inclusive)
   * @param location - Location with name, lat, lon
   * @param timezone - IANA timezone
   * @returns Array of Panchanga data
   */
  async calculateRange(
    startDate: Date,
    endDate: Date,
    location: Location,
    timezone: string
  ): Promise<DailyPanchangaFull[]> {
    const results: DailyPanchangaFull[] = [];

    // Use Luxon for proper date iteration in timezone
    let current = DateTime.fromJSDate(startDate, { zone: timezone }).startOf('day');
    const end = DateTime.fromJSDate(endDate, { zone: timezone }).startOf('day');

    if (DEBUG_LOGGING) {
      const days = Math.ceil(end.diff(current, 'days').days) + 1;
      console.log(`[PanchangaService] Computing range: ${days} days from ${current.toISODate()} to ${end.toISODate()}`);
    }

    while (current <= end) {
      const jsDate = current.toJSDate();
      const panchanga = await this.calculateDaily(jsDate, location, timezone);
      results.push(panchanga);

      // Move to next day
      current = current.plus({ days: 1 });
    }

    if (DEBUG_LOGGING) {
      console.log(`[PanchangaService] Computed ${results.length} days (${this.cache.size} in cache)`);
    }

    return results;
  }

  /**
   * Clear the cache (useful for testing or when location settings change)
   */
  clearCache(): void {
    this.cache.clear();
    if (DEBUG_LOGGING) {
      console.log('[PanchangaService] Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.maxSize,
      ttlMs: CACHE_CONFIG.ttlMs,
    };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

/**
 * Export a singleton instance for use across the application
 * This ensures cache is shared between API calls
 */
export const panchangaService = new PanchangaService();
