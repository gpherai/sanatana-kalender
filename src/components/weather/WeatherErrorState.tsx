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
      <div className="theme-card mt-16 p-10 text-center">
        <Cloud className="text-theme-fg-muted mx-auto mb-4 h-10 w-10" />
        <h2 className="text-theme-fg mb-2 text-lg font-semibold">
          Weerdata niet beschikbaar
        </h2>
        <p className="text-theme-fg-muted mb-6 text-sm">{error}</p>
        <button
          onClick={onRetry}
          className="bg-theme-primary text-theme-primary-fg hover:bg-theme-primary/80 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          Opnieuw proberen
        </button>
      </div>
    </PageLayout>
  );
}
