// ============================================
// PANCHANGA HELPERS
// Utilities for working with Panchanga data
// ============================================

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
 * Detect special lunar days from exact Tithi data.
 * Returns special day information if the tithi corresponds to a significant lunar event.
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
export function detectSpecialDay(
  tithi: TithiInfo,
  date: Date = new Date()
): SpecialDay | null {
  if (!tithi) return null;

  const { number, paksha } = tithi;

  // Purnima (Full Moon) - 15th Shukla Paksha
  if (number === 15 && paksha === "Shukla") {
    return {
      date,
      type: "purnima",
      name: "Purnima",
      description: "Volle Maan - Heilige dag",
      emoji: "🌕",
    };
  }

  // Amavasya (New Moon) - 15th Krishna Paksha
  if (number === 15 && paksha === "Krishna") {
    return {
      date,
      type: "amavasya",
      name: "Amavasya",
      description: "Nieuwe Maan - Voorouderdag",
      emoji: "🌑",
    };
  }

  // Ekadashi (11th tithi) - Important fasting day for Vishnu worship
  if (number === 11) {
    return {
      date,
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
        date,
        type: "chaturthi",
        name: "Vinayaka Chaturthi",
        description: "Ganesha puja dag",
        emoji: "🙏",
      };
    } else {
      return {
        date,
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
      date,
      type: "pradosham",
      name: "Pradosham",
      description: "Shiva vereringsdag",
      emoji: "🔱",
    };
  }

  // Ashtami (8th tithi) - Durga/Devi worship
  if (number === 8) {
    return {
      date,
      type: "ashtami",
      name: `${paksha} Ashtami`,
      description: "Durga dag",
      emoji: "⚔️",
    };
  }

  return null;
}
