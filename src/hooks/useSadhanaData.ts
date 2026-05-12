"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type {
  TodayStats,
  StreakStats,
  OverviewStats,
  CalendarDay,
  SessionData,
  Practice,
  Goal,
  Routine,
  DayInfo,
  DayInfoMap,
} from "@/types/sadhana";
import { apiFetch, fetchDayInfoMap } from "@/lib/sadhana-api";
import { todayString, SADHANA_START_DATE } from "@/lib/sadhana-utils";
import type { CalendarEventResponse } from "@/types/calendar";
import { addDaysDateOnly } from "@/lib/default-location-date";

// Module-level cache — survives re-renders and tab-switches within one browser session.
// Keyed on the end date: if the day rolls over, the next load fetches the new day's data.
let _dayInfoMapCache: DayInfoMap | null = null;
let _dayInfoMapCacheEnd: string | null = null;

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

export interface SadhanaInitialData extends Partial<
  Omit<SadhanaData, "dayInfoMap" | "loadAll" | "activePractices">
> {
  dayInfoMapEntries?: [string, DayInfo][];
  heatmapStart?: string;
  heatmapEnd?: string;
}

export function useSadhanaData(initialData?: SadhanaInitialData): SadhanaData {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(
    initialData?.todayStats ?? null
  );
  const [streak, setStreak] = useState<StreakStats | null>(initialData?.streak ?? null);
  const [overview, setOverview] = useState<OverviewStats | null>(
    initialData?.overview ?? null
  );
  const [calDays, setCalDays] = useState<CalendarDay[]>(initialData?.calDays ?? []);
  const [sessions, setSessions] = useState<SessionData[]>(initialData?.sessions ?? []);
  const [allPractices, setAllPractices] = useState<Practice[]>(
    initialData?.allPractices ?? []
  );
  const [goals, setGoals] = useState<Goal[]>(initialData?.goals ?? []);
  const [routines, setRoutines] = useState<Routine[]>(initialData?.routines ?? []);

  const [dayInfoMap, setDayInfoMap] = useState<DayInfoMap>(() => {
    if (initialData?.dayInfoMapEntries) {
      return new Map(initialData.dayInfoMapEntries);
    }
    return new Map();
  });

  const [heatmapEventsRaw, setHeatmapEventsRaw] = useState<CalendarEventResponse[]>(
    initialData?.heatmapEventsRaw ?? []
  );
  const [heatmapEventsByDate, setHeatmapEventsByDate] = useState<
    Map<string, Array<{ id: string; title: string }>>
  >(() => {
    const { heatmapEventsRaw, heatmapStart, heatmapEnd } = initialData ?? {};
    if (heatmapEventsRaw && heatmapStart && heatmapEnd) {
      const evMap = new Map();
      for (const ev of heatmapEventsRaw) {
        addEventToDates(evMap, ev, heatmapStart, heatmapEnd);
      }
      return evMap;
    }
    return new Map();
  });

  const initialLoadDone = useRef(!!initialData);

  const loadAll = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      setError(null);

      const heatmapStart = SADHANA_START_DATE;
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
        apiFetch<SessionData[]>(`/sessions?from=${heatmapStart}`),
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
          : fetchDayInfoMap(heatmapStart, heatmapEnd),
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

  const activePractices = useMemo(
    () => allPractices.filter((p) => p.active),
    [allPractices]
  );

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
}
