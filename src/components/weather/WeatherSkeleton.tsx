"use client";

import { PageLayout } from "@/components/layout";
import { cn } from "@/lib/utils";

function Pulse({ className }: { className: string }) {
  return <div className={cn("bg-theme-bg-subtle animate-pulse rounded", className)} />;
}

export function WeatherSkeleton() {
  return (
    <PageLayout spacing>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pulse className="h-4 w-4 rounded-full" />
          <Pulse className="h-5 w-32" />
          <Pulse className="h-4 w-10" />
        </div>
        <Pulse className="h-8 w-8 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_272px]">
        <div className="theme-card p-5 md:p-6">
          <div className="mb-4 flex justify-between">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-6 w-28 rounded-full" />
          </div>
          <div className="mb-5 flex items-start gap-2">
            <Pulse className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2 pt-1">
              <Pulse className="h-14 w-32" />
              <Pulse className="h-4 w-56" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Pulse key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Pulse className="h-7 w-36 rounded-full" />
            <Pulse className="h-7 w-28 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:flex lg:flex-col lg:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="theme-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Pulse className="h-7 w-7 rounded-lg" />
                <Pulse className="h-4 w-16" />
              </div>
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Pulse key={j} className="h-3.5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Pulse className="mb-3 h-3 w-28" />
        <div className="theme-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <Pulse className="h-3 w-3 rounded-full" />
            <Pulse className="h-7 w-20 rounded-full" />
            <Pulse className="h-4 w-80" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Pulse key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div>
        <Pulse className="mb-3 h-3 w-32" />
        <div className="theme-card h-40" />
      </div>

      <div>
        <Pulse className="mb-3 h-3 w-48" />
        <div className="theme-card h-52" />
      </div>

      <div>
        <Pulse className="mb-3 h-3 w-36" />
        <div className="theme-card overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 px-5 py-4",
                i > 0 && "border-theme-border border-t"
              )}
            >
              <Pulse className="h-4 w-20" />
              <Pulse className="h-8 w-8 rounded-lg" />
              <Pulse className="h-4 flex-1" />
              <Pulse className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
