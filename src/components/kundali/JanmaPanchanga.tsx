import type { BirthChart } from "@/engine/panchanga/types";

interface Props {
  chart: BirthChart;
}

export function JanmaPanchanga({ chart }: Props) {
  return (
    <div className="bg-theme-surface-raised rounded-xl px-6 py-4 shadow">
      <p className="text-theme-fg-muted mb-3 text-xs font-semibold tracking-wide uppercase">
        Janma Panchanga
      </p>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <p className="text-theme-fg-muted text-xs">Vara</p>
          <p className="text-theme-fg mt-0.5 font-semibold">
            {chart.janmaPanchanga.vara.name}
          </p>
        </div>
        <div>
          <p className="text-theme-fg-muted text-xs">Tithi</p>
          <p className="text-theme-fg mt-0.5 font-semibold">
            {chart.janmaPanchanga.tithi.name}
          </p>
          <p className="text-theme-fg-muted text-xs">
            {chart.janmaPanchanga.tithi.paksha} · #{chart.janmaPanchanga.tithi.number}
          </p>
        </div>
        <div>
          <p className="text-theme-fg-muted text-xs">Nakshatra</p>
          <p className="text-theme-fg mt-0.5 font-semibold">
            {chart.janmaPanchanga.nakshatra.name}
          </p>
          <p className="text-theme-fg-muted text-xs">
            pada {chart.janmaPanchanga.nakshatra.pada}
          </p>
        </div>
        <div>
          <p className="text-theme-fg-muted text-xs">Yoga</p>
          <p className="text-theme-fg mt-0.5 font-semibold">
            {chart.janmaPanchanga.yoga.name}
          </p>
          <p className="text-theme-fg-muted text-xs">
            #{chart.janmaPanchanga.yoga.number}
          </p>
        </div>
        <div>
          <p className="text-theme-fg-muted text-xs">Karana</p>
          <p className="text-theme-fg mt-0.5 font-semibold">
            {chart.janmaPanchanga.karana.name}
          </p>
        </div>
      </div>
    </div>
  );
}
