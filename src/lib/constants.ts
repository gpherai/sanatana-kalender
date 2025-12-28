// ============================================
// DHARMA CALENDAR - CONSTANTS
// Single source of truth for all enums and categories
// ============================================

// --------------------------------------------
// CATEGORIES - Imported from config (single source of truth)
// --------------------------------------------
import {
  CATEGORY_CATALOG,
  getAllCategoryOptions,
  getCategoryByName,
  type CategoryOption,
} from "@/config/categories";

// Re-export for backwards compatibility
// UI components use this format: { value, label, icon, color }
export const CATEGORIES: readonly CategoryOption[] = getAllCategoryOptions();

export type CategoryValue = (typeof CATEGORY_CATALOG)[number]["name"];

// Re-export helper
export { getCategoryByName as getCategory };

// --------------------------------------------
// EVENT TYPES
// --------------------------------------------
export const EVENT_TYPES = [
  { value: "FESTIVAL", label: "Festival", icon: "🎉" },
  { value: "PUJA", label: "Puja", icon: "🙏" },
  { value: "VRAT", label: "Vrat (Fasting)", icon: "🙇" },
  { value: "JAYANTI", label: "Jayanti", icon: "⭐" },
  { value: "TITHI", label: "Tithi", icon: "🌙" },
  { value: "SANKRANTI", label: "Sankranti", icon: "☀️" },
  { value: "ECLIPSE", label: "Eclipse", icon: "🌑" },
  { value: "OTHER", label: "Other", icon: "📅" },
] as const;

export type EventTypeValue = (typeof EVENT_TYPES)[number]["value"];

// --------------------------------------------
// RECURRENCE TYPES
// --------------------------------------------
export const RECURRENCE_TYPES = [
  { value: "NONE", label: "Geen herhaling" },
  { value: "YEARLY_LUNAR", label: "Jaarlijks (Lunair)" },
  { value: "YEARLY_SOLAR", label: "Jaarlijks (Solaar)" },
  { value: "MONTHLY_LUNAR", label: "Maandelijks (Lunair)" },
  { value: "MONTHLY_SOLAR", label: "Maandelijks (Solaar)" },
] as const;

export type RecurrenceTypeValue = (typeof RECURRENCE_TYPES)[number]["value"];

// --------------------------------------------
// IMPORTANCE LEVELS
// --------------------------------------------
export const IMPORTANCE_LEVELS = [
  { value: "MAJOR", label: "Major", color: "red" },
  { value: "MODERATE", label: "Moderate", color: "yellow" },
  { value: "MINOR", label: "Minor", color: "gray" },
] as const;

export type ImportanceValue = (typeof IMPORTANCE_LEVELS)[number]["value"];

// --------------------------------------------
// SPECIAL TITHIS (for filtering)
// --------------------------------------------
export const SPECIAL_TITHIS = [
  { value: "PURNIMA", label: "Purnima (Volle Maan)", icon: "🌕" },
  { value: "AMAVASYA", label: "Amavasya (Nieuwe Maan)", icon: "🌑" },
] as const;

export type SpecialTithiValue = (typeof SPECIAL_TITHIS)[number]["value"];

// --------------------------------------------
// PAKSHAS (lunar fortnights)
// --------------------------------------------
export const PAKSHAS = [
  {
    value: "SHUKLA",
    label: "Shukla Paksha",
    description: "Waxing moon (bright fortnight)",
  },
  {
    value: "KRISHNA",
    label: "Krishna Paksha",
    description: "Waning moon (dark fortnight)",
  },
] as const;

export type PakshaValue = (typeof PAKSHAS)[number]["value"];

