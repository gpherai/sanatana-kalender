"use client";

import { useMemo } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BirthChart, GrahaKey } from "@/engine/panchanga/types";
import { GRAHA_SYMBOL, GRAHA_COLOR, GRAHA_SHORT, RASHI_NAMES } from "./KundaliChart";
import { calcAspects, type GrahaAspect } from "./graha-aspects";

const ASPECTOR_ORDER: GrahaKey[] = [
  "surya",
  "chandra",
  "mangala",
  "budha",
  "guru",
  "shukra",
  "shani",
  "rahu",
  "ketu",
];

function AspectedPill({ asp }: { asp: GrahaAspect }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs",
        asp.isSpecial
          ? "bg-theme-primary/10 text-theme-primary"
          : "bg-theme-surface text-theme-fg-secondary"
      )}
    >
      <span style={{ color: GRAHA_COLOR[asp.aspected] }} className="leading-none">
        {GRAHA_SYMBOL[asp.aspected]}
      </span>
      <span className="font-medium">{GRAHA_SHORT[asp.aspected]}</span>
      <span className="text-theme-fg-muted text-[10px]">({asp.label})</span>
      {asp.isMutual && (
        <span className="text-[10px] opacity-70" title="Wederzijds aspect">
          ↔
        </span>
      )}
    </span>
  );
}

export function GrahaAspects({ chart }: { chart: BirthChart }) {
  const { aspects, conjunctions } = useMemo(() => calcAspects(chart.grahas), [chart]);

  const byAspector = useMemo(() => {
    const map = new Map<GrahaKey, GrahaAspect[]>();
    for (const asp of aspects) {
      const list = map.get(asp.aspector) ?? [];
      list.push(asp);
      map.set(asp.aspector, list);
    }
    return map;
  }, [aspects]);

  const activeAspectors = ASPECTOR_ORDER.filter((k) => byAspector.has(k));

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary/10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Eye className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-theme-fg text-sm font-semibold">Graha Drishti</h2>
          <p className="text-theme-fg-muted text-xs">Planetaire aspecten & conjuncties</p>
        </div>
      </div>

      {/* Aspects */}
      {activeAspectors.length === 0 ? (
        <p className="text-theme-fg-muted text-sm">Geen inter-planetaire aspecten.</p>
      ) : (
        <div className="space-y-2">
          {activeAspectors.map((aspectorKey) => {
            const aspList = byAspector.get(aspectorKey)!;
            return (
              <div key={aspectorKey} className="flex items-start gap-2">
                <div className="flex w-16 shrink-0 items-center gap-1 pt-0.5">
                  <span
                    className="text-base leading-none"
                    style={{ color: GRAHA_COLOR[aspectorKey] }}
                  >
                    {GRAHA_SYMBOL[aspectorKey]}
                  </span>
                  <span className="text-theme-fg-muted text-xs">
                    {GRAHA_SHORT[aspectorKey]}
                  </span>
                </div>
                <span className="text-theme-fg-muted mt-0.5 shrink-0 text-xs">→</span>
                <div className="flex flex-wrap gap-1.5">
                  {aspList.map((asp) => (
                    <AspectedPill key={asp.aspected + asp.label} asp={asp} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conjunctions */}
      {conjunctions.length > 0 && (
        <div className="border-theme-border mt-4 border-t pt-4">
          <p className="text-theme-fg-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            Conjuncties
          </p>
          <div className="flex flex-wrap gap-2">
            {conjunctions.map((conj) => (
              <div
                key={conj.rashi}
                className="bg-theme-surface flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              >
                {conj.grahas.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    {i > 0 && <span className="text-theme-fg-muted text-[10px]">+</span>}
                    <span
                      className="text-sm leading-none"
                      style={{ color: GRAHA_COLOR[k] }}
                    >
                      {GRAHA_SYMBOL[k]}
                    </span>
                    <span className="text-theme-fg text-xs font-medium">
                      {GRAHA_SHORT[k]}
                    </span>
                  </span>
                ))}
                <span className="text-theme-fg-muted ml-1 text-[10px]">
                  in {RASHI_NAMES[conj.rashi]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-theme-fg-muted mt-4 text-xs">
        Speciaal: <span className="text-theme-primary">blauw</span> · ♂ 4e/8e · ♃ 5e/9e ·
        ♄ 3e/10e · alle planeten 7e · ↔ wederzijds
      </p>
    </div>
  );
}
