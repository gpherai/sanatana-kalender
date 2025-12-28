"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, X, Plus } from "lucide-react";
import { cn, logError } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useFetch } from "@/hooks";
import {
  eventFormSchema,
  transformFormToApi,
  type EventFormData,
} from "@/lib/validations";
import {
  EVENT_TYPES,
  IMPORTANCE_LEVELS,
  TITHIS,
  NAKSHATRAS,
  MAAS,
} from "@/lib/constants";
import type { Category } from "@/types/calendar";

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: Partial<EventFormData> & { id?: string };
  onSuccess?: () => void;
}

export function EventForm({ mode, initialData, onSuccess }: EventFormProps) {
  const router = useRouter();
  const { success, error } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    eventType: initialData?.eventType ?? "FESTIVAL",
    categoryId: initialData?.categoryId ?? "",
    importance: initialData?.importance ?? "MODERATE",
    recurrenceType: initialData?.recurrenceType ?? "NONE",
    date: initialData?.date ?? "",
    endDate: initialData?.endDate ?? "",
    startTime: initialData?.startTime ?? "",
    endTime: initialData?.endTime ?? "",
    tithi: initialData?.tithi ?? "",
    nakshatra: initialData?.nakshatra ?? "",
    maas: initialData?.maas ?? "",
    tags: initialData?.tags ?? "",
    notes: initialData?.notes ?? "",
  });

  // Load categories from database using useFetch hook
  const {
    data: categories,
    loading: isLoadingCategories,
  } = useFetch<Category[]>("/api/categories", {
    errorMessage: "Failed to load categories",
    onError: (err) => logError("Failed to load categories", err),
  });

  // Tags as array for chip display
  const [tagInput, setTagInput] = useState("");
  const tagsArray = formData.tags
    ? formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const updateField = <K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tagsArray.includes(tag)) {
      const newTags = [...tagsArray, tag].join(", ");
      updateField("tags", newTags);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tagsArray.filter((t) => t !== tagToRemove).join(", ");
    updateField("tags", newTags);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const result = eventFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = transformFormToApi(result.data);
      const url = mode === "create" ? "/api/events" : `/api/events/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Er is iets misgegaan");
      }

      success(mode === "create" ? "Event aangemaakt!" : "Event bijgewerkt!");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/events");
        router.refresh();
      }
    } catch (err) {
      error(err instanceof Error ? err.message : "Er is iets misgegaan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group tithis by paksha for optgroup
  const shuklaTithis = TITHIS.filter((t) => t.paksha === "Shukla");
  const krishnaTithis = TITHIS.filter((t) => t.paksha === "Krishna");

  // Input base classes with theme-aware focus
  const inputClasses = cn(
    "w-full px-3 py-2 rounded-lg border bg-theme-surface",
    "text-theme-fg",
    "focus:outline-none focus:ring-2 ring-theme-primary/50 focus:border-theme-primary"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium tracking-wide text-theme-fg-muted uppercase">
          Basis Informatie
        </h3>

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-theme-fg-secondary"
          >
            Naam <span className="text-theme-error">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={cn(
              inputClasses,
              errors.name ? "border-theme-error" : "border-theme-border"
            )}
            placeholder="Bijv. Maha Shivaratri"
          />
          {errors.name && <p className="mt-1 text-sm text-theme-error">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-theme-fg-secondary"
          >
            Beschrijving
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className={cn(inputClasses, "border-theme-border")}
            placeholder="Optionele beschrijving van het event..."
          />
        </div>

        {/* Type, Category, Importance Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Event Type */}
          <div>
            <label
              htmlFor="eventType"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Type <span className="text-theme-error">*</span>
            </label>
            <select
              id="eventType"
              value={formData.eventType}
              onChange={(e) =>
                updateField("eventType", e.target.value as EventFormData["eventType"])
              }
              className={cn(inputClasses, "border-theme-border")}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category - Now loads from database */}
          <div>
            <label
              htmlFor="categoryId"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Categorie
            </label>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              disabled={isLoadingCategories}
              className={cn(
                inputClasses,
                "border-theme-border",
                isLoadingCategories && "opacity-50"
              )}
            >
              <option value="">Geen categorie</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Importance */}
          <div>
            <label
              htmlFor="importance"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Belang
            </label>
            <select
              id="importance"
              value={formData.importance}
              onChange={(e) =>
                updateField("importance", e.target.value as EventFormData["importance"])
              }
              className={cn(inputClasses, "border-theme-border")}
            >
              {IMPORTANCE_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium tracking-wide text-theme-fg-muted uppercase">
          Datum & Tijd
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <div>
            <label
              htmlFor="date"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Startdatum <span className="text-theme-error">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => updateField("date", e.target.value)}
              className={cn(
                inputClasses,
                errors.date ? "border-theme-error" : "border-theme-border"
              )}
            />
            {errors.date && <p className="mt-1 text-sm text-theme-error">{errors.date}</p>}
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="endDate"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Einddatum <span className="text-xs text-theme-fg-subtle">(optioneel)</span>
            </label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              min={formData.date}
              className={cn(inputClasses, "border-theme-border")}
            />
          </div>

          {/* Start Time */}
          <div>
            <label
              htmlFor="startTime"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Starttijd <span className="text-xs text-theme-fg-subtle">(optioneel)</span>
            </label>
            <input
              type="time"
              id="startTime"
              value={formData.startTime}
              onChange={(e) => updateField("startTime", e.target.value)}
              className={cn(inputClasses, "border-theme-border")}
            />
          </div>

          {/* End Time */}
          <div>
            <label
              htmlFor="endTime"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Eindtijd <span className="text-xs text-theme-fg-subtle">(optioneel)</span>
            </label>
            <input
              type="time"
              id="endTime"
              value={formData.endTime}
              onChange={(e) => updateField("endTime", e.target.value)}
              className={cn(inputClasses, "border-theme-border")}
            />
          </div>
        </div>
      </div>

      {/* Lunar Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium tracking-wide text-theme-fg-muted uppercase">
          Lunaire Informatie <span className="text-xs font-normal">(optioneel)</span>
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Tithi */}
          <div>
            <label
              htmlFor="tithi"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Tithi
            </label>
            <select
              id="tithi"
              value={formData.tithi}
              onChange={(e) => updateField("tithi", e.target.value)}
              className={cn(inputClasses, "border-theme-border")}
            >
              <option value="">Selecteer tithi...</option>
              <optgroup label="Shukla Paksha (Wassende maan)">
                {shuklaTithis.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Krishna Paksha (Afnemende maan)">
                {krishnaTithis.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Nakshatra */}
          <div>
            <label
              htmlFor="nakshatra"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Nakshatra
            </label>
            <select
              id="nakshatra"
              value={formData.nakshatra}
              onChange={(e) => updateField("nakshatra", e.target.value)}
              className={cn(inputClasses, "border-theme-border")}
            >
              <option value="">Selecteer nakshatra...</option>
              {NAKSHATRAS.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          {/* Maas */}
          <div>
            <label
              htmlFor="maas"
              className="mb-1 block text-sm font-medium text-theme-fg-secondary"
            >
              Maas (Maand)
            </label>
            <select
              id="maas"
              value={formData.maas}
              onChange={(e) => updateField("maas", e.target.value)}
              className={cn(inputClasses, "border-theme-border")}
            >
              <option value="">Selecteer maas...</option>
              {MAAS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tags Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium tracking-wide text-theme-fg-muted uppercase">
          Tags <span className="text-xs font-normal">(optioneel)</span>
        </h3>

        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className={cn(inputClasses, "flex-1 border-theme-border")}
              placeholder="Voeg tag toe..."
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-lg bg-theme-surface-raised px-3 py-2 transition-colors hover:bg-theme-hover"
            >
              <Plus className="h-5 w-5 text-theme-fg-secondary" />
            </button>
          </div>

          {/* Tags Display - theme-aware */}
          {tagsArray.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tagsArray.map((tag) => (
                <span
                  key={tag}
                  className="bg-theme-primary/15 text-theme-primary inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-theme-primary/25 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium tracking-wide text-theme-fg-muted uppercase">
          Notities <span className="text-xs font-normal">(optioneel)</span>
        </h3>

        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={2}
          className={cn(inputClasses, "border-theme-border")}
          placeholder="Specifieke notities voor deze datum..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 border-t border-theme-border pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-theme-fg-secondary transition-colors hover:text-theme-fg"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            "bg-theme-primary text-white hover:opacity-90",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "shadow-theme-primary transition-colors"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === "create" ? "Aanmaken" : "Opslaan"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
