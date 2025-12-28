import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

type LayoutWidth = "full" | "medium" | "narrow";

interface PageLayoutProps {
  /**
   * Page content (required unless loading={true})
   */
  children?: ReactNode;

  /**
   * Maximum content width
   * - full: No max-width (default for content pages)
   * - medium: max-w-4xl (for settings, wide forms)
   * - narrow: max-w-2xl (for single-column forms)
   */
  width?: LayoutWidth;

  /**
   * Vertical spacing between direct children
   * @default false
   */
  spacing?: boolean;

  /**
   * Show loading state instead of content
   * @default false
   */
  loading?: boolean;

  /**
   * Loading message
   * @default "Laden..."
   */
  loadingMessage?: string;

  /**
   * Custom className for main element
   */
  className?: string;
}

// =============================================================================
// WIDTH MAPPING
// =============================================================================

const WIDTH_CLASSES: Record<LayoutWidth, string> = {
  full: "",
  medium: "max-w-4xl",
  narrow: "max-w-2xl",
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Standardized page layout wrapper
 *
 * Provides consistent:
 * - Full-height background (min-h-screen)
 * - Theme-aware background color (bg-theme-bg-subtle)
 * - Responsive container with padding
 * - Optional max-width constraints
 * - Optional vertical spacing
 * - Built-in loading state
 *
 * @example Full width content page
 * ```tsx
 * <PageLayout spacing>
 *   <TodayHero />
 *   <Calendar />
 * </PageLayout>
 * ```
 *
 * @example Settings page with max-width
 * ```tsx
 * <PageLayout width="medium">
 *   <SettingsForm />
 * </PageLayout>
 * ```
 *
 * @example Form with loading
 * ```tsx
 * <PageLayout width="narrow" loading={isLoading} loadingMessage="Opslaan...">
 *   <EventForm />
 * </PageLayout>
 * ```
 */
export function PageLayout({
  children,
  width = "full",
  spacing = false,
  loading = false,
  loadingMessage = "Laden...",
  className,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-theme-bg-subtle">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-theme-primary mx-auto mb-2 h-8 w-8 animate-spin" />
            <p className="text-sm text-theme-fg-muted">{loadingMessage}</p>
          </div>
        </div>
      ) : (
        <main
          className={cn(
            "container mx-auto px-4 py-6",
            WIDTH_CLASSES[width],
            spacing && "space-y-8",
            className
          )}
        >
          {children}
        </main>
      )}
    </div>
  );
}
