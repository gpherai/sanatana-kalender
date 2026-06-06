/**
 * Panchanga timing thresholds (minutes).
 *
 * Empirically-tuned offsets used by the date-rule services (`recurrence/*`) and
 * the observation-window helpers (`lib/timing-utils`). Centralized here so the
 * values — validated against Drik Panchang (Den Haag, Purnimanta) — are
 * traceable and tunable in ONE place instead of scattered as magic numbers.
 *
 * NOT included: structural/śāstra-fixed units (1440 min/day, 360°, 30°/rashi,
 * night ÷ 15 muhurtas, night ÷ 5 = 3-muhurta Pradosh). Those stay inline as they
 * are definitions, not tunable thresholds.
 */

// --- Pradosh Kaal ---------------------------------------------------------

/** Display window length after sunset (6 ghati = 144 min). Used by `calculatePradoshKaal`. */
export const PRADOSH_DISPLAY_AFTER_SUNSET_MIN = 144;

/** Selection: Pradosh window opens this many minutes before sunset. */
export const PRADOSH_START_BEFORE_SUNSET_MIN = 90;

/**
 * Custom-tithi Pradosh (e.g. Parashurama Jayanti): skip a prev-tithi whose end
 * is more than this many minutes before sunrise (clearly a next-day/kshaya time).
 */
export const PRADOSH_CUSTOM_SUNRISE_SKIP_MIN = 60;

// --- Sankashti Chaturthi --------------------------------------------------

/**
 * D-1 Pradosh validity: if `computeTithiOccurrence` shifted to the evening
 * before but Chaturthi started after sunset + this, revert to the Udaya Tithi
 * day. Tuned to 125 (was 120) for the Dwijapriya Feb 2026 edge case.
 */
export const SANKASHTI_PRADOSH_AFTER_SUNSET_MIN = 125;

/**
 * Midnight rule: Chaturthi starting within this many minutes after midnight
 * (and moonrise before sunrise) is observed on D-1 per Hindu timekeeping.
 */
export const SANKASHTI_MIDNIGHT_START_MIN = 60;

// --- Sankranti ------------------------------------------------------------

/**
 * Local-time threshold (02:30 = 150 min) ≈ India sunrise expressed in Den Haag
 * local time. An early-morning transit at/after this is post-India-sunrise per
 * DP → observe the next Gregorian day (D+1).
 */
export const INDIA_SUNRISE_LOCAL_MIN = 150;
