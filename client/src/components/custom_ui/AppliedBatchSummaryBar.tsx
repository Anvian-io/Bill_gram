import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppliedBatchSummary {
  batchNo: string;
  mfgDate: string | null;
  expDate: string | null;
  barcode: string;
  stock: number;
  mrp: number;
  rate: number;
  pack: number;
}

interface AppliedBatchSummaryBarProps {
  summary: AppliedBatchSummary;
  rateLabel?: string;
  className?: string;
}

function formatBatchDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SummaryField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{children}</span>
    </div>
  );
}

export function AppliedBatchSummaryBar({
  summary,
  rateLabel = "S. Rate",
  className,
}: AppliedBatchSummaryBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 min-w-0 flex-1 overflow-x-auto text-[11px] leading-none py-0.5",
        className,
      )}
    >
      <SummaryField label="Batch No">
        <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0">
          {summary.batchNo}
        </Badge>
      </SummaryField>
      <SummaryField label="MFG Date">
        {formatBatchDate(summary.mfgDate)}
      </SummaryField>
      <SummaryField label="EXP Date">
        {formatBatchDate(summary.expDate)}
      </SummaryField>
      <SummaryField label="Barcode">
        <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0">
          {summary.barcode || "—"}
        </Badge>
      </SummaryField>
      <SummaryField label="Current Stock">
        <span className="inline-flex items-center gap-0.5">
          <Package className="h-3 w-3 text-muted-foreground" />
          {summary.stock.toLocaleString()}
        </span>
      </SummaryField>
      <SummaryField label="MRP">
        <span className="inline-flex items-center">
          <IndianRupee className="h-3 w-3" />
          {summary.mrp.toFixed(2)}
        </span>
      </SummaryField>
      <SummaryField label={rateLabel}>
        <span className="inline-flex items-center text-green-700 dark:text-green-400">
          <IndianRupee className="h-3 w-3" />
          {summary.rate.toFixed(2)}
        </span>
      </SummaryField>
      <SummaryField label="Pack">
        <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
          {summary.pack}
        </Badge>
      </SummaryField>
    </div>
  );
}
