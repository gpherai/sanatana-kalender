/**
 * Pure Rule Engine
 *
 * Exports all types and pure helper functions used by the recurrence service.
 * None of these functions touch the database — they operate on pre-fetched rows.
 *
 * Entry points:
 *   import { computeTithiOccurrence, groupConsecutiveDays, ... } from "@/engine"
 */

export type { GeneratedOccurrence, PrevDayInfo } from "./types";
export {
  isConsecutiveDay,
  groupConsecutiveDays,
  selectFirstWindowPerLunarCycle,
  isPredecessorEndsInEvening,
  isNishitakalDateShiftNeeded,
  isSankashtiPradoshShiftNeeded,
  computeTithiOccurrence,
  computeSankashtiOccurrence,
  applyRatriVyapiniDateRule,
} from "@/services/recurrence/helpers/tithi-helpers";
