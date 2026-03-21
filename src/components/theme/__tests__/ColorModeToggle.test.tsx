import { vi } from "vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "../ThemeProvider";
import { ColorModeToggle } from "../ColorModeToggle";

function mockMatchMedia(matches = false) {
  return vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }));
}

describe("ColorModeToggle", () => {
  beforeEach(() => {
    window.matchMedia = mockMatchMedia(false) as typeof window.matchMedia;
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("toggles between light and dark", async () => {
    render(
      <ThemeProvider defaultColorMode="light">
        <ColorModeToggle />
      </ThemeProvider>
    );

    const button = await screen.findByLabelText(/Switch to dark mode/i);
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByLabelText(/Switch to light mode/i)).toBeInTheDocument();
    });
  });
});
