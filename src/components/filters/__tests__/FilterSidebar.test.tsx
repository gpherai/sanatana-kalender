import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterSidebar } from "../FilterSidebar";
import { CATEGORIES, EVENT_TYPES, SPECIAL_TITHIS } from "@/lib/domain";
import type { FilterState } from "@/hooks/useFilters";

const BASE_FILTERS: FilterState = {
  search: "",
  dateFrom: "",
  dateTo: "",
  categories: [],
  eventTypes: [],
  specialTithis: [],
  sortBy: "date",
  sortOrder: "asc",
};

describe("FilterSidebar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows active filter count and clears filters", async () => {
    const onClearFilters = vi.fn();
    render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={vi.fn()}
        onToggleFilter={vi.fn()}
        onClearFilters={onClearFilters}
        activeFilterCount={2}
      />
    );
    const clearButton = screen.getByRole("button", { name: /Wissen/i });
    await userEvent.click(clearButton);
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("debounces search input changes and handles clearing", async () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    const { rerender } = render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={0}
      />
    );

    const input = screen.getByPlaceholderText("Zoeken...");
    fireEvent.change(input, { target: { value: "shiv" } });

    // Coverage for line 104 (skip sync if same value)
    fireEvent.change(input, { target: { value: "shiv" } });

    vi.advanceTimersByTime(300);
    expect(onFilterChange).toHaveBeenCalledWith("search", "shiv");

    rerender(
      <FilterSidebar
        filters={{ ...BASE_FILTERS, search: "shiv" }}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={1}
      />
    );
    const xButton = screen.getByRole("button", { name: /Zoekopdracht wissen/i });

    // Line 123 check: call handleClear when NOT empty
    fireEvent.click(xButton);
    expect(onFilterChange).toHaveBeenCalledWith("search", "");

    // Line 123 again: skip callback if already empty (lastSyncedRef.current is already "")
    fireEvent.click(xButton);
  });

  it("handles DateInput clearing", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    const { rerender, container } = render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={0}
      />
    );

    const sectionButton = screen.getByText(/Periode/i).closest("button")!;
    await user.click(sectionButton);

    const inputs = container.querySelectorAll('input[type="date"]');

    // Change date
    fireEvent.change(inputs[0]!, { target: { value: "2025-01-01" } });
    expect(onFilterChange).toHaveBeenCalledWith("dateFrom", "2025-01-01");

    rerender(
      <FilterSidebar
        filters={{ ...BASE_FILTERS, dateFrom: "2025-01-01" }}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={1}
      />
    );

    const clearPeriod = screen.getByText("Periode wissen");
    await user.click(clearPeriod);
    expect(onFilterChange).toHaveBeenCalledWith("dateFrom", "");
    expect(onFilterChange).toHaveBeenCalledWith("dateTo", "");
  });

  it("toggles sections and filters", async () => {
    const onToggleFilter = vi.fn();
    const user = userEvent.setup();
    render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={vi.fn()}
        onToggleFilter={onToggleFilter}
        onClearFilters={vi.fn()}
        activeFilterCount={0}
      />
    );

    await user.click(screen.getByText(CATEGORIES[0]!.label));
    expect(onToggleFilter).toHaveBeenCalledWith("categories", CATEGORIES[0]!.value);

    // Event Types (Line 328 callback coverage)
    await user.click(screen.getByText(EVENT_TYPES[0]!.label));
    expect(onToggleFilter).toHaveBeenCalledWith("eventTypes", EVENT_TYPES[0]!.value);

    // Special Tithis (Line 343 callback coverage)
    const tithiSection = screen.getByText(/Speciale dagen/i).closest("button")!;
    await user.click(tithiSection);
    await user.click(screen.getByText(SPECIAL_TITHIS[0]!.label));
    expect(onToggleFilter).toHaveBeenCalledWith(
      "specialTithis",
      SPECIAL_TITHIS[0]!.value
    );

    const godSection = screen.getByText(/Godheden/i).closest("button")!;
    await user.click(godSection);
    expect(screen.queryByText(CATEGORIES[0]!.label)).toBeNull();
  });
});
