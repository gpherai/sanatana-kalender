/**
 * Panchanga Service - Service Layer
 *
 * Architecture:
 * - Called by: API routes (/api/daily-info, seed scripts)
 * - Calls: PanchangaSwissService (Swiss Ephemeris engine)
 * - Features: TTL cache with LRU eviction, timezone handling, batch calculations
 *
 * Layer boundary:
 * - UI → API → Service → Engine
 * - UI never imports from this service directly
 */

import {
  PanchangaSwissService,
  type DailyPanchangaFull,
  type LocationConfig,
} from "@/engine/panchanga";
import type { Location } from "@/lib/domain";
import { logDebug } from "@/lib/utils";
import { DateTime } from "luxon";

// =============================================================================
// CONFIGURATION
// =============================================================================

const CACHE_CONFIG = {
  maxSize: 2000, // Cache up to 2000 days of data (approx 5.5 years)
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

  private createKey(date: string, location: Location, timezone: string): string {
    // Include timezone in cache key: same date + location with different timezone yields different results
    return `${date}:${location.lat.toFixed(4)}:${location.lon.toFixed(4)}:${timezone}`;
  }

  get(date: string, location: Location, timezone: string): DailyPanchangaFull | null {
    const key = this.createKey(date, location, timezone);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_CONFIG.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Move to end of Map to update recency (LRU eviction order)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(
    date: string,
    location: Location,
    timezone: string,
    data: DailyPanchangaFull
  ): void {
    const key = this.createKey(date, location, timezone);

    // Evict least-recently-used entry when cache is full
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
class PanchangaService {
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

    // Today's data contains time-sensitive moonrise/moonset (upcomingFromNow logic),
    // so we skip the cache for it — historical dates are safe to cache indefinitely.
    const todayStr = DateTime.now().setZone(timezone).toISODate();
    const isToday = dateStr === todayStr;

    // Check cache first (only for non-today dates)
    if (!isToday) {
      const cached = this.cache.get(dateStr, location, timezone);
      if (cached) {
        logDebug(`[PanchangaService] Cache hit for ${dateStr}`);
        return cached;
      }
    }

    // Convert to LocationConfig for Swiss Ephemeris
    const locConfig: LocationConfig = {
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      tz: timezone,
    };

    const result = await this.swissService.computeDaily(dateStr, locConfig);

    // Cache the result (only for non-today dates)
    if (!isToday) {
      this.cache.set(dateStr, location, timezone, result);
    }

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
    let current = DateTime.fromJSDate(startDate, { zone: timezone }).startOf("day");
    const end = DateTime.fromJSDate(endDate, { zone: timezone }).startOf("day");

    logDebug(
      `[PanchangaService] Computing range: ${Math.ceil(end.diff(current, "days").days) + 1} days from ${current.toISODate()} to ${end.toISODate()}`
    );

    let daysProcessed = 0;

    while (current <= end) {
      const jsDate = current.toJSDate();
      const panchanga = await this.calculateDaily(jsDate, location, timezone);
      results.push(panchanga);

      // Move to next day
      current = current.plus({ days: 1 });
      daysProcessed++;

      // Yield the event loop every 10 days to prevent blocking concurrent Prisma connections
      // and other incoming API requests when computing large ranges.
      if (daysProcessed % 10 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    logDebug(
      `[PanchangaService] Computed ${results.length} days (${this.cache.size} in cache)`
    );

    return results;
  }

  /**
   * Clear the cache (useful for testing or when location settings change)
   */
  clearCache(): void {
    this.cache.clear();
    logDebug("[PanchangaService] Cache cleared");
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
 * Singleton pattern using globalThis to survive Next.js hot-reload.
 * Without this, each hot-reload creates a new instance, losing the LRU cache.
 * Same pattern as src/lib/db.ts uses for PrismaClient.
 */
const globalForPanchanga = globalThis as unknown as {
  panchangaService: PanchangaService | undefined;
};

export const panchangaService =
  globalForPanchanga.panchangaService ?? new PanchangaService();

if (process.env.NODE_ENV !== "production") {
  globalForPanchanga.panchangaService = panchangaService;
}
