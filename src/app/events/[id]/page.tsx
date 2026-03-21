import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events/EventForm";
import { PageLayout } from "@/components/layout";
import { formatDateForInput } from "@/lib/date-utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      category: true,
      occurrences: {
        orderBy: { date: "asc" },
        take: 1,
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Get the first occurrence for date fields
  const firstOccurrence = event.occurrences[0];

  // Transform to form data format
  const initialData = {
    id: event.id,
    name: event.name,
    description: event.description ?? "",
    eventType: event.eventType as string,
    categoryId: event.categoryId ?? "",
    importance: event.importance as string,
    recurrenceType: event.recurrenceType as string,
    date: firstOccurrence ? formatDateForInput(firstOccurrence.date) : "",
    endDate: firstOccurrence?.endDate ? formatDateForInput(firstOccurrence.endDate) : "",
    startTime: firstOccurrence?.startTime ?? "",
    endTime: firstOccurrence?.endTime ?? "",
    tithi: event.tithi ?? "",
    nakshatra: event.nakshatra ?? "",
    maas: event.maas ?? "",
    tags: event.tags.join(", "),
    notes: firstOccurrence?.notes ?? "",
  };

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
        <h1 className="text-theme-fg mb-6 text-2xl font-bold">Event Bewerken</h1>

        <EventForm mode="edit" initialData={initialData} />
      </div>
    </PageLayout>
  );
}
