import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarSection } from "../CalendarSection";

describe("CalendarSection", () => {
  it("calls onFieldChange for default view updates and renders timezone read-only", () => {
    const onFieldChange = vi.fn();

    render(
      <CalendarSection
        defaultView="month"
        timezone="Europe/Amsterdam"
        onFieldChange={onFieldChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/Standaard weergave/i), {
      target: { value: "week" },
    });

    expect(onFieldChange).toHaveBeenCalledWith("defaultView", "week");
    expect(screen.getByLabelText(/Tijdzone/i)).toHaveTextContent("Europe/Amsterdam");
  });
});
