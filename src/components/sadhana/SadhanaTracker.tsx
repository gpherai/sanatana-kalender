"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Flame,
  Calendar,
  Loader2,
  RefreshCw,
  Sparkles,
  Activity,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import {
  type TodayStats,
  type StreakStats,
  type OverviewStats,
  type CalendarDay,
  type SessionData,
  type Practice,
  type Goal,
  type Routine,
  type DayInfoMap,
  apiFetch,
  fetchDayInfoMap,
  localDateString,
  todayString,
  formatDuration,
} from "./types";
import { buildHeatmap, Heatmap } from "./Heatmap";
import { MalasChart } from "./MalasChart";
import { StatCard } from "./StatCard";
import { SessionsSection } from "./SessionsSection";
import { AllTimeOverview } from "./AllTimeOverview";
import { WeekdayPattern, ConsistencyRing } from "./AnalyticsWidgets";
import { PracticesPanel } from "./PracticesPanel";
import { GoalPanel } from "./GoalPanel";
import { RoutinePanel } from "./RoutinePanel";

export function SadhanaTracker() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [calDays, setCalDays] = useState<CalendarDay[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [allPractices, setAllPractices] = useState<Practice[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set([todayString().slice(0, 7)])
  );
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dayInfoMap, setDayInfoMap] = useState<DayInfoMap>(new Map());
  const initialLoadDone = useRef(false);
  const prevGoalProgressRef = useRef<Map<string, number>>(new Map());

  const activePractices = allPractices.filter((p) => p.active);

  const loadAll = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      setError(null);
      const fromDate = new Date("2026-01-01T00:00:00");
      const yearAgo = new Date();
      yearAgo.setDate(yearAgo.getDate() - 364);
      const minDate = new Date("2026-01-01T00:00:00");
      const effectiveStart = yearAgo < minDate ? minDate : yearAgo;

      const results = await Promise.allSettled([
        apiFetch<TodayStats>("/stats/today"),
        apiFetch<StreakStats>("/stats/streak"),
        apiFetch<OverviewStats>("/stats/overview"),
        apiFetch<CalendarDay[]>("/stats/calendar"),
        apiFetch<SessionData[]>(`/sessions?from=${localDateString(fromDate)}`),
        apiFetch<Practice[]>("/practices?active_only=false"),
        apiFetch<Goal[]>("/goals"),
        apiFetch<Routine[]>("/routines"),
        fetchDayInfoMap(localDateString(effectiveStart), todayString()),
      ]);

      const failed = results.filter(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult[];
      if (failed.length > 0) {
        const errors = failed.map((f) => f.reason?.message || "Onbekende fout");
        console.error("Sommige API calls zijn gefaald:", errors);
        throw new Error(errors[0]);
      }

      const [ts, st, ov, cal, sess, pracs, gl, rout, dim] = results.map(
        (r) => (r as PromiseFulfilledResult<unknown>).value
      ) as [
        TodayStats,
        StreakStats,
        OverviewStats,
        CalendarDay[],
        SessionData[],
        Practice[],
        Goal[],
        Routine[],
        DayInfoMap,
      ];

      setTodayStats(ts);
      setStreak(st);
      setOverview(ov);
      setCalDays(cal);
      setSessions(sess);
      setAllPractices(pracs);
      setGoals(gl);
      setRoutines(rout);
      setDayInfoMap(dim);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Onbekende fout bij het laden van de gegevens.";
      console.error("Sadhana load error:", err);
      setError(msg);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Detect newly completed goals and toast once per transition
  useEffect(() => {
    if (goals.length === 0) return;
    const isFirst = prevGoalProgressRef.current.size === 0;
    let hasNewCompletion = false;
    if (!isFirst) {
      for (const g of goals) {
        if (!g.active) continue;
        const prev = prevGoalProgressRef.current.get(g.id);
        const curr = (g.progress_malas || 0) / g.target_malas;
        if (curr >= 1 && (prev === undefined || prev < 1)) {
          hasNewCompletion = true;
          break;
        }
      }
    }
    const newMap = new Map<string, number>();
    for (const g of goals) {
      newMap.set(g.id, (g.progress_malas || 0) / g.target_malas);
    }
    prevGoalProgressRef.current = newMap;
    if (hasNewCompletion) {
      setToast("Doel bereikt!");
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    }
  }, [goals]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const toggleMonth = useCallback((month: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  }, []);

  const heatmapFull = buildHeatmap(calDays, 364);
  const heatmapMobile = buildHeatmap(calDays, 154);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="text-theme-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-warning-subtle border-theme-warning rounded-2xl border p-6 text-center">
        <p className="text-theme-warning text-sm">{error}</p>
        <button
          onClick={loadAll}
          className="text-theme-primary mt-3 inline-flex items-center gap-2 text-sm hover:opacity-70"
        >
          <RefreshCw className="h-4 w-4" /> Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-fg text-2xl font-bold">Sadhana</h1>
          <p className="text-theme-fg-muted text-sm">
            Mantra japa &amp; beoefening tracker
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Vandaag"
          value={
            todayStats?.goal_malas_target
              ? `${todayStats.total_malas} / ${todayStats.goal_malas_target} malas`
              : `${todayStats?.total_malas ?? 0} malas`
          }
          sub={`${(todayStats?.total_mantras ?? 0).toLocaleString("nl-NL")} mantras${todayStats?.total_minutes ? ` · ${formatDuration(todayStats.total_minutes)}` : ""}`}
          progress={todayStats?.goal_malas_progress ?? undefined}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Deze week"
          value={`${overview?.total_malas_this_week ?? 0} malas`}
          sub={`${overview?.total_sessions_this_week ?? 0} sessies${overview?.total_minutes_this_week ? ` · ${formatDuration(overview.total_minutes_this_week)}` : ""}`}
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Deze maand"
          value={`${overview?.total_malas_this_month ?? 0} malas`}
          sub={`${overview?.total_sessions_this_month ?? 0} sessies${overview?.total_minutes_this_month ? ` · ${formatDuration(overview.total_minutes_this_month)}` : ""}`}
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Streak"
          value={`${streak?.current_streak ?? 0} dagen`}
          sub={`Langste: ${streak?.longest_streak ?? 0} dagen`}
          accent
        />
      </div>

      {/* Vandaag per beoefening */}
      {todayStats && (
        <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-theme-fg text-sm font-semibold">
              Vandaag per beoefening
            </h2>
          </div>
          {todayStats.practices.length === 0 ? (
            <p className="text-theme-fg-muted text-sm">Vandaag nog niets gelogd.</p>
          ) : (
            <div className="space-y-2">
              {todayStats.practices.map((ps) => (
                <div key={ps.practice_id} className="flex items-center gap-3">
                  <div className="text-theme-primary shrink-0">
                    {ps.practice_type === "mantra_japa" ? (
                      <Sparkles className="h-3.5 w-3.5" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="text-theme-fg-secondary min-w-0 flex-1 truncate text-sm">
                    {ps.practice_name}
                  </span>
                  <span className="text-theme-fg-muted shrink-0 text-xs tabular-nums">
                    {ps.total_quantity}{" "}
                    {ps.practice_type === "mantra_japa" ? "malas" : "×"}
                    {ps.total_mantras
                      ? ` · ${ps.total_mantras.toLocaleString("nl-NL")} mantras`
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sessies */}
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

      {/* Heatmap */}
      <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
            <Calendar className="h-4 w-4" />
          </div>
          <h2 className="text-theme-fg text-sm font-semibold">
            Activiteit — laatste jaar
          </h2>
        </div>
        <div className="hidden sm:block">
          <Heatmap weeks={heatmapFull} dayInfoMap={dayInfoMap} />
        </div>
        <div className="sm:hidden">
          <Heatmap weeks={heatmapMobile} cellSize={11} dayInfoMap={dayInfoMap} />
        </div>
      </div>

      {/* Maandgrafiek */}
      <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
        <div className="mb-1 flex items-center gap-2">
          <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h2 className="text-theme-fg text-sm font-semibold">
            Per maand — laatste jaar
          </h2>
        </div>
        <MalasChart calDays={calDays} sessions={sessions} />
      </div>

      {/* All-time overzicht */}
      {overview && <AllTimeOverview overview={overview} />}

      {/* Weekpatroon + Consistentie */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WeekdayPattern sessions={sessions} />
        <ConsistencyRing calDays={calDays} />
      </div>

      {/* Routines + Goals + Practices */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <RoutinePanel routines={routines} practices={allPractices} onChanged={loadAll} />
        <GoalPanel goals={goals} practices={allPractices} onChanged={loadAll} />
      </div>
      <PracticesPanel practices={allPractices} onChanged={loadAll} />

      {/* Toast */}
      {toast && (
        <div className="bg-theme-primary fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
