"use client";

import Link from "next/link";
import { Calendar, Clock, Tag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEventType } from "@/lib/domain";
import { formatShortDate } from "@/lib/date-utils";
import {
  getCategoryBgClass,
  getCategoryDynamicStyle,
  getCategoryTextClass,
  FALLBACK_CATEGORY_COLOR,
} from "@/lib/category-styles";
import type { Category } from "@/types/calendar";

interface EventCardProps {
  id: string;
  name: string;
  description?: string | null;
  date: Date;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
  // Category is now a full object from the database
  category?: Category | null;
  eventType: string;
  tithi?: string | null;
  nakshatra?: string | null;
  tags?: string[];
  onClick?: () => void;
  className?: string;
}

export function EventCard({
  id,
  name,
  description,
  date,
  endDate,
  startTime,
  endTime,
  category,
  eventType,
  tithi,
  nakshatra,
  tags = [],
  onClick,
  className,
}: EventCardProps) {
  const eventTypeData = getEventType(eventType);

  const categoryColor = category?.color ?? FALLBACK_CATEGORY_COLOR;
  const categoryBgClass = category ? getCategoryBgClass(category.name, 15) : "";
  const categoryBgStyle = !category
    ? getCategoryDynamicStyle(FALLBACK_CATEGORY_COLOR, 15)
    : undefined;
  const categoryTextClass = category ? getCategoryTextClass(category.name) : "";

  // Calculate duration for multi-day events
  const durationDays = endDate
    ? Math.ceil(
        (new Date(endDate).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    : 1;

  // Format date nicely
  const formatEventDate = () => {
    const start = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };

    if (endDate && durationDays > 1) {
      const end = new Date(endDate);
      return `${start.toLocaleDateString("nl-NL", options)} - ${end.toLocaleDateString("nl-NL", options)}`;
    }

    return start.toLocaleDateString("nl-NL", {
      ...options,
      year: "numeric",
    });
  };

  const cardClassName = cn(
    "group relative block w-full h-full text-left",
    "bg-theme-surface",
    "rounded-2xl overflow-hidden",
    "border border-theme-border",
    "shadow-sm hover:shadow-xl",
    "transition-all duration-300 ease-out",
    "hover:-translate-y-1 active:opacity-75 active:scale-[0.99]",
    className
  );

  const cardContent = (
    <>
      {/* Category Color Strip */}
      <div
        className="absolute top-0 left-0 h-full w-1.5 transition-all duration-300 group-hover:w-2"
        style={{ backgroundColor: categoryColor }}
      />

      <div className="p-5 pl-6">
        {/* Header: Icon + Title */}
        <div className="mb-3 flex items-start gap-4">
          {/* Category Icon */}
          <div
            className={cn(
              "h-12 w-12 flex-shrink-0 rounded-xl",
              "flex items-center justify-center text-2xl",
              "transition-transform duration-300 group-hover:scale-110",
              categoryBgClass
            )}
            style={categoryBgStyle}
          >
            {category?.icon ?? eventTypeData?.icon ?? "📅"}
          </div>

          {/* Title + Category */}
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="text-theme-fg group-hover:text-theme-primary truncate text-lg font-semibold transition-colors">
              {name}
            </h3>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  categoryBgClass,
                  categoryTextClass
                )}
                style={categoryBgStyle}
              >
                {category?.displayName ?? "Algemeen"}
              </span>
              <span className="text-theme-fg-muted text-xs">{eventTypeData?.label}</span>
            </div>
          </div>
        </div>

        {/* Description (if present) */}
        {description && (
          <p className="text-theme-fg-secondary mb-3 line-clamp-2 pl-16 text-sm">
            {description}
          </p>
        )}

        {/* Date & Time Row */}
        <div className="text-theme-fg-secondary mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-16 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="text-theme-accent h-4 w-4" />
            <span>{formatEventDate()}</span>
            {durationDays > 1 && (
              <span className="text-theme-accent font-medium">
                ({durationDays} dagen)
              </span>
            )}
          </div>

          {startTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="text-theme-info h-4 w-4" />
              <span>
                {startTime}
                {endTime && ` - ${endTime}`}
              </span>
            </div>
          )}
        </div>

        {/* Lunar Info */}
        {(tithi || nakshatra) && (
          <div className="mb-3 flex flex-wrap items-center gap-2 pl-16">
            {tithi && (
              <span className="bg-theme-secondary-10 text-theme-secondary inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs">
                🌙 {tithi}
              </span>
            )}
            {nakshatra && (
              <span className="bg-theme-accent-10 text-theme-accent inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs">
                ⭐ {nakshatra}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pl-16">
            <Tag className="text-theme-fg-subtle h-3 w-3" />
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="bg-theme-surface-raised text-theme-fg-secondary rounded-md px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-theme-fg-subtle text-xs">
                +{tags.length - 4} meer
              </span>
            )}
          </div>
        )}

        {/* Arrow — always subtly visible on mobile, full opacity on hover */}
        <div className="absolute right-5 bottom-5 opacity-30 transition-opacity group-hover:opacity-100 lg:opacity-0">
          <ChevronRight className="text-theme-primary h-5 w-5" />
        </div>
      </div>

      {/* Bottom Gradient on Hover */}
      <div
        className="absolute right-0 bottom-0 left-0 h-1 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${categoryColor}, transparent)`,
        }}
      />
    </>
  );

  // Render button or link based on onClick prop
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ touchAction: "manipulation" }}
        className={cardClassName}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <Link
      href={`/events/${id}`}
      style={{ touchAction: "manipulation" }}
      className={cardClassName}
    >
      {cardContent}
    </Link>
  );
}

/**
 * Compact version for sidebars and lists
 */
export function EventCardCompact({
  id,
  name,
  date,
  category,
  eventType,
  onClick,
  className,
}: Pick<
  EventCardProps,
  "id" | "name" | "date" | "category" | "eventType" | "onClick" | "className"
>) {
  const eventTypeData = getEventType(eventType);
  const categoryBgClass = category ? getCategoryBgClass(category.name, 15) : "";
  const categoryBgStyle = !category
    ? getCategoryDynamicStyle(FALLBACK_CATEGORY_COLOR, 15)
    : undefined;

  const compactClassName = cn(
    "group flex items-center gap-3 p-3 rounded-xl w-full text-left",
    "hover:bg-theme-hover",
    "transition-colors duration-200",
    className
  );

  const compactContent = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg transition-transform duration-200 group-hover:scale-110",
          categoryBgClass
        )}
        style={categoryBgStyle}
      >
        {category?.icon ?? eventTypeData?.icon ?? "📅"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-theme-fg group-hover:text-theme-primary truncate text-sm font-medium transition-colors">
            {name}
          </span>
        </div>
        <div className="text-theme-fg-muted text-xs">{formatShortDate(date)}</div>
      </div>

      <ChevronRight className="text-theme-fg-subtle h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
    </>
  );

  // Render button or link based on onClick prop
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={compactClassName}>
        {compactContent}
      </button>
    );
  }

  return (
    <Link href={`/events/${id}`} className={compactClassName}>
      {compactContent}
    </Link>
  );
}
