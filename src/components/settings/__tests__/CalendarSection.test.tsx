import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarSection } from "../CalendarSection";

describe("CalendarSection", () => {
  it("calls onFieldChange for select updates", () => {
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
    fireEvent.change(screen.getByLabelText(/Tijdzone/i), {
      target: { value: "Asia/Kolkata" },
    });

    expect(onFieldChange).toHaveBeenCalledWith("defaultView", "week");
    expect(onFieldChange).toHaveBeenCalledWith("timezone", "Asia/Kolkata");
  });
});
