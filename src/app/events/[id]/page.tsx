import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events";
import { PageLayout } from "@/components/layout";
import { formatDateForInput } from "@/lib/utils";

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
          className="mb-6 inline-flex items-center gap-2 text-sm text-theme-fg-muted hover:text-theme-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar Events
        </Link>

        {/* Form Card */}
        <div className="rounded-2xl bg-theme-surface-raised p-6 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-theme-fg">
            Event Bewerken
          </h1>

          <EventForm mode="edit" initialData={initialData} />
        </div>
    </PageLayout>
  );
}
