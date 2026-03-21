import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events/EventForm";
import { PageLayout } from "@/components/layout";

export default function NewEventPage() {
  return (
    <PageLayout width="narrow">
      {/* Back Link */}
      <Link
        href="/events"
        className="text-theme-fg-muted hover:text-theme-fg mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar Events
      </Link>

      {/* Form Card */}
      <div className="bg-theme-surface-raised rounded-2xl p-6 shadow-lg">
        <h1 className="text-theme-fg mb-6 text-2xl font-bold">Nieuw Event</h1>

        <EventForm mode="create" />
      </div>
    </PageLayout>
  );
}
