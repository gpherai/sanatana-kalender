import type { SessionData, CalendarDay } from "../types";
import { WeekdayPattern, ConsistencyRing } from "../AnalyticsWidgets";

interface AnalyticsTabProps {
  sessions: SessionData[];
  calDays: CalendarDay[];
}

export function AnalyticsTab({ sessions, calDays }: AnalyticsTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <WeekdayPattern sessions={sessions} />
      <ConsistencyRing calDays={calDays} />
    </div>
  );
}
