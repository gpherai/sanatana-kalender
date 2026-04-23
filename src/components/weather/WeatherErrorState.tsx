"use client";

import { Cloud } from "lucide-react";
import { PageLayout } from "@/components/layout";

interface WeatherErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function WeatherErrorState({ error, onRetry }: WeatherErrorStateProps) {
  return (
    <PageLayout width="narrow">
      <div className="bg-theme-surface border-theme-border mt-16 rounded-2xl border p-10 text-center shadow-sm">
        <Cloud className="text-theme-fg-muted mx-auto mb-4 h-10 w-10" />
        <h2 className="text-theme-fg mb-2 text-lg font-semibold">
          Weerdata niet beschikbaar
        </h2>
        <p className="text-theme-fg-muted mb-6 text-sm">{error}</p>
        <button
          onClick={onRetry}
          className="bg-theme-primary cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Opnieuw proberen
        </button>
      </div>
    </PageLayout>
  );
}
