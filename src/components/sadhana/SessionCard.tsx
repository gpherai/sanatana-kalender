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
import {
  type SessionData,
  type Practice,
  type FormItem,
  apiFetch,
  todayString,
  formatTime,
  isoToLocalTime,
  formatDuration,
} from "./types";
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
        started_at: data.startedAt
          ? new Date(`${data.date}T${data.startedAt}`).toISOString()
          : null,
        duration_minutes: data.duration ? parseInt(data.duration, 10) : null,
        notes: data.notes.trim() || null,
        items: data.items.map((it) => ({
          practice_id: it.practice_id,
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
            startedAt: session.started_at ? isoToLocalTime(session.started_at) : "",
            duration: session.duration_minutes ? String(session.duration_minutes) : "",
            notes: session.notes ?? "",
            items: session.items.map((i) => ({
              practice_id: i.practice_id,
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
  const bubbleValue = session.total_malas + session.total_count;

  const countItems = session.items.filter(
    (i) => i.unit === "count" && i.practice_type !== "mantra_japa"
  );
  const countSummary =
    countItems.length === 1
      ? `${countItems[0]!.quantity}× ${countItems[0]!.practice_name}`
      : `${session.total_count.toLocaleString("nl-NL")}× recitatie`;

  const primarySummary =
    session.total_malas > 0 && session.total_count > 0
      ? `${session.total_malas} malas · ${session.total_count}×`
      : session.total_malas > 0
        ? `${session.total_malas} malas`
        : session.total_mantras > 0
          ? `${session.total_mantras.toLocaleString("nl-NL")} mantras`
          : session.total_count > 0
            ? countSummary
            : "Geen telling";

  const detailSummary =
    session.total_mantras > 0
      ? `${session.total_mantras.toLocaleString("nl-NL")} mantras`
      : session.total_count > 0
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
          className="flex flex-1 items-start gap-3 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="bg-theme-primary-15 text-theme-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums">
            {bubbleValue}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-theme-fg-secondary text-sm font-medium">
              {primarySummary}
              {session.started_at && (
                <span className="text-theme-fg-muted ml-1.5 text-xs font-normal">
                  {formatTime(session.started_at)}
                </span>
              )}
            </div>
            <div className="text-theme-fg-muted text-xs">
              {detailSummary}
              {session.duration_minutes
                ? ` · ${formatDuration(session.duration_minutes)}`
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
            onClick={() => setEditing(true)}
            className="text-theme-fg-muted hover:text-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
            aria-label="Sessie bewerken"
            title="Bewerken"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors hover:opacity-70"
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
                onClick={() => setConfirmDelete(false)}
                className="text-theme-fg-muted hover:text-theme-fg flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
                aria-label="Annuleren"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-theme-fg-muted hover:text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
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
                {item.practice_type === "mantra_japa" ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5" />
                )}
              </div>
              <span className="text-theme-fg-secondary min-w-0 truncate text-sm">
                {item.practice_name}
              </span>
              <span className="text-theme-fg-muted ml-auto shrink-0 text-xs">
                {item.quantity}
                {item.unit === "malas" ? " malas" : "×"}
                {item.mantra_count
                  ? ` (${item.mantra_count.toLocaleString("nl-NL")} mantras)`
                  : item.count_total
                    ? ` (${item.count_total.toLocaleString("nl-NL")} namen)`
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
