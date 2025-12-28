/**
 * Category Configuration - Single Source of Truth
 *
 * ALL category definitions live here. This file is the canonical source for:
 * - Category metadata (name, icon, color)
 * - Database seeding (via npm run db:seed)
 * - UI components (FilterSidebar, EventForm)
 *
 * Architecture:
 * - TypeScript definitions → Seed script → Database
 * - Database stores categories for FK relations with Events
 * - UI components can use CATEGORY_CATALOG directly for static lists
 *
 * @see src/scripts/seed.ts - Database seeding
 * @see src/lib/constants.ts - Re-exports for UI components
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Complete category definition.
 * Used for database seeding and as source of truth.
 */
export interface CategoryDefinition {
  /** Unique identifier (slug) - used as database name field */
  readonly name: string;
  /** Human-readable name for UI */
  readonly displayName: string;
  /** Emoji icon */
  readonly icon: string;
  /** oklch color string for visual distinction */
  readonly color: string;
  /** Sort order for consistent display */
  readonly sortOrder: number;
  /** Optional description */
  readonly description?: string;
}

/**
 * Minimal category data for UI filter components.
 * Compatible with existing CATEGORIES format in constants.ts
 */
export interface CategoryOption {
  readonly value: string;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
}

// =============================================================================
// CATEGORY CATALOG - THE SOURCE OF TRUTH
// =============================================================================

/**
 * All category definitions.
 * Order determines default sort in UI when sortOrder is equal.
 */
export const CATEGORY_CATALOG: readonly CategoryDefinition[] = [
  {
    name: "ganesha",
    displayName: "Ganesha",
    icon: "🐘",
    color: "oklch(0.75 0.15 30)",
    sortOrder: 1,
    description: "Lord of beginnings and remover of obstacles",
  },
  {
    name: "shiva",
    displayName: "Shiva",
    icon: "🔱",
    color: "oklch(0.70 0.10 250)",
    sortOrder: 2,
    description: "The transformer and destroyer",
  },
  {
    name: "vishnu",
    displayName: "Vishnu",
    icon: "🪷",
    color: "oklch(0.70 0.15 200)",
    sortOrder: 3,
    description: "The preserver and protector",
  },
  {
    name: "durga",
    displayName: "Durga",
    icon: "⚔️",
    color: "oklch(0.70 0.18 0)",
    sortOrder: 4,
    description: "The warrior goddess",
  },
  {
    name: "lakshmi",
    displayName: "Lakshmi",
    icon: "✨",
    color: "oklch(0.80 0.15 85)",
    sortOrder: 5,
    description: "Goddess of wealth and prosperity",
  },
  {
    name: "saraswati",
    displayName: "Saraswati",
    icon: "🎵",
    color: "oklch(0.85 0.10 90)",
    sortOrder: 6,
    description: "Goddess of knowledge and arts",
  },
  {
    name: "hanuman",
    displayName: "Hanuman",
    icon: "🏔️",
    color: "oklch(0.65 0.15 30)",
    sortOrder: 7,
    description: "The devoted servant of Rama",
  },
  {
    name: "krishna",
    displayName: "Krishna",
    icon: "🦚",
    color: "oklch(0.60 0.20 270)",
    sortOrder: 8,
    description: "The divine lover and philosopher",
  },
  {
    name: "rama",
    displayName: "Rama",
    icon: "🏹",
    color: "oklch(0.65 0.12 150)",
    sortOrder: 9,
    description: "The ideal king and dharma upholder",
  },
  {
    name: "dattatreya",
    displayName: "Dattatreya",
    icon: "🕉️",
    color: "oklch(0.70 0.12 60)",
    sortOrder: 10,
    description: "The combined form of Brahma, Vishnu, and Shiva",
  },
  {
    name: "skanda",
    displayName: "Skanda/Murugan",
    icon: "🔥",
    color: "oklch(0.70 0.15 15)",
    sortOrder: 11,
    description: "The god of war and victory",
  },
  {
    name: "surya",
    displayName: "Surya/Sun",
    icon: "☀️",
    color: "oklch(0.75 0.20 70)",
    sortOrder: 12,
    description: "The Sun god and solar transitions (Sankranti)",
  },
  {
    name: "general",
    displayName: "General",
    icon: "📅",
    color: "oklch(0.70 0.10 180)",
    sortOrder: 13,
    description: "General festivals and observances",
  },
] as const;

// =============================================================================
// DERIVED VALUES
// =============================================================================

/** All category names as a readonly array */
export const CATEGORY_NAMES = CATEGORY_CATALOG.map((c) => c.name) as readonly string[];

/** Number of categories */
export const CATEGORY_COUNT = CATEGORY_CATALOG.length;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a category by name.
 */
export function getCategoryByName(name: string): CategoryDefinition | undefined {
  return CATEGORY_CATALOG.find((c) => c.name === name);
}

/**
 * Convert CategoryDefinition to CategoryOption (for UI components).
 * Maps: name → value, displayName → label
 */
export function toCategoryOption(category: CategoryDefinition): CategoryOption {
  return {
    value: category.name,
    label: category.displayName,
    icon: category.icon,
    color: category.color,
  };
}

/**
 * Get all categories as CategoryOptions (for UI filter components).
 */
export function getAllCategoryOptions(): readonly CategoryOption[] {
  return CATEGORY_CATALOG.map(toCategoryOption);
}

/**
 * Validate if a category name exists.
 */
export function isValidCategoryName(name: string): boolean {
  return CATEGORY_NAMES.includes(name);
}

/**
 * Get category color by name.
 */
export function getCategoryColor(name: string): string | undefined {
  return getCategoryByName(name)?.color;
}

/**
 * Get category icon by name.
 */
export function getCategoryIcon(name: string): string | undefined {
  return getCategoryByName(name)?.icon;
}
