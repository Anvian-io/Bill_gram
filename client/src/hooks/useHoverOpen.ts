import { useRef, useState, useCallback } from "react";

/**
 * Open/close state for dropdowns that should open on hover.
 */
export function useHoverOpen() {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }, []);

  return { open, setOpen, onMouseEnter, onMouseLeave };
}
