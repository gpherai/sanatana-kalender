"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionData, Practice, FormItem } from "@/types/sadhana";
import { apiFetch } from "@/lib/sadhana-api";
import {
  todayString,
  formatTime,
  isoToLocalTime,
  formatDuration,
} from "@/lib/sadhana-utils";
import { SessionForm } from "./SessionForm";

export function SessionCard({
  session,
  practices,
  onUpdated,
  onDeleted,
}: {
  session: SessionData;
  practices: Practice[];
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/sessions/${session.id}`, { method: "DELETE" });
      onDeleted();
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleUpdate = async (data: {
    date: string;
    startedAt: string;
    duration: string;
    notes: string;
    items: FormItem[];
  }) => {
    await apiFetch(`/sessions/${session.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        date: data.date,
        startedAt: data.startedAt
          ? new Date(`${data.date}T${data.startedAt}`).toISOString()
          : null,
        durationMinutes: data.duration ? parseInt(data.duration, 10) : null,
        notes: data.notes.trim() || null,
        items: data.items.map((it) => ({
          ...(it.id && { id: it.id }),
          practiceId: it.practiceId,
          quantity: parseInt(it.quantity, 10),
          unit: it.unit,
        })),
      }),
    });
    setEditing(false);
    onUpdated();
  };

  if (editing) {
    return (
      <div className="bg-theme-surface-raised rounded-2xl p-4 shadow">
        <h4 className="text-theme-fg mb-3 text-sm font-semibold">Sessie bewerken</h4>
        <SessionForm
          practices={practices}
          initial={{
            date: session.date,
            startedAt: session.startedAt ? isoToLocalTime(session.startedAt) : "",
            duration: session.durationMinutes ? String(session.durationMinutes) : "",
            notes: session.notes ?? "",
            items: session.items.map((i) => ({
              id: i.id,
              practiceId: i.practiceId,
              quantity: String(i.quantity),
              unit: i.unit,
            })),
          }}
          submitLabel="Opslaan"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const isToday = session.date === todayString();
  const bubbleValue = session.totalMalas + session.totalCount;

  const countItems = session.items.filter(
    (i) => i.unit === "count" && i.practiceType !== "mantra_japa"
  );

  // Build a readable summary for count-based items: list each with quantity and name
  const countSummary =
    countItems.length === 0
      ? ""
      : countItems.map((i) => `${i.quantity}× ${i.practiceName}`).join(" · ");

  const primarySummary =
    session.totalMalas > 0 && session.totalCount > 0
      ? `${session.totalMalas} malas · ${countSummary}`
      : session.totalMalas > 0
        ? `${session.totalMalas} malas`
        : session.totalMantras > 0
          ? `${session.totalMantras.toLocaleString("nl-NL")} mantras`
          : session.totalCount > 0
            ? countSummary
            : "Geen telling";

  const detailSummary =
    session.totalMantras > 0
      ? `${session.totalMantras.toLocaleString("nl-NL")} mantras`
      : session.totalCount > 0
        ? countSummary
        : "Geen telling";

  return (
    <div
      className={cn(
        "bg-theme-surface-raised rounded-2xl p-4 shadow",
        isToday && "shadow-theme-primary ring-2 ring-[var(--theme-primary)]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Expand toggle */}
        <button
          type="button"
          className="hover:bg-theme-hover focus-visible:ring-theme-primary -m-2 flex flex-1 cursor-pointer items-start gap-3 rounded-xl p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="bg-theme-primary/15 text-theme-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums">
            {bubbleValue}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-theme-fg-secondary text-sm font-medium">
              {primarySummary}
              {session.startedAt && (
                <span className="text-theme-fg-muted ml-1.5 text-xs font-normal">
                  {formatTime(session.startedAt)}
                </span>
              )}
            </div>
            <div className="text-theme-fg-muted text-xs">
              {detailSummary}
              {session.durationMinutes
                ? ` · ${formatDuration(session.durationMinutes)}`
                : ""}
            </div>
          </div>
          <div className="text-theme-fg-muted mt-0.5 shrink-0">
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-theme-fg-muted hover:text-theme-primary focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Sessie bewerken"
            title="Bewerken"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-theme-error hover:text-theme-error/70 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-error-fg)] focus-visible:outline-none"
                aria-label="Verwijderen bevestigen"
                title="Bevestig verwijderen"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-theme-fg-muted hover:text-theme-fg focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Annuleren"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-theme-fg-muted hover:text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-error-fg)] focus-visible:outline-none"
              aria-label="Sessie verwijderen"
              title="Verwijderen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-theme-border mt-3 space-y-2 border-t pt-3">
          {session.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="text-theme-primary shrink-0">
                {item.practiceType === "mantra_japa" ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5" />
                )}
              </div>
              <span className="text-theme-fg-secondary min-w-0 truncate text-sm">
                {item.practiceName}
              </span>
              <span className="text-theme-fg-muted ml-auto shrink-0 text-xs">
                {item.quantity}
                {item.unit === "malas" ? " malas" : "×"}
                {item.mantraCount
                  ? ` (${item.mantraCount.toLocaleString("nl-NL")} mantras)`
                  : item.countTotal
                    ? ` (${item.countTotal.toLocaleString("nl-NL")} namen)`
                    : ""}
              </span>
            </div>
          ))}
          {session.notes && (
            <p className="text-theme-fg-muted border-theme-border border-t pt-2 text-xs italic">
              {session.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
