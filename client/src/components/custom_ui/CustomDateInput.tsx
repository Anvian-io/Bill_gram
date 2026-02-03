import React, { useState, useEffect } from "react";
import { format, parse, isValid, isDate } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  // Parse date from string (support multiple formats)
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

    // Try standard Date parsing as fallback
    const date = new Date(str);
    return isValid(date) && isDate(date) ? date : null;
  };

  // Format date for display
  const formatDateForDisplay = (date: Date | null): string => {
    if (!date || !isValid(date)) return "";
    return format(date, "dd/MM/yyyy");
  };

  // Format date for storage (YYYY-MM-DD)
  const formatDateForStorage = (date: Date | null): string | null => {
    if (!date || !isValid(date)) return null;
    return format(date, "yyyy-MM-dd");
  };

  // Initialize input value
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

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Auto-format as user types
    if (newValue.length === 2 && newValue.length > inputValue.length) {
      setInputValue(newValue + "/");
      return;
    }
    if (newValue.length === 5 && newValue.length > inputValue.length) {
      setInputValue(newValue + "/");
      return;
    }

    // Try to parse and validate when input is complete
    if (newValue.length >= 8) {
      const parsedDate = parseDateFromString(newValue);
      if (parsedDate) {
        onChange(formatDateForStorage(parsedDate));
      } else if (newValue.length === 10) {
        // If we have a full date but can't parse it, clear the value
        onChange(null);
      }
    }
  };

  // Handle calendar date selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = formatDateForStorage(date);
      onChange(formattedDate);
      setInputValue(formatDateForDisplay(date));
      setCalendarOpen(false);
    }
  };

  // Handle clear button click
  const handleClear = () => {
    setInputValue("");
    onChange(null);
  };

  // Convert value to Date for calendar
  const calendarDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium block">{label}</label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pr-10"
            disabled={disabled}
            onBlur={() => {
              // Validate on blur
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
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                disabled={disabled}
                type="button"
              >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={handleCalendarSelect}
                initialFocus
                disabled={disabled}
              />
            </PopoverContent>
          </Popover>
        </div>
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={handleClear}
            disabled={disabled}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};