/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { SettingsContent } from "@/components/settings/SettingsContent";

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
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
}));

vi.mock("@/components/settings", () => ({
  ThemeSection: ({ onThemeChange }: any) => (
    <button onClick={() => onThemeChange("dark-theme")}>Change Theme</button>
  ),
  CalendarSection: ({ onFieldChange }: any) => (
    <button onClick={() => onFieldChange("defaultView", "week")}>Change View</button>
  ),
  LocationSection: () => <div>Fixed Location</div>,
}));

const defaultPreferences = { currentTheme: "light", defaultView: "month" };

describe("SettingsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("handles full save lifecycle", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) } as any);

    const { unmount } = render(
      <SettingsContent initialPreferences={defaultPreferences} initialDailyInfo={null} />
    );

    fireEvent.click(screen.getByText("Change Theme"));
    expect(mockTheme.setTheme).toHaveBeenCalledWith("dark-theme");

    fireEvent.click(screen.getByText("Change View"));

    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/preferences",
          expect.objectContaining({ method: "PUT" })
        );
      },
      { timeout: 2000 }
    );

    expect(screen.getByText("Opgeslagen")).toBeInTheDocument();

    unmount();
  });

  it("shows error toast when initialPreferences is null", () => {
    render(<SettingsContent initialPreferences={null} initialDailyInfo={null} />);

    expect(mockToast.showToast).toHaveBeenCalledWith(
      "Kon instellingen niet laden",
      "error"
    );
  });

  it("does not autosave immediately after mount with initial preferences", async () => {
    vi.useFakeTimers();

    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) } as any);
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SettingsContent
        initialPreferences={{ currentTheme: "ocean", defaultView: "month" }}
        initialDailyInfo={null}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("handles save failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "FAIL" }),
      } as any)
    );

    render(
      <SettingsContent initialPreferences={defaultPreferences} initialDailyInfo={null} />
    );
    fireEvent.click(screen.getByText("Change View"));

    await waitFor(
      () => {
        expect(screen.getByText(/Fout bij opslaan/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
