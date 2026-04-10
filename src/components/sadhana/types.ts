// =============================================================================
// CONFIG
// =============================================================================

export const API = "/api/sadhana";

// =============================================================================
// TYPES
// =============================================================================

export type PracticeType = "mantra_japa" | "parayana" | "other";
export type ItemUnit = "malas" | "count";
export type GoalType = "daily" | "weekly";

export interface Practice {
  id: string;
  name: string;
  type: PracticeType;
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
  duration_minutes: number | null;
}

export interface SessionData {
  id: string;
  date: string;
  started_at: string | null;
  duration_minutes: number | null;
  total_malas: number;
  total_mantras: number;
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
  target_malas: number;
  target_minutes: number | null;
  active: boolean;
}

export interface FormItem {
  practice_id: string;
  quantity: string;
  unit: ItemUnit;
}

export type HeatmapCell = { date: string; malas: number } | null;

export interface DayInfo {
  tithi?: { name: string; paksha: "Shukla" | "Krishna" };
  specialDay?: { name: string; emoji: string; type: string } | null;
  moonPhaseEvent?: { type: "new" | "first_quarter" | "full" | "last_quarter" } | null;
}
export type DayInfoMap = Map<string, DayInfo>;

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

export async function fetchDayInfoMap(start: string, end: string): Promise<DayInfoMap> {
  const res = await fetch(`/api/daily-info?start=${start}&end=${end}`);
  if (!res.ok) return new Map();
  const arr = (await res.json()) as Array<{
    date: string;
    tithi?: { name: string; paksha: "Shukla" | "Krishna" };
    specialDay?: { name: string; emoji: string; type: string } | null;
    moonPhaseEvent?: { type: "new" | "first_quarter" | "full" | "last_quarter" } | null;
  }>;
  const map: DayInfoMap = new Map();
  for (const d of arr) {
    map.set(d.date.slice(0, 10), {
      tithi: d.tithi,
      specialDay: d.specialDay,
      moonPhaseEvent: d.moonPhaseEvent,
    });
  }
  return map;
}

// =============================================================================
// HELPERS
// =============================================================================

export function localDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayString() {
  return localDateString(new Date());
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${h}u ${rem}m` : `${h}u`;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
