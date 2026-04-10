"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Flame,
  Award,
  Calendar,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  Activity,
  Pencil,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// CONFIG
// =============================================================================

const API = "/api/sadhana";

// =============================================================================
// TYPES
// =============================================================================

type PracticeType = "mantra_japa" | "parayana" | "other";
type ItemUnit = "malas" | "count";

interface Practice {
  id: string;
  name: string;
  type: PracticeType;
  notes: string | null;
  active: boolean;
}

interface SessionItemData {
  id: string;
  practice_id: string;
  practice_name: string;
  practice_type: PracticeType;
  quantity: number;
  unit: ItemUnit;
  mantra_count: number | null;
  duration_minutes: number | null;
}

interface SessionData {
  id: string;
  date: string;
  duration_minutes: number | null;
  total_malas: number;
  total_mantras: number;
  notes: string | null;
  items: SessionItemData[];
}

interface PracticeStat {
  practice_id: string;
  practice_name: string;
  practice_type: PracticeType;
  total_quantity: number;
  total_mantras: number | null;
}

interface TodayStats {
  date: string;
  total_malas: number;
  total_minutes: number;
  total_mantras: number;
  goal_malas_target: number | null;
  goal_malas_progress: number | null;
  goal_minutes_target: number | null;
  goal_minutes_progress: number | null;
  practices: PracticeStat[];
}

interface StreakStats {
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
}

interface CalendarDay {
  date: string;
  total_malas: number;
  total_minutes: number;
  session_count: number;
}

interface OverviewStats {
  total_sessions: number;
  total_malas_all_time: number;
  total_minutes_all_time: number;
  total_sessions_this_month: number;
  total_malas_this_month: number;
  total_minutes_this_month: number;
  avg_malas_per_session: number;
  practices: PracticeStat[];
}

type GoalType = "daily" | "weekly";

interface Goal {
  id: string;
  type: GoalType;
  target_malas: number;
  target_minutes: number | null;
  active: boolean;
}

// =============================================================================
// API
// =============================================================================

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// =============================================================================
// HELPERS
// =============================================================================

function localDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayString() {
  return localDateString(new Date());
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${h}u ${rem}m` : `${h}u`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  mantra_japa: "Mantra japa",
  parayana: "Parayana",
  other: "Overig",
};

// =============================================================================
// HEATMAP
// =============================================================================

type HeatmapCell = { date: string; malas: number } | null;

function buildHeatmap(calendarDays: CalendarDay[]): HeatmapCell[][] {
  const map = new Map(calendarDays.map((d) => [d.date, d.total_malas]));
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const start = new Date(todayDate);
  start.setDate(start.getDate() - 364);
  const dow = start.getDay();
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
  const weeks: HeatmapCell[][] = [];
  const cur = new Date(start);
  while (cur <= todayDate) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      if (cur > todayDate) {
        week.push(null);
      } else {
        const ds = localDateString(cur);
        week.push({ date: ds, malas: map.get(ds) ?? 0 });
      }
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function heatColor(malas: number): string {
  if (malas < 4) return "color-mix(in oklch, var(--theme-primary) 28%, transparent)";
  if (malas < 8) return "color-mix(in oklch, var(--theme-primary) 52%, transparent)";
  if (malas < 12) return "color-mix(in oklch, var(--theme-primary) 75%, transparent)";
  return "var(--theme-primary)";
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mrt",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];
const DAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function Heatmap({ weeks }: { weeks: HeatmapCell[][] }) {
  const monthPositions: { month: number; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const first = week.find((c) => c !== null);
    if (!first) return;
    const m = new Date(first.date + "T00:00:00").getMonth();
    if (m !== lastMonth) {
      monthPositions.push({ month: m, col: i });
      lastMonth = m;
    }
  });

  return (
    <div className="overflow-x-auto">
      <div style={{ display: "inline-block" }}>
        <div className="mb-1 flex" style={{ paddingLeft: 30 }}>
          {weeks.map((_, i) => {
            const mp = monthPositions.find((p) => p.col === i);
            return (
              <div key={i} style={{ width: 14, flexShrink: 0 }}>
                {mp && (
                  <span
                    className="text-theme-fg-muted"
                    style={{ fontSize: 10, whiteSpace: "nowrap" }}
                  >
                    {MONTH_LABELS[mp.month]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-0.5">
          <div className="mr-1 flex flex-col gap-0.5">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-theme-fg-muted flex items-center justify-end"
                style={{ height: 12, width: 24, fontSize: 9 }}
              >
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell, di) =>
                cell === null ? (
                  <div key={di} style={{ width: 12, height: 12 }} />
                ) : (
                  <div
                    key={di}
                    className="rounded-sm transition-colors"
                    style={{
                      width: 12,
                      height: 12,
                      background:
                        cell.malas === 0 ? "var(--theme-surface)" : heatColor(cell.malas),
                      opacity: cell.malas === 0 ? 0.45 : 1,
                    }}
                    title={`${formatDate(cell.date)}: ${cell.malas} malas`}
                  />
                )
              )}
            </div>
          ))}
        </div>
        <div className="text-theme-fg-muted mt-3 flex items-center gap-1.5 text-xs">
          <span>Minder</span>
          {[0, 3, 7, 11, 14].map((m, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: 12,
                height: 12,
                background: m === 0 ? "var(--theme-surface)" : heatColor(m),
                opacity: m === 0 ? 0.45 : 1,
              }}
            />
          ))}
          <span>Meer</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STAT CARD
// =============================================================================

function StatCard({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
}) {
  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-theme-primary">{icon}</div>
        <span className="text-theme-fg-secondary text-sm font-medium">{label}</span>
      </div>
      <div className="text-theme-fg text-3xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-theme-fg-muted mt-1 text-xs">{sub}</div>}
      {progress !== undefined && (
        <div className="bg-theme-surface mt-3 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-theme-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SESSION FORM (shared by add + edit)
// =============================================================================

interface FormItem {
  practice_id: string;
  quantity: string;
  unit: ItemUnit;
}

interface SessionFormProps {
  practices: Practice[];
  initial?: { date: string; duration: string; notes: string; items: FormItem[] };
  submitLabel: string;
  onSubmit: (data: {
    date: string;
    duration: string;
    notes: string;
    items: FormItem[];
  }) => Promise<void>;
  onCancel: () => void;
}

function SessionForm({
  practices,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: SessionFormProps) {
  const defaultItem: FormItem = {
    practice_id: practices[0]?.id ?? "",
    quantity: "",
    unit: "malas",
  };
  const [date, setDate] = useState(initial?.date ?? todayString());
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState<FormItem[]>(initial?.items ?? [defaultItem]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => setItems((p) => [...p, { ...defaultItem }]);
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<FormItem>) =>
    setItems((p) => p.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const valid = items.filter((it) => it.practice_id && it.quantity);
    if (!valid.length) {
      setError("Voeg minstens één beoefening met hoeveelheid toe.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ date, duration, notes, items: valid });
    } catch {
      setError("Opslaan mislukt.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "bg-theme-surface border-theme-border text-theme-fg placeholder:text-theme-fg-muted w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-theme-fg-secondary mb-1 block text-xs font-medium">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="text-theme-fg-secondary mb-1 block text-xs font-medium">
            Duur (minuten, optioneel)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="bijv. 45"
            min={1}
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-theme-fg-secondary text-xs font-medium">
          Beoefeningen
        </label>
        {items.map((item, i) => {
          const practice = practices.find((p) => p.id === item.practice_id);
          return (
            <div
              key={i}
              className="bg-theme-surface flex flex-wrap items-center gap-2 rounded-xl p-3"
            >
              <select
                value={item.practice_id}
                onChange={(e) =>
                  updateItem(i, { practice_id: e.target.value, unit: "malas" })
                }
                className={cn(inputCls, "min-w-32 flex-1 cursor-pointer")}
                required
              >
                {practices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: e.target.value })}
                placeholder="aantal"
                min={1}
                className={cn(inputCls, "w-24")}
                required
              />
              <select
                value={item.unit}
                onChange={(e) => updateItem(i, { unit: e.target.value as ItemUnit })}
                className={cn(inputCls, "w-28 cursor-pointer")}
              >
                <option value="malas">malas</option>
                <option value="count">
                  {practice?.type === "mantra_japa" ? "tellers" : "keer"}
                </option>
              </select>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-theme-fg-muted hover:text-theme-error p-1 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={addItem}
          className="text-theme-primary flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
        >
          <Plus className="h-3.5 w-3.5" /> Item toevoegen
        </button>
      </div>

      <div>
        <label className="text-theme-fg-secondary mb-1 block text-xs font-medium">
          Notities (optioneel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bijzonderheden..."
          rows={2}
          className={cn(inputCls, "resize-none")}
        />
      </div>

      {error && <p className="text-theme-error text-xs">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-theme-fg-secondary hover:text-theme-fg rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-theme-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// =============================================================================
// SESSION CARD
// =============================================================================

function SessionCard({
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
    duration: string;
    notes: string;
    items: FormItem[];
  }) => {
    await apiFetch(`/sessions/${session.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        date: data.date,
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
      <div className="bg-theme-surface-raised rounded-xl p-4 shadow">
        <h4 className="text-theme-fg mb-3 text-sm font-semibold">Sessie bewerken</h4>
        <SessionForm
          practices={practices}
          initial={{
            date: session.date,
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

  return (
    <div className="bg-theme-surface-raised rounded-xl p-4 shadow">
      <div className="flex items-start gap-3">
        {/* Expand toggle */}
        <button
          className="flex flex-1 items-start gap-3 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="bg-theme-primary-15 text-theme-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums">
            {session.total_malas}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-theme-fg text-sm font-semibold">
              {formatDate(session.date)}
            </div>
            <div className="text-theme-fg-muted text-xs">
              {session.total_mantras.toLocaleString("nl-NL")} mantras
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
            className="text-theme-fg-muted hover:text-theme-primary rounded p-1.5 transition-colors"
            title="Bewerken"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-theme-error rounded p-1.5 transition-colors hover:opacity-70"
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
                className="text-theme-fg-muted hover:text-theme-fg rounded p-1.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-theme-fg-muted hover:text-theme-error rounded p-1.5 transition-colors"
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
                {item.quantity} {item.unit === "malas" ? "malas" : "×"}
                {item.mantra_count
                  ? ` (${item.mantra_count.toLocaleString("nl-NL")} mantras)`
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

// =============================================================================
// PRACTICES PANEL
// =============================================================================

function PracticesPanel({
  practices,
  onChanged,
}: {
  practices: Practice[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<PracticeType>("mantra_japa");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<PracticeType>("mantra_japa");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (p: Practice) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditType(p.type);
    setEditNotes(p.notes ?? "");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await apiFetch("/practices", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          type: newType,
          notes: newNotes.trim() || null,
        }),
      });
      setNewName("");
      setNewType("mantra_japa");
      setNewNotes("");
      setShowAdd(false);
      onChanged();
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await apiFetch(`/practices/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          type: editType,
          notes: editNotes.trim() || null,
        }),
      });
      setEditingId(null);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: Practice) => {
    await apiFetch(`/practices/${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !p.active }),
    });
    onChanged();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/practices/${id}`, { method: "DELETE" });
    onChanged();
  };

  const visible = practices.filter((p) => showInactive || p.active);
  const inputCls =
    "bg-theme-surface border-theme-border text-theme-fg placeholder:text-theme-fg-muted rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]";

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-theme-primary h-4 w-4" />
          <h2 className="text-theme-fg text-sm font-semibold">Beoefeningen</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="text-theme-fg-muted hover:text-theme-fg text-xs transition-colors"
          >
            {showInactive ? "Verberg inactief" : "Toon inactief"}
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="bg-theme-primary flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Toevoegen
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-theme-surface mb-4 space-y-3 rounded-xl p-4"
        >
          <div className="flex flex-wrap gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Naam beoefening"
              className={cn(inputCls, "min-w-40 flex-1")}
              required
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as PracticeType)}
              className={cn(inputCls, "cursor-pointer")}
            >
              <option value="mantra_japa">Mantra japa</option>
              <option value="parayana">Parayana</option>
              <option value="other">Overig</option>
            </select>
          </div>
          <input
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notities (optioneel)"
            className={cn(inputCls, "w-full")}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-theme-fg-secondary hover:text-theme-fg text-sm"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={adding}
              className="bg-theme-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {adding && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Opslaan
            </button>
          </div>
        </form>
      )}

      {/* Practice list */}
      <div className="space-y-2">
        {visible.length === 0 && (
          <p className="text-theme-fg-muted text-sm">Geen beoefeningen gevonden.</p>
        )}
        {visible.map((p) =>
          editingId === p.id ? (
            <div key={p.id} className="bg-theme-surface space-y-2 rounded-xl p-3">
              <div className="flex flex-wrap gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={cn(inputCls, "min-w-40 flex-1")}
                  required
                />
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as PracticeType)}
                  className={cn(inputCls, "cursor-pointer")}
                >
                  <option value="mantra_japa">Mantra japa</option>
                  <option value="parayana">Parayana</option>
                  <option value="other">Overig</option>
                </select>
              </div>
              <input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notities"
                className={cn(inputCls, "w-full")}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="text-theme-fg-secondary hover:text-theme-fg text-sm"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => handleSave(p.id)}
                  disabled={saving}
                  className="bg-theme-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Opslaan
                </button>
              </div>
            </div>
          ) : (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3",
                p.active ? "bg-theme-surface" : "bg-theme-surface opacity-50"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="text-theme-fg text-sm font-medium">{p.name}</div>
                <div className="text-theme-fg-muted text-xs">
                  {PRACTICE_TYPE_LABELS[p.type]}
                  {p.notes ? ` · ${p.notes}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => startEdit(p)}
                  className="text-theme-fg-muted hover:text-theme-primary rounded p-1.5 transition-colors"
                  title="Bewerken"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleToggle(p)}
                  className="text-theme-fg-muted hover:text-theme-primary rounded p-1.5 transition-colors"
                  title={p.active ? "Deactiveren" : "Activeren"}
                >
                  {p.active ? (
                    <ToggleRight className="text-theme-primary h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-theme-fg-muted hover:text-theme-error rounded p-1.5 transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// =============================================================================
// GOAL PANEL
// =============================================================================

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  daily: "Dagdoel",
  weekly: "Weekdoel",
};

function GoalPanel({ goals, onChanged }: { goals: Goal[]; onChanged: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Add form
  const [newType, setNewType] = useState<GoalType>("daily");
  const [newMalas, setNewMalas] = useState("");
  const [newMinutes, setNewMinutes] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit form
  const [editMalas, setEditMalas] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setEditMalas(String(g.target_malas));
    setEditMinutes(g.target_minutes ? String(g.target_minutes) : "");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMalas) return;
    setAdding(true);
    try {
      await apiFetch("/goals", {
        method: "POST",
        body: JSON.stringify({
          type: newType,
          target_malas: parseInt(newMalas, 10),
          target_minutes: newMinutes ? parseInt(newMinutes, 10) : null,
        }),
      });
      setNewMalas("");
      setNewMinutes("");
      setShowAdd(false);
      onChanged();
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await apiFetch(`/goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          target_malas: parseInt(editMalas, 10),
          target_minutes: editMinutes ? parseInt(editMinutes, 10) : null,
        }),
      });
      setEditingId(null);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (g: Goal) => {
    await apiFetch(`/goals/${g.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !g.active }),
    });
    onChanged();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/goals/${id}`, { method: "DELETE" });
    onChanged();
  };

  const visible = goals.filter((g) => showInactive || g.active);
  const inputCls =
    "bg-theme-surface border-theme-border text-theme-fg placeholder:text-theme-fg-muted rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]";

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="text-theme-primary h-4 w-4" />
          <h2 className="text-theme-fg text-sm font-semibold">Doelen</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="text-theme-fg-muted hover:text-theme-fg text-xs transition-colors"
          >
            {showInactive ? "Verberg inactief" : "Toon inactief"}
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="bg-theme-primary flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Toevoegen
          </button>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-theme-surface mb-4 space-y-3 rounded-xl p-4"
        >
          <div className="flex flex-wrap gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as GoalType)}
              className={cn(inputCls, "cursor-pointer")}
            >
              <option value="daily">Dagdoel</option>
              <option value="weekly">Weekdoel</option>
            </select>
            <input
              type="number"
              value={newMalas}
              onChange={(e) => setNewMalas(e.target.value)}
              placeholder="Malas doel"
              min={1}
              className={cn(inputCls, "w-32")}
              required
            />
            <input
              type="number"
              value={newMinutes}
              onChange={(e) => setNewMinutes(e.target.value)}
              placeholder="Min. (optioneel)"
              min={1}
              className={cn(inputCls, "w-36")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-theme-fg-secondary hover:text-theme-fg text-sm"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={adding}
              className="bg-theme-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {adding && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Opslaan
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {visible.length === 0 && (
          <p className="text-theme-fg-muted text-sm">Geen doelen ingesteld.</p>
        )}
        {visible.map((g) =>
          editingId === g.id ? (
            <div key={g.id} className="bg-theme-surface space-y-2 rounded-xl p-3">
              <div className="text-theme-fg-secondary text-xs font-medium">
                {GOAL_TYPE_LABELS[g.type]}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  value={editMalas}
                  onChange={(e) => setEditMalas(e.target.value)}
                  placeholder="Malas doel"
                  min={1}
                  className={cn(inputCls, "w-32")}
                  required
                />
                <input
                  type="number"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  placeholder="Min. (optioneel)"
                  min={1}
                  className={cn(inputCls, "w-36")}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="text-theme-fg-secondary hover:text-theme-fg text-sm"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => handleSave(g.id)}
                  disabled={saving}
                  className="bg-theme-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Opslaan
                </button>
              </div>
            </div>
          ) : (
            <div
              key={g.id}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3",
                g.active ? "bg-theme-surface" : "bg-theme-surface opacity-50"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="text-theme-fg text-sm font-medium">
                  {GOAL_TYPE_LABELS[g.type]}: {g.target_malas} malas
                  {g.target_minutes ? ` · ${g.target_minutes} min` : ""}
                </div>
                {!g.active && <div className="text-theme-fg-muted text-xs">Inactief</div>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => startEdit(g)}
                  className="text-theme-fg-muted hover:text-theme-primary rounded p-1.5 transition-colors"
                  title="Bewerken"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleToggle(g)}
                  className="text-theme-fg-muted hover:text-theme-primary rounded p-1.5 transition-colors"
                  title={g.active ? "Deactiveren" : "Activeren"}
                >
                  {g.active ? (
                    <ToggleRight className="text-theme-primary h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="text-theme-fg-muted hover:text-theme-error rounded p-1.5 transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export function SadhanaTracker() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [calDays, setCalDays] = useState<CalendarDay[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [allPractices, setAllPractices] = useState<Practice[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);

  const activePractices = allPractices.filter((p) => p.active);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [ts, st, ov, cal, sess, pracs, gl] = await Promise.all([
        apiFetch<TodayStats>("/stats/today"),
        apiFetch<StreakStats>("/stats/streak"),
        apiFetch<OverviewStats>("/stats/overview"),
        apiFetch<CalendarDay[]>("/stats/calendar"),
        apiFetch<SessionData[]>(`/sessions?from=${localDateString(thirtyDaysAgo)}`),
        apiFetch<Practice[]>("/practices?active_only=false"),
        apiFetch<Goal[]>("/goals"),
      ]);

      setTodayStats(ts);
      setStreak(st);
      setOverview(ov);
      setCalDays(cal);
      setSessions(sess);
      setAllPractices(pracs);
      setGoals(gl);
    } catch {
      setError("Backend niet bereikbaar. Controleer of de Next.js server draait.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const heatmap = buildHeatmap(calDays);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="text-theme-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-warning-subtle border-theme-warning rounded-2xl border p-6 text-center">
        <p className="text-theme-warning text-sm">{error}</p>
        <button
          onClick={loadAll}
          className="text-theme-primary mt-3 inline-flex items-center gap-2 text-sm hover:opacity-70"
        >
          <RefreshCw className="h-4 w-4" /> Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-fg text-2xl font-bold">Sadhana</h1>
          <p className="text-theme-fg-muted text-sm">
            Mantra japa &amp; beoefening tracker
          </p>
        </div>
        <button
          onClick={loadAll}
          className="text-theme-fg-muted hover:text-theme-fg rounded-lg p-2 transition-colors"
          title="Verversen"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Vandaag"
          value={`${todayStats?.total_malas ?? 0} malas`}
          sub={`${(todayStats?.total_mantras ?? 0).toLocaleString("nl-NL")} mantras${todayStats?.total_minutes ? ` · ${formatDuration(todayStats.total_minutes)}` : ""}`}
          progress={todayStats?.goal_malas_progress ?? undefined}
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Streak"
          value={`${streak?.current_streak ?? 0} dagen`}
          sub={`Langste: ${streak?.longest_streak ?? 0} dagen`}
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Deze maand"
          value={`${overview?.total_malas_this_month ?? 0} malas`}
          sub={`${overview?.total_sessions_this_month ?? 0} sessies${overview?.total_minutes_this_month ? ` · ${formatDuration(overview.total_minutes_this_month)}` : ""}`}
        />
      </div>

      {/* Per-practice vandaag */}
      {todayStats && todayStats.practices.length > 0 && (
        <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="text-theme-primary h-4 w-4" />
            <h2 className="text-theme-fg text-sm font-semibold">
              Vandaag per beoefening
            </h2>
          </div>
          <div className="space-y-2">
            {todayStats.practices.map((ps) => (
              <div key={ps.practice_id} className="flex items-center gap-3">
                <div className="text-theme-primary shrink-0">
                  {ps.practice_type === "mantra_japa" ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="text-theme-fg-secondary min-w-0 flex-1 truncate text-sm">
                  {ps.practice_name}
                </span>
                <span className="text-theme-fg-muted shrink-0 text-xs tabular-nums">
                  {ps.total_quantity} {ps.practice_type === "mantra_japa" ? "malas" : "×"}
                  {ps.total_mantras
                    ? ` · ${ps.total_mantras.toLocaleString("nl-NL")} mantras`
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="text-theme-primary h-4 w-4" />
          <h2 className="text-theme-fg text-sm font-semibold">
            Activiteit — laatste jaar
          </h2>
        </div>
        <Heatmap weeks={heatmap} />
      </div>

      {/* Sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-theme-fg font-semibold">Sessies (laatste 30 dagen)</h2>
          <button
            onClick={() => setShowAddSession((v) => !v)}
            className="bg-theme-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Toevoegen
          </button>
        </div>

        {showAddSession && (
          <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
            <h3 className="text-theme-fg mb-4 font-semibold">Sessie toevoegen</h3>
            {activePractices.length === 0 ? (
              <p className="text-theme-warning text-sm">
                Voeg eerst een actieve beoefening toe onderaan de pagina.
              </p>
            ) : (
              <SessionForm
                practices={activePractices}
                submitLabel="Opslaan"
                onSubmit={async (data) => {
                  await apiFetch("/sessions", {
                    method: "POST",
                    body: JSON.stringify({
                      date: data.date,
                      duration_minutes: data.duration
                        ? parseInt(data.duration, 10)
                        : null,
                      notes: data.notes.trim() || null,
                      items: data.items.map((it) => ({
                        practice_id: it.practice_id,
                        quantity: parseInt(it.quantity, 10),
                        unit: it.unit,
                      })),
                    }),
                  });
                  setShowAddSession(false);
                  loadAll();
                }}
                onCancel={() => setShowAddSession(false)}
              />
            )}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="bg-theme-surface-raised rounded-2xl p-8 text-center shadow-lg">
            <div className="text-theme-fg-muted text-sm">
              Geen sessies in de afgelopen 30 dagen.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                practices={activePractices}
                onUpdated={loadAll}
                onDeleted={loadAll}
              />
            ))}
          </div>
        )}
      </div>

      {/* Goals + Practices naast elkaar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GoalPanel goals={goals} onChanged={loadAll} />
        <PracticesPanel practices={allPractices} onChanged={loadAll} />
      </div>

      {/* All-time overview */}
      {overview && (
        <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Award className="text-theme-primary h-4 w-4" />
            <h2 className="text-theme-fg text-sm font-semibold">All-time overzicht</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {[
              {
                label: "Sessies",
                value: overview.total_sessions.toLocaleString("nl-NL"),
              },
              {
                label: "Malas totaal",
                value: overview.total_malas_all_time.toLocaleString("nl-NL"),
              },
              {
                label: "Minuten totaal",
                value: overview.total_minutes_all_time.toLocaleString("nl-NL"),
              },
              {
                label: "Gem. malas/sessie",
                value: overview.avg_malas_per_session.toFixed(1),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-theme-fg-muted text-xs">{label}</div>
                <div className="text-theme-fg mt-0.5 text-2xl font-bold tabular-nums">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {overview.practices.length > 0 && (
            <div className="border-theme-border mt-5 border-t pt-4">
              <div className="text-theme-fg-secondary mb-3 text-xs font-medium">
                Per beoefening
              </div>
              <div className="space-y-2">
                {overview.practices.map((ps) => (
                  <div key={ps.practice_id} className="flex items-center gap-3">
                    <div className="text-theme-primary shrink-0">
                      {ps.practice_type === "mantra_japa" ? (
                        <Sparkles className="h-3.5 w-3.5" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="text-theme-fg-secondary min-w-0 flex-1 truncate text-sm">
                      {ps.practice_name}
                    </span>
                    <span className="text-theme-fg-muted shrink-0 text-xs tabular-nums">
                      {ps.total_quantity}{" "}
                      {ps.practice_type === "mantra_japa" ? "malas" : "×"}
                      {ps.total_mantras
                        ? ` · ${ps.total_mantras.toLocaleString("nl-NL")} mantras`
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
