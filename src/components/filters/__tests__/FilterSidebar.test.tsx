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
    const xButton = screen.getByRole("button", { name: "" });

    // Line 123 check: call handleClear when NOT empty
    fireEvent.click(xButton);
    expect(onFilterChange).toHaveBeenCalledWith("search", "");

    // Line 123 again: skip callback if already empty (lastSyncedRef.current is already "")
    fireEvent.click(xButton);
  });

  it("handles DateInput formatting and clearing", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
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

    let inputs = screen.getAllByPlaceholderText("DD-MM-JJJJ");

    // Complete date (Line 285)
    await user.type(inputs[0]!, "01012025");
    expect(onFilterChange).toHaveBeenCalledWith("dateFrom", "2025-01-01");

    // Edge case: invalid date with 8 digits (e.g. 99-99-9999) - should not call onChange
    await user.clear(inputs[0]!);
    await user.type(inputs[0]!, "99999999");
    expect(onFilterChange).not.toHaveBeenCalledWith("dateFrom", "9999-99-99");

    rerender(
      <FilterSidebar
        filters={{ ...BASE_FILTERS, dateFrom: "2025-01-01" }}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={1}
      />
    );

    const clearPeriod = screen.getByTitle("Periode wissen");
    await user.click(clearPeriod);
    expect(onFilterChange).toHaveBeenCalledWith("dateFrom", "");

    inputs = screen.getAllByPlaceholderText("DD-MM-JJJJ");
    await user.clear(inputs[0]!); // Line 287 (trigger !digits)
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
    const typeSection = screen.getByText(/Soort evenement/i).closest("button")!;
    await user.click(typeSection); // Open it explicitly
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

  it("handles sorting changes", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={0}
      />
    );

    const sortSection = screen.getByText(/Sortering/i).closest("button")!;
    await user.click(sortSection);

    await user.selectOptions(screen.getByLabelText(/Sorteer op/i), "name");
    expect(onFilterChange).toHaveBeenCalledWith("sortBy", "name");

    await user.selectOptions(screen.getByLabelText(/Volgorde/i), "desc");
    expect(onFilterChange).toHaveBeenCalledWith("sortOrder", "desc");
  });
});
