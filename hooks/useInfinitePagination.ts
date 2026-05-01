'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

const DEFAULT_PAGE_SIZE = 24; // OPhim default totalItemsPerPage

export interface UseInfinitePaginationOptions<T> {
  /**
   * Async fetcher that returns the items for a given page (1-indexed).
   * Throwing will surface as `error` and pause pagination until `retry()` is called.
   */
  fetcher: (page: number) => Promise<T[]>;
  /**
   * When this value changes, the hook resets entirely (items, page, hasMore, error)
   * and re-fetches from page 1. Useful when route param like `slug` changes.
   */
  resetKey?: string | number;
  /**
   * Used to detect "end of list": when the API returns less than this many items,
   * we assume there's no more pages. Defaults to OPhim's standard 24.
   */
  pageSize?: number;
}

export interface UseInfinitePaginationReturn<T> {
  items: T[];
  isLoading: boolean; // initial load only
  isLoadingMore: boolean; // pagination load
  hasMore: boolean;
  error: Error | null;
  /** Attach to a sentinel `<div ref={sentinelRef} />` near the bottom of the list. */
  sentinelRef: (node?: Element | null) => void;
  /** Re-attempt the current page after an error. */
  retry: () => void;
}

/**
 * Reusable infinite-scroll pagination hook.
 *
 * Replaces the buggy ad-hoc pattern previously copy-pasted across format/type/country
 * pages — fixes:
 *  - Infinite fetches after API returns empty (no end-of-list detection)
 *  - Concurrent / duplicate fetches when `inView` fires multiple times
 *  - Race conditions when `slug` changes mid-fetch (now properly cancelled)
 *  - Missing error handling
 */
export function useInfinitePagination<T>({
  fetcher,
  resetKey,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseInfinitePaginationOptions<T>): UseInfinitePaginationReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  /** retryTick lets us re-run the load effect for the current page on demand. */
  const [retryTick, setRetryTick] = useState<number>(0);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '200px', // pre-load slightly before sentinel enters viewport
  });

  // Keep latest fetcher in a ref so the load effect doesn't re-run on every render
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Guard against concurrent/duplicate in-flight fetches (e.g., inView fires repeatedly)
  const isFetchingRef = useRef(false);

  // Reset everything when resetKey changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setIsLoading(true);
    setIsLoadingMore(false);
    setHasMore(true);
    setError(null);
    setRetryTick(0);
    isFetchingRef.current = false;
  }, [resetKey]);

  // Load effect — fires on page change, resetKey change, or retry
  useEffect(() => {
    let cancelled = false;
    const isInitial = page === 1;

    const run = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (!isInitial) setIsLoadingMore(true);
      setError(null);

      try {
        const data = await fetcherRef.current(page);
        if (cancelled) return;

        if (!data || data.length === 0) {
          setHasMore(false);
        } else {
          if (data.length < pageSize) setHasMore(false);
          setItems((prev) => (isInitial ? data : [...prev, ...data]));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to fetch'));
      } finally {
        if (!cancelled) {
          isFetchingRef.current = false;
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [page, resetKey, retryTick, pageSize]);

  // Sentinel intersection → bump page (with all guards to prevent duplicate fires)
  useEffect(() => {
    if (!inView) return;
    if (isLoading || isLoadingMore) return;
    if (!hasMore || error) return;
    if (isFetchingRef.current) return;

    setPage((p) => p + 1);
  }, [inView, hasMore, isLoading, isLoadingMore, error]);

  const retry = useCallback(() => {
    setError(null);
    setRetryTick((t) => t + 1);
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sentinelRef,
    retry,
  };
}
