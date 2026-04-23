/**
 * Category Styling Utilities
 *
 * Helper functions for applying category colors using explicit CSS utility classes.
 * Part of the hybrid theming approach for category colors.
 *
 * @see src/styles/utilities.css - Category utility classes
 * @see src/app/globals.css - CSS import hub
 */

import type { CSSProperties } from "react";

/**
 * Standard opacity levels available as explicit utility classes.
 * Using these values gives best performance (no runtime color-mix).
 */
export type OpacityLevel = 10 | 15 | 20 | 30;

/**
 * Fallback color used when an event has no category assigned.
 * Neutral blue-grey in oklch.
 */
export const FALLBACK_CATEGORY_COLOR = "oklch(0.6 0.15 250)";

/**
 * Get category background className for category utility classes.
 *
 * @param categoryName - Category slug (e.g., "ganesha", "shiva")
 * @param opacity - Opacity level (10, 15, 20, or 30)
 * @returns CSS className
 *
 * @example
 * ```tsx
 * <div className={getCategoryBgClass("ganesha", 15)}>
 *   Category content
 * </div>
 * ```
 */
export function getCategoryBgClass(
  categoryName: string,
  opacity: OpacityLevel = 15
): string {
  return `bg-category-${categoryName}-${opacity}`;
}

/**
 * Get category border className.
 *
 * @param categoryName - Category slug
 * @param opacity - Opacity level (10, 15, 20, or 30)
 * @returns CSS className
 *
 * @example
 * ```tsx
 * <div className={getCategoryBorderClass("shiva", 20)}>
 *   With colored border
 * </div>
 * ```
 */
/**
 * Get category text className with lightness adjusted for readability.
 * Light mode: L clamped to [0.35, 0.55]. Dark mode: L clamped to [0.68, 0.82].
 */
export function getCategoryTextClass(categoryName: string): string {
  return `text-category-${categoryName}`;
}

export function getCategoryBorderClass(
  categoryName: string,
  opacity: OpacityLevel = 20
): string {
  return `border-category-${categoryName}-${opacity}`;
}

/**
 * Fallback: Get inline style for non-standard opacity.
 * Use this only for edge cases where standard opacity levels don't work!
 *
 * For standard opacity (10, 15, 20, 30), prefer getCategoryBgClass instead.
 *
 * @param categoryColor - oklch color string (e.g., "oklch(0.75 0.15 30)")
 * @param opacity - Any opacity percentage (0-100)
 * @returns Inline style object
 *
 * @example
 * ```tsx
 * // Use this for non-standard opacity like 25% or 12%
 * <div style={getCategoryDynamicStyle("oklch(0.75 0.15 30)", 25)}>
 *   Custom opacity
 * </div>
 * ```
 */
export function getCategoryDynamicStyle(
  categoryColor: string,
  opacity: number
): CSSProperties {
  return {
    backgroundColor: `color-mix(in oklch, ${categoryColor} ${opacity}%, transparent)`,
  };
}

/**
 * Fallback: Get dynamic className with custom property.
 * Requires setting --category-color inline style.
 *
 * @param opacity - Opacity level (10, 15, 20, or 30)
 * @returns CSS className
 *
 * @example
 * ```tsx
 * <div
 *   className={getDynamicCategoryClass(15)}
 *   style={{ "--category-color": categoryColor } as CSSProperties}
 * >
 *   Dynamic category color
 * </div>
 * ```
 */
export function getDynamicCategoryClass(opacity: OpacityLevel): string {
  return `bg-category-dynamic-${opacity}`;
}

/**
 * Resolve the correct category color for the current color mode.
 * Use this for inline styles where CSS-class dark-mode overrides aren't possible
 * (e.g. React Big Calendar eventStyleGetter, dynamic gradients).
 *
 * @param color - Light-mode oklch color from DB
 * @param colorDark - Dark-mode oklch color from DB (nullable)
 * @param isDark - Whether dark mode is currently active
 * @returns The resolved oklch color string
 */
export function resolveCategoryColor(
  color: string,
  colorDark: string | null | undefined,
  isDark: boolean
): string {
  return isDark && colorDark ? colorDark : color;
}
