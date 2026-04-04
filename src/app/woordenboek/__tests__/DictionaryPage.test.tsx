/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DictionaryPage from "../page";

// Mock dependencies
vi.mock("@/components/layout", () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
}));

vi.mock("@/components/ui/Section", () => ({
  Section: ({ title, children }: any) => (
    <div data-testid={`section-${title}`}>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

describe("DictionaryPage", () => {
  it("renders all categories and terms", () => {
    render(<DictionaryPage />);

    expect(
      screen.getByRole("heading", { name: /Sanskriet Woordenboek/i, level: 1 })
    ).toBeInTheDocument();

    // Check for some known categories from DICTIONARY_TERMS
    expect(screen.getByTestId(/section-Astronomie/i)).toBeInTheDocument();
    expect(screen.getByTestId(/section-Tijd/i)).toBeInTheDocument();
    expect(screen.getByTestId(/section-Algemeen/i)).toBeInTheDocument();

    // Check for specific terms via their main term text
    expect(screen.getByText("Tithi")).toBeInTheDocument();
    expect(screen.getByText("Nakṣatra")).toBeInTheDocument();
    expect(screen.getByText("Dharma")).toBeInTheDocument();
  });
});
