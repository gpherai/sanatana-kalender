import { defaultLocationDate } from "@/lib/default-location-date";
import type { DayInfo, Goal, PracticeType } from "@/components/sadhana/types";

// =============================================================================
// DATE HELPERS
// =============================================================================

export function localDateString(d: Date): string {
  return defaultLocationDate(d);
}

export function todayString(): string {
  return defaultLocationDate();
}

// =============================================================================
// GOAL LOGIC
// =============================================================================

export function isGoalComplete(goal: Goal): boolean {
  const malasDone = (goal.progress_malas ?? 0) >= goal.target_malas;
  const minutesDone =
    goal.target_minutes === null ||
    goal.target_minutes === undefined ||
    (goal.progress_minutes ?? 0) >= goal.target_minutes;
  return malasDone && minutesDone;
}

export function goalProgressRatio(goal: Goal): number {
  const malasProgress = Math.min(1, (goal.progress_malas ?? 0) / goal.target_malas);
  if (!goal.target_minutes) return malasProgress;
  const minutesProgress = Math.min(1, (goal.progress_minutes ?? 0) / goal.target_minutes);
  return Math.min(malasProgress, minutesProgress);
}

// =============================================================================
// PANCHANGA / DAY CONTEXT DISPLAY
// =============================================================================

export const MOON_PHASE_EMOJI: Record<
  NonNullable<DayInfo["moonPhaseEvent"]>["type"],
  string
> = {
  new: "🌑",
  first_quarter: "🌓",
  full: "🌕",
  last_quarter: "🌗",
};

export function dayContextLabel(info: DayInfo | undefined): string | null {
  if (!info) return null;
  if (info.specialDay) return `${info.specialDay.emoji} ${info.specialDay.name}`;
  const moon = info.moonPhaseEvent
    ? MOON_PHASE_EMOJI[info.moonPhaseEvent.type] + " "
    : "";
  if (info.tithi) return `${moon}${info.tithi.paksha} ${info.tithi.name}`;
  if (info.moonPhaseEvent) return MOON_PHASE_EMOJI[info.moonPhaseEvent.type];
  return null;
}

// =============================================================================
// DISPLAY CONSTANTS
// =============================================================================

export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  mantra_japa: "Mantra japa",
  parayana: "Parayana",
  other: "Overig",
};

// =============================================================================
// FORMATTERS
// =============================================================================

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${h}u ${rem}m` : `${h}u`;
}

const MONTHS_NL = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isoToLocalTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
