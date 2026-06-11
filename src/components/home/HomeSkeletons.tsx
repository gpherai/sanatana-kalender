export function TodayHeroSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="bg-theme-surface-raised animate-pulse rounded-3xl shadow-2xl"
    >
      <div className="p-6 md:p-8">
        {/* Top row: date + time */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="bg-theme-border mb-2 h-4 w-48 rounded" />
            <div className="bg-theme-border h-12 w-64 rounded-lg md:h-14" />
          </div>
          <div className="shrink-0 text-right">
            <div className="bg-theme-border h-10 w-24 rounded-lg md:h-12" />
            <div className="bg-theme-border mt-2 h-3 w-20 rounded" />
          </div>
        </div>

        {/* Panchanga grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-theme-surface-hover rounded-xl p-3">
              <div className="bg-theme-border mb-2 h-3 w-16 rounded" />
              <div className="bg-theme-border h-5 w-24 rounded" />
            </div>
          ))}
        </div>

        {/* Sun/moon row */}
        <div className="mt-4 flex gap-4">
          <div className="bg-theme-border h-4 w-28 rounded" />
          <div className="bg-theme-border h-4 w-28 rounded" />
        </div>

        {/* Muhurta grid (added to match height of actual hero) */}
        <div className="mt-6">
          <div className="bg-theme-border mb-2 h-3 w-16 rounded" />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`m-${i}`}
                className="bg-theme-surface-hover rounded-xl p-2.5 sm:p-3"
              >
                <div className="bg-theme-border mb-1 h-3 w-20 rounded" />
                <div className="bg-theme-border h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Events strip */}
        <div className="mt-5 flex gap-2">
          <div className="bg-theme-surface-hover h-7 w-32 rounded-full" />
          <div className="bg-theme-surface-hover h-7 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function UpcomingEventsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="bg-theme-surface-raised animate-pulse rounded-2xl p-5 shadow-lg"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-border h-6 w-6 rounded" />
        <div className="bg-theme-border h-5 w-32 rounded" />
      </div>

      {/* Event rows */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3">
            <div className="bg-theme-border h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="bg-theme-border mb-1.5 h-4 w-36 rounded" />
              <div className="bg-theme-border/60 h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="bg-theme-surface-raised animate-pulse rounded-2xl p-5 shadow-lg"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-border h-6 w-6 rounded" />
        <div className="bg-theme-border h-5 w-24 rounded" />
      </div>

      {/* Category pills — matches actual flex-wrap layout to prevent CLS */}
      <div className="flex flex-wrap gap-1.5">
        {[56, 72, 64, 80, 60, 68, 76, 52].map((w, i) => (
          <div
            key={i}
            className="border-theme-border bg-theme-border/30 h-7 rounded-full border"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
    </div>
  );
}
