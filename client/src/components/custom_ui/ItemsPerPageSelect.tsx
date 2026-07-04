import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHoverOpenDelay } from "@/hooks/useHoverOpenDelay";

const DEFAULT_OPTIONS = [5, 10, 20, 50] as const;

interface ItemsPerPageSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  options?: readonly number[];
  className?: string;
}

export function ItemsPerPageSelect({
  value,
  onChange,
  disabled = false,
  options = DEFAULT_OPTIONS,
  className,
}: ItemsPerPageSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scheduleOpen, cancelScheduledOpen } = useHoverOpenDelay();

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    clearCloseTimeout();
    setOpen(true);
  }, [clearCloseTimeout, disabled]);

  const closeMenu = useCallback(() => {
    clearCloseTimeout();
    setOpen(false);
  }, [clearCloseTimeout]);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setOpen(false);
    }, 120);
  }, [clearCloseTimeout]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeMenu, open]);

  useEffect(() => clearCloseTimeout, [clearCloseTimeout]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-fit", className)}
      onMouseEnter={() => {
        if (!disabled) {
          scheduleOpen(openMenu);
        }
      }}
      onMouseLeave={() => {
        cancelScheduledOpen();
        if (open) {
          scheduleClose();
        }
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Items per page"
        className={cn(
          "table-filter-control flex h-9 w-20 items-center justify-between rounded-md border bg-transparent px-3 text-sm shadow-none outline-none transition-colors",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30 dark:hover:bg-input/50",
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
      >
        <span>{value}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Items per page options"
          className="absolute left-0 top-full z-[60] mt-1 w-20 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          onMouseEnter={clearCloseTimeout}
        >
          {options.map((option) => (
            <li key={option} role="option" aria-selected={option === value}>
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                  option === value
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
                onClick={() => {
                  onChange(option);
                  closeMenu();
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
