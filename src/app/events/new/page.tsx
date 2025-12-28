import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events";
import { PageLayout } from "@/components/layout";

export default function NewEventPage() {
  return (
    <PageLayout width="narrow">
        {/* Back Link */}
        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-2 text-sm text-theme-fg-muted hover:text-theme-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar Events
        </Link>

        {/* Form Card */}
        <div className="rounded-2xl bg-theme-surface-raised p-6 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-theme-fg">
            Nieuw Event
          </h1>

          <EventForm mode="create" />
        </div>
    </PageLayout>
  );
}
