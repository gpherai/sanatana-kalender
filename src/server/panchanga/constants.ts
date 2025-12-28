
/**
 * Panchanga Constants - Single Source of Truth (Server-side)
 *
 * Sanskrit names for Vedic calendar elements.
 * These constants are used by:
 * - PanchangaService for calculations and name mapping
 * - API responses for sending resolved names to clients
 *
 * IMPORTANT: UI components should NOT import from this file.
 * UI gets all data via API responses.
 */

// =============================================================================
// TITHI (30 LUNAR DAYS)
// =============================================================================

/**
 * 30 Tithis (15 Shukla Paksha + 15 Krishna Paksha)
 * Index 0-14: Shukla Paksha (waxing)
 * Index 15-29: Krishna Paksha (waning)
 */
export const TITHI_NAMES = [
  // Shukla Paksha (waxing, 1-15)
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima", // Full moon

  // Krishna Paksha (waning, 1-15)
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Amavasya", // New moon
] as const;

// =============================================================================
// NAKSHATRA (27 LUNAR MANSIONS)
// =============================================================================

/**
 * 27 Nakshatras (lunar mansions)
 * Index 0-26 corresponds to nakshatra numbers 1-27
 */
export const NAKSHATRA_NAMES = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

// =============================================================================
// YOGA (27 YOGAS)
// =============================================================================

/**
 * 27 Yogas (combinations of Sun and Moon positions)
 * Index 0-26 corresponds to yoga numbers 1-27
 */
export const YOGA_NAMES = [
  "Vishkumbha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyan",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
] as const;

// =============================================================================
// KARANA (11 KARANAS)
// =============================================================================

/**
 * 11 Karanas (half-tithis)
 * - First 7: Movable (repeat in cycle)
 * - Last 4: Fixed (occur once per lunar month)
 */
export const KARANA_NAMES = [
  // Movable Karanas (0-6)
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Gara",
  "Vanija",
  "Vishti",

  // Fixed Karanas (7-10)
  "Shakuni",
  "Chatushpada",
  "Naga",
  "Kimstughna",
] as const;

// =============================================================================
// VARA (7 WEEKDAYS)
// =============================================================================

/**
 * 7 Varas (weekdays in Sanskrit)
 * Index 0-6 corresponds to Sunday-Saturday
 */
export const VARA_NAMES = [
  "Ravivara", // Sunday (Surya - Sun)
  "Somavara", // Monday (Chandra - Moon)
  "Mangalavara", // Tuesday (Mangala - Mars)
  "Budhavara", // Wednesday (Budha - Mercury)
  "Guruvara", // Thursday (Brihaspati - Jupiter)
  "Shukravara", // Friday (Shukra - Venus)
  "Shanivara", // Saturday (Shani - Saturn)
] as const;

// =============================================================================
// MAAS (12 LUNAR MONTHS)
// =============================================================================

/**
 * 12 Lunar Masas (Hindu months based on lunar cycles)
 *
 * IMPORTANT: These are LUNAR months, not solar months (rashi/sankranti).
 * Proper lunar māsa calculation requires determining which Purnima occurs
 * in which solar month. This is NOT simply mapping moon phase to month.
 *
 * TODO: Implement proper lunar māsa calculation algorithm.
 * For now, this is used as reference only.
 */
export const LUNAR_MASA_NAMES = [
  "Chaitra", // March-April
  "Vaishakha", // April-May
  "Jyeshtha", // May-June
  "Ashadha", // June-July
  "Shravana", // July-August
  "Bhadrapada", // August-September
  "Ashwin", // September-October
  "Kartik", // October-November
  "Margashirsha", // November-December
  "Pausha", // December-January
  "Magha", // January-February
  "Phalguna", // February-March
] as const;

// =============================================================================
// SOLAR MASA (12 SOLAR MONTHS / RASHI)
// =============================================================================

/**
 * 12 Solar Masas (Sankranti-based months when Sun enters each rashi)
 *
 * IMPORTANT: These are SOLAR months based on Sun's position in zodiac.
 * This is DIFFERENT from lunar māsa.
 *
 * Solar months are used in some regional calendars (Tamil, Bengali, etc.)
 * and for agricultural/festival calculations.
 *
 * TODO: Can be exposed as separate "sunRashi" field in future if needed.
 */
