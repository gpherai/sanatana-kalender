import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Kundali from "../page";

// Mock the PageLayout component
vi.mock("@/components/layout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

describe("Kundali Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the birth data form", () => {
    render(<Kundali />);

    // Header check
    expect(screen.getByRole("heading", { name: /^Kundali$/i })).toBeInTheDocument();

    // Form check
    expect(screen.getByText(/Geboortedatum/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("DD")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("MM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("JJJJ")).toBeInTheDocument();

    expect(screen.getByText(/Geboortetijd/i)).toBeInTheDocument();
    // Time input doesn't have a label or placeholder, target by type
    expect(document.querySelector('input[type="time"]')).toBeInTheDocument();

    expect(screen.getByPlaceholderText("52.0893")).toBeInTheDocument(); // Lat
    expect(screen.getByPlaceholderText("4.3683")).toBeInTheDocument(); // Lon
    expect(screen.getByPlaceholderText("Europe/Amsterdam")).toBeInTheDocument(); // TZ

    expect(screen.getByRole("button", { name: /Bereken Kundali/i })).toBeInTheDocument();
  });

  it("submits the form and displays the result", async () => {
    const mockGraha = (name: string, lon: number) => ({
      name,
      longitude: lon,
      latitude: 0,
      speed: 1,
      retrograde: false,
      rashi: { number: Math.floor(lon / 30) + 1, name: "Rashi" },
      degreeInRashi: lon % 30,
      nakshatra: { number: 1, name: "Nakshatra", pada: 1 as const },
    });

    const mockChart = {
      birthData: {
        date: "1987-11-20",
        time: "10:30",
        lat: 52.3676,
        lon: 4.9041,
        tz: "Europe/Amsterdam",
      },
      ayanamsa: { name: "Lahiri", degrees: 23.684 },
      lagna: {
        longitude: 255.5,
        rashi: { number: 9, name: "Dhanu (Boogschutter)" },
        degreeInRashi: 15.5,
        nakshatra: { number: 20, name: "Purva Ashadha", pada: 1 as const },
      },
      grahas: {
        surya: mockGraha("Surya", 214.5),
        chandra: mockGraha("Chandra", 200.1),
        mangala: mockGraha("Mangala", 150.2),
        budha: mockGraha("Budha", 220.3),
        guru: mockGraha("Guru", 10.4),
        shukra: mockGraha("Shukra", 240.5),
        shani: mockGraha("Shani", 260.6),
        rahu: mockGraha("Rahu", 350.7),
        ketu: mockGraha("Ketu", 170.7),
        uranus: mockGraha("Uranus", 230.8),
        neptune: mockGraha("Neptune", 250.9),
        pluto: mockGraha("Pluto", 210.0),
      },
      julianDay: 2447119.895833333,
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChart,
    } as Response);

    const { container } = render(<Kundali />);

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText("DD"), { target: { value: "20" } });
    fireEvent.change(screen.getByPlaceholderText("MM"), { target: { value: "11" } });
    fireEvent.change(screen.getByPlaceholderText("JJJJ"), { target: { value: "1987" } });

    const timeInput = container.querySelector('input[type="time"]')!;
    fireEvent.change(timeInput, { target: { value: "10:30" } });

    fireEvent.change(screen.getByPlaceholderText("52.0893"), {
      target: { value: "52.3676" },
    });
    fireEvent.change(screen.getByPlaceholderText("4.3683"), {
      target: { value: "4.9041" },
    });
    fireEvent.change(screen.getByPlaceholderText("Europe/Amsterdam"), {
      target: { value: "Europe/Amsterdam" },
    });

    // Click submit
    fireEvent.click(screen.getByRole("button", { name: /Bereken Kundali/i }));

    // Wait for result
    await waitFor(
      () => {
        expect(screen.getAllByText("Lagna")[0]).toBeInTheDocument();
        expect(screen.getByText("Vrishabha")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Verify some values
    expect(screen.getAllByText("Dhanu (Boogschutter)")[0]).toBeInTheDocument();
    expect(screen.getByText("15.50°")).toBeInTheDocument();
    expect(screen.getByText("Purva Ashadha")).toBeInTheDocument();

    // Switch to table view to see full names
    fireEvent.click(screen.getByRole("button", { name: /Tabel/i }));

    // Check Graha row
    expect(screen.getByText("Surya")).toBeInTheDocument();
    expect(screen.getAllByText("Rashi").length).toBeGreaterThan(0);
  });

  it("displays an error message when the API fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Calculation failed" }),
    } as Response);

    const { container } = render(<Kundali />);

    // Fill minimal data
    fireEvent.change(screen.getByPlaceholderText("DD"), { target: { value: "20" } });
    fireEvent.change(screen.getByPlaceholderText("MM"), { target: { value: "11" } });
    fireEvent.change(screen.getByPlaceholderText("JJJJ"), { target: { value: "1987" } });

    const timeInput = container.querySelector('input[type="time"]')!;
    fireEvent.change(timeInput, { target: { value: "10:30" } });

    fireEvent.change(screen.getByPlaceholderText("52.0893"), {
      target: { value: "52.3" },
    });
    fireEvent.change(screen.getByPlaceholderText("4.3683"), { target: { value: "4.9" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Bereken Kundali/i }));

    // Wait for error
    await waitFor(() =>
      expect(screen.getByText(/Calculation failed/i)).toBeInTheDocument()
    );
  });
});
