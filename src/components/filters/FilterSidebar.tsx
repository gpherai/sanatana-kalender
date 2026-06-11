"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Tag,
  List,
  Moon,
} from "lucide-react";
import { CATEGORIES, EVENT_TYPES, SPECIAL_TITHIS } from "@/lib/domain";
import type { FilterState } from "@/hooks/useFilters";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleFilter: (
    key: "categories" | "eventTypes" | "specialTithis",
    value: string
  ) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  className?: string;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-theme-primary text-theme-fg-secondary mb-2 flex w-full cursor-pointer items-center justify-between text-left font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-theme-fg-muted flex h-4 w-4 items-center justify-center">
            {icon}
          </span>
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
        aria-label="Zoeken"
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
          type="button"
          onClick={handleClear}
          aria-label="Zoekopdracht wissen"
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
  className,
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
    <aside
      className={cn(
        "bg-theme-surface sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl p-4 shadow-md",
        className
      )}
    >
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
            type="button"
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

      {/* Periode */}
      <FilterSection
        title="Periode"
        icon={<CalendarDays className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            <input
              type="date"
              aria-label="Datum van"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange("dateFrom", e.target.value)}
              className={cn(
                "w-full rounded-lg px-2 py-1.5 text-sm",
                "bg-theme-surface-raised",
                "border-theme-border border",
                "ring-theme-primary-50 focus:border-theme-primary focus:ring-2 focus:outline-none"
              )}
            />
            <span
              className="text-theme-fg-muted text-center text-xs select-none"
              aria-hidden="true"
            >
              →
            </span>
            <input
              type="date"
              aria-label="Datum tot"
              value={filters.dateTo}
              onChange={(e) => onFilterChange("dateTo", e.target.value)}
              min={filters.dateFrom || undefined}
              className={cn(
                "w-full rounded-lg px-2 py-1.5 text-sm",
                "bg-theme-surface-raised",
                "border-theme-border border",
                "ring-theme-primary-50 focus:border-theme-primary focus:ring-2 focus:outline-none"
              )}
            />
            {(filters.dateFrom || filters.dateTo) && (
              <button
                type="button"
                onClick={() => {
                  onFilterChange("dateFrom", "");
                  onFilterChange("dateTo", "");
                }}
                className="text-theme-fg-muted hover:text-theme-primary flex items-center gap-1 text-xs transition-colors"
              >
                <X className="h-3 w-3" />
                Periode wissen
              </button>
            )}
          </div>
        </div>
      </FilterSection>

      {/* Godheden */}
      <FilterSection title="Godheden" icon={<Tag className="h-4 w-4" />}>
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

      {/* Soort evenement */}
      <FilterSection title="Soort evenement" icon={<List className="h-4 w-4" />}>
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

      {/* Speciale Dagen */}
      <FilterSection
        title="Speciale dagen"
        icon={<Moon className="h-4 w-4" />}
        defaultOpen={false}
      >
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
    </aside>
  );
}
