"use client";

import { PageLayout } from "@/components/layout";

export default function EventsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <PageLayout>
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-theme-fg-muted text-sm">
          Er is een fout opgetreden bij het laden van de evenementen.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-theme-error font-mono text-xs">{error.message}</p>
        )}
        <button
          type="button"
          onClick={unstable_retry}
          className="bg-theme-primary-15 text-theme-primary focus-visible:ring-theme-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none"
        >
          Opnieuw proberen
        </button>
      </div>
    </PageLayout>
  );
}
