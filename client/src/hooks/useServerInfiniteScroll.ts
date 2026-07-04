import { useState, useEffect, useRef, useCallback } from "react";
import { REPORT_INFINITE_SCROLL_PAGE_SIZE } from "./useInfiniteScrollList";

interface ServerPagination {
  hasNextPage: boolean;
  currentPage: number;
  total?: number;
}

interface FetchPageResult<T> {
  items: T[];
  pagination: ServerPagination;
}

export function useServerInfiniteScroll<T>(
  fetchPage: (page: number) => Promise<FetchPageResult<T>>,
  resetKey: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const fetchPageRef = useRef(fetchPage);

  fetchPageRef.current = fetchPage;

  const loadPage = useCallback(async (pageNum: number, replace: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    if (replace) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await fetchPageRef.current(pageNum);
      setItems((prev) =>
        replace ? result.items : [...prev, ...result.items],
      );
      setPage(pageNum);
      setHasMore(result.pagination.hasNextPage);
      if (result.pagination.total !== undefined) {
        setTotal(result.pagination.total);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(false);
    setTotal(0);
    loadPage(1, true);
  }, [resetKey, loadPage]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          !loadingRef.current
        ) {
          loadPage(page + 1, false);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, page, loadPage]);

  const refresh = useCallback(() => loadPage(1, true), [loadPage]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
    refresh,
    total,
    loadedCount: items.length,
  };
}

export { REPORT_INFINITE_SCROLL_PAGE_SIZE };
