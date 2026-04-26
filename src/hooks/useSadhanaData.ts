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

// Module-level cache — survives re-renders and tab-switches within one browser session.
// Keyed on the end date: if the day rolls over, the next load fetches the new day's data.
let _dayInfoMapCache: DayInfoMap | null = null;
let _dayInfoMapCacheEnd: string | null = null;
import type { CalendarEventResponse } from "@/types/calendar";
import { addDaysDateOnly } from "@/lib/default-location-date";

async function fetchCalendarEvents(url: string): Promise<CalendarEventResponse[]> {
  const response = await fetch(url);
  if (!response.ok) return [];
  const json = (await response.json()) as unknown;
  return Array.isArray(json) ? (json as CalendarEventResponse[]) : [];
}

function addEventToDates(
  map: Map<string, Array<{ id: string; title: string }>>,
  event: CalendarEventResponse,
  start: string,
  end: string
) {
  let current = event.start.slice(0, 10);
  const last = event.resource.originalEndDate?.slice(0, 10) ?? current;

  while (current <= last) {
    if (current >= start && current <= end) {
      const arr = map.get(current) ?? [];
      arr.push({ id: event.id, title: event.title });
      map.set(current, arr);
    }
    current = addDaysDateOnly(current, 1);
  }
}

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

      const fromDate = new Date("2025-01-01T00:00:00");
      const heatmapStart = localDateString(fromDate);
      const heatmapEnd = todayString();
      const heatmapEventsUrl = `/api/events?start=${heatmapStart}&end=${heatmapEnd}&sortBy=date&order=asc`;

      // Phase 1: fast core data — update UI immediately when done
      const coreResults = await Promise.allSettled([
        apiFetch<TodayStats>("/stats/today"),
        apiFetch<StreakStats>("/stats/streak"),
        apiFetch<OverviewStats>("/stats/overview"),
        apiFetch<CalendarDay[]>(
          `/stats/calendar?start=${heatmapStart}&end=${heatmapEnd}`
        ),
        apiFetch<SessionData[]>(`/sessions?from=${localDateString(fromDate)}`),
        apiFetch<Practice[]>("/practices?active_only=false"),
        apiFetch<Goal[]>("/goals"),
        apiFetch<Routine[]>("/routines"),
      ]);

      const coreFailed = coreResults.filter(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult[];
      if (coreFailed.length > 0) {
        const errors = coreFailed.map(
          (f) => (f.reason as Error)?.message || "Onbekende fout"
        );
        throw new Error(errors[0]);
      }

      const [ts, st, ov, cal, sess, pracs, gl, rout] = coreResults.map(
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
      ];

      setTodayStats(ts);
      setStreak(st);
      setOverview(ov);
      setCalDays(cal);
      setSessions(sess);
      setAllPractices(pracs);
      setGoals(gl);
      setRoutines(rout);
      setLoading(false);
      initialLoadDone.current = true;

      // Phase 2: slow data (panchanga + events) — loads in background, doesn't block UI.
      // DayInfoMap is served from the module-level cache when the same day is requested twice
      // (e.g. navigating away and back). Cache is invalidated when the date rolls over.
      const cachedMap =
        _dayInfoMapCache && _dayInfoMapCacheEnd === heatmapEnd ? _dayInfoMapCache : null;

      void Promise.allSettled([
        cachedMap
          ? Promise.resolve(cachedMap)
          : fetchDayInfoMap(localDateString(fromDate), heatmapEnd),
        fetchCalendarEvents(heatmapEventsUrl),
      ]).then(([dimResult, evResult]) => {
        if (dimResult.status === "fulfilled") {
          if (!cachedMap) {
            _dayInfoMapCache = dimResult.value;
            _dayInfoMapCacheEnd = heatmapEnd;
          }
          setDayInfoMap(dimResult.value);
        }
        if (evResult.status === "fulfilled") {
          const rawEvs = evResult.value ?? [];
          setHeatmapEventsRaw(rawEvs);
          const evMap = new Map<string, Array<{ id: string; title: string }>>();
          for (const ev of rawEvs) {
            addEventToDates(evMap, ev, heatmapStart, heatmapEnd);
          }
          setHeatmapEventsByDate(evMap);
        }
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Onbekende fout bij het laden van de gegevens.";
      setError(msg);
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
