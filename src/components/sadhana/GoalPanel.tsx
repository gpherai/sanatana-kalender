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
import { type Goal, type GoalType, type Practice, apiFetch } from "./types";

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  daily: "Dagdoel",
  weekly: "Weekdoel",
  lifetime: "Totaal doel",
};

export function GoalPanel({
  goals,
  practices,
  onChanged,
}: {
  goals: Goal[];
  practices: Practice[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [newType, setNewType] = useState<GoalType>("daily");
  const [newName, setNewName] = useState("");
  const [newMalas, setNewMalas] = useState("");
  const [newMinutes, setNewMinutes] = useState("");
  const [newPracticeIds, setNewPracticeIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const [editName, setEditName] = useState("");
  const [editMalas, setEditMalas] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editPracticeIds, setEditPracticeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setEditName(g.name || "");
    setEditMalas(String(g.target_malas));
    setEditMinutes(g.target_minutes ? String(g.target_minutes) : "");
    setEditPracticeIds(g.practices?.map((p) => p.id) || []);
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
          name: newType === "lifetime" ? newName : undefined,
          target_malas: parseInt(newMalas, 10),
          target_minutes: newMinutes ? parseInt(newMinutes, 10) : null,
          practice_ids: newType === "lifetime" ? newPracticeIds : [],
        }),
      });
      setNewType("daily");
      setNewName("");
      setNewMalas("");
      setNewMinutes("");
      setNewPracticeIds([]);
      setShowAdd(false);
      onChanged();
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async (g: Goal) => {
    setSaving(true);
    try {
      await apiFetch(`/goals/${g.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: g.type === "lifetime" ? editName : undefined,
          target_malas: parseInt(editMalas, 10),
          target_minutes: editMinutes ? parseInt(editMinutes, 10) : null,
          practice_ids: g.type === "lifetime" ? editPracticeIds : [],
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

  const togglePractice = (
    id: string,
    currentIds: string[],
    setFn: (ids: string[]) => void
  ) => {
    if (currentIds.includes(id)) {
      setFn(currentIds.filter((pid) => pid !== id));
    } else {
      setFn([...currentIds, id]);
    }
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
              <option value="lifetime">Totaal doel</option>
            </select>

            {newType === "lifetime" && (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Naam (bijv. Atharvashirsha 1000x)"
                className={cn(inputCls, "w-full lg:w-48")}
                required
              />
            )}

            <label htmlFor="ga-malas" className="sr-only">
              Malas doel
            </label>
            <input
              id="ga-malas"
              type="number"
              inputMode="numeric"
              value={newMalas}
              onChange={(e) => setNewMalas(e.target.value)}
              placeholder={
                newType === "lifetime" ? "Totaal aantal (malas)" : "Malas doel"
              }
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

          {newType === "lifetime" && (
            <div className="mt-2 space-y-1">
              <label className="text-theme-fg-secondary text-xs font-medium">
                Welke oefeningen tellen mee voor dit doel? (optioneel)
              </label>
              <div className="flex flex-wrap gap-2">
                {practices.map((p) => {
                  const isSelected = newPracticeIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        togglePractice(p.id, newPracticeIds, setNewPracticeIds)
                      }
                      className={cn(
                        "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-theme-primary text-white"
                          : "bg-theme-surface-raised text-theme-fg hover:bg-theme-border"
                      )}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                {g.type === "lifetime" && (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Naam doel"
                    className={cn(inputCls, "w-full")}
                    required
                  />
                )}
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

              {g.type === "lifetime" && (
                <div className="mt-2 space-y-1">
                  <label className="text-theme-fg-secondary text-xs font-medium">
                    Gekoppelde oefeningen
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {practices.map((p) => {
                      const isSelected = editPracticeIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            togglePractice(p.id, editPracticeIds, setEditPracticeIds)
                          }
                          className={cn(
                            "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
                            isSelected
                              ? "bg-theme-primary text-white"
                              : "bg-theme-surface-raised text-theme-fg hover:bg-theme-border"
                          )}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="text-theme-fg-secondary hover:text-theme-fg min-h-[44px] cursor-pointer text-sm"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => handleSave(g)}
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
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                      g.type === "daily"
                        ? "bg-theme-primary/15 text-theme-primary"
                        : g.type === "weekly"
                          ? "bg-theme-secondary/15 text-theme-secondary"
                          : "bg-emerald-500/15 text-emerald-600"
                    )}
                  >
                    {GOAL_TYPE_LABELS[g.type]}
                  </span>
                  {g.type === "lifetime" && g.name && (
                    <span className="text-theme-fg truncate text-sm font-semibold">
                      {g.name}
                    </span>
                  )}
                  {!g.active && (
                    <span className="text-theme-fg-muted text-xs">Inactief</span>
                  )}
                </div>

                <div className="text-theme-fg flex items-center gap-2 text-sm font-medium">
                  <span className="whitespace-nowrap">
                    {Math.round(g.progress_malas || 0)} / {g.target_malas} malas
                  </span>
                  <div className="bg-theme-surface-raised h-2 w-20 overflow-hidden rounded-full lg:w-32">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        g.type === "daily"
                          ? "bg-theme-primary"
                          : g.type === "weekly"
                            ? "bg-theme-secondary"
                            : "bg-emerald-500"
                      )}
                      style={{
                        width: `${Math.min(100, Math.max(0, ((g.progress_malas || 0) / g.target_malas) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-theme-fg-muted text-xs whitespace-nowrap">
                    {(((g.progress_malas || 0) / g.target_malas) * 100).toFixed(1)}%
                  </span>
                  {g.target_minutes ? (
                    <span className="text-theme-fg-muted text-xs whitespace-nowrap">
                      · {g.progress_minutes || 0}/{g.target_minutes} min
                    </span>
                  ) : null}
                </div>

                {g.type === "lifetime" && g.practices && g.practices.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {g.practices.map((p) => (
                      <span
                        key={p.id}
                        className="text-theme-fg-muted bg-theme-surface-raised rounded px-1.5 text-xs"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
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
