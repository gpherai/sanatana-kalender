"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Practice, PracticeType } from "@/types/sadhana";
import { apiFetch } from "@/lib/sadhana-api";
import { PRACTICE_TYPE_LABELS } from "@/lib/sadhana-utils";

export function PracticesPanel({
  practices,
  onChanged,
}: {
  practices: Practice[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<PracticeType>("mantra_japa");
  const [newMantraText, setNewMantraText] = useState("");
  const [newCountSize, setNewCountSize] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<PracticeType>("mantra_japa");
  const [editMantraText, setEditMantraText] = useState("");
  const [editCountSize, setEditCountSize] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (p: Practice) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditType(p.type);
    setEditMantraText(p.mantraText ?? "");
    setEditCountSize(p.countSize ? String(p.countSize) : "");
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
          mantraText: newType === "mantra_japa" ? newMantraText.trim() || null : null,
          countSize:
            newType !== "mantra_japa" && newCountSize ? parseInt(newCountSize, 10) : null,
          notes: newNotes.trim() || null,
        }),
      });
      setNewName("");
      setNewType("mantra_japa");
      setNewMantraText("");
      setNewCountSize("");
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
          mantraText: editType === "mantra_japa" ? editMantraText.trim() || null : null,
          countSize:
            editType !== "mantra_japa" && editCountSize
              ? parseInt(editCountSize, 10)
              : null,
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
    setConfirmDeleteId(null);
    onChanged();
  };

  const visible = practices.filter((p) => showInactive || p.active);
  const inactivePracticeCount = practices.filter((p) => !p.active).length;
  const inputCls =
    "bg-theme-surface border-theme-border text-theme-fg placeholder:text-theme-fg-muted rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]";

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-theme-fg text-sm font-semibold">Beoefeningen</h2>
        </div>
        <div className="flex items-center gap-2">
          {inactivePracticeCount > 0 && (
            <button
              type="button"
              onClick={() => setShowInactive((v) => !v)}
              className="text-theme-fg-muted hover:text-theme-fg focus-visible:ring-theme-primary min-h-[44px] cursor-pointer rounded text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {showInactive
                ? "Verberg inactief"
                : `Toon inactief (${inactivePracticeCount})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
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
            <label htmlFor="pa-name" className="sr-only">
              Naam beoefening
            </label>
            <input
              id="pa-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Naam beoefening"
              className={cn(inputCls, "min-w-40 flex-1")}
              required
            />
            <label htmlFor="pa-type" className="sr-only">
              Type
            </label>
            <select
              id="pa-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as PracticeType)}
              className={cn(inputCls, "cursor-pointer")}
            >
              <option value="mantra_japa">Mantra japa</option>
              <option value="parayana">Parayana</option>
              <option value="other">Overig</option>
            </select>
          </div>
          {newType === "mantra_japa" && (
            <>
              <label htmlFor="pa-mantra" className="sr-only">
                Mantra tekst
              </label>
              <textarea
                id="pa-mantra"
                value={newMantraText}
                onChange={(e) => setNewMantraText(e.target.value)}
                placeholder="Mantra tekst (optioneel) — bijv. Om Gam Ganapataye Namaha"
                rows={2}
                className={cn(inputCls, "w-full resize-none")}
              />
            </>
          )}
          {newType !== "mantra_japa" && (
            <>
              <label htmlFor="pa-count-size" className="sr-only">
                Aantal namen/items per ronde
              </label>
              <input
                id="pa-count-size"
                type="number"
                inputMode="numeric"
                min={1}
                value={newCountSize}
                onChange={(e) => setNewCountSize(e.target.value)}
                placeholder="Aantal namen per ronde (optioneel) — bijv. 32"
                className={cn(inputCls, "w-full")}
              />
            </>
          )}
          <label htmlFor="pa-notes" className="sr-only">
            Notities
          </label>
          <input
            id="pa-notes"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notities (optioneel)"
            className={cn(inputCls, "w-full")}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-theme-fg-secondary hover:text-theme-fg focus-visible:ring-theme-primary min-h-[44px] cursor-pointer rounded text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={adding}
              className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Opslaan
            </button>
          </div>
        </form>
      )}

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
              {editType === "mantra_japa" && (
                <textarea
                  value={editMantraText}
                  onChange={(e) => setEditMantraText(e.target.value)}
                  placeholder="Mantra tekst (optioneel)"
                  rows={2}
                  className={cn(inputCls, "w-full resize-none")}
                />
              )}
              {editType !== "mantra_japa" && (
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={editCountSize}
                  onChange={(e) => setEditCountSize(e.target.value)}
                  placeholder="Aantal namen per ronde (optioneel) — bijv. 32"
                  className={cn(inputCls, "w-full")}
                />
              )}
              <input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notities"
                className={cn(inputCls, "w-full")}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-theme-fg-secondary hover:text-theme-fg focus-visible:ring-theme-primary min-h-[44px] cursor-pointer rounded text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(p.id)}
                  disabled={saving}
                  className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                {p.mantraText && (
                  <div className="text-theme-fg-secondary mt-0.5 truncate text-xs italic">
                    {p.mantraText}
                  </div>
                )}
                <div className="text-theme-fg-muted text-xs">
                  {PRACTICE_TYPE_LABELS[p.type]}
                  {p.countSize ? ` · ${p.countSize} namen/ronde` : ""}
                  {p.notes ? ` · ${p.notes}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="text-theme-fg-muted hover:text-theme-primary focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  aria-label={`${p.name} bewerken`}
                  title="Bewerken"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(p)}
                  className="text-theme-fg-muted hover:text-theme-primary focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  aria-label={p.active ? `${p.name} deactiveren` : `${p.name} activeren`}
                  title={p.active ? "Deactiveren" : "Activeren"}
                >
                  {p.active ? (
                    <ToggleRight className="text-theme-primary h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                </button>
                {confirmDeleteId === p.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--theme-error-fg)] focus-visible:outline-none"
                      aria-label="Verwijderen bevestigen"
                      title="Bevestig verwijderen"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-theme-fg-muted hover:text-theme-fg focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      aria-label="Annuleren"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(p.id)}
                    className="text-theme-fg-muted hover:text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-error-fg)] focus-visible:outline-none"
                    aria-label={`${p.name} verwijderen`}
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