export const SOLAR_MASA_NAMES = [
  "Mesha", // Aries (mid-April)
  "Vrishabha", // Taurus (mid-May)
  "Mithuna", // Gemini (mid-June)
  "Karka", // Cancer (mid-July)
  "Simha", // Leo (mid-August)
  "Kanya", // Virgo (mid-September)
  "Tula", // Libra (mid-October)
  "Vrishchika", // Scorpio (mid-November)
  "Dhanu", // Sagittarius (mid-December)
  "Makara", // Capricorn (mid-January)
  "Kumbha", // Aquarius (mid-February)
  "Mina", // Pisces (mid-March)
] as const;

// =============================================================================
// SAMVATSARA (60-YEAR CYCLE)
// =============================================================================

/**
 * 60 Samvatsaras (60-year cycle names)
 * Used for both Vikrama Samvat and Shaka Samvat
 *
 * The cycle repeats every 60 years. To find the correct year:
 * 1. Calculate (year - base_offset) % 60
 * 2. Use result as index into this array
 *
 * Base offsets:
 * - Vikrama Samvat: Gregorian year + 57 (approx)
 * - Shaka Samvat: Gregorian year - 78 (approx)
 *
 * IMPORTANT: Year boundaries change at Chaitra Shukla Pratipada (Hindu New Year)
 * not January 1st.
 */
export const SAMVATSARA_NAMES = [
  "Prabhava",      // 1
  "Vibhava",       // 2
  "Shukla",        // 3
  "Pramoda",       // 4
  "Prajapati",     // 5
  "Angirasa",      // 6
  "Shrimukha",     // 7
  "Bhava",         // 8
  "Yuvan",         // 9
  "Dhatri",        // 10
  "Ishvara",       // 11
  "Bahudhanya",    // 12
  "Pramathi",      // 13
  "Vikrama",       // 14
  "Vrisha",        // 15
  "Chitrabhanu",   // 16
  "Svabhanu",      // 17
  "Tarana",        // 18
  "Parthiva",      // 19
  "Vyaya",         // 20
  "Sarvajit",      // 21
  "Sarvadharin",   // 22
  "Virodhin",      // 23
  "Vikrita",       // 24
  "Khara",         // 25
  "Nandana",       // 26
  "Vijaya",        // 27
  "Jaya",          // 28
  "Manmatha",      // 29
  "Durmukhi",      // 30
  "Hevilambi",     // 31
  "Vilambi",       // 32
  "Vikari",        // 33
  "Sharvari",      // 34
  "Plava",         // 35
  "Shubhakrit",    // 36
  "Sobhana",       // 37
  "Krodhi",        // 38
  "Vishvavasu",    // 39
  "Parabhava",     // 40
  "Plavanga",      // 41
  "Kilaka",        // 42
  "Saumya",        // 43
  "Sadharana",     // 44
  "Virodhikrit",   // 45
  "Paridhavi",     // 46
  "Pramadin",      // 47
  "Ananda",        // 48
  "Rakshasa",      // 49
  "Anala",         // 50
  "Pingala",       // 51
  "Kalayukta",     // 52
  "Siddharthi",    // 53
  "Raudra",        // 54
  "Durmati",       // 55
  "Dundubhi",      // 56
  "Rudhirodgari",  // 57
  "Raktakshi",     // 58
  "Krodhana",      // 59
  "Akshaya",       // 60
] as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type TithiName = (typeof TITHI_NAMES)[number];
export type NakshatraName = (typeof NAKSHATRA_NAMES)[number];
export type YogaName = (typeof YOGA_NAMES)[number];
export type KaranaName = (typeof KARANA_NAMES)[number];
export type VaraName = (typeof VARA_NAMES)[number];
export type LunarMasaName = (typeof LUNAR_MASA_NAMES)[number];
export type SolarMasaName = (typeof SOLAR_MASA_NAMES)[number];
export type SamvatsaraName = (typeof SAMVATSARA_NAMES)[number];
