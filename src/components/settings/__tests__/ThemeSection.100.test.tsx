import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeSection } from "../ThemeSection";

describe("ThemeSection 100% Coverage", () => {
  it("handles empty revamped and special categories (lines 182, 255)", () => {
    // An empty themes list exercises the falsy branch of both
    // `themes.some(category === "revamped"|"special")` guards.
    render(
      <ThemeSection
        themes={[]}
        themeName="light"
        colorMode="light"
        resolvedColorMode="light"
        onThemeChange={vi.fn()}
        onColorModeChange={vi.fn()}
      />
    );

    // Should not find the headings for these sections
    expect(screen.queryByText(/Modern Gradients/i)).toBeNull();
    expect(screen.queryByText(/Special Themes/i)).toBeNull();
  });
});
