// ============================================
// PANCHANGA HELPERS
// Utilities for working with Panchanga data
// ============================================

/**
 * Hindu month names in order starting from Pausha (aligns with Gregorian calendar offset)
 */
const HINDU_MONTHS = [
  "Pausha",
  "Magha",
  "Phalguna",
  "Chaitra",
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadrapada",
  "Ashwin",
  "Kartik",
  "Margashirsha",
] as const;

/**
 * Interface for special lunar days detected from Panchanga data
 */
export interface SpecialDay {
  date: Date;
  type: string;
  name: string;
  description: string;
  emoji: string;
}

/**
 * Tithi information structure (subset of full Panchanga data)
 */
export interface TithiInfo {
  number: number;
  name: string;
  paksha: "Shukla" | "Krishna";
  endTime?: string | null;
}

/**
 * Get approximate Hindu month name for a given Gregorian date.
 * Uses a simple offset calculation - for exact results, use Panchanga calculation.
 *
 * @param date - Gregorian date to convert
 * @returns Hindu month name (e.g., "Chaitra", "Kartik")
 *
 * @example
 * getApproximateHinduMonth(new Date(2025, 0, 15)) // "Pausha"
 * getApproximateHinduMonth(new Date(2025, 3, 10)) // "Chaitra"
 */
export function getApproximateHinduMonth(date: Date): string {
  const month = date.getMonth();
  const index = month % 12;
  return HINDU_MONTHS[index] ?? "Unknown";
}

/**
 * Detect special lunar days from exact Tithi data.
 * Returns special day information if the tithi corresponds to a significant lunar event.
 *
 * @deprecated Use server-calculated specialDay from DailyInfoResponse instead.
 * This function will be removed in v2.0.0.
 * Server-side calculation provides better caching and consistency.
 *
 * @param tithi - Tithi information from Panchanga calculation
 * @returns SpecialDay object if significant, null otherwise
 *
 * Special days detected:
 * - Purnima (Full Moon) - 15th Shukla Paksha
 * - Amavasya (New Moon) - 15th Krishna Paksha
 * - Ekadashi (Fasting day) - 11th of both pakshas
 * - Vinayaka/Sankashti Chaturthi (Ganesha days) - 4th of both pakshas
 * - Pradosham (Shiva worship) - 13th of both pakshas
 * - Ashtami (Durga day) - 8th of both pakshas
 *
 * @example
 * detectSpecialDay({ number: 15, paksha: "Shukla", name: "Purnima" })
 * // { type: "purnima", name: "Purnima", description: "Volle Maan - Heilige dag", emoji: "🌕" }
 */
export function detectSpecialDay(tithi: TithiInfo): SpecialDay | null {
  if (!tithi) return null;

  const { number, paksha } = tithi;

  // Purnima (Full Moon) - 15th Shukla Paksha
  if (number === 15 && paksha === "Shukla") {
    return {
      date: new Date(), // Will be set by caller
      type: "purnima",
      name: "Purnima",
      description: "Volle Maan - Heilige dag",
      emoji: "🌕",
    };
  }

  // Amavasya (New Moon) - 15th Krishna Paksha
  if (number === 15 && paksha === "Krishna") {
    return {
      date: new Date(),
      type: "amavasya",
      name: "Amavasya",
      description: "Nieuwe Maan - Voorouderdag",
      emoji: "🌑",
    };
  }

  // Ekadashi (11th tithi) - Important fasting day for Vishnu worship
  if (number === 11) {
    return {
      date: new Date(),
      type: "ekadashi",
      name: `${paksha} Ekadashi`,
      description: "Vishnu vastendag",
      emoji: "🙏",
    };
  }

  // Chaturthi (4th tithi) - Ganesha days
  if (number === 4) {
    if (paksha === "Shukla") {
      return {
        date: new Date(),
        type: "chaturthi",
        name: "Vinayaka Chaturthi",
        description: "Ganesha puja dag",
        emoji: "🙏",
      };
    } else {
      return {
        date: new Date(),
        type: "sankashti",
        name: "Sankashti Chaturthi",
        description: "Ganesha vastendag",
        emoji: "🐘",
      };
    }
  }

  // Pradosham (13th tithi) - Shiva worship time
  if (number === 13) {
    return {
      date: new Date(),
      type: "pradosham",
      name: "Pradosham",
      description: "Shiva vereringsdag",
      emoji: "🔱",
    };
  }

  // Ashtami (8th tithi) - Durga/Devi worship
  if (number === 8) {
    return {
      date: new Date(),
      type: "ashtami",
      name: `${paksha} Ashtami`,
      description: "Durga dag",
      emoji: "⚔️",
    };
  }

  return null;
}

/**
 * Extract all special lunar days from an array of daily Panchanga data.
 * Useful for calendar month views.
 *
 * @deprecated Use server-calculated specialDay from DailyInfoResponse instead.
 * This function will be removed in v2.0.0.
 * Server-side calculation provides better caching and consistency.
 *
 * @param monthData - Array of daily info responses containing tithi data
 * @returns Array of SpecialDay objects found in the month
 *
 * @example
 * const monthData = await fetch('/api/daily-info?start=2025-01-01&end=2025-01-31').then(r => r.json())
 * const specialDays = getSpecialLunarDays(monthData)
 * // Returns array of special days found in January
 */
export function getSpecialLunarDays<T extends { date: string | Date; tithi?: TithiInfo }>(
  monthData: T[]
): SpecialDay[] {
  const specialDays: SpecialDay[] = [];

  for (const day of monthData) {
    if (!day.tithi) continue;

    const specialDay = detectSpecialDay(day.tithi);
    if (specialDay) {
      // Set the correct date for this special day
      const date = typeof day.date === "string" ? new Date(day.date) : day.date;
      specialDay.date = date;
      specialDays.push(specialDay);
    }
  }

  return specialDays;
}
