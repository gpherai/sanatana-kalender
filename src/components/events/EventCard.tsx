"use client";

import Link from "next/link";
import { Calendar, Clock, Star, Tag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEventType } from "@/lib/constants";
import { getCategoryBgClass, getCategoryDynamicStyle } from "@/lib/category-styles";
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
  importance: string;
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
  importance,
  tithi,
  nakshatra,
  tags = [],
  onClick,
  className,
}: EventCardProps) {
  // Category is now a full object, no need to look up
  const categoryData = category;
  const eventTypeData = getEventType(eventType);
  const isMajor = importance === "MAJOR";

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
    "group relative block w-full text-left",
    "bg-theme-surface",
    "rounded-2xl overflow-hidden",
    "border border-theme-border",
    "shadow-sm hover:shadow-xl",
    "transition-all duration-300 ease-out",
    "hover:-translate-y-1",
    isMajor && "ring-2 ring-theme-warning/50",
    className
  );

  const cardContent = (
    <>
      {/* Category Color Strip */}
      <div
        className="absolute top-0 left-0 h-full w-1.5 transition-all duration-300 group-hover:w-2"
        style={{
          backgroundColor: categoryData?.color ?? "oklch(0.6 0.15 250)",
        }}
      />

      {/* Major Event Badge */}
      {isMajor && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-theme-warning-bg px-2 py-1 text-xs font-medium text-theme-warning">
          <Star className="h-3 w-3 fill-current" />
          Belangrijk
        </div>
      )}

      <div className="p-5 pl-6">
        {/* Header: Icon + Title */}
        <div className="mb-3 flex items-start gap-4">
          {/* Category Icon */}
          <div
            className={cn(
              "h-12 w-12 flex-shrink-0 rounded-xl",
              "flex items-center justify-center text-2xl",
              "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
              categoryData?.name
                ? getCategoryBgClass(categoryData.name, 15)
                : ""
            )}
            style={
              !categoryData?.name
                ? getCategoryDynamicStyle("oklch(0.6 0.15 250)", 15)
                : undefined
            }
          >
            {categoryData?.icon ?? eventTypeData?.icon ?? "📅"}
          </div>

          {/* Title + Category */}
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-lg font-semibold text-theme-fg transition-colors group-hover:text-theme-primary">
              {name}
            </h3>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  categoryData?.name
                    ? getCategoryBgClass(categoryData.name, 15)
                    : ""
                )}
                style={{
                  ...((!categoryData?.name && getCategoryDynamicStyle("oklch(0.6 0.15 250)", 15)) || {}),
                  color: categoryData?.color ?? "oklch(0.5 0.15 250)",
                }}
              >
                {categoryData?.displayName ?? "Algemeen"}
              </span>
              <span className="text-xs text-theme-fg-muted">
                {eventTypeData?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Description (if present) */}
        {description && (
          <p className="mb-3 line-clamp-2 pl-16 text-sm text-theme-fg-secondary">
            {description}
          </p>
        )}

        {/* Date & Time Row */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-16 text-sm text-theme-fg-secondary">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-theme-accent" />
            <span>{formatEventDate()}</span>
            {durationDays > 1 && (
              <span className="font-medium text-theme-accent">
                ({durationDays} dagen)
              </span>
            )}
          </div>

          {startTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-theme-info" />
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
              <span className="inline-flex items-center gap-1 rounded-lg bg-theme-secondary-10 px-2 py-1 text-xs text-theme-secondary">
                🌙 {tithi}
              </span>
            )}
            {nakshatra && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-theme-accent-10 px-2 py-1 text-xs text-theme-accent">
                ⭐ {nakshatra}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pl-16">
            <Tag className="h-3 w-3 text-theme-fg-subtle" />
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-theme-surface-raised px-2 py-0.5 text-xs text-theme-fg-secondary dark:text-theme-fg-subtle"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-xs text-theme-fg-subtle">+{tags.length - 4} meer</span>
            )}
          </div>
        )}

        {/* Hover Arrow */}
        <div className="absolute right-5 bottom-5 opacity-0 transition-opacity group-hover:opacity-100">
          <ChevronRight className="h-5 w-5 text-theme-primary" />
        </div>
      </div>

      {/* Bottom Gradient on Hover */}
      <div
        className="absolute right-0 bottom-0 left-0 h-1 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${categoryData?.color ?? "oklch(0.6 0.15 250)"}, transparent)`,
        }}
      />
    </>
  );

  // Render button or link based on onClick prop
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {cardContent}
      </button>
    );
  }

  return (
    <Link href={`/events/${id}`} className={cardClassName}>
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
  importance,
  onClick,
  className,
}: Pick<
  EventCardProps,
  | "id"
  | "name"
  | "date"
  | "category"
  | "eventType"
  | "importance"
  | "onClick"
  | "className"
>) {
  // Category is now a full object
  const categoryData = category;
  const eventTypeData = getEventType(eventType);
  const isMajor = importance === "MAJOR";

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
          categoryData?.name
            ? getCategoryBgClass(categoryData.name, 15)
            : ""
        )}
        style={
          !categoryData?.name
            ? getCategoryDynamicStyle("oklch(0.6 0.15 250)", 15)
            : undefined
        }
      >
        {categoryData?.icon ?? eventTypeData?.icon ?? "📅"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-theme-fg transition-colors group-hover:text-theme-primary">
            {name}
          </span>
          {isMajor && <Star className="h-3 w-3 fill-theme-warning text-theme-warning" />}
        </div>
        <div className="text-xs text-theme-fg-muted">
          {new Date(date).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
          })}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-theme-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" />
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
