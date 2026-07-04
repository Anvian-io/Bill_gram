const FLOATING_PANEL_SELECTOR =
  '[data-floating-panel], [data-inline-search-panel], [data-slot="select-content"]';

export const MODAL_PORTAL_SELECTOR =
  '[data-slot="dialog-content"], [data-slot="alert-dialog-content"]';

export function isFloatingPanelTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(FLOATING_PANEL_SELECTOR);
}

export function resolvePortalContainer(anchor: HTMLElement | null): HTMLElement {
  if (!anchor) return document.body;
  return anchor.closest<HTMLElement>(MODAL_PORTAL_SELECTOR) ?? document.body;
}

let floatingDropdownOpenCount = 0;
let lastPointerX = 0;
let lastPointerY = 0;

const HOVER_FOCUS_SELECTOR = [
  'input[data-slot="input"]:not([disabled])',
  'textarea[data-slot="textarea"]:not([disabled])',
  '[data-inline-search-input]:not([disabled])',
  '[data-slot="select-trigger"]:not([disabled])',
  '[data-hover-date-input]:not([disabled])',
].join(", ");

function trackPointerPosition(event: MouseEvent) {
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
}

function focusFieldUnderPointer() {
  if (document.body.dataset.keyboardNavigating === "true") {
    return;
  }

  const stack = document.elementsFromPoint(lastPointerX, lastPointerY);
  for (const element of stack) {
    if (
      element instanceof HTMLElement &&
      element.closest(
        '[data-inline-search-panel], [data-slot="select-content"], [data-floating-panel]',
      )
    ) {
      continue;
    }

    const focusTarget = element.closest(HOVER_FOCUS_SELECTOR) as HTMLElement | null;
    if (focusTarget) {
      focusTarget.dispatchEvent(
        new MouseEvent("mouseenter", { bubbles: true, clientX: lastPointerX, clientY: lastPointerY }),
      );
      focusTarget.focus();
      return;
    }
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("mousemove", trackPointerPosition, { passive: true });
}

export function setFloatingDropdownOpen(open: boolean) {
  if (open) {
    floatingDropdownOpenCount += 1;
    document.body.dataset.floatingDropdownOpen = "true";
    return;
  }

  floatingDropdownOpenCount = Math.max(0, floatingDropdownOpenCount - 1);
  if (floatingDropdownOpenCount === 0) {
    delete document.body.dataset.floatingDropdownOpen;
    requestAnimationFrame(() => {
      focusFieldUnderPointer();
    });
  }
}

export function isFloatingDropdownOpen(): boolean {
  return document.body.dataset.floatingDropdownOpen === "true";
}

export function updateLastPointerPosition(clientX: number, clientY: number) {
  lastPointerX = clientX;
  lastPointerY = clientY;
}

/** Keep modal open when interacting with portaled dropdown/calendar panels. */
export function preventDismissOnFloatingPanel(
  event: { preventDefault: () => void; target?: EventTarget | null },
  originalEvent: Event,
) {
  if (
    isFloatingPanelTarget(originalEvent.target) ||
    isFloatingPanelTarget(event.target ?? null)
  ) {
    event.preventDefault();
  }
}
