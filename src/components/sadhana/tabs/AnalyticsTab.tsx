import type { SessionData, CalendarDay, OverviewStats } from "../types";
import { WeekdayPattern, ConsistencyRing, PracticeDonut } from "../AnalyticsWidgets";

interface AnalyticsTabProps {
  sessions: SessionData[];
  calDays: CalendarDay[];
  overview: OverviewStats | null;
}

export function AnalyticsTab({ sessions, calDays, overview }: AnalyticsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeekdayPattern sessions={sessions} />
        <ConsistencyRing calDays={calDays} />
      </div>
      {overview && overview.practices.length > 0 && (
        <PracticeDonut practices={overview.practices} />
      )}
    </div>
  );
}
