/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import SettingsPage from "../page";

// Mock dependencies
const mockUseFetch = vi.fn();
vi.mock("@/hooks/useFetch", () => ({
  useFetch: (url: string, options: any) => mockUseFetch(url, options),
}));

const mockTheme = {
  themeName: "light",
  colorMode: "light",
  setTheme: vi.fn(),
  setColorMode: vi.fn(),
  themes: [],
  resolvedColorMode: "light",
};
vi.mock("@/components/theme/ThemeProvider", () => ({
  useTheme: () => mockTheme,
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  showToast: vi.fn(),
};
vi.mock("@/components/ui/Toast", () => ({
  useToast: () => mockToast,
}));

const mockRouter = {
  refresh: vi.fn(),
};
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/components/layout", () => ({
  PageLayout: ({ children, loading }: any) => (
    <div data-testid="page-layout">{loading ? "Loading..." : children}</div>
  ),
}));

vi.mock("@/components/settings", () => ({
  ThemeSection: ({ onThemeChange }: any) => (
    <button onClick={() => onThemeChange("dark-theme")}>Change Theme</button>
  ),
  CalendarSection: ({ onFieldChange }: any) => (
    <button onClick={() => onFieldChange("defaultView", "week")}>Change View</button>
  ),
  LocationSection: ({ onLocationPreset, onLocationChange }: any) => (
    <div>
      <button onClick={() => onLocationPreset({ name: "Berlin", lat: 52.5, lon: 13.4 })}>
        Preset
      </button>
      <button onClick={() => onLocationChange("locationName", "Munich")}>
        Manual Name
      </button>
      <button onClick={() => onLocationChange("locationLon", 11.5)}>Manual Lon</button>
    </div>
  ),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    mockUseFetch.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("handles full lifecycle and all handlers", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) } as any);
    const refetchDaily = vi.fn();
    mockUseFetch.mockImplementation((url) => {
      if (url === "/api/daily-info")
        return { data: {}, loading: false, refetch: refetchDaily };
      return { data: null, loading: false, refetch: vi.fn() };
    });

    const { unmount } = render(<SettingsPage />);

    // Trigger changes
    fireEvent.click(screen.getByText("Change Theme")); // Line 230-231
    expect(mockTheme.setTheme).toHaveBeenCalledWith("dark-theme");

    fireEvent.click(screen.getByText("Preset")); // Line 238-244
    fireEvent.click(screen.getByText("Manual Name"));
    fireEvent.click(screen.getByText("Manual Lon"));
    fireEvent.click(screen.getByText("Change View"));

    // Wait for save cycle (AUTO_SAVE_DELAY = 800ms)
    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    // Status: Opgeslagen (exact match to avoid description text)
    expect(screen.getByText("Opgeslagen")).toBeInTheDocument();

    // Verify refetch triggered (line 219)
    await waitFor(() => {
      expect(refetchDaily).toHaveBeenCalled();
    });

    unmount(); // Line 113 cleanup
  });

  it("handles initial fetch and error callbacks", async () => {
    let successCb: any;
    let errorCb: any;
    mockUseFetch.mockImplementation((url, options) => {
      if (url === "/api/preferences") {
        successCb = options?.onSuccess;
        errorCb = options?.onError;
      }
      return { data: null, loading: false, refetch: vi.fn() };
    });

    render(<SettingsPage />);

    act(() => {
      successCb({ currentTheme: "ocean" });
    });
    expect(mockTheme.setTheme).toHaveBeenCalledWith("ocean");

    act(() => {
      errorCb(new Error("fail"));
    });
    expect(mockToast.showToast).toHaveBeenCalled();
  });

  it("does not autosave immediately after loading initial preferences", async () => {
    vi.useFakeTimers();

    let successCb: any;
    mockUseFetch.mockImplementation((url, options) => {
      if (url === "/api/preferences") {
        successCb = options?.onSuccess;
      }
      return { data: null, loading: false, refetch: vi.fn() };
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) } as any);
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsPage />);

    act(() => {
      successCb({
        currentTheme: "ocean",
        defaultView: "month",
        timezone: "Europe/Amsterdam",
        locationName: "Den Haag",
        locationLat: 52.08,
        locationLon: 4.31,
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fetchMock).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("handles save failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        return Promise.resolve({ ok: false, json: async () => ({ message: "FAIL" }) });
      })
    );

    render(<SettingsPage />);
    fireEvent.click(screen.getByText("Change View"));

    await waitFor(
      () => {
        expect(screen.getByText(/Fout bij opslaan/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
