"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiBadge({
  icon,
  label,
  value,
  valueClass,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  /** Text indicator for elevated values - keeps status non-color-only */
  hint?: string;
}) {
  return (
    <div className="bg-theme-bg-subtle rounded-xl px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <span className="text-theme-fg-muted text-[10px] leading-none font-medium">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "text-sm leading-none font-bold tabular-nums",
          valueClass ?? "text-theme-fg"
        )}
      >
        {value}
        {hint && <span className="ml-1 text-[10px] font-semibold">{hint}</span>}
      </p>
    </div>
  );
}

export function SideRow({
  icon,
  label,
  value,
  muted,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs",
          muted ? "text-theme-fg-muted" : "text-theme-fg-secondary"
        )}
      >
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          muted ? "text-theme-fg-secondary" : "text-theme-fg"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-theme-fg-muted mb-3 text-[10px] font-bold tracking-[0.12em] uppercase">
      {children}
    </h2>
  );
}

export function HourlyDetailStat({
  icon,
  label,
  value,
  compact,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-theme-bg-subtle rounded-lg text-left",
        compact ? "px-1.5 py-1" : "px-2 py-1.5"
      )}
    >
      <div
        className={cn(
          "text-theme-fg-muted mb-1 flex items-center gap-1",
          compact ? "text-[9px]" : "text-[10px]"
        )}
      >
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "text-theme-fg font-semibold tabular-nums",
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function Chem({ children }: { children: string }) {
  return (
    <div className="flex h-4 w-4 shrink-0 items-center justify-center">
      <span className="text-theme-fg-muted text-[9px] leading-none font-bold tabular-nums">
        {children}
      </span>
    </div>
  );
}
