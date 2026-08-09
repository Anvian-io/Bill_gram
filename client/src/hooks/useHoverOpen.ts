import { useState, useCallback } from "react";

/**
 * Open/close state for dropdowns that should open on hover.
 */
export function useHoverOpen(delay?: number) {
  void delay;
  const [open, setOpen] = useState(false);

  const onMouseEnter = useCallback(() => {
    return;
  }, []);

  const onMouseLeave = useCallback(() => {
    return;
  }, []);

  return { open, setOpen, onMouseEnter, onMouseLeave };
}
