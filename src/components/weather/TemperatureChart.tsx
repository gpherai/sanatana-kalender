"use client";

import { useId } from "react";
import { SectionTitle } from "@/components/weather/WeatherPrimitives";
import { dayKey, fmtDayShort, roundWeather as r } from "@/lib/weather";
import type { DailyWeather, HourlyWeather } from "@/types/weather";

interface TemperatureChartProps {
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  timezoneOffset: number;
  nowUnix: number;
}

export function TemperatureChart({
  hourly,
  daily,
  timezoneOffset: tz,
  nowUnix,
}: TemperatureChartProps) {
  const gradId = `weerTempGrad${useId().replace(/:/g, "")}`;
  const W = 800;
  const H = 188;
  const PAD = { l: 36, r: 14, t: 22, b: 32 };
  const pw = W - PAD.l - PAD.r;
  const ph = H - PAD.t - PAD.b;
  const n = hourly.length;
  if (n < 2) return null;

  const allTemps = hourly.flatMap((h) => [h.temp, h.feels_like]);
  const rawMin = Math.min(...allTemps);
  const rawMax = Math.max(...allTemps);
  const minT = Math.floor(rawMin) - 2;
  const maxT = Math.ceil(rawMax) + 2;
  const tRange = maxT - minT;

  const xOf = (i: number) => PAD.l + (i / (n - 1)) * pw;
  const yOf = (t: number) => PAD.t + (1 - (t - minT) / tRange) * ph;

  const tempPts = hourly
    .map((h, i) => `${xOf(i).toFixed(1)},${yOf(h.temp).toFixed(1)}`)
    .join(" ");
  const feelsPts = hourly
    .map((h, i) => `${xOf(i).toFixed(1)},${yOf(h.feels_like).toFixed(1)}`)
    .join(" ");

  const areaD = [
    `M ${PAD.l.toFixed(1)} ${(PAD.t + ph).toFixed(1)}`,
    ...hourly.map((h, i) => `L ${xOf(i).toFixed(1)} ${yOf(h.temp).toFixed(1)}`),
    `L ${(PAD.l + pw).toFixed(1)} ${(PAD.t + ph).toFixed(1)} Z`,
  ].join(" ");

  const gridStep = tRange <= 16 ? 2 : tRange <= 30 ? 5 : 10;
  const gridLines: number[] = [];
  for (let t = Math.ceil(minT / gridStep) * gridStep; t <= maxT; t += gridStep) {
    gridLines.push(t);
  }

  const separators: { xi: number; label: string }[] = [];
  let prevKey = "";
  hourly.forEach((h, i) => {
    const k = dayKey(h.dt, tz);
    if (k !== prevKey) {
      if (prevKey && i > 0) {
        separators.push({ xi: xOf(i), label: fmtDayShort(h.dt, tz, nowUnix) });
      }
      prevKey = k;
    }
  });

  const dailyMarkers = daily
    .slice(0, 6)
    .map((d) => {
      const dayK = dayKey(d.dt, tz);
      const indices = hourly
        .map((h, i) => ({ h, i }))
        .filter(({ h }) => dayKey(h.dt, tz) === dayK)
        .map(({ i }) => i);
      if (indices.length === 0) return null;
      const midIdx = indices[Math.floor(indices.length / 2)]!;
      return {
        xi: xOf(midIdx),
        yMax: yOf(d.temp.max),
        yMin: yOf(d.temp.min),
        tMax: r(d.temp.max),
        tMin: r(d.temp.min),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <div>
      <SectionTitle>Temperatuurverloop · komende 5 dagen</SectionTitle>
      <div className="bg-theme-surface border-theme-border overflow-hidden rounded-2xl border shadow-sm">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ display: "block", height: "auto" }}
          aria-label="Temperatuurverloop grafiek"
          role="img"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map((t) => (
            <g key={t}>
              <line
                x1={PAD.l}
                y1={yOf(t).toFixed(1)}
                x2={W - PAD.r}
                y2={yOf(t).toFixed(1)}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="4 4"
                className="text-theme-border-subtle"
              />
              <text
                x={PAD.l - 5}
                y={yOf(t).toFixed(1)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="currentColor"
                style={{ fontSize: 9, fontVariantNumeric: "tabular-nums" }}
                className="text-theme-fg-muted"
              >
                {t}°
              </text>
            </g>
          ))}

          {separators.map(({ xi, label }) => (
            <g key={xi}>
              <line
                x1={xi.toFixed(1)}
                y1={PAD.t}
                x2={xi.toFixed(1)}
                y2={PAD.t + ph}
                stroke="currentColor"
                strokeWidth="0.75"
                className="text-theme-border-subtle"
              />
              <text
                x={(xi + 5).toFixed(1)}
                y={(PAD.t + ph + 18).toFixed(1)}
                fill="currentColor"
                style={{ fontSize: 9 }}
                className="text-theme-fg-muted"
              >
                {label}
              </text>
            </g>
          ))}

          <path d={areaD} fill={`url(#${gradId})`} />

          <polyline
            points={feelsPts}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polyline
            points={tempPts}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {dailyMarkers.map(({ xi, yMax, yMin, tMax, tMin }) => (
            <g key={xi}>
              <circle
                cx={xi.toFixed(1)}
                cy={yMax.toFixed(1)}
                r="3"
                fill="#f97316"
                opacity="0.7"
              />
              <text
                x={xi.toFixed(1)}
                y={(yMax - 7).toFixed(1)}
                textAnchor="middle"
                fill="#f97316"
                style={{ fontSize: 10, fontWeight: 600 }}
                opacity="0.85"
              >
                {tMax}°
              </text>
              <circle
                cx={xi.toFixed(1)}
                cy={yMin.toFixed(1)}
                r="3"
                fill="#60a5fa"
                opacity="0.7"
              />
              <text
                x={xi.toFixed(1)}
                y={(yMin + 13).toFixed(1)}
                textAnchor="middle"
                fill="#60a5fa"
                style={{ fontSize: 10, fontWeight: 600 }}
                opacity="0.85"
              >
                {tMin}°
              </text>
            </g>
          ))}
        </svg>

        <div className="border-theme-border text-theme-fg-muted flex flex-wrap gap-x-5 gap-y-1 border-t px-4 py-2.5 text-xs">
          <span className="flex items-center gap-2">
            <span className="block h-0.5 w-5 rounded-full bg-orange-400" />
            Temperatuur
          </span>
          <span className="flex items-center gap-2">
            <svg width="20" height="6" aria-hidden="true">
              <line
                x1="0"
                y1="3"
                x2="20"
                y2="3"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>
            Gevoelstemperatuur
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400 opacity-70" />
            Dagmax
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400 opacity-70" />
            Dagmin
          </span>
        </div>
      </div>
    </div>
  );
}
