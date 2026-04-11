/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import Home from "../page";

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with categories and events", async () => {
    prismaMock.category.findMany.mockResolvedValue([
      { id: "1", name: "ganesha", displayName: "Ganesha", icon: "🐘", color: "red" },
    ] as any);

    prismaMock.eventOccurrence.findMany.mockResolvedValue([
      {
        id: "occ_1",
        date: new Date(),
        event: {
          id: "evt_1",
          name: "Test Event",
          eventType: "PUJA",
          categories: [{ category: { icon: null } }], // trigger fallback 📅
        },
      },
    ] as any);

    const ui = await Home();
    render(ui);

    expect(screen.getByText("Ganesha")).toBeInTheDocument();
    expect(screen.getByText("Test Event")).toBeInTheDocument();
    expect(screen.getByText("Puja")).toBeInTheDocument(); // Verifies charAt(0) + slice(1).toLowerCase()
    expect(screen.getByText("📅")).toBeInTheDocument();
  });

  it("renders with no upcoming events", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);
    prismaMock.eventOccurrence.findMany.mockResolvedValue([]);
    const ui = await Home();
    render(ui);
    expect(screen.getByText(/Geen aankomende events/i)).toBeInTheDocument();
  });
});