// --------------------------------------------
// TITHIS (30 lunar days)
// --------------------------------------------
export const TITHIS = [
  // Shukla Paksha (Waxing Moon)
  { value: "PRATIPADA_SHUKLA", label: "Pratipada", paksha: "Shukla", day: 1 },
  { value: "DWITIYA_SHUKLA", label: "Dwitiya", paksha: "Shukla", day: 2 },
  { value: "TRITIYA_SHUKLA", label: "Tritiya", paksha: "Shukla", day: 3 },
  { value: "CHATURTHI_SHUKLA", label: "Chaturthi", paksha: "Shukla", day: 4 },
  { value: "PANCHAMI_SHUKLA", label: "Panchami", paksha: "Shukla", day: 5 },
  { value: "SHASHTHI_SHUKLA", label: "Shashthi", paksha: "Shukla", day: 6 },
  { value: "SAPTAMI_SHUKLA", label: "Saptami", paksha: "Shukla", day: 7 },
  { value: "ASHTAMI_SHUKLA", label: "Ashtami", paksha: "Shukla", day: 8 },
  { value: "NAVAMI_SHUKLA", label: "Navami", paksha: "Shukla", day: 9 },
  { value: "DASHAMI_SHUKLA", label: "Dashami", paksha: "Shukla", day: 10 },
  { value: "EKADASHI_SHUKLA", label: "Ekadashi", paksha: "Shukla", day: 11 },
  { value: "DWADASHI_SHUKLA", label: "Dwadashi", paksha: "Shukla", day: 12 },
  { value: "TRAYODASHI_SHUKLA", label: "Trayodashi", paksha: "Shukla", day: 13 },
  { value: "CHATURDASHI_SHUKLA", label: "Chaturdashi", paksha: "Shukla", day: 14 },
  { value: "PURNIMA", label: "Purnima (Full Moon)", paksha: "Shukla", day: 15 },
  // Krishna Paksha (Waning Moon)
  { value: "PRATIPADA_KRISHNA", label: "Pratipada", paksha: "Krishna", day: 1 },
  { value: "DWITIYA_KRISHNA", label: "Dwitiya", paksha: "Krishna", day: 2 },
  { value: "TRITIYA_KRISHNA", label: "Tritiya", paksha: "Krishna", day: 3 },
  { value: "CHATURTHI_KRISHNA", label: "Chaturthi", paksha: "Krishna", day: 4 },
  { value: "PANCHAMI_KRISHNA", label: "Panchami", paksha: "Krishna", day: 5 },
  { value: "SHASHTHI_KRISHNA", label: "Shashthi", paksha: "Krishna", day: 6 },
  { value: "SAPTAMI_KRISHNA", label: "Saptami", paksha: "Krishna", day: 7 },
  { value: "ASHTAMI_KRISHNA", label: "Ashtami", paksha: "Krishna", day: 8 },
  { value: "NAVAMI_KRISHNA", label: "Navami", paksha: "Krishna", day: 9 },
  { value: "DASHAMI_KRISHNA", label: "Dashami", paksha: "Krishna", day: 10 },
  { value: "EKADASHI_KRISHNA", label: "Ekadashi", paksha: "Krishna", day: 11 },
  { value: "DWADASHI_KRISHNA", label: "Dwadashi", paksha: "Krishna", day: 12 },
  { value: "TRAYODASHI_KRISHNA", label: "Trayodashi", paksha: "Krishna", day: 13 },
  { value: "CHATURDASHI_KRISHNA", label: "Chaturdashi", paksha: "Krishna", day: 14 },
  { value: "AMAVASYA", label: "Amavasya (New Moon)", paksha: "Krishna", day: 15 },
] as const;

export type TithiValue = (typeof TITHIS)[number]["value"];

// Grouped by Paksha for dropdown
export const TITHIS_BY_PAKSHA = {
  Shukla: TITHIS.filter((t) => t.paksha === "Shukla"),
  Krishna: TITHIS.filter((t) => t.paksha === "Krishna"),
};

// --------------------------------------------
// NAKSHATRAS (27 lunar mansions)
// --------------------------------------------
export const NAKSHATRAS = [
  { value: "ASHWINI", label: "Ashwini", deity: "Ashwini Kumaras" },
  { value: "BHARANI", label: "Bharani", deity: "Yama" },
  { value: "KRITTIKA", label: "Krittika", deity: "Agni" },
  { value: "ROHINI", label: "Rohini", deity: "Brahma" },
  { value: "MRIGASHIRA", label: "Mrigashira", deity: "Soma" },
  { value: "ARDRA", label: "Ardra", deity: "Rudra" },
  { value: "PUNARVASU", label: "Punarvasu", deity: "Aditi" },
  { value: "PUSHYA", label: "Pushya", deity: "Brihaspati" },
  { value: "ASHLESHA", label: "Ashlesha", deity: "Nagas" },
  { value: "MAGHA", label: "Magha", deity: "Pitrs" },
  { value: "PURVA_PHALGUNI", label: "Purva Phalguni", deity: "Bhaga" },
  { value: "UTTARA_PHALGUNI", label: "Uttara Phalguni", deity: "Aryaman" },
  { value: "HASTA", label: "Hasta", deity: "Savitar" },
  { value: "CHITRA", label: "Chitra", deity: "Vishvakarma" },
  { value: "SWATI", label: "Swati", deity: "Vayu" },
  { value: "VISHAKHA", label: "Vishakha", deity: "Indra-Agni" },
  { value: "ANURADHA", label: "Anuradha", deity: "Mitra" },
  { value: "JYESHTHA", label: "Jyeshtha", deity: "Indra" },
  { value: "MULA", label: "Mula", deity: "Nirriti" },
  { value: "PURVA_ASHADHA", label: "Purva Ashadha", deity: "Apas" },
  { value: "UTTARA_ASHADHA", label: "Uttara Ashadha", deity: "Vishve Devas" },
  { value: "SHRAVANA", label: "Shravana", deity: "Vishnu" },
  { value: "DHANISHTA", label: "Dhanishta", deity: "Vasus" },
  { value: "SHATABHISHA", label: "Shatabhisha", deity: "Varuna" },
  { value: "PURVA_BHADRAPADA", label: "Purva Bhadrapada", deity: "Aja Ekapada" },
  { value: "UTTARA_BHADRAPADA", label: "Uttara Bhadrapada", deity: "Ahir Budhnya" },
  { value: "REVATI", label: "Revati", deity: "Pushan" },
] as const;

