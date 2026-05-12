export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="border-theme-primary-20 border-t-theme-primary h-12 w-12 animate-spin rounded-full border-4" />
        <span className="text-theme-fg-muted text-sm">Laden...</span>
      </div>
    </div>
  );
}
