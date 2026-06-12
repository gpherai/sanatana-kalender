import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { DateTime } from "luxon";
import { DEFAULT_LOCATION, EVENT_TYPES } from "@/lib/domain";
import type { UpcomingOccurrence } from "@/services/home.service";

interface Props {
  eventsPromise: Promise<UpcomingOccurrence[]>;
  todayYear: number;
}

export async function UpcomingEventsSection({ eventsPromise, todayYear }: Props) {
  const upcomingEvents = await eventsPromise;

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <h2 className="text-theme-fg mb-4 flex items-center gap-2 text-lg font-semibold">
        <span className="text-xl" aria-hidden="true">
          📿
        </span>
        Binnenkort (7 dagen)
      </h2>

      {upcomingEvents.length === 0 ? (
        <div className="border-theme-border rounded-xl border-2 border-dashed px-6 py-10 text-center">
          <div className="mb-3 text-5xl" aria-hidden="true">
            🙏
          </div>
          <p className="text-theme-fg mb-1 text-sm font-medium">Geen aankomende events</p>
          <p className="text-theme-fg-muted mb-5 text-xs">
            Voeg een festival, puja of viering toe aan je kalender.
          </p>
          <Link
            href="/events/new"
            className="bg-theme-primary focus-visible:ring-theme-primary text-theme-primary-fg hover:bg-theme-primary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Plus className="h-4 w-4" />
            Event toevoegen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {upcomingEvents.map((occ) => {
            const category = occ.event.categories[0]?.category ?? null;
            const eventDate = new Date(occ.date);
            const eventYear = DateTime.fromJSDate(eventDate, {
              zone: DEFAULT_LOCATION.timezone,
            }).year;
            const crossesYear = eventYear !== todayYear;
            const typeLabel =
              occ.event.eventType && occ.event.eventType !== "OTHER"
                ? (EVENT_TYPES.find((type) => type.value === occ.event.eventType)
                    ?.label ?? null)
                : null;
            return (
              <Link
                key={occ.id}
                href={`/events/${occ.event.id}`}
                className="group hover:bg-theme-surface-hover focus-visible:ring-theme-primary flex items-center gap-3 rounded-xl p-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none active:opacity-75"
                style={{ touchAction: "manipulation" }}
              >
                <div className="text-xl" aria-hidden="true">
                  {category?.icon || "📅"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="group-hover:text-theme-primary text-theme-fg truncate text-sm font-medium transition-colors">
                    {occ.event.name}
                  </div>
                  <div className="text-theme-fg-muted flex items-center gap-1.5 text-xs">
                    <span>
                      {eventDate.toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        timeZone: DEFAULT_LOCATION.timezone,
                        ...(crossesYear ? { year: "numeric" } : {}),
                      })}
                    </span>
                    {typeLabel && (
                      <>
                        <span className="text-theme-border">·</span>
                        <span className="text-theme-fg-muted">{typeLabel}</span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="group-hover:text-theme-primary text-theme-fg-muted h-4 w-4 transition-[color,transform] duration-200 motion-safe:group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
