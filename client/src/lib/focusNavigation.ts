import { updateLastPointerPosition } from "@/lib/floatingPanelEvents";

let keyboardNavigationDepth = 0;
let keyboardNavigationTimer: ReturnType<typeof setTimeout> | null = null;

export function beginKeyboardNavigation() {
  keyboardNavigationDepth += 1;
  document.body.dataset.keyboardNavigating = "true";
  if (keyboardNavigationTimer) {
    clearTimeout(keyboardNavigationTimer);
    keyboardNavigationTimer = null;
  }
}

export function endKeyboardNavigation(delay = 120) {
  if (keyboardNavigationTimer) {
    clearTimeout(keyboardNavigationTimer);
  }
  keyboardNavigationTimer = setTimeout(() => {
    keyboardNavigationDepth = Math.max(0, keyboardNavigationDepth - 1);
    if (keyboardNavigationDepth === 0) {
      delete document.body.dataset.keyboardNavigating;
    }
    keyboardNavigationTimer = null;
  }, delay);
}

export const FOCUSABLE_SELECTOR = [
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

export const INPUT_FIELD_SELECTOR = [
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[role="combobox"]:not([disabled])',
  '[data-inline-search-input]:not([disabled])',
  '[data-hover-date-input]:not([disabled])',
].join(", ");

export function isVisible(el: HTMLElement) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

export function shouldSkipEnterNavigation(target: HTMLElement) {
  if (target.closest("[data-no-enter-next]")) return true;

  if (
    target.getAttribute("role") === "combobox" &&
    target.getAttribute("aria-expanded") === "true"
  ) {
    return true;
  }

  const inlineSearchPanel = target.closest("[data-inline-search]");
  if (
    inlineSearchPanel?.querySelector("[data-inline-search-panel]") &&
    target.matches("[data-inline-search-input]")
  ) {
    return true;
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

export function shouldSkipArrowNavigation(target: HTMLElement) {
  if (target.closest("[data-skip-arrow-nav]")) return true;

  if (
    target.getAttribute("role") === "combobox" &&
    target.getAttribute("aria-expanded") === "true"
  ) {
    return true;
  }

  const inlineSearchPanel = target.closest("[data-inline-search]");
  if (
    inlineSearchPanel?.querySelector("[data-inline-search-panel]") &&
    target.matches("[data-inline-search-input]")
  ) {
    return true;
  }

  return false;
}

export function getFocusScope(target: HTMLElement) {
  const form = target.closest("form");
  if (form) return form;

  const dialog = target.closest('[role="dialog"]');
  if (dialog) return dialog as HTMLElement;

  const entrySection = target.closest("[data-entry-form]");
  if (entrySection) return entrySection as HTMLElement;

  const main = target.closest("main");
  if (main) return main as HTMLElement;

  return document;
}

export function getVisibleFocusableElements(scope: ParentNode) {
  return Array.from(scope.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      isVisible(el as HTMLElement) &&
      !(el as HTMLElement).hasAttribute("data-skip-field-nav"),
  ) as HTMLElement[];
}

export function getVisibleInputFields(scope: ParentNode) {
  return Array.from(scope.querySelectorAll(INPUT_FIELD_SELECTOR)).filter(
    (el) => isVisible(el as HTMLElement),
  ) as HTMLElement[];
}

export function closeFloatingPanelsForField(target: HTMLElement) {
  const inlineSearch = target.closest("[data-inline-search]");
  if (inlineSearch) {
    inlineSearch.dispatchEvent(new CustomEvent("inline-search-close"));
  }

  const hoverDate = target.closest("[data-hover-date]");
  if (hoverDate) {
    hoverDate.dispatchEvent(new CustomEvent("hover-date-close"));
  }
}

export function syncPointerWithElement(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  if (!rect.width && !rect.height) return;

  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;

  updateLastPointerPosition(clientX, clientY);

  const eventInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    screenX: window.screenX + clientX,
    screenY: window.screenY + clientY,
    view: window,
  };

  const targets: HTMLElement[] = [];
  let node: HTMLElement | null = el;
  while (node) {
    targets.push(node);
    node = node.parentElement;
  }

  for (const target of targets.reverse()) {
    target.dispatchEvent(new MouseEvent("mousemove", eventInit));
    target.dispatchEvent(new MouseEvent("mouseover", eventInit));
    target.dispatchEvent(new MouseEvent("mouseenter", eventInit));
  }

  if (window.electronAPI?.moveCursorTo) {
    void window.electronAPI.moveCursorTo(clientX, clientY);
  }
}

export async function syncPointerWithElementAsync(el: HTMLElement) {
  syncPointerWithElement(el);
  if (window.electronAPI?.moveCursorTo) {
    const rect = el.getBoundingClientRect();
    await window.electronAPI.moveCursorTo(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
  }
}

export function focusElementWithCursor(el: HTMLElement) {
  beginKeyboardNavigation();

  el.focus({ preventScroll: false });
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    try {
      const valueLength = el.value?.length ?? 0;
      el.setSelectionRange(valueLength, valueLength);
    } catch {
      // date inputs may not support select in some browsers
    }
  }

  requestAnimationFrame(() => {
    syncPointerWithElement(el);
    requestAnimationFrame(() => {
      syncPointerWithElement(el);
      endKeyboardNavigation();
    });
  });
}

export function focusFieldById(fieldId: string, delay = 0) {
  const focus = () => {
    const nextElement = document.getElementById(fieldId) as HTMLElement | null;
    if (!nextElement) return;
    focusElementWithCursor(nextElement);
  };

  if (delay > 0) {
    setTimeout(focus, delay);
  } else {
    focus();
  }
}

export function focusAdjacentField(
  target: HTMLElement,
  direction: "next" | "prev",
) {
  const customTargetId = target.getAttribute("data-enter-next");
  if (direction === "next" && customTargetId) {
    focusFieldById(customTargetId);
    return true;
  }

  const scope = getFocusScope(target);
  const visibleElements = getVisibleFocusableElements(scope);
  const currentIndex = visibleElements.indexOf(target);

  if (currentIndex === -1) return false;

  const nextIndex =
    direction === "next" ? currentIndex + 1 : currentIndex - 1;

  if (nextIndex >= 0 && nextIndex < visibleElements.length) {
    focusElementWithCursor(visibleElements[nextIndex]);
    return true;
  }

  return false;
}

export function focusFirstFieldInPage() {
  const main = document.querySelector("main");
  const scope = main ?? document;
  const inputFields = getVisibleInputFields(scope);

  if (inputFields.length > 0) {
    focusElementWithCursor(inputFields[0]);
    return true;
  }

  const visibleElements = getVisibleFocusableElements(scope);
  if (visibleElements.length > 0) {
    focusElementWithCursor(visibleElements[0]);
    return true;
  }

  return false;
}

export function isInputLikeElement(target: HTMLElement) {
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea" ||
    target.matches('[role="combobox"]') ||
    target.matches('[data-slot="select-trigger"]') ||
    target.matches("[data-inline-search-input]") ||
    target.matches("[data-hover-date-input]")
  );
}

export function isPageLevelEnterTarget(target: HTMLElement) {
  const tagName = target.tagName.toLowerCase();
  if (tagName === "body" || tagName === "html") return true;
  if (target.matches("main")) return true;

  if (tagName === "div" || tagName === "section" || tagName === "article") {
    return !target.closest(
      "button, a, input, select, textarea, [role='combobox'], [data-inline-search-input], [data-hover-date-input]",
    );
  }

  return false;
}

export function shouldFocusFirstFieldOnEnter(target: HTMLElement) {
  if (isInputLikeElement(target)) return false;

  const tag = target.tagName.toLowerCase();
  if (tag === "textarea") return false;

  if (target.closest('[role="dialog"]')) return false;
  if (target.closest("[data-no-enter-first]")) return false;

  const main = document.querySelector("main");

  if (main?.contains(target)) {
    if (tag === "button" || tag === "a") return false;
    if (
      target.getAttribute("role") === "button" ||
      target.getAttribute("role") === "tab"
    ) {
      return false;
    }
    return true;
  }

  if (tag === "button" || tag === "a") return true;

  return isPageLevelEnterTarget(target);
}
