"use client";

import { useState, useCallback, useRef } from "react";
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
} from "@/components/sadhana/types";
import type { CalendarEventResponse } from "@/types/calendar";

export interface SadhanaData {
  loading: boolean;
  error: string | null;
  todayStats: TodayStats | null;
  streak: StreakStats | null;
  overview: OverviewStats | null;
  calDays: CalendarDay[];
  sessions: SessionData[];
  allPractices: Practice[];
  activePractices: Practice[];
  goals: Goal[];
  routines: Routine[];
  dayInfoMap: DayInfoMap;
  heatmapEventsByDate: Map<string, Array<{ id: string; title: string }>>;
  heatmapEventsRaw: CalendarEventResponse[];
  loadAll: () => Promise<void>;
}

export function useSadhanaData(): SadhanaData {
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
  const [dayInfoMap, setDayInfoMap] = useState<DayInfoMap>(new Map());
  const [heatmapEventsByDate, setHeatmapEventsByDate] = useState<
    Map<string, Array<{ id: string; title: string }>>
  >(new Map());
  const [heatmapEventsRaw, setHeatmapEventsRaw] = useState<CalendarEventResponse[]>([]);

  const initialLoadDone = useRef(false);

  const loadAll = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      setError(null);

      const yearAgo = new Date();
      yearAgo.setDate(yearAgo.getDate() - 364);
      const minDate = new Date("2026-01-01T00:00:00");
      const effectiveStart = yearAgo < minDate ? minDate : yearAgo;
      const fromDate = new Date("2026-01-01T00:00:00");
      const heatmapEventsUrl = `/api/events?start=${localDateString(effectiveStart)}&end=${todayString()}&sortBy=date&order=asc`;

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
        fetch(heatmapEventsUrl).then((r) => r.json() as Promise<CalendarEventResponse[]>),
      ]);

      const failed = results.filter(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult[];
      if (failed.length > 0) {
        const errors = failed.map(
          (f) => (f.reason as Error)?.message || "Onbekende fout"
        );
        throw new Error(errors[0]);
      }

      const [ts, st, ov, cal, sess, pracs, gl, rout, dim, heatmapEvents] = results.map(
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
        CalendarEventResponse[],
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

      const rawEvs = heatmapEvents ?? [];
      setHeatmapEventsRaw(rawEvs);
      const evMap = new Map<string, Array<{ id: string; title: string }>>();
      for (const ev of rawEvs) {
        const dateKey = ev.start.slice(0, 10);
        const arr = evMap.get(dateKey) ?? [];
        arr.push({ id: ev.id, title: ev.title });
        evMap.set(dateKey, arr);
      }
      setHeatmapEventsByDate(evMap);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Onbekende fout bij het laden van de gegevens.";
      setError(msg);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, []);

  const activePractices = allPractices.filter((p) => p.active);

  return {
    loading,
    error,
    todayStats,
    streak,
    overview,
    calDays,
    sessions,
    allPractices,
    activePractices,
    goals,
    routines,
    dayInfoMap,
    heatmapEventsByDate,
    heatmapEventsRaw,
    loadAll,
  };
}
