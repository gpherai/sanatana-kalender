import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Pencil, Tag, RefreshCw } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { formatDateNL, getDurationDays } from "@/lib/date-utils";
import { getEventType, RECURRENCE_TYPES } from "@/lib/domain";
import {
  getCategoryBgClass,
  getCategoryDynamicStyle,
  getCategoryTextClass,
  FALLBACK_CATEGORY_COLOR,
} from "@/lib/category-styles";
import {
  findEventByIdBasic,
  findEventByIdForDisplay,
} from "@/repositories/event.repository";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await findEventByIdBasic(id);
  return { title: event?.name ?? "Event" };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const event = await findEventByIdForDisplay(id);

  if (!event) {
    notFound();
  }

  const category = event.categories[0]?.category ?? null;
  const firstOcc = event.occurrences[0];
  const eventTypeData = getEventType(event.eventType);
  const recurrenceLabel = RECURRENCE_TYPES.find(
    (r) => r.value === event.recurrenceType
  )?.label;

  const categoryColor = category?.color ?? FALLBACK_CATEGORY_COLOR;
  const categoryBgClass = category ? getCategoryBgClass(category.name, 15) : "";
  const categoryBgStyle = !category
    ? getCategoryDynamicStyle(FALLBACK_CATEGORY_COLOR, 15)
    : undefined;
  const categoryTextClass = category ? getCategoryTextClass(category.name) : "";

  // Date display
  const startDate = firstOcc?.date ? new Date(firstOcc.date) : null;
  const endDate = firstOcc?.endDate ? new Date(firstOcc.endDate) : null;
  const durationDays = startDate && endDate ? getDurationDays(startDate, endDate) : 1;

  const hasLunarInfo = event.tithi || event.nakshatra || event.maas || event.sankranti;

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

      {/* Header Card */}
      <div className="bg-theme-surface-raised rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-5">
          {/* Category Icon */}
          <div
            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-3xl ${categoryBgClass}`}
            style={{ borderLeft: `4px solid ${categoryColor}`, ...categoryBgStyle }}
          >
            {category?.icon ?? eventTypeData?.icon ?? "📅"}
          </div>

          {/* Title & Meta */}
          <div className="min-w-0 flex-1">
            <h1 className="text-theme-fg text-2xl leading-tight font-bold">
              {event.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {category && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${categoryBgClass} ${categoryTextClass}`}
                  style={categoryBgStyle}
                >
                  {category.displayName}
                </span>
              )}
              {eventTypeData && (
                <span className="text-theme-fg-muted text-sm">
                  {eventTypeData.icon} {eventTypeData.label}
                </span>
              )}
            </div>
          </div>

          {/* Edit + Delete Buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/events/${id}/edit`}
              className="bg-theme-primary flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Pencil className="h-4 w-4" />
              Bewerken
            </Link>
            <DeleteEventButton eventId={id} eventName={event.name} />
          </div>
        </div>

        {/* Date & Time */}
        {startDate && (
          <div className="border-theme-border mt-5 space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="text-theme-accent h-4 w-4 shrink-0" />
              <span className="text-theme-fg font-medium">
                {formatDateNL(startDate, { timeZone: DEFAULT_LOCATION.timezone })}
                {endDate && durationDays > 1 && (
                  <span className="text-theme-fg-muted">
                    {" "}
                    → {formatDateNL(endDate, { timeZone: DEFAULT_LOCATION.timezone })}
                    <span className="text-theme-accent ml-1.5 font-medium">
                      ({durationDays} dagen)
                    </span>
                  </span>
                )}
              </span>
            </div>
            {(firstOcc?.startTime || firstOcc?.endTime) && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="text-theme-info h-4 w-4 shrink-0" />
                <span className="text-theme-fg">
                  {firstOcc.startTime}
                  {firstOcc.endTime && ` – ${firstOcc.endTime}`}
                </span>
              </div>
            )}
            {recurrenceLabel && event.recurrenceType !== "NONE" && (
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="text-theme-fg-muted h-4 w-4 shrink-0" />
                <span className="text-theme-fg-muted">{recurrenceLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <div className="bg-theme-surface-raised rounded-2xl p-6 shadow-lg">
          <h2 className="text-theme-fg-muted mb-3 text-xs font-semibold tracking-wide uppercase">
            Beschrijving
          </h2>
          <p className="text-theme-fg text-sm leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>
      )}

      {/* Notes */}
      {firstOcc?.notes && (
        <div className="bg-theme-surface-raised rounded-2xl p-6 shadow-lg">
          <h2 className="text-theme-fg-muted mb-3 text-xs font-semibold tracking-wide uppercase">
            Notities
          </h2>
          <p className="text-theme-fg text-sm leading-relaxed whitespace-pre-wrap">
            {firstOcc.notes}
          </p>
        </div>
      )}

      {/* Lunar / Solar Info */}
      {hasLunarInfo && (
        <div className="bg-theme-surface-raised rounded-2xl p-6 shadow-lg">
          <h2 className="text-theme-fg-muted mb-3 text-xs font-semibold tracking-wide uppercase">
            Lunaire / Solaire Info
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {event.tithi && (
              <div>
                <p className="text-theme-fg-muted text-xs">Tithi</p>
                <p className="text-theme-fg mt-0.5 text-sm font-medium">
                  🌙 {event.tithi}
                </p>
              </div>
            )}
            {event.nakshatra && (
              <div>
                <p className="text-theme-fg-muted text-xs">Nakshatra</p>
                <p className="text-theme-fg mt-0.5 text-sm font-medium">
                  ⭐ {event.nakshatra}
                </p>
              </div>
            )}
            {event.maas && (
              <div>
                <p className="text-theme-fg-muted text-xs">Maas</p>
                <p className="text-theme-fg mt-0.5 text-sm font-medium">{event.maas}</p>
              </div>
            )}
            {event.sankranti && (
              <div>
                <p className="text-theme-fg-muted text-xs">Sankranti</p>
                <p className="text-theme-fg mt-0.5 text-sm font-medium">
                  {event.sankranti}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="bg-theme-surface-raised rounded-2xl p-6 shadow-lg">
          <h2 className="text-theme-fg-muted mb-3 text-xs font-semibold tracking-wide uppercase">
            Tags
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="text-theme-fg-subtle h-3.5 w-3.5" />
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="bg-theme-surface-hover text-theme-fg-secondary rounded-md px-2.5 py-1 text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
