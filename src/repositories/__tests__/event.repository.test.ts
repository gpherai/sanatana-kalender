import { describe, it, expect, vi, beforeEach } from "vitest";
import { findEventOccurrences } from "../event.repository";

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
    await findEventOccurrences({});
    expect(getWhereArg()).toEqual({});
  });

  it("applies search as OR filter on name, description, and tags", async () => {
    await findEventOccurrences({ search: "diwali" });
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
    await findEventOccurrences({ categories: ["Shakti", "Vishnu"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      category: { name: { in: ["Shakti", "Vishnu"] } },
    });
  });

  it("applies valid event types filter", async () => {
    await findEventOccurrences({ types: ["FESTIVAL", "PUJA"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      eventType: { in: ["FESTIVAL", "PUJA"] },
    });
  });

  it("omits eventType filter when all types are invalid", async () => {
    await findEventOccurrences({ types: ["INVALID_TYPE", "GARBAGE"] });
    expect(getWhereArg()).toEqual({});
  });

  it("filters out invalid types, keeps valid ones", async () => {
    await findEventOccurrences({ types: ["FESTIVAL", "INVALID"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      eventType: { in: ["FESTIVAL"] },
    });
  });

  it("applies valid importance filter", async () => {
    await findEventOccurrences({ importance: ["MAJOR", "MODERATE"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      importance: { in: ["MAJOR", "MODERATE"] },
    });
  });

  it("omits importance filter when all values are invalid", async () => {
    await findEventOccurrences({ importance: ["CRITICAL", "UNKNOWN"] });
    expect(getWhereArg()).toEqual({});
  });

  it("applies valid tithi filter", async () => {
    await findEventOccurrences({ tithis: ["PURNIMA", "AMAVASYA"] });
    const where = getWhereArg();
    expect(where.event).toMatchObject({
      tithi: { in: ["PURNIMA", "AMAVASYA"] },
    });
  });

  it("omits tithi filter when all values are invalid", async () => {
    await findEventOccurrences({ tithis: ["INVALID_TITHI"] });
    expect(getWhereArg()).toEqual({});
  });

  it("applies date range filter when both start and end are given", async () => {
    await findEventOccurrences({ start: "2025-01-01", end: "2025-01-31" });
    const where = getWhereArg();
    expect(where.date).toEqual({
      gte: new Date("2025-01-01"),
      lte: new Date("2025-01-31"),
    });
  });

  it("omits date filter when only start is given", async () => {
    await findEventOccurrences({ start: "2025-01-01" });
    const where = getWhereArg();
    expect(where.date).toBeUndefined();
  });

  it("orders by event name when sortBy=name", async () => {
    await findEventOccurrences({ sortBy: "name" });
    expect(getOrderByArg()).toEqual([{ event: { name: "asc" } }]);
  });

  it("orders by date by default", async () => {
    await findEventOccurrences({});
    expect(getOrderByArg()).toEqual([{ date: "asc" }]);
  });

  it("applies desc order when order=desc", async () => {
    await findEventOccurrences({ order: "desc" });
    expect(getOrderByArg()).toEqual([{ date: "desc" }]);
  });
});
