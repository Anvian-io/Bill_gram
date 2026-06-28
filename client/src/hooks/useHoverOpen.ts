import { useRef, useState, useCallback } from "react";
import { useHoverOpenDelay } from "@/hooks/useHoverOpenDelay";

/**
 * Open/close state for dropdowns that should open on hover.
 */
export function useHoverOpen() {
  const [open, setOpen] = useState(false);
  const { scheduleOpen, cancelScheduledOpen } = useHoverOpenDelay();

  const onMouseEnter = useCallback(() => {
    scheduleOpen(() => setOpen(true));
  }, [scheduleOpen]);

  const onMouseLeave = useCallback(() => {
    cancelScheduledOpen();
    setOpen(false);
  }, [cancelScheduledOpen]);

  return { open, setOpen, onMouseEnter, onMouseLeave };
}
