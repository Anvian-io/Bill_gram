import { useCallback, useRef, type RefObject } from "react";
import { HOVER_DISMISS_DELAY_MS } from "@/hooks/hoverTiming";

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
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelDismiss = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (dismissTimeoutRef.current !== null) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  }, []);

  const dismissOnLeave = useCallback(() => {
    cancelDismiss();
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      dismissTimeoutRef.current = setTimeout(() => {
        dismissTimeoutRef.current = null;
        if (!isPointerOverElements(anchorRef, panelRef)) {
          onDismiss();
        }
      }, HOVER_DISMISS_DELAY_MS);
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
      if (
        !isPointerOverContainer(containerRef) &&
        !isPointerOverSelectContent()
      ) {
        onDismiss();
      }
    });
  }, [containerRef, cancelDismiss, onDismiss]);

  return { cancelDismiss, dismissOnLeave };
}

function isPointerOverSelectContent() {
  const hovered = document.querySelectorAll(":hover");
  for (let i = 0; i < hovered.length; i++) {
    if (hovered[i] instanceof Element && hovered[i].closest('[data-slot="select-content"]')) {
      return true;
    }
  }
  return false;
}
