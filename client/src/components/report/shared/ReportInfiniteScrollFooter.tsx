import React from "react";
import { RefreshCw } from "lucide-react";

interface ReportInfiniteScrollFooterProps {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoadingMore?: boolean;
  loadedCount: number;
  totalCount?: number;
}

export default function ReportInfiniteScrollFooter({
  sentinelRef,
  hasMore,
  isLoadingMore = false,
  loadedCount,
  totalCount,
}: ReportInfiniteScrollFooterProps) {
  const totalLabel =
    totalCount !== undefined ? totalCount : loadedCount > 0 ? loadedCount : 0;

  return (
    <div ref={sentinelRef} className="py-4 text-center text-sm text-muted-foreground">
      {isLoadingMore ? (
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading more...
        </div>
      ) : hasMore ? (
        <span>Scroll for more</span>
      ) : loadedCount > 0 ? (
        <span>
          Showing all {loadedCount}
          {totalCount !== undefined && totalCount !== loadedCount
            ? ` of ${totalCount}`
            : ""}{" "}
          records
        </span>
      ) : (
        <span>{totalLabel === 0 ? "" : `Showing ${totalLabel} records`}</span>
      )}
    </div>
  );
}
