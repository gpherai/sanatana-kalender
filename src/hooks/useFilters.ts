"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import {
  CATEGORIES,
  EVENT_TYPES,
  SPECIAL_TITHIS,
  type CategoryValue,
  type EventTypeValue,
} from "@/lib/domain";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Valid sort fields
 */
const VALID_SORT_BY = ["date", "name"] as const;
type SortBy = (typeof VALID_SORT_BY)[number];

/**
 * Valid sort orders
 */
const VALID_SORT_ORDER = ["asc", "desc"] as const;
type SortOrder = (typeof VALID_SORT_ORDER)[number];

/**
 * Filter state interface
 */
export interface FilterState {
  search: string;
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string; // YYYY-MM-DD or ""
  categories: string[];
  eventTypes: string[];
  specialTithis: string[];
  sortBy: SortBy;
  sortOrder: SortOrder;
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: FilterState = {
  search: "",
  dateFrom: "",
  dateTo: "",
  categories: [],
  eventTypes: [],
  specialTithis: [],
  sortBy: "date",
  sortOrder: "asc",
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and normalize sortBy parameter
 */
function validateSortBy(value: string | null): SortBy {
  if (value && VALID_SORT_BY.includes(value as SortBy)) {
    return value as SortBy;
  }
  return DEFAULT_FILTERS.sortBy;
}

/**
 * Validate and normalize sortOrder parameter
 */
function validateSortOrder(value: string | null): SortOrder {
  if (value && VALID_SORT_ORDER.includes(value as SortOrder)) {
    return value as SortOrder;
  }
  return DEFAULT_FILTERS.sortOrder;
}

/**
 * Valid category names from constants
 */
const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.value));

/**
 * Valid event type values from constants
 */
const VALID_EVENT_TYPES = new Set(EVENT_TYPES.map((t) => t.value));

/**
 * Valid special tithi values from constants
 */
const VALID_SPECIAL_TITHIS = new Set(SPECIAL_TITHIS.map((t) => t.value));

/**
 * Filter array to only include valid values
 * This prevents invalid URL params from polluting state
 */
function filterValidValues(values: string[], validSet: Set<string>): string[] {
  return values.filter((v) => validSet.has(v));
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing filter state synced with URL parameters.
 * Provides shareable, bookmarkable filter URLs with browser history support.
 *
 * Features:
 * - URL parameter validation against constants
 * - Normalized sort parameters (whitelist validation)
 * - Active filter count by group (not individual items)
 * - Type-safe filter operations
 *
 * @example
 * const { filters, setFilter, clearFilters, activeFilterCount } = useFilters();
 *
 * // Set single value
 * setFilter("search", "diwali");
 *
 * // Set array value
 * setFilter("categories", ["ganesha", "krishna"]);
 *
 * // Toggle item in array
 * toggleFilter("categories", "shiva");
 *
 * // Clear all
 * clearFilters();
 */
export function useFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse and validate current filters from URL
  const filters: FilterState = useMemo(() => {
    // Parse arrays from comma-separated strings
    const rawCategories =
      searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
    const rawEventTypes = searchParams.get("types")?.split(",").filter(Boolean) ?? [];
    const rawSpecialTithis = searchParams.get("tithis")?.split(",").filter(Boolean) ?? [];

    return {
      search: searchParams.get("search") ?? "",
      dateFrom: searchParams.get("from") ?? "",
      dateTo: searchParams.get("to") ?? "",
      // Validate arrays against known values
      categories: filterValidValues(rawCategories, VALID_CATEGORIES),
      eventTypes: filterValidValues(rawEventTypes, VALID_EVENT_TYPES),
      specialTithis: filterValidValues(rawSpecialTithis, VALID_SPECIAL_TITHIS),
      // Validate sort params with whitelist
      sortBy: validateSortBy(searchParams.get("sortBy")),
      sortOrder: validateSortOrder(searchParams.get("order")),
    };
  }, [searchParams]);

  // Update URL with new params
  const updateURL = useCallback(
    (newParams: URLSearchParams) => {
      const query = newParams.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      window.history.pushState(null, "", url);
    },
    [pathname]
  );

  // Set a single filter value
  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const params = new URLSearchParams(searchParams.toString());

      // Map keys to URL param names
      const paramMap: Record<keyof FilterState, string> = {
        search: "search",
        dateFrom: "from",
        dateTo: "to",
        categories: "categories",
        eventTypes: "types",
        specialTithis: "tithis",
        sortBy: "sortBy",
        sortOrder: "order",
      };

      const paramName = paramMap[key];

      // Handle empty values - remove from URL
      if (
        value === "" ||
        value === DEFAULT_FILTERS[key] ||
        (Array.isArray(value) && value.length === 0)
      ) {
        params.delete(paramName);
      } else if (Array.isArray(value)) {
        params.set(paramName, value.join(","));
      } else {
        params.set(paramName, String(value));
      }

      updateURL(params);
    },
    [searchParams, updateURL]
  );

  // Toggle a value in an array filter
  const toggleFilter = useCallback(
    (key: "categories" | "eventTypes" | "specialTithis", value: string) => {
      const currentValues = filters[key];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      setFilter(key, newValues);
    },
    [filters, setFilter]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    window.history.pushState(null, "", pathname);
  }, [pathname]);

  /**
   * Count active filter GROUPS (not individual items)
   * This provides a more intuitive badge count:
   * - "2 filters" means 2 different filter types are active
   * - Not "5 filters" when 5 categories are selected
   */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.categories.length > 0) count++;
    if (filters.eventTypes.length > 0) count++;
    if (filters.specialTithis.length > 0) count++;
    return count;
  }, [filters]);

  /**
   * Count total individual filter items (for detailed display)
   */
  const activeFilterItemCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    count += filters.categories.length;
    count += filters.eventTypes.length;
    count += filters.specialTithis.length;
    return count;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0;

  // Build query string for API calls
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.dateFrom) params.set("start", filters.dateFrom);
    if (filters.dateTo) params.set("end", filters.dateTo);
    if (filters.categories.length) params.set("categories", filters.categories.join(","));
    if (filters.eventTypes.length) params.set("types", filters.eventTypes.join(","));
    if (filters.specialTithis.length)
      params.set("tithis", filters.specialTithis.join(","));
    params.set("sortBy", filters.sortBy);
    params.set("order", filters.sortOrder);

    return params.toString();
  }, [filters]);

  return {
    filters,
    setFilter,
    toggleFilter,
    clearFilters,
    /** Number of active filter groups (search, categories, types) */
    activeFilterCount,
    /** Total number of individual filter items selected */
    activeFilterItemCount,
    hasActiveFilters,
    buildQueryString,
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { SortBy, SortOrder, CategoryValue, EventTypeValue };
