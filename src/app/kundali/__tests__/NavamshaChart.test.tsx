import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NavamshaChart, navamshaRashi } from "../NavamshaChart";
import type { BirthChart, GrahaPosition } from "@/server/panchanga/types";

// Helper to create a minimal GrahaPosition
function makeGraha(longitude: number): GrahaPosition {
  return {
    name: "Test",
    longitude,
    latitude: 0,
    speed: 1,
    retrograde: false,
    rashi: { number: Math.floor(longitude / 30) + 1, name: "Test" },
    degreeInRashi: longitude % 30,
    nakshatra: { number: 1, name: "Test", pada: 1 },
  };
}

const mockChart: BirthChart = {
  birthData: {
    date: "1987-11-20",
    time: "10:30",
    lat: 52.3676,
    lon: 4.9041,
    tz: "Europe/Amsterdam",
  },
  julianDay: 2447119.8958,
  ayanamsa: { name: "Lahiri", degrees: 23.68 },
  lagna: {
    longitude: 215.5, // Scorpio (8th sign)
    rashi: { number: 8, name: "Vrishchika" },
    degreeInRashi: 5.5,
    nakshatra: { number: 1, name: "Test", pada: 1 },
  },
  grahas: {
    surya: makeGraha(214.2), // Scorpio
    chandra: makeGraha(205.8), // Libra
    mangala: makeGraha(175.4), // Virgo
    budha: makeGraha(234.1), // Scorpio
    guru: makeGraha(355.2), // Pisces
    shukra: makeGraha(245.3), // Sagittarius
    shani: makeGraha(232.1), // Scorpio
    rahu: makeGraha(350.5), // Pisces
    ketu: makeGraha(170.5), // Virgo
    uranus: makeGraha(235.1),
    neptune: makeGraha(246.2),
    pluto: makeGraha(219.8),
  },
};

describe("navamshaRashi", () => {
  it("calculates Navamsha correctly for Fire signs (Mesha, Simha, Dhanu)", () => {
    // Mesha (1) - 0° to 3°20' is Mesha (1)
    expect(navamshaRashi(1)).toBe(1);
    // Mesha (1) - 26°40' to 30° is Dhanu (9)
    expect(navamshaRashi(28)).toBe(9);
    // Simha (5) - 0° to 3°20' is Mesha (1)
    expect(navamshaRashi(121)).toBe(1);
    // Dhanu (9) - 0° to 3°20' is Mesha (1)
    expect(navamshaRashi(241)).toBe(1);
  });

  it("calculates Navamsha correctly for Earth signs (Vrishabha, Kanya, Makara)", () => {
    // Vrishabha (2) - 0° to 3°20' is Makara (10)
    expect(navamshaRashi(31)).toBe(10);
    // Kanya (6) - 0° to 3°20' is Makara (10)
    expect(navamshaRashi(151)).toBe(10);
    // Makara (10) - 0° to 3°20' is Makara (10)
    expect(navamshaRashi(271)).toBe(10);
  });

  it("calculates Navamsha correctly for Air signs (Mithuna, Tula, Kumbha)", () => {
    // Mithuna (3) - 0° to 3°20' is Tula (7)
    expect(navamshaRashi(61)).toBe(7);
    // Tula (7) - 0° to 3°20' is Tula (7)
    expect(navamshaRashi(181)).toBe(7);
    // Kumbha (11) - 0° to 3°20' is Tula (7)
    expect(navamshaRashi(301)).toBe(7);
  });

  it("calculates Navamsha correctly for Water signs (Karka, Vrishchika, Meena)", () => {
    // Karka (4) - 0° to 3°20' is Karka (4)
    expect(navamshaRashi(91)).toBe(4);
    // Vrishchika (8) - 0° to 3°20' is Karka (4)
    expect(navamshaRashi(211)).toBe(4);
    // Meena (12) - 0° to 3°20' is Karka (4)
    expect(navamshaRashi(331)).toBe(4);
  });
});

describe("NavamshaChart", () => {
  it("renders the D9 label and Lagna rashi name", () => {
    const { container } = render(<NavamshaChart chart={mockChart} />);
    expect(screen.getByText("D9")).toBeInTheDocument();
    expect(screen.getByText("Navamsha")).toBeInTheDocument();

    // Lagna is 215.5° (Scorpio, sign 8, Water)
    // 5.5° into Scorpio is the 2nd pada (0-3.33, 3.33-6.66)
    // Water signs start at Karka (4). 4 + 1 = 5 (Simha)
    // Find the center 2x2 section specifically
    const centerSection = container.querySelector('div[style*="grid-row: 2/4"]');
    expect(centerSection).toBeTruthy();
    expect(within(centerSection as HTMLElement).getByText("Simha")).toBeInTheDocument();
  });

  it("renders grahas in their respective Navamsha positions", () => {
    render(<NavamshaChart chart={mockChart} />);

    // Surya: 214.2° (Scorpio, sign 8, Water)
    // 4.2° into Scorpio is 2nd pada -> Simha (5)
    // Rashi 5 is Leo
    const leoCell = screen.getByTestId("rashi-cell-5");
    expect(leoCell).toHaveTextContent("Su");

    // Guru: 355.2° (Pisces, sign 12, Water)
    // 25.2° into Pisces (355.2 - 330) is the 8th pada (23.33 - 26.66)
    // Water starts at Karka (4). 4 + 7 = 11 (Kumbha)
    const kumbhaCell = screen.getByTestId("rashi-cell-11");
    expect(kumbhaCell).toHaveTextContent("Gu");
  });

  it("handles missing grahas gracefully", () => {
    const minimalChart = {
      ...mockChart,
      grahas: {
        surya: makeGraha(0),
      },
    };
    render(<NavamshaChart chart={minimalChart as unknown as BirthChart} />);
    expect(screen.getByText("Su")).toBeInTheDocument();
    expect(screen.queryByText("Mo")).not.toBeInTheDocument();
  });
});
