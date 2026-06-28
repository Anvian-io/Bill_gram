import { useState } from "react";
import { Check } from "lucide-react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { cn } from "@/lib/utils";

interface FormActiveStatusFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function FormActiveStatusField({
  value,
  onChange,
  disabled,
  placeholder = "Status",
}: FormActiveStatusFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <InlineSearchField
      open={open}
      onOpenChange={setOpen}
      displayValue={value ? "Active" : "Inactive"}
      placeholder={placeholder}
      emptyMessage="No status found."
      disabled={disabled}
    >
      <CommandGroup>
        <CommandItem
          value="active"
          onSelect={() => {
            onChange(true);
            setOpen(false);
          }}
        >
          <Check
            className={cn(
              "mr-2 h-4 w-4",
              value ? "opacity-100" : "opacity-0",
            )}
          />
          Active
        </CommandItem>
        <CommandItem
          value="inactive"
          onSelect={() => {
            onChange(false);
            setOpen(false);
          }}
        >
          <Check
            className={cn(
              "mr-2 h-4 w-4",
              !value ? "opacity-100" : "opacity-0",
            )}
          />
          Inactive
        </CommandItem>
      </CommandGroup>
    </InlineSearchField>
  );
}
