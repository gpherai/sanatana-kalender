"use client";

import { cn } from "@/lib/utils";
import { aqiBadgeClass, aqiDesc, aqiDotClass, aqiLabel } from "@/lib/weather";
import { Chem, KpiBadge, SectionTitle } from "@/components/weather/WeatherPrimitives";
import type { AirQuality } from "@/types/weather";

export function AirQualityCard({ aq }: { aq: AirQuality }) {
  const { aqi, components: c } = aq;
  const label = aqiLabel(aqi);
  const desc = aqiDesc(aqi);
  const badge = aqiBadgeClass(aqi);
  const dot = aqiDotClass(aqi);

  return (
    <div>
      <SectionTitle>Luchtkwaliteit</SectionTitle>
      <div className="theme-card p-5">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn("h-3 w-3 shrink-0 rounded-full", dot)}
              aria-hidden="true"
            />
            <span className={cn("rounded-full px-3 py-1 text-sm font-bold", badge)}>
              {label}
            </span>
            <span className="text-theme-fg-muted text-xs">AQI {aqi}/5</span>
          </div>
          <p className="text-theme-fg-muted ml-auto hidden text-xs sm:block">{desc}</p>
        </div>
        <p className="text-theme-fg-muted mb-4 text-xs sm:hidden">{desc}</p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <KpiBadge
            icon={<Chem>PM</Chem>}
            label="PM2.5"
            value={`${c.pm2_5.toFixed(1)} µg/m³`}
            valueClass={
              c.pm2_5 > 25
                ? "text-orange-500 dark:text-orange-400"
                : c.pm2_5 > 15
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-theme-fg"
            }
            hint={c.pm2_5 > 25 ? "Hoog" : c.pm2_5 > 15 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>PM</Chem>}
            label="PM10"
            value={`${c.pm10.toFixed(1)} µg/m³`}
            valueClass={
              c.pm10 > 90
                ? "text-orange-500 dark:text-orange-400"
                : c.pm10 > 45
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-theme-fg"
            }
            hint={c.pm10 > 90 ? "Hoog" : c.pm10 > 45 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>NO₂</Chem>}
            label="Stikstofdioxide"
            value={`${c.no2.toFixed(1)} µg/m³`}
            valueClass={
              c.no2 > 200
                ? "text-red-500 dark:text-red-400"
                : c.no2 > 40
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-theme-fg"
            }
            hint={c.no2 > 200 ? "Hoog" : c.no2 > 40 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>O₃</Chem>}
            label="Ozon"
            value={`${c.o3.toFixed(1)} µg/m³`}
            valueClass={
              c.o3 > 180
                ? "text-red-500 dark:text-red-400"
                : c.o3 > 120
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-theme-fg"
            }
            hint={c.o3 > 180 ? "Hoog" : c.o3 > 120 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>SO₂</Chem>}
            label="Zwaveldioxide"
            value={`${c.so2.toFixed(1)} µg/m³`}
            valueClass={
              c.so2 > 350
                ? "text-red-500 dark:text-red-400"
                : c.so2 > 40
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-theme-fg"
            }
            hint={c.so2 > 350 ? "Hoog" : c.so2 > 40 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>CO</Chem>}
            label="Koolmonoxide"
            value={`${(c.co / 1000).toFixed(1)} mg/m³`}
            valueClass={
              c.co > 10000
                ? "text-red-500 dark:text-red-400"
                : c.co > 4000
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-theme-fg"
            }
            hint={c.co > 10000 ? "Hoog" : c.co > 4000 ? "Verhoogd" : undefined}
          />
        </div>
      </div>
    </div>
  );
}
