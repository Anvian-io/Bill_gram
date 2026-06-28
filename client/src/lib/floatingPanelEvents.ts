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

export function setFloatingDropdownOpen(open: boolean) {
  if (open) {
    floatingDropdownOpenCount += 1;
    document.body.dataset.floatingDropdownOpen = "true";
    return;
  }

  floatingDropdownOpenCount = Math.max(0, floatingDropdownOpenCount - 1);
  if (floatingDropdownOpenCount === 0) {
    delete document.body.dataset.floatingDropdownOpen;
  }
}

export function isFloatingDropdownOpen(): boolean {
  return document.body.dataset.floatingDropdownOpen === "true";
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
