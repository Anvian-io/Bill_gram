import { useState } from "react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { cn } from "@/lib/utils";
import { gst_details, getGstDetailsLabel } from "@/store/dropdown_data/gst_details";

interface GstDetailsFilterProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  label?: string;
  allLabel?: string;
  placeholder?: string;
  className?: string;
}

export default function GstDetailsFilter({
  value,
  onChange,
  disabled = false,
  allLabel = "All GST Types",
  placeholder = "GST Details",
  className,
}: GstDetailsFilterProps) {
  const [open, setOpen] = useState(false);
  const displayValue = value ? getGstDetailsLabel(value) : "";

  return (
    <div className={cn(className)}>
      <InlineSearchField
        open={open}
        onOpenChange={setOpen}
        displayValue={displayValue}
        placeholder={placeholder}
        emptyMessage="No GST type found."
        disabled={disabled}
      >
        <CommandGroup>
          <CommandItem
            value="all gst types"
            onSelect={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            {allLabel}
          </CommandItem>
          {gst_details.map((gst) => (
            <CommandItem
              key={gst.id}
              value={`${gst.id} ${gst.type}`}
              onSelect={() => {
                onChange(String(gst.id));
                setOpen(false);
              }}
            >
              {gst.type}
            </CommandItem>
          ))}
        </CommandGroup>
      </InlineSearchField>
    </div>
  );
}
