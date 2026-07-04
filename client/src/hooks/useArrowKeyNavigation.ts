import { useEffect } from "react";
import {
  beginKeyboardNavigation,
  closeFloatingPanelsForField,
  endKeyboardNavigation,
  focusAdjacentField,
  isInputLikeElement,
  shouldSkipArrowNavigation,
} from "@/lib/focusNavigation";

export function useArrowKeyNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      const target = e.target as HTMLElement | null;
      if (!target || !isInputLikeElement(target)) return;

      const inputTarget = target as HTMLInputElement | HTMLSelectElement;
      if ("disabled" in inputTarget && inputTarget.disabled) return;

      if (shouldSkipArrowNavigation(target)) return;

      const tagName = target.tagName.toLowerCase();
      if (tagName === "input") {
        const input = target as HTMLInputElement;
        if (input.type === "hidden" || input.type === "submit") return;
      }

      e.preventDefault();
      beginKeyboardNavigation();
      closeFloatingPanelsForField(target);
      focusAdjacentField(target, e.key === "ArrowRight" ? "next" : "prev");
      endKeyboardNavigation();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
