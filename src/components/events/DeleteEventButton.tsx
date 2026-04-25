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
      if (!response.ok) throw new Error("Failed");
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
          className="text-theme-fg-secondary hover:text-theme-fg rounded-lg px-3 py-1.5 text-sm transition-colors"
        >
          Nee
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--theme-error)] px-3 py-1.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
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
      className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--theme-error-bg)] px-4 py-2 text-sm font-medium text-[var(--theme-error-fg)] transition-opacity hover:opacity-80"
    >
      <Trash2 className="h-4 w-4" />
      Verwijderen
    </button>
  );
}
