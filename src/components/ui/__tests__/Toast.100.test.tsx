/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, renderHook, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "../Toast";
import { useEffect } from "react";

describe("Toast 100% Coverage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides fallback outside provider (line 39)", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.success).toBeDefined();
    act(() => {
      result.current.success("test");
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("removes toast automatically after duration (line 78)", () => {
    let capturedContext: any;
    const TestComponent = () => {
      const context = useToast();
      useEffect(() => {
        capturedContext = context;
      }, [context]);
      return null;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      capturedContext.success("Auto remove");
    });

    expect(screen.getByRole("alert")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("handles info toast and manual close (line 149)", () => {
    let capturedContext: any;
    const TestComponent = () => {
      const context = useToast();
      useEffect(() => {
        capturedContext = context;
      }, [context]);
      return null;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      capturedContext.info("Info message");
    });

    expect(screen.getByText("Info message")).toBeDefined();

    const closeBtn = screen.getByLabelText("Sluiten");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Info message")).toBeNull();
  });
});
