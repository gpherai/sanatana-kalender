 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageLayout } from "../PageLayout";

describe("PageLayout", () => {
  it("renders children when not loading", () => {
    render(
      <PageLayout>
        <div data-testid="child">Content</div>
      </PageLayout>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders loading state (covers lines 106-118)", () => {
    render(
      <PageLayout loading>
        <div data-testid="child">Content</div>
      </PageLayout>
    );
    expect(screen.getByText(/Laden/i)).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });
});
