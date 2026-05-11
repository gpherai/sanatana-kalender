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
  mantraText: string | null;
  countSize: number | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
}

export interface SessionItemData {
  id: string;
  practiceId: string;
  practiceName: string;
  practiceType: PracticeType;
  quantity: number;
  unit: ItemUnit;
  mantraCount: number | null;
  countTotal: number | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
}

export interface SessionData {
  id: string;
  date: string;
  startedAt: string | null;
  durationMinutes: number | null;
  totalMalas: number;
  totalMantras: number;
  totalCount: number;
  notes: string | null;
  createdAt: string;
  items: SessionItemData[];
}

export interface PracticeStat {
  practiceId: string;
  practiceName: string;
  practiceType: PracticeType;
  totalQuantity: number;
  totalMantras: number | null;
}

export interface TodayStats {
  date: string;
  totalMalas: number;
  totalMinutes: number;
  totalMantras: number;
  totalCount: number;
  goalMalasTarget: number | null;
  goalMalasProgress: number | null;
  goalMinutesTarget: number | null;
  goalMinutesProgress: number | null;
  practices: PracticeStat[];
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
}

export interface CalendarDay {
  date: string;
  totalMalas: number;
  totalMantras: number;
  totalCount: number;
  activityScore: number;
  totalMinutes: number;
  sessionCount: number;
}

export interface OverviewStats {
  totalSessions: number;
  totalMalasAllTime: number;
  totalMinutesAllTime: number;
  totalSessionsThisWeek: number;
  totalMalasThisWeek: number;
  totalMinutesThisWeek: number;
  totalSessionsThisMonth: number;
  totalMalasThisMonth: number;
  totalMinutesThisMonth: number;
  avgMalasPerSession: number;
  avgMinutesPerSession: number;
  practices: PracticeStat[];
}

export interface Goal {
  id: string;
  type: GoalType;
  name: string | null;
  targetMalas: number;
  targetMinutes: number | null;
  active: boolean;
  createdAt: string;
  practices?: { id: string; name: string }[];
  progressMalas?: number | null;
  progressMinutes?: number | null;
}

export interface RoutineItem {
  id: string;
  practiceId: string;
  practiceName: string;
  practiceType: PracticeType;
  quantity: number;
  unit: ItemUnit;
  sortOrder: number;
}

export interface Routine {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  items: RoutineItem[];
}

export interface FormItem {
  practiceId: string;
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
