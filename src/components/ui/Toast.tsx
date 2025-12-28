"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Toast auto-dismiss duration in milliseconds */
const TOAST_DURATION_MS = 4000;

// =============================================================================
// TYPES
// =============================================================================

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto remove after configured duration
      setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION_MS);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );
  const error = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast]
  );
  const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const styles = {
    success:
      "bg-[var(--theme-success-bg)] text-[var(--theme-success-fg)] border-[var(--theme-success-border)]",
    error:
      "bg-[var(--theme-error-bg)] text-[var(--theme-error-fg)] border-[var(--theme-error-border)]",
    info: "bg-[var(--theme-info-bg)] text-[var(--theme-info-fg)] border-[var(--theme-info-border)]",
  };

  const iconStyles = {
    success: "text-[var(--theme-success)]",
    error: "text-[var(--theme-error)]",
    info: "text-[var(--theme-info)]",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg",
        "animate-in slide-in-from-right-5 fade-in duration-200",
        "max-w-[400px] min-w-[280px]",
        styles[toast.type]
      )}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconStyles[toast.type])} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="rounded p-1 transition-colors hover:bg-theme-surface-hover focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-1"
        aria-label="Sluiten"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
