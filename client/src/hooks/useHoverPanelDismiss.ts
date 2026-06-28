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

function isPointerOverContainer(containerRef: RefObject<HTMLElement | null>) {
  if (!containerRef.current) return false;
  const hovered = document.querySelectorAll(":hover");
  for (let i = 0; i < hovered.length; i++) {
    if (containerRef.current.contains(hovered[i])) {
      return true;
    }
  }
  return false;
}

export function useHoverPanelDismiss(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  const rafRef = useRef<number | null>(null);

  const cancelDismiss = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const dismissOnLeave = useCallback(() => {
    cancelDismiss();
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!isPointerOverElements(anchorRef, panelRef)) {
        onDismiss();
      }
    });
  }, [anchorRef, panelRef, cancelDismiss, onDismiss]);

  return { cancelDismiss, scheduleDismiss: dismissOnLeave, dismissOnLeave };
}

export function useHoverContainerDismiss(
  containerRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  const rafRef = useRef<number | null>(null);

  const cancelDismiss = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const dismissOnLeave = useCallback(() => {
    cancelDismiss();
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!isPointerOverContainer(containerRef)) {
        onDismiss();
      }
    });
  }, [containerRef, cancelDismiss, onDismiss]);

  return { cancelDismiss, dismissOnLeave };
}
