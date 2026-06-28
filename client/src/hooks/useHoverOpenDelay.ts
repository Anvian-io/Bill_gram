import { useCallback, useEffect, useRef } from "react";
import { HOVER_OPEN_DELAY_MS } from "@/hooks/hoverTiming";

export function useHoverOpenDelay(delay = HOVER_OPEN_DELAY_MS) {
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledOpen = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(
    (callback: () => void) => {
      cancelScheduledOpen();
      openTimeoutRef.current = setTimeout(() => {
        openTimeoutRef.current = null;
        callback();
      }, delay);
    },
    [cancelScheduledOpen, delay],
  );

  useEffect(() => cancelScheduledOpen, [cancelScheduledOpen]);

  return { scheduleOpen, cancelScheduledOpen };
}
