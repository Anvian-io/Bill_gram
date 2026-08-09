"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useFloatingPanelPosition } from "@/hooks/useFloatingPanelPosition";
import {
  resolvePortalContainer,
  setFloatingDropdownOpen,
} from "@/lib/floatingPanelEvents";

export interface HoverDateInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  inputClassName?: string;
}

export function HoverDateInput({
  value = "",
  onChange,
  className,
  inputClassName,
  disabled,
  onBlur,
  ...props
}: HoverDateInputProps) {
  const [open, setOpen] = React.useState(false);
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(
    null,
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const panelStyle = useFloatingPanelPosition(open, anchorRef, 4, portalTarget);

  const closePicker = React.useCallback(() => {
    setOpen(false);
  }, []);

  const dismiss = React.useCallback(() => {
    setOpen(false);
    inputRef.current?.blur();
  }, []);

  const openPicker = React.useCallback(() => {
    if (disabled) return;
    setOpen(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [disabled]);

  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);

      requestAnimationFrame(() => {
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (anchorRef.current?.contains(activeElement) ||
            panelRef.current?.contains(activeElement))
        ) {
          return;
        }
        closePicker();
      });
    },
    [closePicker, onBlur],
  );

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date || !onChange) return;
    onChange(format(date, "yyyy-MM-dd"));
    dismiss();
  };

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
      return () => setFloatingDropdownOpen(false);
    }
    return undefined;
  }, [open]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      dismiss();
    };

    const handleCloseRequest = () => {
      closePicker();
    };

    const anchor = anchorRef.current;

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }
    anchor?.addEventListener("hover-date-close", handleCloseRequest);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      anchor?.removeEventListener("hover-date-close", handleCloseRequest);
    };
  }, [open, dismiss, closePicker]);

  const panel = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="overflow-hidden rounded-md border bg-popover p-0 text-popover-foreground shadow-lg ring-1 ring-border/50"
      data-floating-panel
      data-hover-date-panel
      onMouseDown={(event) => event.preventDefault()}
    >
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleCalendarSelect}
        disabled={disabled}
      />
    </div>
  ) : null;

  return (
    <div
      className={cn("relative w-full", className)}
      data-hover-date
      data-hover-date-open={open ? "true" : undefined}
    >
      <div ref={anchorRef} className="relative">
        <Input
          ref={inputRef}
          type="date"
          alwaysEditable
          data-hover-date-input
          value={value}
          disabled={disabled}
          className={cn("pr-10", inputClassName)}
          onChange={(event) => onChange?.(event.target.value)}
          onFocus={openPicker}
          onBlur={handleBlur}
          {...props}
        />
        <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {typeof document !== "undefined" && panel && portalTarget
        ? createPortal(panel, portalTarget)
        : null}
    </div>
  );
}