export type NakshatraValue = (typeof NAKSHATRAS)[number]["value"];

// --------------------------------------------
// MAAS (12 lunar months)
// --------------------------------------------
export const MAAS = [
  { value: "CHAITRA", label: "Chaitra", season: "Vasant (Spring)" },
  { value: "VAISHAKHA", label: "Vaishakha", season: "Vasant (Spring)" },
  { value: "JYESHTHA", label: "Jyeshtha", season: "Grishma (Summer)" },
  { value: "ASHADHA", label: "Ashadha", season: "Grishma (Summer)" },
  { value: "SHRAVANA", label: "Shravana", season: "Varsha (Monsoon)" },
  { value: "BHADRAPADA", label: "Bhadrapada", season: "Varsha (Monsoon)" },
  { value: "ASHWIN", label: "Ashwin", season: "Sharad (Autumn)" },
  { value: "KARTIK", label: "Kartik", season: "Sharad (Autumn)" },
  { value: "MARGASHIRSHA", label: "Margashirsha", season: "Hemant (Pre-winter)" },
  { value: "PAUSHA", label: "Pausha", season: "Hemant (Pre-winter)" },
  { value: "MAGHA", label: "Magha", season: "Shishir (Winter)" },
  { value: "PHALGUNA", label: "Phalguna", season: "Shishir (Winter)" },
] as const;

export type MaasValue = (typeof MAAS)[number]["value"];

// --------------------------------------------
// MOON PHASES
// --------------------------------------------
export const MOON_PHASES = [
  { value: "NEW_MOON", label: "New Moon", emoji: "🌑" },
  { value: "WAXING_CRESCENT", label: "Waxing Crescent", emoji: "🌒" },
  { value: "FIRST_QUARTER", label: "First Quarter", emoji: "🌓" },
  { value: "WAXING_GIBBOUS", label: "Waxing Gibbous", emoji: "🌔" },
  { value: "FULL_MOON", label: "Full Moon", emoji: "🌕" },
  { value: "WANING_GIBBOUS", label: "Waning Gibbous", emoji: "🌖" },
  { value: "LAST_QUARTER", label: "Last Quarter", emoji: "🌗" },
  { value: "WANING_CRESCENT", label: "Waning Crescent", emoji: "🌘" },
] as const;

export type MoonPhaseValue = (typeof MOON_PHASES)[number]["value"];

// --------------------------------------------
// THEMES
// --------------------------------------------
// Theme definitions are in src/config/themes.ts (single source of truth)
// Import theme types and constants from there:
//   import { THEME_CATALOG, DEFAULT_THEME_NAME, ThemeOption } from "@/config/themes"
//
// For runtime theme management, use the ThemeProvider:
//   import { useTheme } from "@/components/theme"

// --------------------------------------------
// LOCATION TYPES & DEFAULTS
// --------------------------------------------

/**
 * Location interface used throughout the application
 * Consistent field names: lat, lon (not latitude/longitude)
 */
export interface Location {
  name: string;
  lat: number;
  lon: number;
}

/**
 * Extended location with timezone for user preferences
 */
export interface LocationWithTimezone extends Location {
  timezone: string;
}

/**
 * Default location: Den Haag, Netherlands (precise coordinates)
 */
export const DEFAULT_LOCATION: LocationWithTimezone = {
  name: "Den Haag",
  lat: 52.078525871758096,
  lon: 4.331036597783044,
  timezone: "Europe/Amsterdam",
} as const;

/**
 * Preset locations for quick selection in settings
 */
export const PRESET_LOCATIONS: Location[] = [
  { name: "Den Haag", lat: 52.0705, lon: 4.3007 },
  { name: "Rotterdam", lat: 51.9225, lon: 4.4792 },
  { name: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  { name: "Utrecht", lat: 52.0907, lon: 5.1214 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Varanasi", lat: 25.3176, lon: 82.9739 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
] as const;

// --------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------

/**
 * Get moon phase emoji from phase value
 */
export function getMoonPhaseEmoji(phase: MoonPhaseValue): string {
  return MOON_PHASES.find((p) => p.value === phase)?.emoji ?? "🌙";
}

/**
 * Get event type by value
 */
export function getEventType(value: string) {
  return EVENT_TYPES.find((e) => e.value === value);
}

/**
 * Get tithi by value
 */
export function getTithi(value: string) {
  return TITHIS.find((t) => t.value === value);
}

/**
 * Get nakshatra by value
 */
export function getNakshatra(value: string) {
  return NAKSHATRAS.find((n) => n.value === value);
}

/**
 * Get maas by value
 */
export function getMaas(value: string) {
  return MAAS.find((m) => m.value === value);
}

/**
 * Get paksha by value
 */
export function getPaksha(value: string) {
  return PAKSHAS.find((p) => p.value === value);
}
