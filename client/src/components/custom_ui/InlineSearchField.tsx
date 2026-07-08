"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandList } from "@/components/ui/command";
import {
  INLINE_SEARCH_PANEL_MIN_WIDTH,
  useFloatingPanelPosition,
} from "@/hooks/useFloatingPanelPosition";
import { useHoverPanelDismiss } from "@/hooks/useHoverPanelDismiss";
import { useHoverOpenDelay } from "@/hooks/useHoverOpenDelay";
import {
  resolvePortalContainer,
  setFloatingDropdownOpen,
} from "@/lib/floatingPanelEvents";

export interface InlineSearchFieldProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  displayValue?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  emptyMessage?: string;
  shouldFilter?: boolean;
  /** Minimum width for the dropdown panel (defaults to 240px). */
  panelMinWidth?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  inputId?: string;
  /** Called after Enter selects the first dropdown item (for focus navigation). */
  onAfterEnterSelect?: () => void;
  /** When dropdown is closed, Enter focuses this field id instead of the next DOM field. */
  enterNextFieldId?: string;
  children: React.ReactNode;
}

export function InlineSearchField({
  open: openProp,
  onOpenChange,
  displayValue = "",
  searchValue: searchValueProp,
  onSearchChange,
  placeholder = "Search...",
  disabled = false,
  className,
  inputClassName,
  emptyMessage = "No results found.",
  shouldFilter = true,
  panelMinWidth = INLINE_SEARCH_PANEL_MIN_WIDTH,
  onMouseEnter,
  onMouseLeave,
  inputId,
  onAfterEnterSelect,
  enterNextFieldId,
  children,
  ...ariaProps
}: InlineSearchFieldProps & React.AriaAttributes) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [internalSearch, setInternalSearch] = React.useState("");
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(
    null,
  );
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const searchValue = searchValueProp ?? internalSearch;
  const setSearchValue = onSearchChange ?? setInternalSearch;
  const panelStyle = useFloatingPanelPosition(
    open,
    anchorRef,
    0,
    portalTarget,
    panelMinWidth,
  );

  const focusInput = React.useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const length = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(length, length);
    });
  }, []);

  const closeDropdown = React.useCallback(() => {
    setOpen(false);
    setSearchValue("");
  }, [setOpen, setSearchValue]);

  const { cancelDismiss, dismissOnLeave } = useHoverPanelDismiss(
    anchorRef,
    panelRef,
    closeDropdown,
  );
  const { scheduleOpen, cancelScheduledOpen } = useHoverOpenDelay();

  const openDropdown = React.useCallback(() => {
    if (disabled) return;
    setOpen(true);
    focusInput();
  }, [disabled, focusInput, setOpen]);

  const handleMouseEnter = React.useCallback(() => {
    cancelDismiss();
    if (openProp !== undefined) {
      onMouseEnter?.();
      return;
    }
    scheduleOpen(openDropdown);
  }, [cancelDismiss, onMouseEnter, openDropdown, openProp, scheduleOpen]);

  const handleMouseLeave = React.useCallback(() => {
    cancelScheduledOpen();
    onMouseLeave?.();
    if (open) {
      dismissOnLeave();
    }
  }, [cancelScheduledOpen, dismissOnLeave, onMouseLeave, open]);

  React.useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPortalTarget(null);
      return;
    }
    setPortalTarget(resolvePortalContainer(anchorRef.current));
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setFloatingDropdownOpen(true);
      focusInput();
      return () => setFloatingDropdownOpen(false);
    }
    return undefined;
  }, [open, focusInput]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeDropdown();
    };

    const handleCloseRequest = () => {
      closeDropdown();
    };

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }
    anchorRef.current?.addEventListener(
      "inline-search-close",
      handleCloseRequest,
    );

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      anchorRef.current?.removeEventListener(
        "inline-search-close",
        handleCloseRequest,
      );
    };
  }, [open, closeDropdown]);

  const closedValue =
    displayValue && displayValue !== placeholder ? displayValue : "";
  const inputValue = open ? searchValue : closedValue;
  const isInvalid = ariaProps["aria-invalid"] === true;

  const selectFirstItem = React.useCallback(() => {
    const selectedItem = panelRef.current?.querySelector(
      "[cmdk-item][data-selected='true']:not([data-disabled='true'])",
    ) as HTMLElement | null;
    const firstItem = panelRef.current?.querySelector(
      "[cmdk-item]:not([data-disabled='true'])",
    ) as HTMLElement | null;
    const itemToSelect = selectedItem ?? firstItem;
    if (itemToSelect) {
      itemToSelect.click();
    }
    closeDropdown();
    if (onAfterEnterSelect) {
      requestAnimationFrame(() => onAfterEnterSelect());
    }
  }, [closeDropdown, onAfterEnterSelect]);

  const getDropdownItems = React.useCallback(() => {
    return Array.from(
      panelRef.current?.querySelectorAll(
        "[cmdk-item]:not([data-disabled='true'])",
      ) ?? [],
    ) as HTMLElement[];
  }, []);

  const navigateDropdownItem = React.useCallback(
    (direction: "up" | "down") => {
      const items = getDropdownItems();
      if (items.length === 0) return;

      const selectedIndex = items.findIndex(
        (item) => item.getAttribute("data-selected") === "true",
      );
      let nextIndex = selectedIndex;

      if (direction === "down") {
        nextIndex =
          selectedIndex === -1 ? 0 : Math.min(selectedIndex + 1, items.length - 1);
      } else {
        nextIndex =
          selectedIndex === -1 ? items.length - 1 : Math.max(selectedIndex - 1, 0);
      }

      items.forEach((item, index) => {
        if (index === nextIndex) {
          item.setAttribute("data-selected", "true");
          item.setAttribute("aria-selected", "true");
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.setAttribute("data-selected", "false");
          item.setAttribute("aria-selected", "false");
        }
      });
    },
    [getDropdownItems],
  );

  const panel = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg ring-1 ring-border/50"
      data-inline-search-panel
      data-floating-panel
      onMouseEnter={handleMouseEnter}
      onMouseLeave={dismissOnLeave}
    >
      <Command shouldFilter={shouldFilter}>
        <CommandList className="max-h-[240px]">
          {children}
          <CommandEmpty>{emptyMessage}</CommandEmpty>
        </CommandList>
      </Command>
    </div>
  ) : null;

  return (
    <div
      className={cn("relative w-full", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-inline-search
      data-inline-search-open={open ? "true" : undefined}
    >
      <div ref={anchorRef} className="relative">
        <Input
          ref={inputRef}
          id={inputId}
          alwaysEditable
          data-no-hover-focus
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          data-inline-search-input
          data-enter-next={enterNextFieldId}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-8",
            isInvalid && "border-destructive",
            inputClassName,
          )}
          aria-invalid={isInvalid || undefined}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeDropdown();
              inputRef.current?.blur();
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              event.stopPropagation();
              if (!open) {
                openDropdown();
                requestAnimationFrame(() => {
                  navigateDropdownItem(
                    event.key === "ArrowDown" ? "down" : "up",
                  );
                });
                return;
              }
              navigateDropdownItem(event.key === "ArrowDown" ? "down" : "up");
              return;
            }
            if (event.key === "Enter" && open) {
              event.preventDefault();
              event.stopPropagation();
              selectFirstItem();
            }
          }}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 opacity-50" />
      </div>

      {typeof document !== "undefined" && panel && portalTarget
        ? createPortal(panel, portalTarget)
        : null}
    </div>
  );
}
