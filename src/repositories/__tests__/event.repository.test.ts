import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findEventOccurrences, findUpcomingOccurrences } from "../event.repository";

// vi.mock is hoisted — the factory runs lazily, capturing prismaMock from closure
const prismaMock = vi.hoisted(() => ({
  eventOccurrence: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

describe("findEventOccurrences", () => {
  beforeEach(() => {
    prismaMock.eventOccurrence.findMany.mockResolvedValue([]);
  });

  function getWhereArg() {
    const [arg] = prismaMock.eventOccurrence.findMany.mock.calls[0] as [
      { where: Record<string, unknown>; orderBy: unknown[] },
    ];
    return arg.where as Record<string, unknown>;
  }

  function getOrderByArg() {
    const [arg] = prismaMock.eventOccurrence.findMany.mock.calls[0] as [
      { where: Record<string, unknown>; orderBy: unknown[] },
    ];
    return arg.orderBy;
  }

  it("calls findMany with empty where when no params given", async () => {
    await findEventOccurrences({ limit: 100, skip: 0 });
    expect(getWhereArg()).toEqual({});
  });

  it("applies search as OR filter on name, description, and tags", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, search: "diwali" });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      OR: [
        { name: { contains: "diwali", mode: "insensitive" } },
        { description: { contains: "diwali", mode: "insensitive" } },
        { tags: { has: "diwali" } },
      ],
    });
  });

  it("applies categories filter as name.in", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, categories: ["Shakti", "Vishnu"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      categories: { some: { category: { name: { in: ["Shakti", "Vishnu"] } } } },
    });
  });

  it("applies valid event types filter", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, types: ["FESTIVAL", "PUJA"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      eventType: { in: ["FESTIVAL", "PUJA"] },
    });
  });

  it("omits eventType filter when all types are invalid", async () => {
    await findEventOccurrences({
      limit: 100,
      skip: 0,
      types: ["INVALID_TYPE", "GARBAGE"],
    });
    expect(getWhereArg()).toEqual({});
  });

  it("filters out invalid types, keeps valid ones", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, types: ["FESTIVAL", "INVALID"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      eventType: { in: ["FESTIVAL"] },
    });
  });

  it("applies valid tithi filter", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, tithis: ["PURNIMA", "AMAVASYA"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      tithi: { in: ["PURNIMA", "AMAVASYA"] },
    });
  });

  it("omits tithi filter when all values are invalid", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, tithis: ["INVALID_TITHI"] });
    expect(getWhereArg()).toEqual({});
  });

  it("applies date range filter when both start and end are given", async () => {
    await findEventOccurrences({
      limit: 100,
      skip: 0,
      start: "2025-01-01",
      end: "2025-01-31",
    });
    const where = getWhereArg();
    // Date range uses OR to include spanning events (events whose endDate overlaps the range)
    expect(where.OR).toEqual([
      {
        date: { gte: new Date("2025-01-01"), lte: new Date("2025-01-31") },
        endDate: null,
      },
      { date: { lte: new Date("2025-01-31") }, endDate: { gte: new Date("2025-01-01") } },
    ]);
  });

  it("omits date filter when only start is given", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, start: "2025-01-01" });
    const where = getWhereArg();
    expect(where.date).toBeUndefined();
  });

  it("orders by event name when sortBy=name", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, sortBy: "name" });
    expect(getOrderByArg()).toEqual([
      { event: { name: "asc" } },
      { date: "asc" },
      { id: "asc" },
    ]);
  });

  it("orders by date by default", async () => {
    await findEventOccurrences({ limit: 100, skip: 0 });
    expect(getOrderByArg()).toEqual([{ date: "asc" }, { id: "asc" }]);
  });

  it("applies desc order when order=desc", async () => {
    await findEventOccurrences({ limit: 100, skip: 0, order: "desc" });
    expect(getOrderByArg()).toEqual([{ date: "desc" }, { id: "desc" }]);
  });
});

describe("findUpcomingOccurrences", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prismaMock.eventOccurrence.findMany.mockResolvedValue([]);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getWhereArg() {
    const [arg] = prismaMock.eventOccurrence.findMany.mock.calls[0] as [
      { where: { OR: Array<Record<string, unknown>> } },
    ];
    return arg.where;
  }

  it("computes todayStart as Amsterdam midnight, not UTC midnight", async () => {
    // Set system time to 2026-01-15 23:30:00 UTC = 2026-01-16 00:30:00 Amsterdam
    // Amsterdam "today" is Jan 16, UTC "today" is still Jan 15
    vi.setSystemTime(new Date("2026-01-15T23:30:00.000Z"));

    await findUpcomingOccurrences(7);

    const { OR } = getWhereArg();
    // Branch 1: single-day events starting today (Amsterdam Jan 16 midnight = UTC Jan 15 23:00)
    const branch1 = OR[0] as { date: { gte: Date; lte: Date }; endDate: null };
    // todayStart should be 2026-01-16T00:00:00+01:00 = 2026-01-15T23:00:00.000Z
    expect(branch1.date.gte.toISOString()).toBe("2026-01-15T23:00:00.000Z");
  });

  it("includes multi-day overlap branch with endDate >= todayStart", async () => {
    vi.setSystemTime(new Date("2026-01-15T23:30:00.000Z"));

    await findUpcomingOccurrences(7);

    const { OR } = getWhereArg();
    const branch2 = OR[1] as { date: { lte: Date }; endDate: { gte: Date } };
    expect(branch2.endDate.gte.toISOString()).toBe("2026-01-15T23:00:00.000Z");
  });

  it("uses the end of the final Amsterdam day as the upper bound", async () => {
    vi.setSystemTime(new Date("2026-04-25T10:00:00.000Z"));

    await findUpcomingOccurrences(6);

    const { OR } = getWhereArg();
    const branch1 = OR[0] as { date: { gte: Date; lte: Date }; endDate: null };
    expect(branch1.date.lte.toISOString()).toBe("2026-05-01T21:59:59.999Z");
  });
});
