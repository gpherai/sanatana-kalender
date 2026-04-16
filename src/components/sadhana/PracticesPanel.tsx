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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Practice,
  type PracticeType,
  apiFetch,
  PRACTICE_TYPE_LABELS,
} from "./types";

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

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<PracticeType>("mantra_japa");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);

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
              onClick={() => setShowInactive((v) => !v)}
              className="text-theme-fg-muted hover:text-theme-fg min-h-[44px] cursor-pointer text-xs transition-colors"
            >
              {showInactive
                ? "Verberg inactief"
                : `Toon inactief (${inactivePracticeCount})`}
            </button>
          )}
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white hover:opacity-90"
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
              className="text-theme-fg-secondary hover:text-theme-fg min-h-[44px] cursor-pointer text-sm"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={adding}
              className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
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
              <input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notities"
                className={cn(inputCls, "w-full")}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="text-theme-fg-secondary hover:text-theme-fg min-h-[44px] cursor-pointer text-sm"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => handleSave(p.id)}
                  disabled={saving}
                  className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
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
                  className="text-theme-fg-muted hover:text-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
                  aria-label={`${p.name} bewerken`}
                  title="Bewerken"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleToggle(p)}
                  className="text-theme-fg-muted hover:text-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
                  aria-label={p.active ? `${p.name} deactiveren` : `${p.name} activeren`}
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
                  className="text-theme-fg-muted hover:text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
                  aria-label={`${p.name} verwijderen`}
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
