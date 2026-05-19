import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilters, DEFAULT_FILTERS } from "../useFilters";

// Mock Next.js navigation
const mockSearchParams = new URLSearchParams();
const mockPathname = "/events";
let replaceStateSpy: ReturnType<typeof vi.spyOn>;

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

describe("useFilters Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceStateSpy = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(() => {});
    const keys = Array.from(mockSearchParams.keys());
    keys.forEach((key) => mockSearchParams.delete(key));
  });

  afterEach(() => {
    replaceStateSpy.mockRestore();
  });

  it("should return default filters when URL is empty", () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("should parse filters from URL", () => {
    mockSearchParams.set("search", "diwali");
    mockSearchParams.set("types", "FESTIVAL");

    const { result } = renderHook(() => useFilters());

    expect(result.current.filters.search).toBe("diwali");
    expect(result.current.filters.eventTypes).toContain("FESTIVAL");
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("should set a filter (search)", () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.setFilter("search", "new search");
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/events?search=new+search");
  });

  it("should toggle array filters", () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.toggleFilter("eventTypes", "PUJA");
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      "",
      expect.stringContaining("types=PUJA")
    );
  });

  it("should clear all filters", () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.clearFilters();
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/events");
  });

  it("should count active filters correctly", () => {
    mockSearchParams.set("search", "test");
    mockSearchParams.set("types", "PUJA,FESTIVAL");

    const { result } = renderHook(() => useFilters());

    // Groups: Search (1) + Types (1) = 2
    expect(result.current.activeFilterCount).toBe(2);

    // Items: Search (1) + Puja (1) + Festival (1) = 3
    expect(result.current.activeFilterItemCount).toBe(3);
  });

  it("should validate and filter out invalid values from URL", () => {
    mockSearchParams.set("categories", "valid_cat,INVALID_CAT");
    mockSearchParams.set("types", "PUJA,INVALID_TYPE");
    mockSearchParams.set("sortBy", "invalid_field");
    mockSearchParams.set("order", "invalid_order");

    const { result } = renderHook(() => useFilters());

    expect(result.current.filters.eventTypes).toEqual(["PUJA"]);
    expect(result.current.filters.eventTypes).not.toContain("INVALID_TYPE");
    expect(result.current.filters.sortBy).toBe("date");
    expect(result.current.filters.sortOrder).toBe("asc");
  });

  it("should remove filter from URL when set to empty or default", () => {
    mockSearchParams.set("search", "to-be-removed");
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.setFilter("search", "");
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/events");
  });

  it("should build correct query string for API", () => {
    mockSearchParams.set("search", "diwali");
    mockSearchParams.set("types", "FESTIVAL");
    mockSearchParams.set("from", "2025-01-01");

    const { result } = renderHook(() => useFilters());
    const queryString = result.current.buildQueryString();

    expect(queryString).toContain("search=diwali");
    expect(queryString).toContain("types=FESTIVAL");
    expect(queryString).toContain("start=2025-01-01");
    expect(queryString).toContain("sortBy=date");
  });

  it("should handle array values in setFilter", () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.setFilter("eventTypes", ["PUJA", "VRAT"]);
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      "",
      expect.stringContaining("types=PUJA%2CVRAT")
    );
  });
});
