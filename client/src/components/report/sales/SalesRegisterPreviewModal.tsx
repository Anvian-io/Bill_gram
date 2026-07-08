import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type {
  SalesRegisterReportData,
  SalesReportFilters,
} from "@/types/sales-report";
import { salesService } from "@/services/salesService";
import { toast } from "sonner";
import { useInfiniteScrollList } from "@/hooks/useInfiniteScrollList";
import ReportInfiniteScrollFooter from "@/components/report/shared/ReportInfiniteScrollFooter";

interface SalesRegisterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SalesRegisterReportData | null;
  filters?: SalesReportFilters;
}

export default function SalesRegisterPreviewModal({
  isOpen,
  onClose,
  data,
  filters,
}: SalesRegisterPreviewModalProps) {
  const { layoutMode } = useTheme();
  const [internalGeneratingPDF, setInternalGeneratingPDF] = useState(false);
  const [internalGeneratingExcel, setInternalGeneratingExcel] = useState(false);

  const invoices = data?.invoices ?? [];
  const { visibleItems, sentinelRef, hasMore, visibleCount, totalCount } =
    useInfiniteScrollList(invoices);

  if (!data) return null;

  const { user, dateRange, invoiceRange, areas, totals } = data;
  const showTotals = !hasMore && totals;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return "";
    }
  };

  const handlePDFClick = async () => {
    if (!filters) {
      toast.error("Filters are missing. Cannot generate PDF.");
      return;
    }

    setInternalGeneratingPDF(true);
    try {
      const blob = await salesService.downloadSalesRegisterPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fromDate = dateRange?.from
        ? format(new Date(dateRange.from), "yyyy-MM-dd")
        : "";
      const toDate = dateRange?.to
        ? format(new Date(dateRange.to), "yyyy-MM-dd")
        : "";
      link.download = `sales-register-${fromDate}_to_${toDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error(error);
    } finally {
      setInternalGeneratingPDF(false);
    }
  };

  const handleExcelClick = async () => {
    if (!filters) {
      toast.error("Filters are missing. Cannot generate Excel.");
      return;
    }

    setInternalGeneratingExcel(true);
    try {
      const blob = await salesService.downloadSalesRegisterExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fromDate = dateRange?.from
        ? format(new Date(dateRange.from), "yyyy-MM-dd")
        : "";
      const toDate = dateRange?.to
        ? format(new Date(dateRange.to), "yyyy-MM-dd")
        : "";
      link.download = `sales-register-${fromDate}_to_${toDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      toast.error("Failed to download Excel");
      console.error(error);
    } finally {
      setInternalGeneratingExcel(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[65vw] max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="relative p-6 pb-2 flex items-center justify-center">
          <DialogTitle className="text-2xl font-bold">
            Sales Register
          </DialogTitle>

          {/* PDF button */}
          <div className="absolute right-6 flex items-center gap-2 mr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePDFClick}
              disabled={internalGeneratingPDF || internalGeneratingExcel}
            >
              {internalGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {internalGeneratingPDF ? "Generating..." : "PDF"}
            </Button>
          </div>

          {/* Excel button */}
          <div className="absolute right-32 flex items-center gap-2 mr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExcelClick}
              disabled={internalGeneratingExcel || internalGeneratingPDF}
            >
              {internalGeneratingExcel ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {internalGeneratingExcel ? "Generating..." : "Excel"}
            </Button>
          </div>
        </DialogHeader>

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden px-6">
          {/* Header Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
          >
            <div className="flex justify-center text-sm">
              <div>
                <span className="text-muted-foreground text-[16px]">
                  Date:{" "}
                </span>
                <span className="font-medium text-[16px]">
                  {formatDate(dateRange.from)} to {formatDate(dateRange.to)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">INVOICE : </span>
                <span className="font-medium">
                  {invoiceRange.start || "—"} to {invoiceRange.end || "—"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground">AREA : </span>
                <span className="font-medium">
                  {areas.length > 0 ? areas.join(", ") : "All"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Table container */}
          <div className="flex-1 overflow-auto rounded-md border max-h-88 mb-2">
            <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
              <TableHeader className="bg-secondary/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 text-center">Sr.</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                  <TableHead className="text-right">Cash (₹)</TableHead>
                  <TableHead className="text-right">Cheque (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No invoices found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {visibleItems.map((invoice, idx) => {
                      const serial = idx + 1;
                      return (
                        <TableRow key={`${invoice.invoiceNo}-${idx}`}>
                          <TableCell className="text-center">
                            {serial}
                          </TableCell>
                          <TableCell className="font-mono font-medium text-primary">
                            {invoice.invoiceNo}
                          </TableCell>
                          <TableCell>{invoice.customerName || "—"}</TableCell>
                          <TableCell>
                            {formatDate(invoice.invoiceDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{invoice.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {invoice.cash || "—"}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {invoice.cheque || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {showTotals && totals && (
                      <TableRow className="font-bold border-t-2 bg-secondary/10">
                        <TableCell className="text-center" colSpan={4}>
                          Total {totals.totalInvoices} invoices
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{totals.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
            {invoices.length > 0 && (
              <ReportInfiniteScrollFooter
                sentinelRef={sentinelRef}
                hasMore={hasMore}
                loadedCount={visibleCount}
                totalCount={totalCount}
              />
            )}
          </div>

          <div className="flex justify-between items-center text-sm text-muted-foreground mt-2 pb-6">
            <span>{user.shop_name || "Your Shop"}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
