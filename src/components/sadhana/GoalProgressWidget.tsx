import { Target, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { goalProgressRatio, isGoalComplete, type Goal } from "./types";

export function GoalProgressWidget({
  goals,
  onGoToSettings,
}: {
  goals: Goal[];
  onGoToSettings: () => void;
}) {
  const activeGoals = goals.filter((g) => g.active);
  if (activeGoals.length === 0) return null;

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
            <Target className="h-4 w-4" />
          </div>
          <h2 className="text-theme-fg text-sm font-semibold">Doelen</h2>
        </div>
        <button
          onClick={onGoToSettings}
          className="text-theme-fg-muted hover:text-theme-primary flex cursor-pointer items-center gap-1 text-xs transition-colors"
        >
          Beheer
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-3">
        {activeGoals.map((g) => {
          const progress = goalProgressRatio(g);
          const pct = Math.round(progress * 100);
          const done = isGoalComplete(g);

          return (
            <div key={g.id}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {done ? (
                    <CheckCircle2 className="text-theme-success h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Target className="text-theme-fg-muted h-3.5 w-3.5 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 truncate text-sm font-medium",
                      done ? "text-theme-success" : "text-theme-fg"
                    )}
                  >
                    {g.name ?? g.type}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      done ? "text-theme-success" : "text-theme-fg-muted"
                    )}
                  >
                    {g.progress_malas ?? 0} / {g.target_malas} malas
                  </span>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      done ? "text-theme-success" : "text-theme-fg-muted"
                    )}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-theme-hover h-1.5 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${done ? "bg-theme-success" : "bg-theme-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
