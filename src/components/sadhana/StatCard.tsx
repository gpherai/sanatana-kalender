import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  sub,
  progress,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex items-center justify-center rounded-xl p-1.5",
            !accent && "bg-theme-primary-10 text-theme-primary"
          )}
          style={
            accent
              ? {
                  background: "color-mix(in oklch, var(--theme-accent) 12%, transparent)",
                  color: "var(--theme-accent)",
                }
              : undefined
          }
        >
          {icon}
        </div>
        <span className="text-theme-fg-secondary text-sm font-medium">{label}</span>
      </div>
      <div
        className="text-xl font-bold tabular-nums sm:text-3xl"
        style={{ color: accent ? "var(--theme-accent)" : "var(--theme-stat-value)" }}
      >
        {value}
      </div>
      {sub && <div className="text-theme-fg-secondary mt-1 text-sm">{sub}</div>}
      {progress !== undefined && (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full"
          style={{ background: "color-mix(in oklch, var(--theme-fg) 10%, transparent)" }}
        >
          <div
            className="h-full rounded-full motion-safe:transition-all motion-safe:duration-500"
            style={{
              width: `${Math.min(100, Math.round(progress * 100))}%`,
              background: accent ? "var(--theme-accent)" : "var(--theme-primary)",
            }}
          />
        </div>
      )}
    </div>
  );
}
