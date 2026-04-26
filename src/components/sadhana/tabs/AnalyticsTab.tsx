import { memo } from "react";
import type { SessionData, CalendarDay, OverviewStats } from "../types";
import {
  WeekdayPattern,
  ConsistencyRing,
  PracticeDonut,
  PracticeTrend,
  TimeOfDayPattern,
} from "../AnalyticsWidgets";

interface AnalyticsTabProps {
  sessions: SessionData[];
  calDays: CalendarDay[];
  overview: OverviewStats | null;
}

export const AnalyticsTab = memo(function AnalyticsTab({
  sessions,
  calDays,
  overview,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeekdayPattern sessions={sessions} />
        <TimeOfDayPattern sessions={sessions} />
        <ConsistencyRing calDays={calDays} />
        {overview && overview.practices.length > 0 && (
          <PracticeDonut practices={overview.practices} />
        )}
      </div>
      <PracticeTrend sessions={sessions} />
    </div>
  );
});
