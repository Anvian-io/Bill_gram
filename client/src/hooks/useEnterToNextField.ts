import { useEffect } from "react";

export function useEnterToNextField() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();

        // Skip if default is already prevented
        if (e.defaultPrevented) return;

        // Apply only to inputs and selects. Exclude textareas and buttons.
        if (tagName !== "input" && tagName !== "select") return;

        const inputTarget = target as HTMLInputElement | HTMLSelectElement;

        // Skip disabled or hidden elements
        if (inputTarget.disabled || inputTarget.type === "hidden" || inputTarget.type === "submit") return;

        // Skip inputs that are used for combobox/search when they are open
        if (
          target.getAttribute("role") === "combobox" &&
          target.getAttribute("aria-expanded") === "true"
        ) {
          return;
        }

        e.preventDefault();

        // Find focusable elements
        const focusableSelector =
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

        let scope: HTMLElement | Document = document;
        const form = target.closest("form");
        const dialog = target.closest('[role="dialog"]');

        if (form) {
          scope = form;
        } else if (dialog) {
          scope = dialog as HTMLElement;
        }

        const elements = Array.from(
          scope.querySelectorAll(focusableSelector)
        ) as HTMLElement[];

        // Filter out elements that are not actually visible
        const visibleElements = elements.filter((el) => {
          return !!(
            el.offsetWidth ||
            el.offsetHeight ||
            el.getClientRects().length
          );
        });

        const currentIndex = visibleElements.indexOf(target);

        if (currentIndex > -1 && currentIndex < visibleElements.length - 1) {
          visibleElements[currentIndex + 1].focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
