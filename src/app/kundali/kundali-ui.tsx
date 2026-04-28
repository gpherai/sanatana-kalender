"use client";

import { cn } from "@/lib/utils";
import type { BirthChart, GrahaKey } from "@/server/panchanga/types";
import { RASHI_NAMES } from "./KundaliChart";
import { navamshaDegree, navamshaRashi } from "./NavamshaChart";
import { dashamshaDegree, dashamshaRashi } from "./DashamshaChart";
import {
  getGrahaDignity,
  DIGNITY_LABEL,
  GRAHA_ORDER,
  GRAHA_SYMBOL,
  DIGNITY_STYLE,
} from "./graha-dignity";

export { GRAHA_ORDER };

// =============================================================================
// HELPERS
// =============================================================================

function formatDeg(deg: number): string {
  const d = Math.floor(deg);
  const mFull = (deg - d) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  return `${d}°${m.toString().padStart(2, "0")}'${s.toString().padStart(2, "0")}"`;
}

function formatLon(lon: number): string {
  const inSign = lon % 30;
  return `${formatDeg(inSign)} (${lon.toFixed(2)}°)`;
}

// =============================================================================
// FORM PRIMITIVES
// =============================================================================

export function FormField({
  label,
  children,
  hint,
  id,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-theme-fg-muted text-xs">{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "border-theme-border bg-theme-surface text-theme-fg rounded-lg border px-3 py-2 text-sm " +
        "focus:border-theme-primary focus:ring-theme-primary-20 focus:ring-2 focus:outline-none " +
        (props.className ?? "")
      }
    />
  );
}

// =============================================================================
// GRAHA TABLE ROWS
// =============================================================================

export function GrahaRow({ grahaKey, chart }: { grahaKey: GrahaKey; chart: BirthChart }) {
  const g = chart.grahas[grahaKey];
  if (!g) return null;

  const dignity = getGrahaDignity(grahaKey, g.rashi.number, g.degreeInRashi);

  return (
    <tr className="border-theme-border border-b last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-theme-primary w-5 text-center text-base">
            {GRAHA_SYMBOL[grahaKey]}
          </span>
          <span className="text-theme-fg font-semibold">{g.name}</span>
          {g.retrograde && (
            <span
              className="text-theme-fg-muted rounded border border-current px-1 text-[10px]"
              title="Retrograde"
            >
              R
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-theme-fg font-medium">{g.rashi.name}</span>
          <span className="text-theme-fg-muted text-xs">
            {g.degreeInRashi.toFixed(2)}°
          </span>
          {dignity && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                DIGNITY_STYLE[dignity]
              )}
            >
              {DIGNITY_LABEL[dignity]}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className="text-theme-fg">{g.nakshatra.name}</span>
        <span className="text-theme-fg-muted ml-1 text-xs">pada {g.nakshatra.pada}</span>
      </td>
      <td className="py-3 pr-4 text-right">
        <span className="text-theme-fg-muted font-mono text-xs">
          {formatLon(g.longitude)}
        </span>
      </td>
      <td className="py-3 text-right">
        <span
          className={cn(
            "font-mono text-xs",
            g.retrograde ? "text-theme-error" : "text-theme-fg-muted"
          )}
        >
          {g.speed >= 0 ? "+" : ""}
          {g.speed.toFixed(3)}°/d
        </span>
      </td>
    </tr>
  );
}

export function NavamshaTableRow({
  grahaKey,
  chart,
}: {
  grahaKey: GrahaKey;
  chart: BirthChart;
}) {
  const g = chart.grahas[grahaKey];
  if (!g) return null;

  const d9Rashi = navamshaRashi(g.longitude);
  const d9Deg = navamshaDegree(g.longitude);
  const d9Dignity = getGrahaDignity(grahaKey, d9Rashi, d9Deg);

  return (
    <tr className="border-theme-border border-b last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-theme-primary w-5 text-center text-base">
            {GRAHA_SYMBOL[grahaKey]}
          </span>
          <span className="text-theme-fg font-semibold">{g.name}</span>
          {g.retrograde && (
            <span className="text-theme-fg-muted rounded border border-current px-1 text-[10px]">
              R
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className="text-theme-fg-muted">{g.rashi.name}</span>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-theme-fg font-medium">{RASHI_NAMES[d9Rashi]}</span>
          {d9Dignity && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                DIGNITY_STYLE[d9Dignity]
              )}
            >
              {DIGNITY_LABEL[d9Dignity]}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 text-right">
        <span className="text-theme-fg-muted font-mono text-xs">{d9Deg.toFixed(2)}°</span>
      </td>
    </tr>
  );
}

export function DashamshaTableRow({
  grahaKey,
  chart,
}: {
  grahaKey: GrahaKey;
  chart: BirthChart;
}) {
  const g = chart.grahas[grahaKey];
  if (!g) return null;

  const d10Rashi = dashamshaRashi(g.longitude);
  const d10Deg = dashamshaDegree(g.longitude);
  const d10Dignity = getGrahaDignity(grahaKey, d10Rashi, d10Deg);

  return (
    <tr className="border-theme-border border-b last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-theme-primary w-5 text-center text-base">
            {GRAHA_SYMBOL[grahaKey]}
          </span>
          <span className="text-theme-fg font-semibold">{g.name}</span>
          {g.retrograde && (
            <span className="text-theme-fg-muted rounded border border-current px-1 text-[10px]">
              R
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className="text-theme-fg-muted">{g.rashi.name}</span>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-theme-fg font-medium">{RASHI_NAMES[d10Rashi]}</span>
          {d10Dignity && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                DIGNITY_STYLE[d10Dignity]
              )}
            >
              {DIGNITY_LABEL[d10Dignity]}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 text-right">
        <span className="text-theme-fg-muted font-mono text-xs">
          {d10Deg.toFixed(2)}°
        </span>
      </td>
    </tr>
  );
}
