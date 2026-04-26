import { useState, useMemo } from "react";
import { Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CalendarDay,
  SessionData,
  OverviewStats,
  DayInfoMap,
  StreakStats,
} from "../types";
import { buildHeatmap, Heatmap } from "../Heatmap";
import { MalasChart } from "../MalasChart";
import { AllTimeOverview } from "../AllTimeOverview";
import { DashboardKPIs } from "../DashboardKPIs";
import { StackedPracticeChart } from "../StackedPracticeChart";

interface DashboardTabProps {
  calDays: CalendarDay[];
  sessions: SessionData[];
  overview: OverviewStats | null;
  streak: StreakStats | null;
  dayInfoMap: DayInfoMap;
  heatmapEventsByDate: Map<string, Array<{ id: string; title: string }>>;
  onHeatmapEventClick: (id: string) => void;
}

export function DashboardTab({
  calDays,
  sessions,
  overview,
  streak,
  dayInfoMap,
  heatmapEventsByDate,
  onHeatmapEventClick,
}: DashboardTabProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const jan1 = new Date(selectedYear, 0, 1);

  // Full calendar year: jan1 → dec31, toekomstige datums = null (leeg)
  const heatmapFull = buildHeatmap(calDays, 364, jan1);
  const heatmapMobile = buildHeatmap(calDays, 154);

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    for (const s of sessions) years.add(parseInt(s.date.slice(0, 4)));
    return Array.from(years).sort((a, b) => b - a);
  }, [sessions, currentYear]);

  return (
    <div className="space-y-6">
      {/* Maand — KPI strip */}
      <DashboardKPIs streak={streak} overview={overview} calDays={calDays} />

      {/* Jaar — maandgrafiek */}
      <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h2 className="text-theme-fg text-sm font-semibold">
            Per maand — {selectedYear}
          </h2>
        </div>
        <MalasChart calDays={calDays} sessions={sessions} year={selectedYear} />
      </div>

      {/* Jaar — stacked beoefening grafiek */}
      <StackedPracticeChart sessions={sessions} year={selectedYear} />

      {/* Jaar — heatmap */}
      <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
              <Calendar className="h-4 w-4" />
            </div>
            <h2 className="text-theme-fg text-sm font-semibold">
              Activiteit — {selectedYear}
            </h2>
          </div>

          <div className="bg-theme-surface flex items-center gap-1 rounded-lg p-1">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "min-h-[32px] cursor-pointer rounded px-3 text-xs font-medium transition-colors",
                  selectedYear === year
                    ? "bg-theme-primary text-white shadow-sm"
                    : "text-theme-fg-muted hover:bg-theme-hover"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className="hidden sm:block">
          <Heatmap
            weeks={heatmapFull}
            dayInfoMap={dayInfoMap}
            eventsByDate={heatmapEventsByDate}
            onEventClick={onHeatmapEventClick}
          />
        </div>
        <div className="sm:hidden">
          <Heatmap
            weeks={heatmapMobile}
            cellSize={11}
            dayInfoMap={dayInfoMap}
            eventsByDate={heatmapEventsByDate}
            onEventClick={onHeatmapEventClick}
          />
        </div>
      </div>

      {/* All-time overzicht */}
      {overview && <AllTimeOverview overview={overview} />}
    </div>
  );
}
