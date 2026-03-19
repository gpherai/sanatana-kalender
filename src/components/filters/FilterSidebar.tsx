"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { CATEGORIES, EVENT_TYPES, IMPORTANCE_LEVELS, SPECIAL_TITHIS } from "@/lib/domain";
import type { FilterState } from "@/hooks/useFilters";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleFilter: (
    key: "categories" | "eventTypes" | "importances" | "specialTithis",
    value: string
  ) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

interface FilterSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-theme-border mb-4 border-b pb-4 last:mb-0 last:border-0 last:pb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-theme-primary text-theme-fg-secondary mb-2 flex w-full items-center justify-between text-left font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}

interface CheckboxItemProps {
  label: string;
  icon?: string;
  checked: boolean;
  onChange: () => void;
  color?: string;
}

function CheckboxItem({ label, icon, checked, onChange, color }: CheckboxItemProps) {
  return (
    <label className="hover:bg-theme-hover flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="border-theme-border h-4 w-4 rounded accent-[var(--theme-primary)]"
      />
      {icon && <span>{icon}</span>}
      <span
        className="text-theme-fg-secondary flex-1 text-sm"
        style={color ? { color } : undefined}
      >
        {label}
      </span>
    </label>
  );
}

/**
 * Search input component with debounced onChange.
 * Uses key-based reset pattern to handle external clears.
 * Debounce is handled via setTimeout in event handler (no useEffect setState).
 */
function SearchInput({
  initialValue,
  onDebouncedChange,
  debounceMs = 300,
}: {
  initialValue: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef(initialValue);

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      // Clear any pending debounce
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Schedule debounced callback
      timeoutRef.current = setTimeout(() => {
        if (newValue !== lastSyncedRef.current) {
          lastSyncedRef.current = newValue;
          onDebouncedChange(newValue);
        }
      }, debounceMs);
    },
    [onDebouncedChange, debounceMs]
  );

  const handleClear = useCallback(() => {
    setValue("");

    // Clear any pending debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Immediately sync empty value
    if (lastSyncedRef.current !== "") {
      lastSyncedRef.current = "";
      onDebouncedChange("");
    }
  }, [onDebouncedChange]);

  return (
    <div className="relative">
      <Search className="text-theme-fg-subtle absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <input
        type="text"
        placeholder="Zoeken..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "w-full rounded-lg py-2 pr-8 pl-9 text-sm",
          "bg-theme-surface-raised",
          "border-theme-border border",
          "ring-theme-primary-50 focus:border-theme-primary focus:ring-2 focus:outline-none",
          "placeholder:text-theme-fg-subtle"
        )}
      />
      {value && (
        <button
          onClick={handleClear}
          className="text-theme-fg-subtle hover:text-theme-fg-secondary absolute top-1/2 right-3 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onToggleFilter,
  onClearFilters,
  activeFilterCount,
}: FilterSidebarProps) {
  // Stable callback for search changes
  const handleSearchChange = useCallback(
    (value: string) => {
      onFilterChange("search", value);
    },
    [onFilterChange]
  );

  // Memoize key to prevent unnecessary remounts
  // Only remount SearchInput when search goes from non-empty to empty (external clear)
  const searchKey = useMemo(() => {
    return filters.search === "" ? "empty" : "has-value";
  }, [filters.search]);

  return (
    <aside className="bg-theme-surface sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl p-4 shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-theme-fg flex items-center gap-2 font-semibold">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-theme-primary-15 text-theme-primary ml-1 rounded-full px-2 py-0.5 text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="hover:text-theme-primary text-theme-fg-muted flex items-center gap-1 text-xs transition-colors"
          >
            <X className="h-3 w-3" />
            Wissen
          </button>
        )}
      </div>

      {/* Search - uses key to reset when filters.search is cleared externally */}
      <div className="mb-4">
        <SearchInput
          key={searchKey}
          initialValue={filters.search}
          onDebouncedChange={handleSearchChange}
        />
      </div>

      {/* Categories */}
      <FilterSection title="Categorieën" icon="🏷️">
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => (
            <CheckboxItem
              key={cat.value}
              label={cat.label}
              icon={cat.icon}
              color={cat.color}
              checked={filters.categories.includes(cat.value)}
              onChange={() => onToggleFilter("categories", cat.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Event Types */}
      <FilterSection title="Event Type" icon="📅">
        <div className="space-y-0.5">
          {EVENT_TYPES.map((type) => (
            <CheckboxItem
              key={type.value}
              label={type.label}
              icon={type.icon}
              checked={filters.eventTypes.includes(type.value)}
              onChange={() => onToggleFilter("eventTypes", type.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Special Tithis */}
      <FilterSection title="Speciale Dagen" icon="🌙" defaultOpen={false}>
        <div className="space-y-0.5">
          {SPECIAL_TITHIS.map((tithi) => (
            <CheckboxItem
              key={tithi.value}
              label={tithi.label}
              icon={tithi.icon}
              checked={filters.specialTithis.includes(tithi.value)}
              onChange={() => onToggleFilter("specialTithis", tithi.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Importance */}
      <FilterSection title="Belangrijkheid" icon="⭐" defaultOpen={false}>
        <div className="space-y-0.5">
          {IMPORTANCE_LEVELS.map((imp) => (
            <CheckboxItem
              key={imp.value}
              label={imp.label}
              checked={filters.importances.includes(imp.value)}
              onChange={() => onToggleFilter("importances", imp.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Sort Options */}
      <FilterSection title="Sortering" icon="↕️" defaultOpen={false}>
        <div className="space-y-2">
          <div>
            <label className="text-theme-fg-muted mb-1 block text-xs">Sorteer op</label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange("sortBy", e.target.value as FilterState["sortBy"])
              }
              className={cn(
                "w-full rounded-lg px-3 py-2 text-sm",
                "bg-theme-surface-raised",
                "border-theme-border border",
                "ring-theme-primary-50 focus:border-theme-primary focus:ring-2 focus:outline-none"
              )}
            >
              <option value="date">Datum</option>
              <option value="name">Naam</option>
            </select>
          </div>
          <div>
            <label className="text-theme-fg-muted mb-1 block text-xs">Volgorde</label>
            <select
              value={filters.sortOrder}
              onChange={(e) =>
                onFilterChange("sortOrder", e.target.value as FilterState["sortOrder"])
              }
              className={cn(
                "w-full rounded-lg px-3 py-2 text-sm",
                "bg-theme-surface-raised",
                "border-theme-border border",
                "ring-theme-primary-50 focus:border-theme-primary focus:ring-2 focus:outline-none"
              )}
            >
              <option value="asc">Oplopend (A-Z / Oud-Nieuw)</option>
              <option value="desc">Aflopend (Z-A / Nieuw-Oud)</option>
            </select>
          </div>
        </div>
      </FilterSection>
    </aside>
  );
}
