"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, X, Plus } from "lucide-react";
import { cn, logError } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useFetch } from "@/hooks/useFetch";
import { createEventAction, updateEventAction } from "@/app/events/actions";
import {
  eventFormSchema,
  transformFormToApi,
  type EventFormData,
} from "@/lib/validations";
import {
  EVENT_TYPES,
  TITHIS,
  NAKSHATRAS,
  MAAS,
  SANKRANTIS,
  RECURRENCE_TYPES,
} from "@/lib/domain";
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
    recurrenceType: initialData?.recurrenceType ?? "NONE",
    date: initialData?.date ?? "",
    endDate: initialData?.endDate ?? "",
    startTime: initialData?.startTime ?? "",
    endTime: initialData?.endTime ?? "",
    tithi: initialData?.tithi ?? "",
    nakshatra: initialData?.nakshatra ?? "",
    maas: initialData?.maas ?? "",
    sankranti: initialData?.sankranti ?? "",
    tags: initialData?.tags ?? "",
    notes: initialData?.notes ?? "",
  });

  // Load categories from database using useFetch hook
  const {
    data: categories,
    loading: isLoadingCategories,
    error: categoriesError,
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
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey) {
        document.getElementById(firstKey)?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = transformFormToApi(result.data);
      const editId = initialData?.id;
      if (mode === "edit" && !editId) {
        throw new Error("Event ID is required in edit mode");
      }

      const actionResult =
        mode === "create"
          ? await createEventAction(payload)
          : await updateEventAction(editId!, payload);

      if (!actionResult.success) {
        throw new Error(actionResult.error);
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
        <h2 className="text-theme-fg-muted text-sm font-medium tracking-wide uppercase">
          Basis Informatie
        </h2>

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="text-theme-fg-secondary mb-1 block text-sm font-medium"
          >
            Naam <span className="text-theme-error">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cn(
              inputClasses,
              errors.name ? "border-theme-error" : "border-theme-border"
            )}
            placeholder="Bijv. Maha Shivaratri"
          />
          {errors.name && (
            <p id="name-error" role="alert" className="text-theme-error mt-1 text-sm">
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="text-theme-fg-secondary mb-1 block text-sm font-medium"
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

        {/* Type and Category Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Event Type */}
          <div>
            <label
              htmlFor="eventType"
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
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
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
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
            {categoriesError && (
              <p className="text-theme-error text-xs">Kon categorieën niet laden</p>
            )}
          </div>
        </div>
      </div>

      {/* Date Section */}
      <div className="space-y-4">
        <h2 className="text-theme-fg-muted text-sm font-medium tracking-wide uppercase">
          Datum & Tijd
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <div>
            <label
              htmlFor="date"
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
            >
              Startdatum <span className="text-theme-error">*</span>
            </label>
            <input
              type="date"
              id="date"
              required
              value={formData.date}
              onChange={(e) => updateField("date", e.target.value)}
              aria-invalid={errors.date ? true : undefined}
              aria-describedby={errors.date ? "date-error" : undefined}
              className={cn(
                inputClasses,
                errors.date ? "border-theme-error" : "border-theme-border"
              )}
            />
            {errors.date && (
              <p id="date-error" role="alert" className="text-theme-error mt-1 text-sm">
                {errors.date}
              </p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="endDate"
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
            >
              Einddatum <span className="text-theme-fg-subtle text-xs">(optioneel)</span>
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
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
            >
              Starttijd <span className="text-theme-fg-subtle text-xs">(optioneel)</span>
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
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
            >
              Eindtijd <span className="text-theme-fg-subtle text-xs">(optioneel)</span>
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

      {/* Recurrence Section */}
      <div className="space-y-4">
        <h2 className="text-theme-fg-muted text-sm font-medium tracking-wide uppercase">
          Herhaling
        </h2>
        <div>
          <label
            htmlFor="recurrenceType"
            className="text-theme-fg-secondary mb-1 block text-sm font-medium"
          >
            Type herhaling
          </label>
          <select
            id="recurrenceType"
            value={formData.recurrenceType}
            onChange={(e) =>
              updateField(
                "recurrenceType",
                e.target.value as EventFormData["recurrenceType"]
              )
            }
            className={cn(inputClasses, "border-theme-border")}
          >
            {RECURRENCE_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {(formData.recurrenceType === "YEARLY_LUNAR" ||
            formData.recurrenceType === "MONTHLY_LUNAR") && (
            <p className="text-theme-fg-subtle mt-1 text-xs">
              Vereist een Tithi in de Lunaire Informatie hieronder.
            </p>
          )}
          {formData.recurrenceType === "YEARLY_SOLAR" && (
            <p className="text-theme-fg-subtle mt-1 text-xs">
              Vereist een Sankranti in de Solaire Informatie hieronder.
            </p>
          )}
        </div>
      </div>

      {/* Lunar Info Section */}
      <div className="space-y-4">
        <h2 className="text-theme-fg-muted text-sm font-medium tracking-wide uppercase">
          Lunaire Informatie <span className="text-xs font-normal">(optioneel)</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Tithi */}
          <div>
            <label
              htmlFor="tithi"
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
            >
              Tithi
              {(formData.recurrenceType === "YEARLY_LUNAR" ||
                formData.recurrenceType === "MONTHLY_LUNAR") && (
                <span className="text-theme-error"> *</span>
              )}
            </label>
            <select
              id="tithi"
              required={
                formData.recurrenceType === "YEARLY_LUNAR" ||
                formData.recurrenceType === "MONTHLY_LUNAR"
              }
              value={formData.tithi}
              onChange={(e) => updateField("tithi", e.target.value)}
              aria-invalid={errors.tithi ? true : undefined}
              aria-describedby={errors.tithi ? "tithi-error" : undefined}
              className={cn(
                inputClasses,
                errors.tithi ? "border-theme-error" : "border-theme-border"
              )}
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
            {errors.tithi && (
              <p id="tithi-error" role="alert" className="text-theme-error mt-1 text-sm">
                {errors.tithi}
              </p>
            )}
          </div>

          {/* Nakshatra */}
          <div>
            <label
              htmlFor="nakshatra"
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
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
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
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

      {/* Solar Info Section — only for YEARLY_SOLAR */}
      {formData.recurrenceType === "YEARLY_SOLAR" && (
        <div className="space-y-4">
          <h2 className="text-theme-fg-muted text-sm font-medium tracking-wide uppercase">
            Solaire Informatie
          </h2>
          <div>
            <label
              htmlFor="sankranti"
              className="text-theme-fg-secondary mb-1 block text-sm font-medium"
            >
              Sankranti <span className="text-theme-error">*</span>
            </label>
            <select
              id="sankranti"
              required
              value={formData.sankranti}
              onChange={(e) => updateField("sankranti", e.target.value)}
              aria-invalid={errors.sankranti ? true : undefined}
              aria-describedby={errors.sankranti ? "sankranti-error" : "sankranti-hint"}
              className={cn(
                inputClasses,
                errors.sankranti ? "border-theme-error" : "border-theme-border"
              )}
            >
              <option value="">Selecteer sankranti...</option>
              {SANKRANTIS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p id="sankranti-hint" className="text-theme-fg-subtle mt-1 text-xs">
              Welke Sankranti (zonsovergang) valt dit evenement op?
            </p>
            {errors.sankranti && (
              <p
                id="sankranti-error"
                role="alert"
                className="text-theme-error mt-1 text-sm"
              >
                {errors.sankranti}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tags Section */}
      <div className="space-y-4">
        <h2 className="text-theme-fg-muted text-sm font-medium tracking-wide uppercase">
          Tags <span className="text-xs font-normal">(optioneel)</span>
        </h2>

        <div>
          <div className="flex gap-2">
            <input
              type="text"
              aria-label="Nieuwe tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className={cn(inputClasses, "border-theme-border flex-1")}
              placeholder="Voeg tag toe..."
            />
            <button
              type="button"
              onClick={addTag}
              aria-label="Tag toevoegen"
              className="bg-theme-surface-raised hover:bg-theme-hover focus-visible:ring-theme-primary cursor-pointer rounded-lg px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Plus className="text-theme-fg-secondary h-5 w-5" />
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
                    aria-label={`Tag ${tag} verwijderen`}
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
        <label
          htmlFor="notes"
          className="text-theme-fg-muted block text-sm font-medium tracking-wide uppercase"
        >
          Notities <span className="text-xs font-normal">(optioneel)</span>
        </label>

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
      <div className="border-theme-border flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-theme-fg-secondary hover:text-theme-fg focus-visible:ring-theme-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            "bg-theme-primary text-theme-primary-fg hover:bg-theme-primary/80",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "shadow-theme-primary transition-colors",
            "focus-visible:ring-theme-primary focus-visible:ring-2 focus-visible:outline-none"
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
