import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EncyclopediaOverview } from "../EncyclopediaOverview";

const MOCK_TERMS = {
  Astronomie: [
    {
      slug: "tithi",
      title: "Tithi",
      sanskrit: "Tithi",
      category: "Astronomie",
      shortDescription: "Lunar day",
    },
    {
      slug: "paksha",
      title: "Paksha",
      sanskrit: "Paksha",
      category: "Astronomie",
      shortDescription: "Fortnight",
      parents: ["tithi"],
    },
  ],
  Navagraha: [
    {
      slug: "surya",
      title: "Surya",
      sanskrit: "Surya",
      category: "Navagraha",
      shortDescription: "The Sun",
    },
    {
      slug: "chandra",
      title: "Chandra",
      sanskrit: "Chandra",
      category: "Navagraha",
      shortDescription: "The Moon",
      parents: ["surya"], // Navagraha items should NOT be filtered out even with parents
    },
  ],
};

const CATEGORIES = ["Astronomie", "Navagraha"];

describe("EncyclopediaOverview", () => {
  it("renders categories and top-level terms", () => {
    render(
      <EncyclopediaOverview
        groupedTerms={MOCK_TERMS}
        categories={CATEGORIES}
        totalCount={4}
      />
    );

    expect(screen.getByText("Astronomie")).toBeInTheDocument();
    expect(screen.getByText("Navagraha")).toBeInTheDocument();
    expect(screen.getByText("Tithi")).toBeInTheDocument();

    // Paksha has a parent and should be filtered out in Astronomie
    expect(screen.queryByText("Paksha")).not.toBeInTheDocument();
  });

  it("does not filter out items with parents in Navagraha category", () => {
    render(
      <EncyclopediaOverview
        groupedTerms={MOCK_TERMS}
        categories={CATEGORIES}
        totalCount={4}
      />
    );

    expect(screen.getByText("Surya")).toBeInTheDocument();
    expect(screen.getByText("Chandra")).toBeInTheDocument();
  });

  it("handles searching correctly", () => {
    render(
      <EncyclopediaOverview
        groupedTerms={MOCK_TERMS}
        categories={CATEGORIES}
        totalCount={4}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Zoek in 4 termen/i);
    fireEvent.change(searchInput, { target: { value: "Fortnight" } });

    // Should show Paksha now (as a search result)
    expect(screen.getByText("Paksha")).toBeInTheDocument();
    expect(screen.queryByText("Tithi")).not.toBeInTheDocument();
    expect(screen.getByText(/1 resultaten voor/i)).toBeInTheDocument();
  });

  it("shows empty state when no results found", () => {
    render(
      <EncyclopediaOverview
        groupedTerms={MOCK_TERMS}
        categories={CATEGORIES}
        totalCount={4}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Zoek in 4 termen/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(screen.getByText(/Geen resultaten voor/i)).toBeInTheDocument();
  });

  it("clears search when X button is clicked", () => {
    render(
      <EncyclopediaOverview
        groupedTerms={MOCK_TERMS}
        categories={CATEGORIES}
        totalCount={4}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Zoek in 4 termen/i);
    fireEvent.change(searchInput, { target: { value: "test" } });

    const clearButton = screen.getByLabelText("Zoekterm wissen");
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue("");
    expect(screen.getByText("Tithi")).toBeInTheDocument();
  });

  it("handles categories with no items gracefully", () => {
    render(
      <EncyclopediaOverview
        groupedTerms={MOCK_TERMS}
        categories={["EmptyCat", ...CATEGORIES]}
        totalCount={4}
      />
    );
    expect(screen.queryByText("EmptyCat")).not.toBeInTheDocument();
  });
});
