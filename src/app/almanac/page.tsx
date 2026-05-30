import { AlmanacClient } from "@/components/almanac/AlmanacClient";
import { panchangaService } from "@/services/panchanga.service";
import { getEventOccurrences } from "@/services/event.service";
import {
  transformToApiResponse,
  transformOccurrenceToCalendarEvent,
} from "@/lib/api-transformers";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";

export default async function AlmanacPage() {
  const timezone = DEFAULT_LOCATION.timezone;
  const now = DateTime.now().setZone(timezone);
  const firstDay = now.startOf("month");
  const lastDay = now.endOf("month").startOf("day");

  const startStr = firstDay.toISODate()!;
  const endStr = lastDay.toISODate()!;

  const [panchangas, occurrences] = await Promise.all([
    panchangaService.calculateRange(
      firstDay.toJSDate(),
      lastDay.toJSDate(),
      DEFAULT_LOCATION,
      timezone
    ),
    getEventOccurrences({ start: startStr, end: endStr }),
  ]);

  const initialMonthData = panchangas.map(transformToApiResponse);
  const initialMonthEvents = occurrences.map(transformOccurrenceToCalendarEvent);

  return (
    <AlmanacClient
      initialMonthData={initialMonthData}
      initialMonthEvents={initialMonthEvents}
    />
  );
}
