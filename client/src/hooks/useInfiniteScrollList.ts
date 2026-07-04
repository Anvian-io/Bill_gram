import { useState, useEffect, useRef, useCallback } from "react";

export const REPORT_INFINITE_SCROLL_PAGE_SIZE = 50;

export function useInfiniteScrollList<T>(
  items: T[],
  pageSize = REPORT_INFINITE_SCROLL_PAGE_SIZE,
) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + pageSize, items.length));
  }, [items.length, pageSize]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return {
    visibleItems,
    sentinelRef,
    hasMore,
    totalCount: items.length,
    visibleCount,
  };
}
