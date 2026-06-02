import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSection } from "../ThemeSection";
import type { ThemeOption } from "@/config/themes";

const THEMES: ThemeOption[] = [
  {
    name: "revamped-default",
    displayName: "Revamped Default",
    description: "Revamped theme",
    colors: { primary: "#111", secondary: "#222", accent: "#333" },
    category: "revamped",
    isDefault: true,
  },
  {
    name: "revamped-one",
    displayName: "Revamped One",
    description: "Revamped theme",
    colors: { primary: "#444", secondary: "#555", accent: "#666" },
    category: "revamped",
    isDefault: false,
  },
  {
    name: "special-one",
    displayName: "Special One",
    description: "Special theme",
    colors: { primary: "#777", secondary: "#888", accent: "#999" },
    category: "special",
    isDefault: false,
    isSpecial: true,
  },
];

describe("ThemeSection", () => {
  it("shows system mode hint and handles changes", async () => {
    const onThemeChange = vi.fn();
    const onColorModeChange = vi.fn();

    render(
      <ThemeSection
        themeName="revamped-default"
        colorMode="system"
        themes={THEMES}
        resolvedColorMode="dark"
        onThemeChange={onThemeChange}
        onColorModeChange={onColorModeChange}
      />
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText("Huidige systeemvoorkeur: Donker")).toBeInTheDocument();
    });

    // Find and click light mode button
    const lightButton = await screen.findByRole("button", { name: /Licht/i });
    await userEvent.click(lightButton);

    await waitFor(() => {
      expect(onColorModeChange).toHaveBeenCalledWith("light");
    });

    // Find and click theme button
    const themeButton = await screen.findByRole("button", { name: /Revamped Default/ });
    await userEvent.click(themeButton);

    await waitFor(() => {
      expect(onThemeChange).toHaveBeenCalledWith("revamped-default");
    });
  }, 10000); // Increase timeout to 10s
});
