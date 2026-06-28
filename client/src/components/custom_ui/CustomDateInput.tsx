import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { format, parse, isValid, isDate } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFloatingPanelPosition } from "@/hooks/useFloatingPanelPosition";
import { useHoverPanelDismiss } from "@/hooks/useHoverPanelDismiss";
import { useHoverOpenDelay } from "@/hooks/useHoverOpenDelay";

interface CustomDateInputProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export const CustomDateInput: React.FC<CustomDateInputProps> = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy or select",
  disabled = false,
  label,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelStyle = useFloatingPanelPosition(calendarOpen, anchorRef);

  const dismiss = useCallback(() => {
    setCalendarOpen(false);
    inputRef.current?.blur();
  }, []);

  const { cancelDismiss, dismissOnLeave } = useHoverPanelDismiss(
    anchorRef,
    panelRef,
    dismiss,
  );
  const { scheduleOpen, cancelScheduledOpen } = useHoverOpenDelay();

  const openCalendar = useCallback(() => {
    if (disabled) return;
    cancelDismiss();
    setCalendarOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [cancelDismiss, disabled]);

  const handleMouseEnter = () => {
    cancelDismiss();
    scheduleOpen(openCalendar);
  };

  const handleMouseLeave = () => {
    cancelScheduledOpen();
    if (calendarOpen) {
      dismissOnLeave();
    }
  };

  const parseDateFromString = (str: string): Date | null => {
    if (!str.trim()) return null;

    const formats = [
      "dd/MM/yyyy",
      "dd-MM-yyyy",
      "dd.MM.yyyy",
      "yyyy-MM-dd",
      "MM/dd/yyyy",
    ];

    for (const formatStr of formats) {
      try {
        const parsed = parse(str, formatStr, new Date());
        if (isValid(parsed) && isDate(parsed)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    const date = new Date(str);
    return isValid(date) && isDate(date) ? date : null;
  };

  const formatDateForDisplay = (date: Date | null): string => {
    if (!date || !isValid(date)) return "";
    return format(date, "dd/MM/yyyy");
  };

  const formatDateForStorage = (date: Date | null): string | null => {
    if (!date || !isValid(date)) return null;
    return format(date, "yyyy-MM-dd");
  };

  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (isValid(date) && isDate(date)) {
          setInputValue(formatDateForDisplay(date));
        } else {
          setInputValue("");
        }
      } catch {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue.length === 2 && newValue.length > inputValue.length) {
      setInputValue(newValue + "/");
      return;
    }
    if (newValue.length === 5 && newValue.length > inputValue.length) {
      setInputValue(newValue + "/");
      return;
    }

    if (newValue.length >= 8) {
      const parsedDate = parseDateFromString(newValue);
      if (parsedDate) {
        onChange(formatDateForStorage(parsedDate));
      } else if (newValue.length === 10) {
        onChange(null);
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = formatDateForStorage(date);
      onChange(formattedDate);
      setInputValue(formatDateForDisplay(date));
      dismiss();
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange(null);
  };

  const calendarDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  useEffect(() => {
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

    if (calendarOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [calendarOpen, dismiss]);

  const panel = calendarOpen ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="overflow-hidden rounded-md border bg-popover p-0 text-popover-foreground shadow-lg ring-1 ring-border/50"
      data-floating-panel
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={cancelDismiss}
      onMouseLeave={dismissOnLeave}
    >
      <Calendar
        mode="single"
        selected={calendarDate}
        onSelect={handleCalendarSelect}
        initialFocus
        disabled={disabled}
      />
    </div>
  ) : null;

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium block">{label}</label>}
      <div
        className="flex gap-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-hover-date
      >
        <div ref={anchorRef} className="relative flex-1">
          <Input
            ref={inputRef}
            alwaysEditable
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pr-10"
            disabled={disabled}
            data-hover-date-input
            onFocus={() => {
              cancelDismiss();
              setCalendarOpen(true);
            }}
            onBlur={() => {
              if (inputValue && !value) {
                const parsedDate = parseDateFromString(inputValue);
                if (!parsedDate) {
                  toast.error("Invalid date format", {
                    description: "Please enter date as dd/mm/yyyy",
                  });
                }
              }
            }}
          />
          <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {inputValue && (
          <div className="flex justify-center items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
              disabled={disabled}
              type="button"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )}
      </div>

      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
};
