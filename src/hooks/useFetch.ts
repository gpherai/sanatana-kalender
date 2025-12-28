/**
 * useFetch Hook
 *
 * Custom hook for fetching data with automatic AbortController management.
 * Handles loading state, error handling, and cleanup.
 *
 * Features:
 * - Automatic AbortController setup and cleanup
 * - Loading state management
 * - Error handling with AbortError filtering
 * - TypeScript generics for type-safe data
 * - Manual refetch capability
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFetch<User[]>('/api/users');
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface UseFetchOptions {
  /** Skip initial fetch (useful for conditional fetching) */
  skip?: boolean;
  /** Callback fired on successful fetch */
  onSuccess?: (data: unknown) => void;
  /** Callback fired on error (non-abort errors only) */
  onError?: (error: Error) => void;
  /** Custom error message */
  errorMessage?: string;
}

export interface UseFetchResult<T> {
  /** Fetched data (null if not yet loaded or error occurred) */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error object (null if no error) */
  error: Error | null;
  /** Manual refetch function */
  refetch: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for fetching data with automatic AbortController management
 *
 * @param url - API endpoint to fetch from
 * @param options - Fetch options
 * @returns Object containing data, loading state, error, and refetch function
 */
export function useFetch<T = unknown>(
  url: string | null,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { skip = false, onSuccess, onError, errorMessage } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Manual refetch function
  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Skip if disabled or no URL
    if (skip || !url) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let didCancel = false;

    async function fetchData() {
      // Reset states
      if (!didCancel && isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(url as string, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(
            errorMessage || `HTTP error ${response.status}: ${response.statusText}`
          );
        }

        const jsonData = (await response.json()) as T;

        if (!didCancel && isMountedRef.current) {
          setData(jsonData);
          onSuccess?.(jsonData);
        }
      } catch (err) {
        // Ignore abort errors (component unmounted or refetch triggered)
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const fetchError = err instanceof Error ? err : new Error("Unknown error");

        if (!didCancel && isMountedRef.current) {
          setError(fetchError);
          onError?.(fetchError);
        }
      } finally {
        if (!didCancel && isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [url, skip, refreshKey, onSuccess, onError, errorMessage]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { data, loading, error, refetch };
}

// =============================================================================
// VARIANT: useFetchMultiple
// =============================================================================

/**
 * Hook for fetching multiple URLs in parallel with automatic AbortController management
 *
 * @param urls - Array of API endpoints to fetch from
 * @param options - Fetch options
 * @returns Object containing data array, loading state, error, and refetch function
 */
export function useFetchMultiple<T = unknown>(
  urls: (string | null)[],
  options: UseFetchOptions = {}
): UseFetchResult<T[]> {
  const { skip = false, onSuccess, onError, errorMessage } = options;

  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isMountedRef = useRef(true);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Skip if disabled or no URLs
    const validUrls = urls.filter((url): url is string => url !== null);
    if (skip || validUrls.length === 0) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let didCancel = false;

    async function fetchAll() {
      if (!didCancel && isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const responses = await Promise.all(
          validUrls.map((url) => fetch(url, { signal: controller.signal }))
        );

        // Check all responses
        const failedResponse = responses.find((r) => !r.ok);
        if (failedResponse) {
          throw new Error(
            errorMessage ||
              `HTTP error ${failedResponse.status}: ${failedResponse.statusText}`
          );
        }

        const jsonData = (await Promise.all(
          responses.map((r) => r.json())
        )) as T[];

        if (!didCancel && isMountedRef.current) {
          setData(jsonData);
          onSuccess?.(jsonData);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const fetchError = err instanceof Error ? err : new Error("Unknown error");

        if (!didCancel && isMountedRef.current) {
          setError(fetchError);
          onError?.(fetchError);
        }
      } finally {
        if (!didCancel && isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    fetchAll();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [urls.join(","), skip, refreshKey, onSuccess, onError, errorMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { data, loading, error, refetch };
}
