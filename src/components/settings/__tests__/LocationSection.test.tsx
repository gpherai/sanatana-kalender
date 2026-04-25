import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocationSection } from "../LocationSection";
import { DEFAULT_LOCATION } from "@/lib/domain";

describe("LocationSection", () => {
  it("renders the fixed application location", () => {
    render(
      <LocationSection
        locationName={DEFAULT_LOCATION.name}
        locationLat={DEFAULT_LOCATION.lat}
        locationLon={DEFAULT_LOCATION.lon}
        dailyInfo={null}
      />
    );

    expect(screen.getByText(DEFAULT_LOCATION.name)).toBeInTheDocument();
    expect(screen.getByText(String(DEFAULT_LOCATION.lat))).toBeInTheDocument();
    expect(screen.getByText(String(DEFAULT_LOCATION.lon))).toBeInTheDocument();
  });

  it("renders daily info when provided", () => {
    render(
      <LocationSection
        locationName={DEFAULT_LOCATION.name}
        locationLat={DEFAULT_LOCATION.lat}
        locationLon={DEFAULT_LOCATION.lon}
        dailyInfo={{
          sunrise: "06:00",
          sunset: "18:00",
          moonPhasePercent: 42,
          moonPhaseName: "Waxing",
          isWaxing: true,
        }}
      />
    );

    expect(screen.getByText("06:00")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.getByText("Waxing")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
});
