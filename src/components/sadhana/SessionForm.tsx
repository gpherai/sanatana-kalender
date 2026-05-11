"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Practice,
  FormItem,
  ItemUnit,
  PracticeType,
  Routine,
} from "@/types/sadhana";
import { todayString } from "@/lib/sadhana-utils";

function defaultUnit(type: PracticeType | undefined): ItemUnit {
  if (type === "parayana") return "count";
  return "malas"; // mantra_japa + other
}

export interface SessionFormProps {
  practices: Practice[];
  routines?: Routine[];
  initial?: {
    date: string;
    startedAt: string;
    duration: string;
    notes: string;
    items: FormItem[];
  };
  submitLabel: string;
  onSubmit: (data: {
    date: string;
    startedAt: string;
    duration: string;
    notes: string;
    items: FormItem[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function SessionForm({
  practices,
  routines = [],
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: SessionFormProps) {
  const defaultItem: FormItem = {
    practiceId: practices[0]?.id ?? "",
    quantity: "",
    unit: defaultUnit(practices[0]?.type),
  };
  const [date, setDate] = useState(initial?.date ?? todayString());
  const [startedAt, setStartedAt] = useState(initial?.startedAt ?? "");
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
    const valid = items.filter((it) => it.practiceId && it.quantity);
    if (!valid.length) {
      setError("Voeg minstens één beoefening met hoeveelheid toe.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ date, startedAt, duration, notes, items: valid });
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-theme-fg-secondary mb-1 block text-sm font-medium">
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
          <label
            htmlFor="session-start"
            className="text-theme-fg-secondary mb-1 block text-sm font-medium"
          >
            Starttijd (optioneel)
          </label>
          <input
            id="session-start"
            type="time"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-theme-fg-secondary mb-1 block text-sm font-medium">
            Duur (minuten, optioneel)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="bijv. 45"
            min={1}
            className={inputCls}
          />
        </div>
      </div>

      {routines.length > 0 && (
        <div>
          <label className="text-theme-fg-secondary mb-2 flex items-center gap-1.5 text-xs font-medium">
            <Layers className="h-3.5 w-3.5" />
            Routine laden
          </label>
          <div className="flex flex-wrap gap-2">
            {routines.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  setItems(
                    r.items.map((i) => ({
                      practiceId: i.practiceId,
                      quantity: String(i.quantity),
                      unit: i.unit,
                    }))
                  )
                }
                className="bg-theme-surface border-theme-border text-theme-fg hover:border-theme-primary hover:text-theme-primary focus-visible:ring-theme-primary min-h-[36px] cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-theme-fg-secondary text-xs font-medium">
          Beoefeningen
        </label>
        {items.map((item, i) => {
          const practice = practices.find((p) => p.id === item.practiceId);
          return (
            <div key={i} className="bg-theme-surface space-y-2 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <select
                  value={item.practiceId}
                  onChange={(e) => {
                    const p = practices.find((p) => p.id === e.target.value);
                    updateItem(i, {
                      practiceId: e.target.value,
                      unit: defaultUnit(p?.type),
                    });
                  }}
                  className={cn(inputCls, "min-w-0 flex-1 cursor-pointer")}
                  required
                >
                  {practices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    aria-label="Item verwijderen"
                    className="text-theme-fg-muted hover:text-theme-error focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: e.target.value })}
                  placeholder="aantal"
                  min={1}
                  className={cn(inputCls, "w-24 shrink-0")}
                  required
                />
                {practice?.type === "other" ? (
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(i, { unit: e.target.value as ItemUnit })}
                    className={cn(inputCls, "min-w-0 flex-1 cursor-pointer")}
                  >
                    <option value="malas">malas</option>
                    <option value="count">keer</option>
                  </select>
                ) : (
                  <div
                    className={cn(
                      inputCls,
                      "text-theme-fg-muted min-w-0 flex-1 select-none"
                    )}
                  >
                    {practice?.type === "parayana" ? "keer" : "malas"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addItem}
          className="text-theme-primary focus-visible:ring-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1 rounded text-xs transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Plus className="h-3.5 w-3.5" /> Item toevoegen
        </button>
      </div>

      <div>
        <label className="text-theme-fg-secondary mb-1 block text-sm font-medium">
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
          className="text-theme-fg-secondary hover:text-theme-fg focus-visible:ring-theme-primary min-h-[44px] cursor-pointer rounded-lg px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
