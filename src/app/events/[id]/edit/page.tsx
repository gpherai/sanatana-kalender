import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events/EventForm";
import { PageLayout } from "@/components/layout";
import { formatDateForInput } from "@/lib/date-utils";
import type { EventFormData } from "@/lib/validations";
import { findEventByIdBasic, findEventForUpdate } from "@/repositories/event.repository";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await findEventByIdBasic(id);
  return { title: event ? `${event.name} bewerken` : "Event bewerken" };
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;

  const event = await findEventForUpdate(id);

  if (!event) {
    notFound();
  }

  const firstOccurrence = event.occurrences[0];

  const initialData: Partial<EventFormData> & { id: string } = {
    id: event.id,
    name: event.name,
    description: event.description ?? "",
    eventType: event.eventType as EventFormData["eventType"],
    categoryId: event.categories[0]?.categoryId ?? "",
    recurrenceType: event.recurrenceType as EventFormData["recurrenceType"],
    date: firstOccurrence ? formatDateForInput(firstOccurrence.date) : "",
    endDate: firstOccurrence?.endDate ? formatDateForInput(firstOccurrence.endDate) : "",
    startTime: firstOccurrence?.startTime ?? "",
    endTime: firstOccurrence?.endTime ?? "",
    tithi: (event.tithi ?? "") as EventFormData["tithi"],
    nakshatra: (event.nakshatra ?? "") as EventFormData["nakshatra"],
    maas: (event.maas ?? "") as EventFormData["maas"],
    sankranti: (event.sankranti ?? "") as EventFormData["sankranti"],
    tags: event.tags.join(", "),
    notes: firstOccurrence?.notes ?? "",
  };

  return (
    <PageLayout width="narrow">
      {/* Back Link */}
      <Link
        href={`/events/${id}`}
        className="text-theme-fg-muted hover:text-theme-fg focus-visible:ring-theme-primary mb-6 inline-flex items-center gap-2 rounded text-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar event
      </Link>

      {/* Form Card */}
      <div className="bg-theme-surface-raised rounded-2xl p-6 shadow-lg">
        <h1 className="text-theme-fg mb-6 text-2xl font-bold">Event Bewerken</h1>

        <EventForm mode="edit" initialData={initialData} />
      </div>
    </PageLayout>
  );
}
