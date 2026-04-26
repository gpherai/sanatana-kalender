"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Flame,
  Loader2,
  RefreshCw,
  TrendingUp,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { goalProgressRatio, isGoalComplete, todayString } from "@/lib/sadhana-utils";
import type { CalendarEvent, CalendarEventResponse } from "@/types/calendar";
import { parseCalendarEvent } from "@/types/calendar";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { TrackerTab } from "./tabs/TrackerTab";
import { DashboardTab } from "./tabs/DashboardTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { InstellingenTab } from "./tabs/InstellingenTab";
import { useSadhanaData, type SadhanaInitialData } from "@/hooks/useSadhanaData";

// =============================================================================
// TYPES
// =============================================================================

type TabId = "tracker" | "dashboard" | "analytics" | "instellingen";

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "tracker", label: "Tracker", Icon: Flame },
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", Icon: TrendingUp },
  { id: "instellingen", label: "Instellingen", Icon: Settings },
];

const VALID_TABS = new Set<string>(TABS.map((t) => t.id));

// =============================================================================
// COMPONENT
// =============================================================================

export function SadhanaTracker({ initialData }: { initialData?: SadhanaInitialData }) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "tracker";
  const activeTab: TabId = VALID_TABS.has(rawTab) ? (rawTab as TabId) : "tracker";

  const setTab = useCallback(
    (id: TabId) => window.history.replaceState(null, "", `/sadhana?tab=${id}`),
    []
  );

  // ── Data via hook ────────────────────────────────────────────────────────────
  const {
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
  } = useSadhanaData(initialData);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showAddSession, setShowAddSession] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set([todayString().slice(0, 7)])
  );
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevGoalProgressRef = useRef<Map<string, number>>(new Map());
  const [selectedHeatmapEvent, setSelectedHeatmapEvent] = useState<CalendarEvent | null>(
    null
  );

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData) {
      loadAll();
    }
  }, [loadAll, initialData]);

  // ── Goal completion toast ───────────────────────────────────────────────────
  useEffect(() => {
    if (goals.length === 0) return;
    const isFirst = prevGoalProgressRef.current.size === 0;
    let hasNewCompletion = false;
    if (!isFirst) {
      for (const g of goals) {
        if (!g.active) continue;
        const prev = prevGoalProgressRef.current.get(g.id);
        if (isGoalComplete(g) && (prev === undefined || prev < 1)) {
          hasNewCompletion = true;
          break;
        }
      }
    }
    const newMap = new Map<string, number>();
    for (const g of goals) {
      newMap.set(g.id, goalProgressRatio(g));
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

  const handleHeatmapEventClick = useCallback(
    (id: string) => {
      const raw = (heatmapEventsRaw as CalendarEventResponse[]).find((e) => e.id === id);
      if (raw) setSelectedHeatmapEvent(parseCalendarEvent(raw));
    },
    [heatmapEventsRaw]
  );

  const handleGoToSettings = useCallback(() => setTab("instellingen"), [setTab]);

  // ── Loading / error states ──────────────────────────────────────────────────
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
          className="text-theme-primary mt-3 inline-flex cursor-pointer items-center gap-2 text-sm hover:opacity-70"
        >
          <RefreshCw className="h-4 w-4" /> Opnieuw proberen
        </button>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header + tab nav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-theme-fg text-2xl font-bold">Sadhana</h1>
          <p className="text-theme-fg-muted text-sm">
            Mantra japa &amp; beoefening tracker
          </p>
        </div>

        <div className="bg-theme-surface-raised flex items-center rounded-xl p-1 shadow-sm">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === id
                  ? "bg-theme-primary-15 text-theme-primary"
                  : "text-theme-fg-muted hover:text-theme-fg"
              )}
              aria-label={label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "tracker" && (
        <TrackerTab
          todayStats={todayStats}
          streak={streak}
          overview={overview}
          goals={goals}
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
          onGoToSettings={handleGoToSettings}
        />
      )}

      {activeTab === "dashboard" && (
        <DashboardTab
          calDays={calDays}
          sessions={sessions}
          overview={overview}
          streak={streak}
          dayInfoMap={dayInfoMap}
          heatmapEventsByDate={heatmapEventsByDate}
          onHeatmapEventClick={handleHeatmapEventClick}
        />
      )}

      {activeTab === "analytics" && (
        <AnalyticsTab sessions={sessions} calDays={calDays} overview={overview} />
      )}

      {activeTab === "instellingen" && (
        <InstellingenTab
          routines={routines}
          goals={goals}
          allPractices={allPractices}
          loadAll={loadAll}
        />
      )}

      {selectedHeatmapEvent && (
        <EventDetailModal
          event={selectedHeatmapEvent}
          isOpen
          onClose={() => setSelectedHeatmapEvent(null)}
        />
      )}

      {toast && (
        <div className="bg-theme-primary fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
