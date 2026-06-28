import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import {
  MODAL_PORTAL_SELECTOR,
  resolvePortalContainer,
} from "@/lib/floatingPanelEvents";

/** Above page content; below the fixed header (z-30). */
export const FLOATING_PANEL_Z_INDEX = 20;

/** Above dialog / alert-dialog layers (z-50). */
export const FLOATING_PANEL_MODAL_Z_INDEX = 60;

export function resolveFloatingPanelZIndex(
  anchor: HTMLElement | null,
  portalContainer: HTMLElement | null,
): number {
  if (portalContainer && portalContainer !== document.body) {
    return 50;
  }
  if (!anchor?.closest(MODAL_PORTAL_SELECTOR)) {
    return FLOATING_PANEL_Z_INDEX;
  }
  return FLOATING_PANEL_MODAL_Z_INDEX;
}

export const INLINE_SEARCH_PANEL_MIN_WIDTH = 240;

export function useFloatingPanelPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  offset = 4,
  portalContainer: HTMLElement | null = null,
  minWidth = 0,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    width: 0,
    zIndex: FLOATING_PANEL_Z_INDEX,
    visibility: "hidden",
  });

  useEffect(() => {
    if (!open || !anchorRef.current) {
      return;
    }

    const container =
      portalContainer ?? resolvePortalContainer(anchorRef.current);
    const useAbsolute = container !== document.body;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const zIndex = resolveFloatingPanelZIndex(anchor, container);

      const panelWidth =
        minWidth > 0 ? Math.max(rect.width, minWidth) : rect.width;

      if (useAbsolute) {
        const containerRect = container.getBoundingClientRect();
        setStyle({
          position: "absolute",
          top: rect.bottom - containerRect.top + container.scrollTop + offset,
          left: rect.left - containerRect.left + container.scrollLeft,
          width: panelWidth,
          zIndex,
          visibility: "visible",
        });
        return;
      }

      setStyle({
        position: "fixed",
        top: rect.bottom + offset,
        left: rect.left,
        width: panelWidth,
        zIndex,
        visibility: "visible",
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(anchorRef.current);
    if (useAbsolute) {
      observer.observe(container);
    }

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    container.addEventListener("scroll", update, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      container.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, offset, portalContainer, minWidth]);

  return style;
}

export { resolvePortalContainer };
