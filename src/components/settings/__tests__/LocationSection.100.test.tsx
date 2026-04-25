/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocationSection } from "../LocationSection";

describe("LocationSection 100% Coverage", () => {
  it("renders fixed coordinates as read-only text", () => {
    render(
      <LocationSection
        locationName="Test"
        locationLat={52}
        locationLon={4}
        dailyInfo={null}
      />
    );

    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("52")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("covers fallback dash for missing dailyInfo times (lines 146-154)", () => {
    const minimalDaily = {
      sunrise: null,
      sunset: null,
      moonPhaseName: "New Moon",
      moonPhaseEmoji: "🌑",
      moonPhasePercent: 0,
    };

    render(
      <LocationSection
        locationName="Test"
        locationLat={52}
        locationLon={4}
        dailyInfo={minimalDaily as any}
      />
    );

    // Expect dash instead of time
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });
});
