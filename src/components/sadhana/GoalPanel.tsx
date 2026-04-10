"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Goal, type GoalType, apiFetch } from "./types";

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  daily: "Dagdoel",
  weekly: "Weekdoel",
};

export function GoalPanel({
  goals,
  onChanged,
}: {
  goals: Goal[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [newType, setNewType] = useState<GoalType>("daily");
  const [newMalas, setNewMalas] = useState("");
  const [newMinutes, setNewMinutes] = useState("");
  const [adding, setAdding] = useState(false);

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
  const inactiveGoalCount = goals.filter((g) => !g.active).length;
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
          {inactiveGoalCount > 0 && (
            <button
              onClick={() => setShowInactive((v) => !v)}
              className="text-theme-fg-muted hover:text-theme-fg min-h-[44px] cursor-pointer text-xs transition-colors"
            >
              {showInactive ? "Verberg inactief" : `Toon inactief (${inactiveGoalCount})`}
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
            <label htmlFor="ga-type" className="sr-only">
              Type doel
            </label>
            <select
              id="ga-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as GoalType)}
              className={cn(inputCls, "cursor-pointer")}
            >
              <option value="daily">Dagdoel</option>
              <option value="weekly">Weekdoel</option>
            </select>
            <label htmlFor="ga-malas" className="sr-only">
              Malas doel
            </label>
            <input
              id="ga-malas"
              type="number"
              inputMode="numeric"
              value={newMalas}
              onChange={(e) => setNewMalas(e.target.value)}
              placeholder="Malas doel"
              min={1}
              className={cn(inputCls, "w-32")}
              required
            />
            <label htmlFor="ga-minutes" className="sr-only">
              Minuten doel (optioneel)
            </label>
            <input
              id="ga-minutes"
              type="number"
              inputMode="numeric"
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
                  inputMode="numeric"
                  value={editMalas}
                  onChange={(e) => setEditMalas(e.target.value)}
                  placeholder="Malas doel"
                  min={1}
                  className={cn(inputCls, "w-32")}
                  required
                />
                <input
                  type="number"
                  inputMode="numeric"
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
                  className="text-theme-fg-secondary hover:text-theme-fg min-h-[44px] cursor-pointer text-sm"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => handleSave(g.id)}
                  disabled={saving}
                  className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
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
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      g.type === "daily"
                        ? "bg-theme-primary/15 text-theme-primary"
                        : "bg-theme-secondary/15 text-theme-secondary"
                    )}
                  >
                    {GOAL_TYPE_LABELS[g.type]}
                  </span>
                  {!g.active && (
                    <span className="text-theme-fg-muted text-xs">Inactief</span>
                  )}
                </div>
                <div className="text-theme-fg text-sm font-medium">
                  {g.target_malas} malas
                  {g.target_minutes ? ` · ${g.target_minutes} min` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => startEdit(g)}
                  className="text-theme-fg-muted hover:text-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
                  aria-label={`${GOAL_TYPE_LABELS[g.type]} bewerken`}
                  title="Bewerken"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleToggle(g)}
                  className="text-theme-fg-muted hover:text-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
                  aria-label={
                    g.active
                      ? `${GOAL_TYPE_LABELS[g.type]} deactiveren`
                      : `${GOAL_TYPE_LABELS[g.type]} activeren`
                  }
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
                  className="text-theme-fg-muted hover:text-theme-error flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded transition-colors"
                  aria-label={`${GOAL_TYPE_LABELS[g.type]} verwijderen`}
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
