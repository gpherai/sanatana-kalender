export function StatCard({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
}) {
  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-theme-primary">{icon}</div>
        <span className="text-theme-fg-secondary text-sm font-medium">{label}</span>
      </div>
      <div className="text-theme-fg text-xl font-bold tabular-nums sm:text-3xl">
        {value}
      </div>
      {sub && <div className="text-theme-fg-secondary mt-1 text-sm">{sub}</div>}
      {progress !== undefined && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full"
          style={{ background: "color-mix(in oklch, var(--theme-fg) 12%, transparent)" }}
        >
          <div
            className="bg-theme-primary h-full rounded-full motion-safe:transition-all motion-safe:duration-500"
            style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}
