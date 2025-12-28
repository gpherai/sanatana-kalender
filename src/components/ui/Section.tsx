import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

type IconColor = "primary" | "secondary" | "accent" | "muted";

interface SectionProps {
  /** Section title */
  title: string;
  /** Section description (optional) */
  description?: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Icon color variant */
  iconColor?: IconColor;
  /** Section content */
  children: ReactNode;
  /** Additional className for section wrapper */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ICON_COLOR_CLASSES: Record<IconColor, { bg: string; text: string }> = {
  primary: {
    bg: "bg-theme-primary-15",
    text: "text-theme-primary",
  },
  secondary: {
    bg: "bg-theme-secondary-15",
    text: "text-theme-secondary",
  },
  accent: {
    bg: "bg-theme-accent-15",
    text: "text-theme-accent",
  },
  muted: {
    bg: "bg-theme-surface-hover",
    text: "text-theme-fg-muted",
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Section Component
 *
 * Reusable section wrapper with consistent styling for settings and other pages.
 * Provides a card-like container with icon header, title, description, and content area.
 *
 * @example
 * ```tsx
 * <Section
 *   title="Theme"
 *   description="Choose a color scheme"
 *   icon={Palette}
 *   iconColor="primary"
 * >
 *   <ThemeSelector />
 * </Section>
 * ```
 */
export function Section({
  title,
  description,
  icon: Icon,
  iconColor = "primary",
  children,
  className,
}: SectionProps) {
  const colors = ICON_COLOR_CLASSES[iconColor];

  return (
    <section className={cn("rounded-2xl bg-theme-surface p-6 shadow-lg", className)}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className={cn("rounded-lg p-2", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.text)} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-theme-fg">{title}</h2>
          {description && (
            <p className="text-sm text-theme-fg-muted">{description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </section>
  );
}
