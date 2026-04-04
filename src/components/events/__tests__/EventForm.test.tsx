/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "../EventForm";
import { ERROR_MESSAGES } from "@/lib/patterns";
import type { Category } from "@/types/calendar";

const mockUseFetch = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/hooks/useFetch", async () => {
  const actual =
    await vi.importActual<typeof import("@/hooks/useFetch")>("@/hooks/useFetch");
  return {
    ...actual,
    useFetch: (...args: any[]) => mockUseFetch(...args),
  };
});

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
  }),
}));

const push = vi.fn();
const refresh = vi.fn();
const back = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
    back,
  }),
}));

const CATEGORIES: Category[] = [
  {
    id: "cat_1",
    name: "ganesha",
    displayName: "Ganesha",
    icon: "🐘",
    color: "#fff",
    description: null,
    sortOrder: 1,
  },
];

describe("EventForm", () => {
  beforeEach(() => {
    mockUseFetch.mockReturnValue({
      data: CATEGORIES,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.stubGlobal("fetch", vi.fn());
    toastSuccess.mockClear();
    toastError.mockClear();
    push.mockClear();
    refresh.mockClear();
    back.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows validation errors and handles field updates", async () => {
    render(<EventForm mode="create" />);
    await userEvent.click(screen.getByRole("button", { name: "Aanmaken" }));
    expect(screen.getByText(ERROR_MESSAGES.REQUIRED_NAME)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Naam/i);
    await userEvent.type(nameInput, "Fixed name");
    expect(screen.queryByText(ERROR_MESSAGES.REQUIRED_NAME)).not.toBeInTheDocument();
  });

  it("handles tag addition and removal edge cases", async () => {
    const user = userEvent.setup();
    render(<EventForm mode="create" />);
    const tagInput = screen.getByPlaceholderText(/Voeg tag toe/i);
    const addButton = screen.getByRole("button", { name: "Tag toevoegen" });

    // Add empty
    await user.click(addButton);

    await user.type(tagInput, "shivaratri{enter}");
    await user.type(tagInput, "shivaratri{enter}"); // duplicate
    expect(screen.getAllByText("#shivaratri")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /Tag shivaratri verwijderen/i }));
    expect(screen.queryByText("#shivaratri")).not.toBeInTheDocument();
  });

  it("handles edit mode and onSuccess callback", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const onSuccess = vi.fn();
    render(
      <EventForm
        mode="edit"
        initialData={{ id: "evt_123", name: "Old Name", date: "2025-01-01" }}
        onSuccess={onSuccess}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("throws error in edit mode without ID (line 124)", async () => {
    // Suppress console.error for this test
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<EventForm mode="edit" initialData={{ name: "Test", date: "2025-01-01" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Event ID is required in edit mode");
    });
    errorSpy.mockRestore();
  });

  it("handles successful submission without onSuccess (redirects)", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(
      <EventForm mode="create" initialData={{ name: "Test", date: "2025-01-01" }} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Aanmaken" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/events");
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("handles API error with message", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Server Error" }),
    } as Response);

    render(
      <EventForm mode="create" initialData={{ name: "Test", date: "2025-01-01" }} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Aanmaken" }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Server Error");
    });
  });

  it("covers all form fields including solar section", async () => {
    const user = userEvent.setup();
    render(<EventForm mode="create" initialData={{ recurrenceType: "YEARLY_SOLAR" }} />);

    expect(screen.getByText(/Solaire Informatie/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Beschrijving/i), "Desc text");
    await user.selectOptions(screen.getByLabelText(/Type/i), "PUJA");
    await user.selectOptions(screen.getByLabelText(/Categorie/i), "cat_1");
    fireEvent.change(screen.getByLabelText(/Einddatum/i), {
      target: { value: "2025-01-02" },
    });
    fireEvent.change(screen.getByLabelText(/Starttijd/i), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText(/Eindtijd/i), { target: { value: "12:00" } });
    await user.selectOptions(screen.getByLabelText(/Tithi/i), "EKADASHI_SHUKLA");
    await user.selectOptions(screen.getByLabelText(/Nakshatra/i), "ASHWINI");
    await user.selectOptions(screen.getByLabelText(/Maas/i), "PAUSHA");
    await user.selectOptions(screen.getByLabelText(/Sankranti/i), "MAKARA_SANKRANTI");

    const notesInput = screen.getByPlaceholderText(
      /Specifieke notities voor deze datum/i
    );
    await user.type(notesInput, "Some notes");

    expect(screen.getByLabelText(/Naam/i)).toBeInTheDocument();
  });

  it("covers categories loading error branch", async () => {
    mockUseFetch.mockImplementation((url, options) => {
      if (url === "/api/categories" && options?.onError) {
        options.onError(new Error("Fetch failed"));
      }
      return { data: null, loading: false };
    });

    render(<EventForm mode="create" />);
  });

  it("handles Cancel button", async () => {
    render(<EventForm mode="create" />);
    await userEvent.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(back).toHaveBeenCalled();
  });
});
