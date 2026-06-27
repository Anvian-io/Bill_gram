import { useEffect } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[role="combobox"]:not([disabled])',
  '[data-slot="select-trigger"]:not([disabled])',
  '[data-inline-search-input]:not([disabled])',
  '[data-hover-date-input]:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function isVisible(el: HTMLElement) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function shouldSkipEnterNavigation(target: HTMLElement) {
  if (target.closest("[data-no-enter-next]")) return true;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "textarea") return true;

  if (
    target.getAttribute("role") === "combobox" &&
    target.getAttribute("aria-expanded") === "true"
  ) {
    return true;
  }

  const inlineSearchPanel = target.closest("[data-inline-search]");
  if (
    inlineSearchPanel?.querySelector('[data-inline-search-panel]') &&
    target.matches('[data-inline-search-input]')
  ) {
    const selectedItem = inlineSearchPanel.querySelector(
      '[cmdk-item][data-selected="true"]',
    );
    if (selectedItem) return true;
  }

  const commandRoot = target.closest('[data-slot="command"]');
  if (commandRoot && target.matches('[data-slot="command-input"]')) {
    const selectedItem = commandRoot.querySelector(
      '[cmdk-item][data-selected="true"]',
    );
    if (selectedItem) return true;
  }

  return false;
}

function getScope(target: HTMLElement) {
  const form = target.closest("form");
  if (form) return form;

  const dialog = target.closest('[role="dialog"]');
  if (dialog) return dialog as HTMLElement;

  const entrySection = target.closest("[data-entry-form]");
  if (entrySection) return entrySection as HTMLElement;

  return document;
}

function focusNextField(target: HTMLElement) {
  const scope = getScope(target);
  const elements = Array.from(
    scope.querySelectorAll(FOCUSABLE_SELECTOR),
  ) as HTMLElement[];

  const visibleElements = elements.filter(isVisible);
  const currentIndex = visibleElements.indexOf(target);

  if (currentIndex > -1 && currentIndex < visibleElements.length - 1) {
    visibleElements[currentIndex + 1].focus();
    return true;
  }

  return false;
}

export function useEnterToNextField() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.defaultPrevented || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      const isInputLike =
        tagName === "input" ||
        tagName === "select" ||
        target.matches('[role="combobox"]') ||
        target.matches('[data-slot="select-trigger"]') ||
        target.matches('[data-inline-search-input]');

      if (!isInputLike) return;

      const inputTarget = target as HTMLInputElement | HTMLSelectElement | HTMLButtonElement;
      if ("disabled" in inputTarget && inputTarget.disabled) return;
      if (tagName === "input") {
        const input = inputTarget as HTMLInputElement;
        if (input.type === "hidden" || input.type === "submit") return;
      }

      if (shouldSkipEnterNavigation(target)) return;

      e.preventDefault();

      const inlineSearch = target.closest("[data-inline-search]");
      if (inlineSearch) {
        const panel = inlineSearch.querySelector("[data-inline-search-panel]");
        if (panel) {
          inlineSearch.dispatchEvent(new CustomEvent("inline-search-close"));
        }
      }

      focusNextField(target);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
