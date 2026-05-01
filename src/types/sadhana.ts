// =============================================================================
// SADHANA DOMAIN TYPES
//
// Pure TypeScript interfaces — no runtime code.
// Helpers and formatters: @/lib/sadhana-utils
// API fetching:           @/lib/sadhana-api
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
