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
  children,
}: InlineSearchFieldProps) {
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
    4,
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
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          data-inline-search-input
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pr-8", inputClassName)}
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
