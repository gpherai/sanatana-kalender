"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Tag,
  Moon,
  Star,
  Pencil,
  Trash2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarEvent } from "@/types/calendar";
import { getEventType, getTithi, getNakshatra, getMaas } from "@/lib/constants";
import { cn, logError } from "@/lib/utils";
import { getMoonPhaseIllumination } from "@/lib/date-utils";
import { useToast } from "@/components/ui/Toast";
import { MoonPhase } from "@/components/ui/MoonPhase";
// Note: Inline color-mix styles used here for edge cases (gradients, mixing with white)

interface EventDetailModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

function getRelativeDateLabel(date: Date): string | null {
  if (isToday(date)) return "Vandaag";
  if (isTomorrow(date)) return "Morgen";
  if (!isPast(date)) {
    const distance = formatDistanceToNow(date, { locale: nl, addSuffix: false });
    return `Over ${distance}`;
  }
  return null;
}

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  onDeleted,
}: EventDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { error: showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Animate in
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Close on ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    },
    [onClose, showDeleteConfirm]
  );

  // Close on click outside modal
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const handleEdit = () => {
    onClose();
    router.push(`/events/${event.eventId}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${event.eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      onClose();
      onDeleted?.();
    } catch (error) {
      logError("Failed to delete event", error);
      showError("Kon event niet verwijderen");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  // Category is now a full object, not a string
  const category = event.resource.category;
  const eventType = getEventType(event.resource.eventType);
  const tithi = event.resource.tithi ? getTithi(event.resource.tithi) : null;
  const nakshatra = event.resource.nakshatra
    ? getNakshatra(event.resource.nakshatra)
    : null;
  const maas = event.resource.maas ? getMaas(event.resource.maas) : null;

  // Date calculations
  const displayEndDate = event.resource.originalEndDate ?? event.start;
  const startDate = format(event.start, "EEEE d MMMM yyyy", { locale: nl });
  const endDate = format(displayEndDate, "EEEE d MMMM yyyy", { locale: nl });
  const isMultiDay =
    event.start.toDateString() !== new Date(displayEndDate).toDateString();
  const relativeLabel = getRelativeDateLabel(event.start);
  const moonInfo = getMoonPhaseIllumination(event.start);

  // Calculate duration for multi-day events
  const durationDays = isMultiDay
    ? Math.ceil(
        (new Date(displayEndDate).getTime() - event.start.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    : 1;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[var(--theme-modal-backdrop)] backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-lg rounded-3xl bg-theme-surface shadow-2xl",
          "max-h-[90vh] overflow-hidden",
          "outline-none",
          "transition-all duration-300",
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-95 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div
          className="relative overflow-hidden p-6 pb-5"
          style={{
            // Keep as inline: gradient with non-standard opacity levels (25%, 10%)
            background: category?.color
              ? `linear-gradient(135deg, color-mix(in oklch, ${category.color} 25%, transparent) 0%, color-mix(in oklch, ${category.color} 10%, transparent) 100%)`
              : "linear-gradient(135deg, oklch(0.97 0.02 60) 0%, oklch(0.98 0.01 60) 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[var(--theme-glass-bg)]" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[var(--theme-glass-bg)]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 rounded-full p-2.5",
              "bg-theme-surface-hover/60 hover:bg-theme-surface-hover",
              "backdrop-blur-sm transition-all duration-200",
              "hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
            )}
            aria-label="Sluiten"
          >
            <X className="h-5 w-5 text-theme-fg-secondary" />
          </button>

          {/* Category + Type badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {category && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium backdrop-blur-sm"
                style={{
                  // Keep as inline: mixing with white instead of transparent
                  backgroundColor: `color-mix(in oklch, ${category.color} 30%, white)`,
                  color: category.color,
                }}
              >
                <span className="text-base">{category.icon}</span>
                <span>{category.displayName}</span>
              </span>
            )}
            {eventType && (
              <span className="inline-flex items-center gap-1 rounded-full bg-theme-surface-overlay px-2.5 py-1 text-sm text-theme-fg-secondary backdrop-blur-sm">
                {eventType.icon} {eventType.label}
              </span>
            )}
            {event.resource.importance === "MAJOR" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/30 px-2.5 py-1 text-sm font-medium text-amber-700 backdrop-blur-sm dark:text-amber-300">
                <Star className="h-3.5 w-3.5 fill-current" />
                Belangrijk
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            id="modal-title"
            className="pr-10 text-2xl leading-tight font-bold text-theme-fg"
          >
            {event.title}
          </h2>

          {/* Relative date badge - theme colored */}
          {relativeLabel && (
            <div className="bg-theme-primary mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white">
              <Sparkles className="h-3.5 w-3.5" />
              {relativeLabel}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-280px)] space-y-5 overflow-y-auto p-6 pt-5">
          {/* Date + Moon Phase Row */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <MoonPhase
                percent={moonInfo.percent}
                isWaxing={moonInfo.isWaxing}
                size={56}
                glow={false}
              />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Calendar className="text-theme-primary h-4 w-4" />
                <span className="text-sm font-medium text-theme-fg-muted">
                  Datum
                </span>
              </div>
              <div className="font-medium text-theme-fg capitalize">
                {startDate}
              </div>
              {isMultiDay && (
                <>
                  <div className="mt-0.5 text-sm text-theme-fg-muted capitalize">
                    tot {endDate}
                  </div>
                  <div className="bg-theme-primary-15 text-theme-primary mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                    {durationDays} dagen
                  </div>
                </>
              )}
              <div className="mt-1 text-xs text-theme-fg-subtle">
                {moonInfo.percent}% maanverlicht •{" "}
                {moonInfo.isWaxing ? "Wassend" : "Afnemend"}
              </div>
            </div>
          </div>

          {/* Time (if set) */}
          {event.resource.startTime && (
            <div className="flex items-center gap-3 rounded-xl bg-theme-surface-raised p-3">
              <Clock className="text-theme-secondary h-5 w-5" />
              <div>
                <span className="font-medium text-theme-fg">
                  {event.resource.startTime}
                </span>
                {event.resource.endTime && (
                  <span className="text-theme-fg-muted">
                    {" "}
                    - {event.resource.endTime}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {event.resource.description && (
            <div className="leading-relaxed text-theme-fg-secondary">
              {event.resource.description}
            </div>
          )}

          {/* Lunar Info */}
          {(tithi || nakshatra || maas) && (
            <div
              className="rounded-2xl p-4"
              style={{
                background: `linear-gradient(135deg, var(--theme-almanac-moon-card-from), var(--theme-almanac-moon-card-to))`,
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Moon className="h-5 w-5 text-[var(--theme-almanac-moon-icon)]" />
                <span className="font-medium text-[var(--theme-almanac-moon-fg)]">
                  Vedische Informatie
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {tithi && (
                  <div className="rounded-xl bg-[var(--theme-almanac-moon-cell-bg)] p-3 text-center">
                    <div className="mb-1 text-xs tracking-wide text-[var(--theme-almanac-moon-icon)] uppercase">
                      Tithi
                    </div>
                    <div className="font-medium text-theme-fg">
                      {tithi.label}
                    </div>
                    <div className="mt-0.5 text-xs text-theme-fg-muted">
                      {tithi.paksha} Paksha
                    </div>
                  </div>
                )}
                {nakshatra && (
                  <div className="rounded-xl bg-[var(--theme-almanac-moon-cell-bg)] p-3 text-center">
                    <div className="mb-1 text-xs tracking-wide text-[var(--theme-almanac-moon-icon)] uppercase">
                      Nakshatra
                    </div>
                    <div className="font-medium text-theme-fg">
                      {nakshatra.label}
                    </div>
                  </div>
                )}
                {maas && (
                  <div className="rounded-xl bg-[var(--theme-almanac-moon-cell-bg)] p-3 text-center">
                    <div className="mb-1 text-xs tracking-wide text-[var(--theme-almanac-moon-icon)] uppercase">
                      Maas
                    </div>
                    <div className="font-medium text-theme-fg">
                      {maas.label}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {event.resource.tags.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-theme-fg-subtle" />
                <span className="text-sm font-medium text-theme-fg-muted">
                  Tags
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="cursor-default rounded-full bg-theme-surface-raised px-3 py-1 text-sm text-theme-fg-secondary transition-colors hover:bg-theme-hover"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {event.resource.notes && (
            <div className="rounded-2xl bg-[var(--theme-info-bg)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">📝</span>
                <span className="font-medium text-[var(--theme-info-fg)]">
                  Notities
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--theme-info-fg)]">
                {event.resource.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-theme-border bg-theme-bg-subtle p-5 pt-4">
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Weet je zeker dat je &ldquo;{event.title}&rdquo; wilt verwijderen?
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl bg-theme-active px-4 py-2.5 text-sm font-medium transition-colors hover:bg-theme-hover"
                  disabled={isDeleting}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-[var(--theme-error)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {isDeleting ? "Verwijderen..." : "Ja, verwijderen"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleEdit}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
                  "bg-theme-primary text-white hover:opacity-90",
                  "shadow-theme-primary shadow-lg",
                  "transition-all duration-200"
                )}
              >
                <Pencil className="h-4 w-4" />
                Bewerken
              </button>
              <button
                onClick={() => router.push(`/events/${event.eventId}`)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
                  "bg-theme-active hover:bg-theme-hover",
                  "text-theme-fg-secondary",
                  "transition-colors"
                )}
                title="Open volledige pagina"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={cn(
                  "flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium",
                  "bg-theme-active hover:bg-[var(--theme-error-bg)]",
                  "text-theme-fg-secondary hover:text-[var(--theme-error-fg)]",
                  "transition-colors"
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
