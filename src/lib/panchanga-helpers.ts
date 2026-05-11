// ============================================
// PANCHANGA HELPERS
// Utilities for working with Panchanga data
// ============================================

import type { MoonPhaseType, Tithi } from "@prisma/client";
import type { DayInfo } from "@/types/sadhana";

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
  // Guard for JS callers that may pass undefined despite the TypeScript type.
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

// =============================================================================
// DB → DayInfo derivation (avoids Swiss Ephemeris re-computation)
// =============================================================================

// These lookup tables mirror the TITHIS catalog in src/config (via domain.ts).
// If new tithis are added there, update these tables accordingly.
const TITHI_BASE_TO_NUMBER: Record<string, number> = {
  PRATIPADA: 1,
  DWITIYA: 2,
  TRITIYA: 3,
  CHATURTHI: 4,
  PANCHAMI: 5,
  SHASHTHI: 6,
  SAPTAMI: 7,
  ASHTAMI: 8,
  NAVAMI: 9,
  DASHAMI: 10,
  EKADASHI: 11,
  DWADASHI: 12,
  TRAYODASHI: 13,
  CHATURDASHI: 14,
  PURNIMA: 15,
  AMAVASYA: 15,
};

const TITHI_BASE_TO_NAME: Record<string, string> = {
  PRATIPADA: "Pratipada",
  DWITIYA: "Dwitiya",
  TRITIYA: "Tritiya",
  CHATURTHI: "Chaturthi",
  PANCHAMI: "Panchami",
  SHASHTHI: "Shashthi",
  SAPTAMI: "Saptami",
  ASHTAMI: "Ashtami",
  NAVAMI: "Navami",
  DASHAMI: "Dashami",
  EKADASHI: "Ekadashi",
  DWADASHI: "Dwadashi",
  TRAYODASHI: "Trayodashi",
  CHATURDASHI: "Chaturdashi",
  PURNIMA: "Purnima",
  AMAVASYA: "Amavasya",
};

const MOON_PHASE_EVENT: Partial<
  Record<MoonPhaseType, "new" | "first_quarter" | "full" | "last_quarter">
> = {
  NEW_MOON: "new",
  FIRST_QUARTER: "first_quarter",
  FULL_MOON: "full",
  LAST_QUARTER: "last_quarter",
};

function parseTithiEnum(tithi: Tithi): TithiInfo | null {
  if (tithi === "PURNIMA") return { number: 15, name: "Purnima", paksha: "Shukla" };
  if (tithi === "AMAVASYA") return { number: 15, name: "Amavasya", paksha: "Krishna" };

  const sep = tithi.lastIndexOf("_");
  if (sep === -1) return null;

  const base = tithi.slice(0, sep);
  const pakshaStr = tithi.slice(sep + 1);
  const number = TITHI_BASE_TO_NUMBER[base];
  const name = TITHI_BASE_TO_NAME[base];
  if (!number || !name) return null;

  return { number, name, paksha: pakshaStr === "SHUKLA" ? "Shukla" : "Krishna" };
}

export function deriveDayInfoFromDailyInfo(
  tithi: Tithi | null,
  moonPhaseType: MoonPhaseType | null,
  date: Date
): DayInfo {
  const moonPhaseEventType = moonPhaseType ? MOON_PHASE_EVENT[moonPhaseType] : undefined;
  const moonPhaseEvent = moonPhaseEventType ? { type: moonPhaseEventType } : null;
  const parsedTithi = tithi ? parseTithiEnum(tithi) : null;

  let specialDay: DayInfo["specialDay"] = null;
  if (moonPhaseEvent?.type === "full") {
    specialDay = { type: "purnima", name: "Purnima", emoji: "🌕" };
  } else if (moonPhaseEvent?.type === "new") {
    specialDay = { type: "amavasya", name: "Amavasya", emoji: "🌑" };
  } else if (parsedTithi) {
    const sd = detectSpecialDay(parsedTithi, date);
    if (sd && sd.type !== "purnima" && sd.type !== "amavasya") {
      specialDay = { type: sd.type, name: sd.name, emoji: sd.emoji };
    }
  }

  return {
    tithi: parsedTithi
      ? { name: parsedTithi.name, paksha: parsedTithi.paksha }
      : undefined,
    specialDay,
    moonPhaseEvent,
  };
}
