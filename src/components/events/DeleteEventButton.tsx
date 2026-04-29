"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { logError } from "@/lib/utils";

interface DeleteEventButtonProps {
  eventId: string;
  eventName: string;
}

export function DeleteEventButton({ eventId, eventName }: DeleteEventButtonProps) {
  const router = useRouter();
  const { error } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? "Failed");
      }
      router.push("/events");
      router.refresh();
    } catch (err) {
      logError("Failed to delete event", err);
      error("Kon event niet verwijderen");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--theme-error-fg)]">
          &ldquo;{eventName}&rdquo; verwijderen?
        </span>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="text-theme-fg-secondary hover:text-theme-fg focus-visible:ring-theme-primary cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Nee
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--theme-error)] px-3 py-1.5 text-sm font-medium text-white transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Ja, verwijderen
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[var(--theme-error-bg)] px-4 py-2 text-sm font-medium text-[var(--theme-error-fg)] transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--theme-error-fg)] focus-visible:outline-none"
    >
      <Trash2 className="h-4 w-4" />
      Verwijderen
    </button>
  );
}
