"use client";

import { useState, useId } from "react";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Layers,
  GripVertical,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Routine, Practice, ItemUnit, PracticeType } from "./types";
import { apiFetch } from "@/lib/sadhana-api";

function defaultUnit(type: PracticeType | undefined): ItemUnit {
  if (type === "parayana") return "count";
  return "malas";
}

interface RoutineItemForm {
  practice_id: string;
  quantity: string;
  unit: ItemUnit;
}

function RoutineForm({
  practices,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  practices: Practice[];
  initial?: { name: string; items: RoutineItemForm[] };
  submitLabel: string;
  onSubmit: (data: { name: string; items: RoutineItemForm[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const uid = useId();
  const defaultItem: RoutineItemForm = {
    practice_id: practices[0]?.id ?? "",
    quantity: "",
    unit: defaultUnit(practices[0]?.type),
  };
  const [name, setName] = useState(initial?.name ?? "");
  const [items, setItems] = useState<RoutineItemForm[]>(initial?.items ?? [defaultItem]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => setItems((p) => [...p, { ...defaultItem }]);
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<RoutineItemForm>) =>
    setItems((p) => p.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const valid = items.filter((it) => it.practice_id && it.quantity);
    if (!valid.length) {
      setError("Voeg minstens één beoefening toe.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name, items: valid });
    } catch {
      setError("Opslaan mislukt.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "bg-theme-surface border-theme-border text-theme-fg placeholder:text-theme-fg-muted w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-theme-surface mb-4 space-y-3 rounded-xl p-4"
    >
      <div>
        <label
          htmlFor={`${uid}-name`}
          className="text-theme-fg-secondary mb-1 block text-xs font-medium"
        >
          Naam
        </label>
        <input
          id={`${uid}-name`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="bijv. Nitya Sadhana"
          maxLength={80}
          className={inputCls}
          required
        />
      </div>

      <div className="space-y-2">
        <span className="text-theme-fg-secondary text-xs font-medium">Beoefeningen</span>
        {items.map((item, i) => {
          const practice = practices.find((p) => p.id === item.practice_id);
          return (
            <div key={i} className="bg-theme-surface-raised space-y-2 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <GripVertical
                  className="text-theme-fg-muted h-4 w-4 shrink-0"
                  aria-hidden
                />
                <select
                  value={item.practice_id}
                  onChange={(e) => {
                    const p = practices.find((p) => p.id === e.target.value);
                    updateItem(i, {
                      practice_id: e.target.value,
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
                    aria-label="Verwijderen"
                    className="text-theme-fg-muted hover:text-theme-error focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <X className="h-4 w-4" />
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

export function RoutinePanel({
  routines,
  practices,
  onChanged,
}: {
  routines: Routine[];
  practices: Practice[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activePractices = practices.filter((p) => p.active);

  const handleCreate = async (data: { name: string; items: RoutineItemForm[] }) => {
    await apiFetch("/routines", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        items: data.items.map((it, idx) => ({
          practice_id: it.practice_id,
          quantity: parseInt(it.quantity, 10),
          unit: it.unit,
          sort_order: idx,
        })),
      }),
    });
    setShowAdd(false);
    onChanged();
  };

  const handleUpdate = async (
    id: string,
    data: { name: string; items: RoutineItemForm[] }
  ) => {
    await apiFetch(`/routines/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: data.name,
        items: data.items.map((it, idx) => ({
          practice_id: it.practice_id,
          quantity: parseInt(it.quantity, 10),
          unit: it.unit,
          sort_order: idx,
        })),
      }),
    });
    setEditingId(null);
    onChanged();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/routines/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    onChanged();
  };

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
            <Layers className="h-4 w-4" />
          </div>
          <h2 className="text-theme-fg text-sm font-semibold">Routines</h2>
        </div>
        <button
          onClick={() => {
            setShowAdd((v) => !v);
            setEditingId(null);
          }}
          className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          <Plus className="h-3.5 w-3.5" /> Toevoegen
        </button>
      </div>

      {showAdd && (
        <RoutineForm
          practices={activePractices}
          submitLabel="Opslaan"
          onSubmit={handleCreate}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="space-y-2">
        {routines.length === 0 && !showAdd && (
          <p className="text-theme-fg-muted text-sm">
            Geen routines. Maak er een aan om sessies snel in te vullen.
          </p>
        )}
        {routines.map((r) =>
          editingId === r.id ? (
            <RoutineForm
              key={r.id}
              practices={activePractices}
              initial={{
                name: r.name,
                items: r.items.map((i) => ({
                  practice_id: i.practice_id,
                  quantity: String(i.quantity),
                  unit: i.unit,
                })),
              }}
              submitLabel="Opslaan"
              onSubmit={(data) => handleUpdate(r.id, data)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={r.id}
              className="bg-theme-surface flex items-start gap-3 rounded-xl p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-theme-fg text-sm font-medium">{r.name}</div>
                <div className="text-theme-fg-muted mt-1 text-xs">
                  {r.items.map((i) => `${i.practice_name} ×${i.quantity}`).join(" · ")}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    setEditingId(r.id);
                    setShowAdd(false);
                  }}
                  className="text-theme-fg-muted hover:text-theme-primary focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  aria-label={`${r.name} bewerken`}
                  title="Bewerken"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {confirmDeleteId === r.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--theme-error-fg)] focus-visible:outline-none"
                      aria-label="Verwijderen bevestigen"
                      title="Bevestig verwijderen"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-theme-fg-muted hover:text-theme-fg focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      aria-label="Annuleren"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(r.id)}
                    className="text-theme-fg-muted hover:text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-error-fg)] focus-visible:outline-none"
                    aria-label={`${r.name} verwijderen`}
                    title="Verwijderen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
