"use client";

import { Grid2x2, Table2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BirthChart } from "@/engine/panchanga/types";
import { RASHI_NAMES } from "./KundaliChart";
import { navamshaRashi } from "./NavamshaChart";
import { dashamshaRashi } from "./DashamshaChart";
import type { ResultView } from "./useKundaliForm";

interface Props {
  chart: BirthChart;
  resultView: ResultView;
  onResultViewChange: (view: ResultView) => void;
}

function TabButton({
  view,
  current,
  onClick,
  title,
  children,
}: {
  view: ResultView;
  current: ResultView;
  onClick: (v: ResultView) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={current === view}
      onClick={() => onClick(view)}
      style={{ touchAction: "manipulation" }}
      title={title}
      aria-label={title}
      className={cn(
        "focus-visible:ring-theme-primary flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
        current === view
          ? "bg-theme-primary-15 text-theme-primary"
          : "text-theme-fg-muted hover:text-theme-fg"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div role="presentation" className="bg-theme-border mx-0.5 h-4 w-px shrink-0" />;
}

export function LagnaSummaryBar({ chart, resultView, onResultViewChange }: Props) {
  return (
    <div className="bg-theme-surface-raised rounded-xl p-4 shadow">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
              Lagna
            </p>
            <p className="text-theme-fg mt-0.5 text-lg font-bold">
              {chart.lagna.rashi.name}
            </p>
            <p className="text-theme-fg-muted text-xs">
              {chart.lagna.degreeInRashi.toFixed(2)}°
            </p>
          </div>
          <div>
            <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
              Nakshatra
            </p>
            <p className="text-theme-fg mt-0.5 font-semibold">
              {chart.lagna.nakshatra.name}
            </p>
            <p className="text-theme-fg-muted text-xs">
              pada {chart.lagna.nakshatra.pada}
            </p>
          </div>
          <div>
            <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
              Chandra Rashi
            </p>
            <p className="text-theme-fg mt-0.5 text-lg font-bold">
              {chart.grahas.chandra.rashi.name}
            </p>
            <p className="text-theme-fg-muted text-xs">
              {chart.grahas.chandra.degreeInRashi.toFixed(2)}°
            </p>
          </div>
          <div>
            <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
              Janma Nakshatra
            </p>
            <p className="text-theme-fg mt-0.5 font-semibold">
              {chart.grahas.chandra.nakshatra.name}
            </p>
            <p className="text-theme-fg-muted text-xs">
              pada {chart.grahas.chandra.nakshatra.pada}
            </p>
          </div>
          <div>
            <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
              Ayanamsa
            </p>
            <p className="text-theme-fg mt-0.5 font-semibold">{chart.ayanamsa.name}</p>
            <p className="text-theme-fg-muted text-xs">
              {chart.ayanamsa.degrees.toFixed(4)}°
            </p>
          </div>
          {(resultView === "d9-chart" || resultView === "d9-table") && (
            <div>
              <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                D9 Lagna
              </p>
              <p className="text-theme-fg mt-0.5 text-lg font-bold">
                {RASHI_NAMES[navamshaRashi(chart.lagna.longitude)]}
              </p>
              <p className="text-theme-fg-muted text-xs">Navamsha</p>
            </div>
          )}
          {(resultView === "d10-chart" || resultView === "d10-table") && (
            <div>
              <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                D10 Lagna
              </p>
              <p className="text-theme-fg mt-0.5 text-lg font-bold">
                {RASHI_NAMES[dashamshaRashi(chart.lagna.longitude)]}
              </p>
              <p className="text-theme-fg-muted text-xs">Dashamsha</p>
            </div>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Horoscoop weergave"
          className="bg-theme-surface border-theme-border flex items-center gap-1 rounded-lg border p-1"
        >
          <TabButton
            view="d1-chart"
            current={resultView}
            onClick={onResultViewChange}
            title="D1 Grafiek"
          >
            <Grid2x2 className="h-3.5 w-3.5" />
            D1
          </TabButton>
          <TabButton
            view="d1-table"
            current={resultView}
            onClick={onResultViewChange}
            title="D1 Tabel"
          >
            <Table2 className="h-3.5 w-3.5" />
          </TabButton>
          <Divider />
          <TabButton
            view="d9-chart"
            current={resultView}
            onClick={onResultViewChange}
            title="D9 Grafiek"
          >
            <Layers className="h-3.5 w-3.5" />
            D9
          </TabButton>
          <TabButton
            view="d9-table"
            current={resultView}
            onClick={onResultViewChange}
            title="D9 Tabel"
          >
            <Table2 className="h-3.5 w-3.5" />
          </TabButton>
          <Divider />
          <TabButton
            view="d10-chart"
            current={resultView}
            onClick={onResultViewChange}
            title="D10 Grafiek"
          >
            <Layers className="h-3.5 w-3.5" />
            D10
          </TabButton>
          <TabButton
            view="d10-table"
            current={resultView}
            onClick={onResultViewChange}
            title="D10 Tabel"
          >
            <Table2 className="h-3.5 w-3.5" />
          </TabButton>
        </div>
      </div>
    </div>
  );
}
