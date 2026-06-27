import { useCallback, useRef, type RefObject } from "react";

function isPointerOverElements(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
) {
  const hovered = document.querySelectorAll(":hover");
  for (let i = 0; i < hovered.length; i++) {
    const el = hovered[i];
    if (anchorRef.current?.contains(el) || panelRef.current?.contains(el)) {
      return true;
    }
  }
  return false;
}

export function useHoverPanelDismiss(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  delay = 200,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelDismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    cancelDismiss();
    timeoutRef.current = setTimeout(() => {
      if (!isPointerOverElements(anchorRef, panelRef)) {
        onDismiss();
      }
    }, delay);
  }, [anchorRef, panelRef, cancelDismiss, delay, onDismiss]);

  return { cancelDismiss, scheduleDismiss };
}
