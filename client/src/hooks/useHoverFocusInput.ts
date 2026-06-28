import * as React from "react";

const SKIP_HOVER_FOCUS_TYPES = new Set([
  "checkbox",
  "radio",
  "file",
  "hidden",
  "submit",
  "button",
  "reset",
]);

export function shouldSkipHoverFocus(
  type?: string,
  props?: { alwaysEditable?: boolean; "data-no-hover-focus"?: boolean },
): boolean {
  if (props?.alwaysEditable || props?.["data-no-hover-focus"]) return true;
  if (type && SKIP_HOVER_FOCUS_TYPES.has(type)) return true;
  return false;
}

export function useHoverFocusInput(
  type?: string,
  options?: {
    alwaysEditable?: boolean;
    "data-no-hover-focus"?: boolean;
    readOnly?: boolean;
    disabled?: boolean;
  },
) {
  const skip = shouldSkipHoverFocus(type, options);
  const [hoverActive, setHoverActive] = React.useState(false);
  const ref = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const isEditable =
    skip || options?.disabled
      ? true
      : hoverActive && !options?.readOnly;

  const activate = React.useCallback(() => {
    if (skip || options?.disabled) return;
    setHoverActive(true);
    ref.current?.focus();
  }, [skip, options?.disabled]);

  const deactivate = React.useCallback(() => {
    if (skip) return;
    if (document.activeElement !== ref.current) {
      setHoverActive(false);
    }
  }, [skip]);

  const handleMouseEnter = React.useCallback(() => {
    const tryFocus = () => {
      if (document.body.dataset.floatingDropdownOpen === "true") return false;
      if (!options?.disabled) {
        ref.current?.focus();
        if (!skip) setHoverActive(true);
      }
      return true;
    };

    if (document.body.dataset.floatingDropdownOpen === "true") {
      requestAnimationFrame(() => {
        if (!tryFocus()) {
          window.setTimeout(tryFocus, 220);
        }
      });
      return;
    }

    tryFocus();
  }, [skip, options?.disabled]);

  const handleMouseLeave = React.useCallback(() => {
    deactivate();
  }, [deactivate]);

  const handleFocus = React.useCallback(() => {
    if (!skip) setHoverActive(true);
  }, [skip]);

  const handleBlur = React.useCallback(() => {
    if (!skip) setHoverActive(false);
  }, [skip]);

  return {
    ref,
    skip,
    isEditable,
    hoverActive,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
    activate,
  };
}
