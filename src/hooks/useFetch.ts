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

  // Stable refs for callbacks — callers don't need to memoize them
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

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
    const { signal } = controller;

    async function fetchData() {
      // Reset states
      if (!signal.aborted) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(url as string, { signal });

        if (!response.ok) {
          throw new Error(
            errorMessage || `HTTP error ${response.status}: ${response.statusText}`
          );
        }

        const jsonData = (await response.json()) as T;

        if (!signal.aborted) {
          setData(jsonData);
          onSuccessRef.current?.(jsonData);
        }
      } catch (err) {
        // Ignore abort errors (component unmounted or refetch triggered)
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const fetchError = err instanceof Error ? err : new Error("Unknown error");

        if (!signal.aborted) {
          setError(fetchError);
          onErrorRef.current?.(fetchError);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
    // onSuccess/onError via refs — stable without being in dep array
  }, [url, skip, refreshKey, errorMessage]);

  return { data, loading, error, refetch };
}
