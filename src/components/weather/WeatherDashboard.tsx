"use client";

import { PageLayout } from "@/components/layout";
import { AirQualityCard } from "@/components/weather/AirQualityCard";
import { CurrentWeatherCard } from "@/components/weather/CurrentWeatherCard";
import { DailyForecastSection } from "@/components/weather/DailyForecastSection";
import { FutureHourlySection } from "@/components/weather/FutureHourlySection";
import { TemperatureChart } from "@/components/weather/TemperatureChart";
import { TodayHourlySection } from "@/components/weather/TodayHourlySection";
import { WeatherAlerts } from "@/components/weather/WeatherAlerts";
import { WeatherAstronomyCards } from "@/components/weather/WeatherAstronomyCards";
import { WeatherErrorState } from "@/components/weather/WeatherErrorState";
import { WeatherHeader } from "@/components/weather/WeatherHeader";
import { WeatherSkeleton } from "@/components/weather/WeatherSkeleton";
import { useWeather } from "@/hooks/useWeather";
import { prepareWeatherDashboardData } from "@/lib/weather";
import dynamic from "next/dynamic";

const WeatherMap = dynamic(() => import("@/components/weather/WeatherMap"), {
  ssr: false,
  loading: () => (
    <div className="border-theme-border bg-theme-bg-muted h-64 w-full animate-pulse rounded-3xl border" />
  ),
});

export function WeatherDashboard() {
  const { weather, loading, error, lastUpdated, refreshing, refresh, retry } =
    useWeather();

  if (loading) return <WeatherSkeleton />;
  if (error) return <WeatherErrorState error={error} onRetry={retry} />;
  if (!weather) return null;

  const {
    current,
    hourly,
    daily,
    alerts,
    timezone_offset: timezoneOffset,
    air_quality: airQuality,
  } = weather;
  // eslint-disable-next-line react-hooks/purity -- stable enough for local-day bucketing during a render pass
  const nowUnix = Math.floor(Date.now() / 1000);
  const { today, todayHourlyInterp, futureItems, allMin, tempRange } =
    prepareWeatherDashboardData(weather, nowUnix);

  return (
    <PageLayout spacing>
      <h1 className="sr-only">Weer — {weather.location}</h1>

      <WeatherHeader
        location={weather.location}
        country={weather.country}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      <WeatherAlerts alerts={alerts} timezoneOffset={timezoneOffset} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_272px]">
        <CurrentWeatherCard current={current} today={today} />
        <WeatherAstronomyCards
          current={current}
          today={today}
          timezoneOffset={timezoneOffset}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {airQuality && <AirQualityCard aq={airQuality} />}
        <div className="relative z-0 min-h-[300px] w-full">
          <WeatherMap
            lat={current.coord.lat}
            lon={current.coord.lon}
            layer="precipitation_new"
            className="absolute inset-0"
          />
        </div>
      </div>

      <TodayHourlySection hourly={todayHourlyInterp} timezoneOffset={timezoneOffset} />

      {hourly.length >= 2 && (
        <TemperatureChart
          hourly={hourly}
          daily={daily}
          timezoneOffset={timezoneOffset}
          nowUnix={nowUnix}
        />
      )}

      <DailyForecastSection
        daily={daily}
        timezoneOffset={timezoneOffset}
        allMin={allMin}
        tempRange={tempRange}
        nowUnix={nowUnix}
      />

      <FutureHourlySection items={futureItems} timezoneOffset={timezoneOffset} />
    </PageLayout>
  );
}
