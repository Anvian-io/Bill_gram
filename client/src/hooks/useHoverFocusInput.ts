import * as React from "react";

export function shouldSkipHoverFocus(
  type?: string,
  props?: { alwaysEditable?: boolean; "data-no-hover-focus"?: boolean },
): boolean {
  void type;
  void props;
  return true;
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
    setHoverActive(false);
    if (document.activeElement === ref.current) {
      ref.current?.blur();
    }
  }, [skip]);

  const handleMouseEnter = React.useCallback(() => {
    return;
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    return;
  }, []);

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
