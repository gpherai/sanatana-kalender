"use client";

import { PageLayout } from "@/components/layout";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageLayout>
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-theme-fg-muted text-sm">
          Er is een fout opgetreden bij het laden van de pagina.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-theme-error font-mono text-xs">{error.message}</p>
        )}
        <button
          onClick={reset}
          className="bg-theme-primary-15 text-theme-primary rounded-lg px-4 py-2 text-sm font-medium hover:opacity-80"
        >
          Opnieuw proberen
        </button>
      </div>
    </PageLayout>
  );
}
