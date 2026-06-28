import { useState } from "react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";

export type FilterStatusValue = "all" | "active" | "inactive";

const STATUS_DISPLAY: Record<FilterStatusValue, string> = {
  all: "",
  active: "Active",
  inactive: "Inactive",
};

interface FilterStatusFieldProps {
  value: FilterStatusValue | undefined;
  onValueChange: (value: FilterStatusValue) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function FilterStatusField({
  value,
  onValueChange,
  disabled,
  placeholder = "Status",
}: FilterStatusFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = value ?? "all";

  return (
    <InlineSearchField
      open={open}
      onOpenChange={setOpen}
      displayValue={STATUS_DISPLAY[selected]}
      placeholder={placeholder}
      emptyMessage="No status found."
      disabled={disabled}
    >
      <CommandGroup>
        <CommandItem
          value="all status"
          onSelect={() => {
            onValueChange("all");
            setOpen(false);
          }}
        >
          All Status
        </CommandItem>
        <CommandItem
          value="active"
          onSelect={() => {
            onValueChange("active");
            setOpen(false);
          }}
        >
          Active
        </CommandItem>
        <CommandItem
          value="inactive"
          onSelect={() => {
            onValueChange("inactive");
            setOpen(false);
          }}
        >
          Inactive
        </CommandItem>
      </CommandGroup>
    </InlineSearchField>
  );
}
