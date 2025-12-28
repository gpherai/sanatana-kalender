import { parseCalendarDate } from "@/lib/utils";
import type { Tithi, Nakshatra, MoonPhaseType, Maas, Sankranti } from "@/generated/prisma/client";

/**
 * Helper for calendar dates (pure date, no timezone conversion).
 */
export function calendarDate(year: number, month: number, day: number): Date {
  const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return parseCalendarDate(dateString);
}

// Convert tithi number (1-30) and paksha to Prisma enum
export function convertTithiToEnum(tithiNum: number, paksha: string): Tithi | null {
  const tithiNames = [
    "PRATIPADA",
    "DWITIYA",
    "TRITIYA",
    "CHATURTHI",
    "PANCHAMI",
    "SHASHTHI",
    "SAPTAMI",
    "ASHTAMI",
    "NAVAMI",
    "DASHAMI",
    "EKADASHI",
    "DWADASHI",
    "TRAYODASHI",
    "CHATURDASHI",
  ];

  const withinPaksha = paksha === "Shukla" ? tithiNum : tithiNum - 15;

  if (withinPaksha < 1 || withinPaksha > 15) {
    console.error(
      `Invalid tithi: ${tithiNum} (paksha: ${paksha}, normalized: ${withinPaksha})`
    );
    return null;
  }

  if (withinPaksha === 15) {
    return paksha === "Shukla" ? "PURNIMA" : "AMAVASYA";
  }

  const baseName = tithiNames[withinPaksha - 1];
  const suffix = paksha === "Shukla" ? "_SHUKLA" : "_KRISHNA";
  return (baseName + suffix) as Tithi;
}

// Convert nakshatra number (1-27) to Prisma enum
export function mapNakshatraToEnum(nakNum: number): Nakshatra | null {
  const names = [
    "ASHWINI",
    "BHARANI",
    "KRITTIKA",
    "ROHINI",
    "MRIGASHIRA",
    "ARDRA",
    "PUNARVASU",
    "PUSHYA",
    "ASHLESHA",
    "MAGHA",
    "PURVA_PHALGUNI",
    "UTTARA_PHALGUNI",
    "HASTA",
    "CHITRA",
    "SWATI",
    "VISHAKHA",
    "ANURADHA",
    "JYESHTHA",
    "MULA",
    "PURVA_ASHADHA",
    "UTTARA_ASHADHA",
    "SHRAVANA",
    "DHANISHTA",
    "SHATABHISHA",
    "PURVA_BHADRAPADA",
    "UTTARA_BHADRAPADA",
    "REVATI",
  ];

  if (nakNum >= 1 && nakNum <= 27) {
    return names[nakNum - 1] as Nakshatra;
  }
  return null;
}

// Determine moon phase type from illumination percentage
export function getMoonPhaseType(pct: number, waxing: boolean): MoonPhaseType {
  if (pct < 3) return "NEW_MOON";
  if (pct > 97) return "FULL_MOON";

  if (waxing) {
    if (pct < 25) return "WAXING_CRESCENT";
    if (pct < 50) return "FIRST_QUARTER";
    if (pct < 75) return "WAXING_GIBBOUS";
    return "FULL_MOON";
  }

  if (pct > 75) return "WANING_GIBBOUS";
  if (pct > 50) return "LAST_QUARTER";
  if (pct > 25) return "WANING_CRESCENT";
  return "NEW_MOON";
}

// Convert maas name (e.g., "Chaitra") to Prisma enum (e.g., "CHAITRA")
export function convertMaasToEnum(maasName: string): Maas | null {
  const normalized = maasName.toUpperCase();
  const validMaas = [
    "CHAITRA",
    "VAISHAKHA",
    "JYESHTHA",
    "ASHADHA",
    "SHRAVANA",
    "BHADRAPADA",
    "ASHWIN",
    "KARTIK",
    "MARGASHIRSHA",
    "PAUSHA",
    "MAGHA",
    "PHALGUNA",
  ];

  if (validMaas.includes(normalized)) {
    return normalized as Maas;
  }

  console.warn(`Unknown maas name: ${maasName}`);
  return null;
}

// Convert sankranti name (e.g., "MAKARA_SANKRANTI") to Prisma enum
export function convertSankrantiToEnum(sankrantiName: string): Sankranti | null {
  const normalized = sankrantiName.toUpperCase();
  const validSankrantis = [
    "MESHA_SANKRANTI",
    "VRISHABHA_SANKRANTI",
    "MITHUNA_SANKRANTI",
    "KARKA_SANKRANTI",
    "SIMHA_SANKRANTI",
    "KANYA_SANKRANTI",
    "TULA_SANKRANTI",
    "VRISHCHIKA_SANKRANTI",
    "DHANU_SANKRANTI",
    "MAKARA_SANKRANTI",
    "KUMBHA_SANKRANTI",
    "MEENA_SANKRANTI",
  ];

  if (validSankrantis.includes(normalized)) {
    return normalized as Sankranti;
  }

  console.warn(`Unknown sankranti name: ${sankrantiName}`);
  return null;
}
