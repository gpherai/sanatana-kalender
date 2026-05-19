import { Suspense } from "react";
import { PageLayout } from "@/components/layout";
import { findEventOccurrences } from "@/repositories/event.repository";
import { transformOccurrenceToCalendarEvent } from "@/lib/api-transformers";
import { eventQuerySchema } from "@/lib/validations";
import { EventsContent } from "@/components/events/EventsContent";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const parseResult = eventQuerySchema.safeParse({
    start: typeof params.start === "string" ? params.start : undefined,
    end: typeof params.end === "string" ? params.end : undefined,
    search:
      typeof params.search === "string" ? params.search.trim() || undefined : undefined,
    categories:
      typeof params.categories === "string"
        ? params.categories.split(",").filter(Boolean)
        : undefined,
    types:
      typeof params.types === "string"
        ? params.types.split(",").filter(Boolean)
        : undefined,
    tithis:
      typeof params.tithis === "string"
        ? params.tithis.split(",").filter(Boolean)
        : undefined,
    sortBy: typeof params.sortBy === "string" ? params.sortBy : undefined,
    order: typeof params.order === "string" ? params.order : undefined,
  });

  const occurrences = await findEventOccurrences(
    parseResult.success ? parseResult.data : {}
  );
  const initialEvents = occurrences.map(transformOccurrenceToCalendarEvent);

  return (
    <Suspense fallback={<PageLayout loading loadingMessage="Events laden..." />}>
      <EventsContent initialEvents={initialEvents} />
    </Suspense>
  );
}
