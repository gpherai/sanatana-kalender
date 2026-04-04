/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LocationSection } from "../LocationSection";

describe("LocationSection 100% Coverage", () => {
  const onLocationPreset = vi.fn();
  const onLocationChange = vi.fn();

  it("handles manual lat/lon input changes (lines 107-127)", () => {
    render(
      <LocationSection
        locationName="Test"
        locationLat={52}
        locationLon={4}
        onLocationPreset={onLocationPreset}
        onLocationChange={onLocationChange}
      />
    );

    const latInput = screen.getByLabelText(/Breedtegraad/i);
    const lonInput = screen.getByLabelText(/Lengtegraad/i);

    fireEvent.change(latInput, { target: { value: "53.1" } });
    expect(onLocationChange).toHaveBeenCalledWith("locationLat", 53.1);

    fireEvent.change(lonInput, { target: { value: "5.5" } });
    expect(onLocationChange).toHaveBeenCalledWith("locationLon", 5.5);

    // Coverage for parseFloat fallback || 0
    fireEvent.change(latInput, { target: { value: "" } });
    expect(onLocationChange).toHaveBeenCalledWith("locationLat", 0);
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
        onLocationPreset={onLocationPreset}
        onLocationChange={onLocationChange}
        dailyInfo={minimalDaily as any}
      />
    );

    // Expect dash instead of time
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });
});
