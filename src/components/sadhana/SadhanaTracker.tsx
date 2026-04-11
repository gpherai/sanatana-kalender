"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Flame,
  Award,
  Calendar,
  Plus,
  Loader2,
  RefreshCw,
  Sparkles,
  Activity,
  TrendingUp,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  formatDate,
  formatDuration,
  dayContextLabel,
} from "./types";
import { buildHeatmap, Heatmap } from "./Heatmap";
import { MalasChart } from "./MalasChart";
import { StatCard } from "./StatCard";
import { SessionForm } from "./SessionForm";
import { SessionCard } from "./SessionCard";
import { PracticesPanel } from "./PracticesPanel";
import { GoalPanel } from "./GoalPanel";
import { RoutinePanel } from "./RoutinePanel";

const MONTHS_NL_FULL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function formatMonthLabel(ym: string) {
  const parts = ym.split("-");
  const y = parts[0]!;
  const m = parts[1]!;
  return `${MONTHS_NL_FULL[parseInt(m, 10) - 1]} ${y}`;
}

function getMonthTotals(monthSessions: SessionData[]) {
  let malas = 0;
  let minutes = 0;
  for (const s of monthSessions) {
    malas += s.total_malas;
    minutes += s.duration_minutes ?? 0;
  }
  return { malas, minutes, count: monthSessions.length };
}

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
      // Project mandate: only from 2026-01-01
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
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  }, []);

  // Group sessions by YYYY-MM, sorted descending
  const sessionsByMonth = useMemo(() => {
    const map = new Map<string, SessionData[]>();
    for (const s of sessions) {
      const month = s.date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(s);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [sessions]);

  const heatmapFull = buildHeatmap(calDays, 364);
  const heatmapMobile = buildHeatmap(calDays, 154); // ~22 weken, past op 375px

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
        <button
          onClick={loadAll}
          className="text-theme-fg-muted hover:text-theme-fg flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg transition-colors"
          aria-label="Pagina verversen"
          title="Verversen"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
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
        />
      </div>

      {/* Sessions — maandaccordeon */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-theme-fg font-semibold">Sessies</h2>
          <button
            onClick={() => setShowAddSession((v) => !v)}
            className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white shadow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Toevoegen
          </button>
        </div>

        {showAddSession && (
          <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
            <h3 className="text-theme-fg mb-4 font-semibold">Sessie toevoegen</h3>
            {activePractices.length === 0 ? (
              <p className="text-theme-warning text-sm">
                Voeg eerst een actieve beoefening toe onderaan de pagina.
              </p>
            ) : (
              <SessionForm
                practices={activePractices}
                routines={routines}
                submitLabel="Opslaan"
                onSubmit={async (data) => {
                  await apiFetch("/sessions", {
                    method: "POST",
                    body: JSON.stringify({
                      date: data.date,
                      started_at: data.startedAt
                        ? new Date(`${data.date}T${data.startedAt}`).toISOString()
                        : null,
                      duration_minutes: data.duration
                        ? parseInt(data.duration, 10)
                        : null,
                      notes: data.notes.trim() || null,
                      items: data.items.map((it) => ({
                        practice_id: it.practice_id,
                        quantity: parseInt(it.quantity, 10),
                        unit: it.unit,
                      })),
                    }),
                  });
                  setShowAddSession(false);
                  loadAll();
                  showToast("Sessie opgeslagen");
                }}
                onCancel={() => setShowAddSession(false)}
              />
            )}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="bg-theme-surface-raised rounded-2xl p-8 text-center shadow-lg">
            <div className="text-theme-fg-muted text-sm">Geen sessies gevonden.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {sessionsByMonth.map(([month, monthSessions]) => {
              const isOpen = expandedMonths.has(month);
              const { malas, minutes, count } = getMonthTotals(monthSessions);
              return (
                <div
                  key={month}
                  className="bg-theme-surface-raised overflow-hidden rounded-2xl shadow-lg"
                >
                  {/* Maand-header */}
                  <button
                    onClick={() => toggleMonth(month)}
                    className="hover:bg-theme-hover flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        "text-theme-fg-muted h-4 w-4 shrink-0 transition-transform duration-200",
                        isOpen && "rotate-90"
                      )}
                    />
                    <span className="text-theme-fg flex-1 text-left font-semibold capitalize">
                      {formatMonthLabel(month)}
                    </span>
                    <div className="text-theme-fg-muted flex items-center gap-2 text-xs">
                      <span>{count} sessies</span>
                      <span className="text-theme-border">·</span>
                      <span>{Math.round(malas)} malas</span>
                      {minutes > 0 && (
                        <>
                          <span className="text-theme-border">·</span>
                          <span>{formatDuration(minutes)}</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Dag-groepen */}
                  {isOpen && (
                    <div className="border-theme-border space-y-4 border-t px-4 pt-4 pb-4">
                      {Object.entries(
                        monthSessions.reduce(
                          (acc, s) => {
                            (acc[s.date] ??= []).push(s);
                            return acc;
                          },
                          {} as Record<string, SessionData[]>
                        )
                      )
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([date, daySessions]) => {
                          const info = dayInfoMap.get(date);
                          const context = dayContextLabel(info);
                          const isToday = date === todayString();
                          return (
                            <div key={date} className="space-y-2">
                              {/* Dag-header */}
                              <div className="flex flex-wrap items-center gap-2 px-1">
                                <span className="text-theme-fg-secondary text-xs font-semibold">
                                  {formatDate(date)}
                                </span>
                                {isToday && (
                                  <span className="bg-theme-primary/15 text-theme-primary rounded-full px-2 py-0.5 text-xs font-medium">
                                    Vandaag
                                  </span>
                                )}
                                {context && (
                                  <span className="text-theme-fg-muted text-xs">
                                    {context}
                                  </span>
                                )}
                              </div>
                              {daySessions.map((s) => (
                                <SessionCard
                                  key={s.id}
                                  session={s}
                                  practices={activePractices}
                                  onUpdated={() => {
                                    loadAll();
                                    showToast("Sessie opgeslagen");
                                  }}
                                  onDeleted={() => {
                                    loadAll();
                                    showToast("Sessie verwijderd");
                                  }}
                                />
                              ))}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-practice vandaag */}
      {todayStats && (
        <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="text-theme-primary h-4 w-4" />
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

      {/* Heatmap */}
      <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="text-theme-primary h-4 w-4" />
          <h2 className="text-theme-fg text-sm font-semibold">
            Activiteit — laatste jaar
          </h2>
        </div>
        <div className="hidden sm:block">
          <Heatmap weeks={heatmapFull} dayInfoMap={dayInfoMap} />
        </div>
        <div className="sm:hidden">
          <Heatmap weeks={heatmapMobile} cellSize={10} dayInfoMap={dayInfoMap} />
        </div>
      </div>

      {/* Maandgrafiek */}
      <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className="text-theme-primary h-4 w-4" />
          <h2 className="text-theme-fg text-sm font-semibold">
            Per maand — laatste jaar
          </h2>
        </div>
        <MalasChart calDays={calDays} />
      </div>

      {/* All-time overview */}
      {overview && (
        <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Award className="text-theme-primary h-4 w-4" />
            <h2 className="text-theme-fg text-sm font-semibold">All-time overzicht</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                label: "Sessies",
                value: overview.total_sessions.toLocaleString("nl-NL"),
              },
              {
                label: "Malas totaal",
                value: overview.total_malas_all_time.toLocaleString("nl-NL"),
              },
              {
                label: "Minuten totaal",
                value: overview.total_minutes_all_time.toLocaleString("nl-NL"),
              },
              {
                label: "Gem. malas/sessie",
                value: overview.avg_malas_per_session.toFixed(1),
              },
              {
                label: "Gem. min/sessie",
                value: overview.avg_minutes_per_session.toFixed(1),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-theme-fg-muted text-xs">{label}</div>
                <div className="text-theme-fg mt-0.5 text-2xl font-bold tabular-nums">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {overview.practices.length > 0 && (
            <div className="border-theme-border mt-5 border-t pt-4">
              <div className="text-theme-fg-secondary mb-3 text-xs font-medium">
                Per beoefening
              </div>
              <div className="space-y-2">
                {overview.practices.map((ps) => (
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
            </div>
          )}
        </div>
      )}

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
