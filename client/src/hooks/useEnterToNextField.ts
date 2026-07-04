import { useEffect } from "react";
import {
  beginKeyboardNavigation,
  closeFloatingPanelsForField,
  endKeyboardNavigation,
  focusAdjacentField,
  focusFirstFieldInPage,
  isInputLikeElement,
  shouldFocusFirstFieldOnEnter,
  shouldSkipEnterNavigation,
} from "@/lib/focusNavigation";

function handleOpenDatePickerEnter(target: HTMLElement, event: KeyboardEvent) {
  const hoverDateRoot = target.closest("[data-hover-date]");
  if (hoverDateRoot?.getAttribute("data-hover-date-open") !== "true") {
    return false;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const dateInput = hoverDateRoot.querySelector(
    "[data-hover-date-input]",
  ) as HTMLElement | null;

  beginKeyboardNavigation();
  if (dateInput) {
    closeFloatingPanelsForField(dateInput);
    focusAdjacentField(dateInput, "next");
  } else {
    closeFloatingPanelsForField(target);
  }
  endKeyboardNavigation();

  return true;
}

export function useEnterToNextField() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key !== "Enter" ||
        e.defaultPrevented ||
        e.shiftKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (handleOpenDatePickerEnter(target, e)) {
        return;
      }

      if (isInputLikeElement(target)) {
        const inputTarget = target as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLButtonElement;
        if ("disabled" in inputTarget && inputTarget.disabled) return;

        const tagName = target.tagName.toLowerCase();
        if (tagName === "input") {
          const input = inputTarget as HTMLInputElement;
          if (input.type === "hidden" || input.type === "submit") return;
        }

        if (shouldSkipEnterNavigation(target)) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        beginKeyboardNavigation();
        closeFloatingPanelsForField(target);
        focusAdjacentField(target, "next");
        endKeyboardNavigation();
        return;
      }

      if (shouldFocusFirstFieldOnEnter(target)) {
        e.preventDefault();
        beginKeyboardNavigation();
        focusFirstFieldInPage();
        endKeyboardNavigation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
