import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { gst_details } from "@/store/dropdown_data/gst_details";

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
  label = "GST Details",
  allLabel = "All GST Types",
  placeholder = "Select GST details",
  className,
}: GstDetailsFilterProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <Select
        value={value ?? "all"}
        onValueChange={(nextValue) =>
          onChange(nextValue === "all" ? undefined : nextValue)
        }
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {gst_details.map((gst) => (
            <SelectItem key={gst.id} value={String(gst.id)}>
              {gst.type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
