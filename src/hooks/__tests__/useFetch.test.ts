import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetch } from "../useFetch";

describe("useFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets loading=false and does not fetch when url is null", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useFetch(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sets loading=false and does not fetch when skip=true", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useFetch("/api/test", { skip: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches and returns data on success", async () => {
    const data = { value: 42 };
    const onSuccess = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => data })
    );

    const { result } = renderHook(() => useFetch("/api/test", { onSuccess }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(data);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(data);
  });

  it("sets error with default message on HTTP error", async () => {
    const onError = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" })
    );

    const { result } = renderHook(() => useFetch("/api/test", { onError }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe("HTTP error 404: Not Found");
    expect(onError).toHaveBeenCalledWith(result.current.error);
  });

  it("uses custom errorMessage on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        })
    );

    const { result } = renderHook(() =>
      useFetch("/api/test", { errorMessage: "Custom error" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Custom error");
  });

  it("wraps non-Error rejections in Error with 'Unknown error'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("string rejection"));

    const { result } = renderHook(() => useFetch("/api/test"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Unknown error");
  });

  it("ignores AbortError silently", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    const { result } = renderHook(() => useFetch("/api/test"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it("re-fetches when refetch is called", async () => {
    const data = { value: 1 };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useFetch("/api/test"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
