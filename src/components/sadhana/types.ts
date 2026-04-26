// =============================================================================
// CONFIG
// =============================================================================

import { defaultLocationDate } from "@/lib/default-location-date";

export const API = "/api/sadhana";

// =============================================================================
// TYPES
// =============================================================================

export type PracticeType = "mantra_japa" | "parayana" | "other";
export type ItemUnit = "malas" | "count";
export type GoalType = "daily" | "weekly" | "lifetime";

export interface Practice {
  id: string;
  name: string;
  type: PracticeType;
  mantra_text: string | null;
  count_size: number | null;
  notes: string | null;
  active: boolean;
}

export interface SessionItemData {
  id: string;
  practice_id: string;
  practice_name: string;
  practice_type: PracticeType;
  quantity: number;
  unit: ItemUnit;
  mantra_count: number | null;
  count_total: number | null;
  duration_minutes: number | null;
}

export interface SessionData {
  id: string;
  date: string;
  started_at: string | null;
  duration_minutes: number | null;
  total_malas: number;
  total_mantras: number;
  total_count: number;
  notes: string | null;
  items: SessionItemData[];
}

export interface PracticeStat {
  practice_id: string;
  practice_name: string;
  practice_type: PracticeType;
  total_quantity: number;
  total_mantras: number | null;
}

export interface TodayStats {
  date: string;
  total_malas: number;
  total_minutes: number;
  total_mantras: number;
  total_count: number;
  goal_malas_target: number | null;
  goal_malas_progress: number | null;
  goal_minutes_target: number | null;
  goal_minutes_progress: number | null;
  practices: PracticeStat[];
}

export interface StreakStats {
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
}

export interface CalendarDay {
  date: string;
  total_malas: number;
  total_mantras: number;
  total_count: number;
  activity_score: number;
  total_minutes: number;
  session_count: number;
}

export interface OverviewStats {
  total_sessions: number;
  total_malas_all_time: number;
  total_minutes_all_time: number;
  total_sessions_this_week: number;
  total_malas_this_week: number;
  total_minutes_this_week: number;
  total_sessions_this_month: number;
  total_malas_this_month: number;
  total_minutes_this_month: number;
  avg_malas_per_session: number;
  avg_minutes_per_session: number;
  practices: PracticeStat[];
}

export interface Goal {
  id: string;
  type: GoalType;
  name: string | null;
  target_malas: number;
  target_minutes: number | null;
  active: boolean;
  practices?: { id: string; name: string }[];
  progress_malas?: number | null;
  progress_minutes?: number | null;
}

export interface RoutineItem {
  id: string;
  practice_id: string;
  practice_name: string;
  practice_type: PracticeType;
  quantity: number;
  unit: ItemUnit;
  sort_order: number;
}

export interface Routine {
  id: string;
  name: string;
  active: boolean;
  items: RoutineItem[];
}

export interface FormItem {
  practice_id: string;
  quantity: string;
  unit: ItemUnit;
}

export type HeatmapCell = {
  date: string;
  malas: number;
  count: number;
  activity: number;
} | null;

export interface DayInfo {
  tithi?: { name: string; paksha: "Shukla" | "Krishna" };
  specialDay?: { name: string; emoji: string; type: string } | null;
  moonPhaseEvent?: { type: "new" | "first_quarter" | "full" | "last_quarter" } | null;
}
export type DayInfoMap = Map<string, DayInfo>;

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
// API
// =============================================================================

export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

type DayInfoRaw = {
  date: string;
  tithi?: { name: string; paksha: "Shukla" | "Krishna" };
  specialDay?: { name: string; emoji: string; type: string } | null;
  moonPhaseEvent?: { type: "new" | "first_quarter" | "full" | "last_quarter" } | null;
};

export async function fetchDayInfoMap(start: string, end: string): Promise<DayInfoMap> {
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  // Build all chunk ranges up-front, then fetch all in parallel
  const chunks: Array<{ s: string; e: string }> = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    const chunkEnd = new Date(current);
    chunkEnd.setDate(chunkEnd.getDate() + 85); // Safety margin (API limit is 90)
    const actualEnd = chunkEnd > endDate ? endDate : chunkEnd;
    chunks.push({ s: localDateString(current), e: localDateString(actualEnd) });
    current = new Date(actualEnd);
    current.setDate(current.getDate() + 1);
  }

  const results = await Promise.all(
    chunks.map(async ({ s, e }) => {
      try {
        const res = await fetch(`/api/daily-info?start=${s}&end=${e}`);
        if (!res.ok) return [] as DayInfoRaw[];
        return (await res.json()) as DayInfoRaw[];
      } catch (err) {
        console.error("Chunk fetch failed:", s, e, err);
        return [] as DayInfoRaw[];
      }
    })
  );

  const map: DayInfoMap = new Map();
  for (const arr of results) {
    for (const d of arr) {
      map.set(d.date.slice(0, 10), {
        tithi: d.tithi,
        specialDay: d.specialDay,
        moonPhaseEvent: d.moonPhaseEvent,
      });
    }
  }
  return map;
}

// =============================================================================
// HELPERS
// =============================================================================

export function localDateString(d: Date) {
  return defaultLocationDate(d);
}

export function todayString() {
  return defaultLocationDate();
}

export function isGoalComplete(goal: Goal) {
  const malasDone = (goal.progress_malas ?? 0) >= goal.target_malas;
  const minutesDone =
    goal.target_minutes === null ||
    goal.target_minutes === undefined ||
    (goal.progress_minutes ?? 0) >= goal.target_minutes;
  return malasDone && minutesDone;
}

export function goalProgressRatio(goal: Goal) {
  const malasProgress = Math.min(1, (goal.progress_malas ?? 0) / goal.target_malas);
  if (!goal.target_minutes) return malasProgress;
  const minutesProgress = Math.min(1, (goal.progress_minutes ?? 0) / goal.target_minutes);
  return Math.min(malasProgress, minutesProgress);
}

export function formatDuration(minutes: number) {
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

export function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isoToLocalTime(isoStr: string) {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  mantra_japa: "Mantra japa",
  parayana: "Parayana",
  other: "Overig",
};
