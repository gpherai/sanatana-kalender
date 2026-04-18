import { Calendar, TrendingUp } from "lucide-react";
import type { CalendarDay, SessionData, OverviewStats, DayInfoMap } from "../types";
import { buildHeatmap, Heatmap } from "../Heatmap";
import { MalasChart } from "../MalasChart";
import { AllTimeOverview } from "../AllTimeOverview";

interface DashboardTabProps {
  calDays: CalendarDay[];
  sessions: SessionData[];
  overview: OverviewStats | null;
  dayInfoMap: DayInfoMap;
  heatmapEventsByDate: Map<string, Array<{ id: string; title: string }>>;
  onHeatmapEventClick: (id: string) => void;
}

export function DashboardTab({
  calDays,
  sessions,
  overview,
  dayInfoMap,
  heatmapEventsByDate,
  onHeatmapEventClick,
}: DashboardTabProps) {
  const heatmapFull = buildHeatmap(calDays, 364);
  const heatmapMobile = buildHeatmap(calDays, 154);

  return (
    <div className="space-y-6">
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
    </div>
  );
}
