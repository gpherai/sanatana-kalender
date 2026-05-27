"use client";

import { PageLayout } from "@/components/layout";
import { Star, TriangleAlert } from "lucide-react";
import { KundaliChart } from "@/components/kundali/KundaliChart";
import { NavamshaChart } from "@/components/kundali/NavamshaChart";
import { VimshottariDasha } from "@/components/kundali/VimshottariDasha";
import { GrahaAspects } from "@/components/kundali/GrahaAspects";
import { DashamshaChart } from "@/components/kundali/DashamshaChart";
import { useKundaliForm } from "@/components/kundali/useKundaliForm";
import { KundaliForm } from "@/components/kundali/KundaliForm";
import { LagnaSummaryBar } from "@/components/kundali/LagnaSummaryBar";
import { JanmaPanchanga } from "@/components/kundali/JanmaPanchanga";
import {
  D1GrahaTable,
  D9GrahaTable,
  D10GrahaTable,
} from "@/components/kundali/GrahaTable";

export default function KundaliPage() {
  const {
    form,
    loading,
    error,
    chart,
    resultView,
    setResultView,
    hasSaved,
    setField,
    clearSaved,
    handleSubmit,
  } = useKundaliForm();

  return (
    <PageLayout width="medium" spacing>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star className="text-theme-primary h-6 w-6" />
        <div>
          <h1 className="text-theme-fg text-2xl font-bold">Kundali</h1>
          <p className="text-theme-fg-muted text-sm">
            Geboortehoroscoop — Jyotisha (Lahiri ayanamsa · Whole Sign huizen · Mean Node)
          </p>
        </div>
      </div>

      <KundaliForm
        form={form}
        loading={loading}
        hasSaved={hasSaved}
        onFieldChange={setField}
        onSubmit={handleSubmit}
        onClearSaved={clearSaved}
      />

      {/* Error */}
      {error && (
        <div className="border-theme-error flex items-start gap-3 rounded-xl border bg-[var(--theme-error-bg)] p-4">
          <TriangleAlert className="text-theme-error mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm text-[var(--theme-error-fg)]">{error}</p>
        </div>
      )}

      {/* Result */}
      {chart && (
        <div className="space-y-6">
          <LagnaSummaryBar
            chart={chart}
            resultView={resultView}
            onResultViewChange={setResultView}
          />

          <JanmaPanchanga chart={chart} />

          {resultView === "d1-chart" && (
            <div className="mx-auto w-full max-w-2xl">
              <KundaliChart chart={chart} />
            </div>
          )}

          {resultView === "d1-table" && <D1GrahaTable chart={chart} />}

          {resultView === "d9-chart" && (
            <div className="mx-auto w-full max-w-2xl">
              <NavamshaChart chart={chart} />
            </div>
          )}

          {resultView === "d9-table" && <D9GrahaTable chart={chart} />}

          {resultView === "d10-chart" && (
            <div className="mx-auto w-full max-w-2xl">
              <DashamshaChart chart={chart} />
            </div>
          )}

          {resultView === "d10-table" && <D10GrahaTable chart={chart} />}

          <GrahaAspects chart={chart} />

          <VimshottariDasha chart={chart} />

          <details className="text-theme-fg-muted text-xs">
            <summary className="focus-visible:ring-theme-primary cursor-pointer rounded focus-visible:ring-2 focus-visible:outline-none">
              Technische details
            </summary>
            <div className="mt-2 space-y-1 font-mono">
              <p>Julian Day: {chart.julianDay.toFixed(8)}</p>
              <p>
                Geboorte UTC:{" "}
                {new Date((chart.julianDay - 2440587.5) * 86400000).toISOString()}
              </p>
              <p>Ayanamsa: {chart.ayanamsa.degrees.toFixed(8)}°</p>
            </div>
          </details>
        </div>
      )}
    </PageLayout>
  );
}
