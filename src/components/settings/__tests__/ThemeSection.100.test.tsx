/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeSection } from "../ThemeSection";

describe("ThemeSection 100% Coverage", () => {
  it("handles empty revamped and special categories (lines 182, 255)", () => {
    // We pass a custom themes list that lacks these categories
    const minimalThemes = [
      {
        name: "light",
        displayName: "Light",
        description: "L",
        colors: {},
        category: "classic",
      },
    ];

    render(
      <ThemeSection
        themes={minimalThemes as any}
        themeName="light"
        colorMode="light"
        onThemeChange={vi.fn()}
        onColorModeChange={vi.fn()}
      />
    );

    // Should not find the headings for these sections
    expect(screen.queryByText(/Modern Gradients/i)).toBeNull();
    expect(screen.queryByText(/Special Themes/i)).toBeNull();
  });
});
