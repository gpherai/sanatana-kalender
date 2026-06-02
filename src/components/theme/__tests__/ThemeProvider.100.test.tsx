/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, renderHook } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../ThemeProvider";
import { DEFAULT_THEME_NAME } from "@/config/themes";
import { useEffect } from "react";

describe("ThemeProvider 100% Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("handles storage corruption (line 116)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Security Error");
    });

    render(
      <ThemeProvider>
        <div data-testid="child" />
      </ThemeProvider>
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("handles invalid theme name (lines 197-198)", () => {
    let capturedContext: any;
    const TestComponent = () => {
      const context = useTheme();
      useEffect(() => {
        capturedContext = context;
      }, [context]);
      return null;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    act(() => {
      capturedContext.setTheme("INVALID_THEME");
    });

    expect(capturedContext.themeName).toBe(DEFAULT_THEME_NAME);
  });

  it("sets color mode explicitly (line 205)", () => {
    let capturedContext: any;
    const TestComponent = () => {
      const context = useTheme();
      useEffect(() => {
        capturedContext = context;
      }, [context]);
      return null;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    act(() => {
      capturedContext.setColorMode("dark");
    });

    expect(capturedContext.colorMode).toBe("dark");
  });

  it("toggles color mode from system (line 213)", () => {
    let capturedContext: any;
    const TestComponent = () => {
      const context = useTheme();
      useEffect(() => {
        capturedContext = context;
      }, [context]);
      return null;
    };

    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(
      <ThemeProvider defaultColorMode="system">
        <TestComponent />
      </ThemeProvider>
    );

    act(() => {
      capturedContext.toggleColorMode();
    });

    expect(capturedContext.colorMode).toBe("light");
  });

  it("provides fallback context outside provider (line 261)", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeName).toBeDefined();
    act(() => {
      result.current.setTheme("ocean");
    });
    expect(result.current.themeName).not.toBe("ocean");
  });

  it("handles save to storage error", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });

    let capturedContext: any;
    const TestComponent = () => {
      const context = useTheme();
      useEffect(() => {
        capturedContext = context;
      }, [context]);
      return null;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    act(() => {
      capturedContext.setTheme("ocean");
    });
  });
});
