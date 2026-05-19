import { Suspense } from "react";
import { PageLayout } from "@/components/layout";
import { findEventOccurrences } from "@/repositories/event.repository";
import { transformOccurrenceToCalendarEvent } from "@/lib/api-transformers";
import { EventsContent } from "@/components/events/EventsContent";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const occurrences = await findEventOccurrences({});
  const initialEvents = occurrences.map(transformOccurrenceToCalendarEvent);

  return (
    <Suspense fallback={<PageLayout loading loadingMessage="Events laden..." />}>
      <EventsContent initialEvents={initialEvents} />
    </Suspense>
  );
}
