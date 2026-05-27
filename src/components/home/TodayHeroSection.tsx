import { DateTime } from "luxon";
import { TodayHero } from "@/components/ui/TodayHero";
import { transformToApiResponse } from "@/lib/api-transformers";
import { DEFAULT_LOCATION } from "@/lib/domain";
import {
  dbDateToLocationDay,
  occurrenceOverlapsDay,
  type UpcomingOccurrence,
} from "@/services/home.service";
import type { DailyPanchangaFull } from "@/engine/panchanga";
import type { WeatherApiResponse } from "@/types/weather";

interface Props {
  panchangaPromise: Promise<DailyPanchangaFull>;
  eventsPromise: Promise<UpcomingOccurrence[]>;
  weatherPromise: Promise<WeatherApiResponse | null>;
  today: DateTime;
}

export async function TodayHeroSection({
  panchangaPromise,
  eventsPromise,
  weatherPromise,
  today,
}: Props) {
  const [rawPanchanga, upcomingEvents, weatherDash] = await Promise.all([
    panchangaPromise,
    eventsPromise,
    weatherPromise,
  ]);

  const todayEvents = upcomingEvents
    .filter((occ) => occurrenceOverlapsDay(occ, today, DEFAULT_LOCATION.timezone))
    .map((occ) => ({
      id: occ.event.id,
      name: occ.event.name,
      category: occ.event.categories[0]?.category ?? null,
      eventType: occ.event.eventType,
      date: dbDateToLocationDay(occ.date, DEFAULT_LOCATION.timezone).toISODate()!,
    }));

  return (
    <TodayHero
      dailyInfo={transformToApiResponse(rawPanchanga)}
      todayEvents={todayEvents}
      currentWeather={weatherDash?.current ?? null}
    />
  );
}
