import { useEffect, useState, type CSSProperties, type RefObject } from "react";

/** Above cards/tables; below the fixed header (z-30) and main sidebar (z-50). */
export const FLOATING_PANEL_Z_INDEX = 20;

export function useFloatingPanelPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  offset = 4,
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

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + offset,
        left: rect.left,
        width: rect.width,
        zIndex: FLOATING_PANEL_Z_INDEX,
        visibility: "visible",
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(anchorRef.current);

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, offset]);

  return style;
}
