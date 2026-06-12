"use client";

import { memo } from "react";
import { Flame, Sparkles, Activity, TrendingUp, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TodayStats,
  StreakStats,
  OverviewStats,
  SessionData,
  Practice,
  Routine,
  DayInfoMap,
  Goal,
} from "@/types/sadhana";
import { formatDuration } from "@/lib/sadhana-utils";
import { SessionsSection } from "../SessionsSection";
import { UpcomingEventsPanel } from "../UpcomingEventsPanel";
import { GoalProgressWidget } from "../GoalProgressWidget";

// Compact stat voor de sidebar — dichter dan de volledige StatCard
function SidebarStat({
  icon,
  label,
  value,
  sub,
  accent = false,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  progress?: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl p-3",
        accent ? "bg-theme-accent-10" : "bg-theme-surface"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn("shrink-0", accent ? "text-theme-accent" : "text-theme-primary")}
        >
          {icon}
        </span>
        <span className="text-theme-fg-muted text-xs font-medium">{label}</span>
      </div>
      <div
        className={cn(
          "text-lg leading-tight font-bold tabular-nums",
          accent ? "text-theme-accent" : "text-theme-stat-value"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-theme-fg-muted text-xs">{sub}</div>}
      {progress !== undefined && (
        <div className="bg-theme-hover mt-1 h-1.5 overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500",
              accent ? "bg-theme-accent" : "bg-theme-primary"
            )}
            style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface TrackerTabProps {
  todayStats: TodayStats | null;
  streak: StreakStats | null;
  overview: OverviewStats | null;
  goals: Goal[];
  sessions: SessionData[];
  expandedMonths: Set<string>;
  toggleMonth: (month: string) => void;
  showAddSession: boolean;
  setShowAddSession: (v: boolean) => void;
  dayInfoMap: DayInfoMap;
  activePractices: Practice[];
  routines: Routine[];
  loadAll: () => Promise<void>;
  showToast: (msg: string) => void;
  onGoToSettings: () => void;
}

export const TrackerTab = memo(function TrackerTab({
  todayStats,
  streak,
  overview,
  goals,
  sessions,
  expandedMonths,
  toggleMonth,
  showAddSession,
  setShowAddSession,
  dayInfoMap,
  activePractices,
  routines,
  loadAll,
  showToast,
  onGoToSettings,
}: TrackerTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      {/* ── Sessies (hoofdkolom links) ────────────────────────────────── */}
      <div className="min-w-0">
        <SessionsSection
          sessions={sessions}
          expandedMonths={expandedMonths}
          toggleMonth={toggleMonth}
          showAddSession={showAddSession}
          setShowAddSession={setShowAddSession}
          dayInfoMap={dayInfoMap}
          activePractices={activePractices}
          routines={routines}
          loadAll={loadAll}
          showToast={showToast}
        />
      </div>

      {/* ── Sidebar (rechts) ──────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Doelen */}
        <GoalProgressWidget goals={goals} onGoToSettings={onGoToSettings} />

        {/* Vandaag per beoefening */}
        {todayStats && (
          <div className="bg-theme-surface-raised rounded-2xl p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-theme-fg text-sm font-semibold">Vandaag</h2>
            </div>
            {todayStats.practices.length === 0 ? (
              <p className="text-theme-fg-muted text-sm">Nog niets gelogd.</p>
            ) : (
              <div className="space-y-2">
                {todayStats.practices.map((ps) => (
                  <div key={ps.practiceId} className="flex items-center gap-2">
                    <span className="text-theme-primary shrink-0">
                      {ps.practiceType === "mantra_japa" ? (
                        <Sparkles className="h-3 w-3" />
                      ) : (
                        <BookOpen className="h-3 w-3" />
                      )}
                    </span>
                    <span className="text-theme-fg-secondary min-w-0 flex-1 truncate text-xs">
                      {ps.practiceName}
                    </span>
                    <span className="text-theme-fg-muted shrink-0 text-xs tabular-nums">
                      {ps.totalQuantity}
                      {ps.practiceType === "mantra_japa" ? " malas" : "×"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compact stats — 2×2 grid */}
        <div className="bg-theme-surface-raised rounded-2xl p-4 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="text-theme-fg text-sm font-semibold">Overzicht</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SidebarStat
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Vandaag"
              value={
                todayStats?.goalMalasTarget
                  ? `${todayStats.totalMalas}/${todayStats.goalMalasTarget}`
                  : `${todayStats?.totalMalas ?? 0} malas`
              }
              sub={
                todayStats?.totalMinutes
                  ? formatDuration(todayStats.totalMinutes)
                  : undefined
              }
              progress={todayStats?.goalMalasProgress ?? undefined}
            />
            <SidebarStat
              icon={<Flame className="h-3.5 w-3.5" />}
              label="Streak"
              value={`${streak?.currentStreak ?? 0} d`}
              sub={`Langste: ${streak?.longestStreak ?? 0} d`}
              accent
            />
            <SidebarStat
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Deze week"
              value={`${overview?.totalMalasThisWeek ?? 0} malas`}
              sub={`${overview?.totalSessionsThisWeek ?? 0} sessies`}
            />
            <SidebarStat
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Deze maand"
              value={`${overview?.totalMalasThisMonth ?? 0} malas`}
              sub={`${overview?.totalSessionsThisMonth ?? 0} sessies`}
            />
          </div>
        </div>

        {/* Aankomende festivals */}
        <UpcomingEventsPanel />
      </div>
    </div>
  );
});
