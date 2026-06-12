import { Suspense } from "react";
import { PageLayout } from "@/components/layout";
import { getEventOccurrences } from "@/services/event.service";
import { transformOccurrenceToCalendarEvent } from "@/lib/api-transformers";
import { EventsContent } from "@/components/events/EventsContent";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const occurrences = await getEventOccurrences({ limit: 5000, skip: 0 });
  const initialEvents = occurrences.map(transformOccurrenceToCalendarEvent);

  return (
    <Suspense fallback={<PageLayout loading loadingMessage="Events laden..." />}>
      <EventsContent initialEvents={initialEvents} />
    </Suspense>
  );
}
