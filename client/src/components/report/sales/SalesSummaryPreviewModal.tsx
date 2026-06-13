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
import { CustomPagination } from "@/components/custom_ui";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type {
  SalesSummaryReportData,
  SalesReportFilters,
} from "@/types/sales-report";
import { salesService } from "@/services/salesService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";

interface SalesSummaryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SalesSummaryReportData | null;
  onPageChange: (page: number) => void;
  currentPage: number;
  isGeneratingPDF?: boolean;
  onGeneratePDF?: () => void;
  filters?: SalesReportFilters;
}

export default function SalesSummaryPreviewModal({
  isOpen,
  onClose,
  data,
  onPageChange,
  currentPage,
  isGeneratingPDF = false,
  onGeneratePDF,
  filters,
}: SalesSummaryPreviewModalProps) {
  const [internalGeneratingPDF, setInternalGeneratingPDF] = useState(false);
  const [internalGeneratingExcel, setInternalGeneratingExcel] = useState(false);
  const { layoutMode } = useTheme();

  if (!data) return null;

  const { user, dateRange, invoiceRange, areas, products, pagination, totals } =
    data;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return "";
    }
  };

  const handlePDFClick = async () => {
    if (onGeneratePDF) {
      onGeneratePDF();
      return;
    }

    if (!filters) {
      toast.error("Filters are missing. Cannot generate PDF.");
      return;
    }

    setInternalGeneratingPDF(true);
    try {
      const blob = await salesService.downloadSalesSummaryPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fromDate = dateRange?.from
        ? format(new Date(dateRange.from), "yyyy-MM-dd")
        : "";
      const toDate = dateRange?.to
        ? format(new Date(dateRange.to), "yyyy-MM-dd")
        : "";
      link.download = `sales-summary-${fromDate}_to_${toDate}.pdf`;
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
      const blob = await salesService.downloadSalesSummaryExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fromDate = dateRange?.from
        ? format(new Date(dateRange.from), "yyyy-MM-dd")
        : "";
      const toDate = dateRange?.to
        ? format(new Date(dateRange.to), "yyyy-MM-dd")
        : "";
      link.download = `sales-summary-${fromDate}_to_${toDate}.xlsx`;
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

  const isLastPage = currentPage === pagination.totalPages;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[85vw] max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="relative p-6 pb-2 flex flex-col items-center justify-center space-y-1">
          <DialogTitle className="text-2xl font-bold text-center">
            {filters?.summaryType === "loading_summary" ? "Loading Summary" : "Sales Summary"}
          </DialogTitle>
          <div className="text-sm font-medium">
            From : {formatDate(dateRange.from)} &nbsp;&nbsp;&nbsp; To : {formatDate(dateRange.to)}
          </div>

          {/* PDF button */}
          <div className="absolute right-6 flex items-center gap-2 mr-8 top-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePDFClick}
              disabled={
                isGeneratingPDF ||
                internalGeneratingPDF ||
                internalGeneratingExcel
              }
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
          <div className="absolute right-32 flex items-center gap-2 mr-8 top-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExcelClick}
              disabled={
                internalGeneratingExcel ||
                internalGeneratingPDF ||
                isGeneratingPDF
              }
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
            className="mb-4 mt-2"
          >
            <div className="flex flex-col gap-1 text-sm font-medium">
              <div>
                <span>Invoice no : </span>
                <span>
                  {invoiceRange.start || "—"}-{invoiceRange.end || "—"}
                </span>
              </div>
              <div>
                <span>Area : </span>
                <span>
                  {areas.length > 0 ? areas.join(", ") : "All"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Table container */}
          <div className="flex-1 overflow-auto rounded-md border max-h-88 mb-2">
            {/* @ts-ignore */}
            <Table className={cn(layoutMode === "classic" && "classic-table")}>
              <TableHeader className="bg-secondary/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs font-semibold px-2">Sr No</TableHead>
                  <TableHead className="text-xs font-semibold px-2">P.Code</TableHead>
                  <TableHead className="text-xs font-semibold px-2">DISCRIPTION</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">MRP</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">BOX</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">UNIT</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">QTY</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">FREE</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">REP</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">DMG</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">SCH</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">RATE</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">AMT</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">RET</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">MRP Value</TableHead>
                  <TableHead className="text-right text-xs font-semibold px-2">FREE X RATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={16}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No products found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {products.map((product, idx) => {
                      const serial =
                        (currentPage - 1) * pagination.limit + idx + 1;
                      return (
                        <TableRow key={`${product.productCode}-${idx}`}>
                          <TableCell className="text-center px-2 py-1 text-sm">{serial}</TableCell>
                          <TableCell className="font-mono px-2 py-1 text-sm">{product.productCode}</TableCell>
                          <TableCell className="group-hover:bg-secondary/30 cursor-pointer px-2 py-1">
                            <div className="text-sm font-medium h-6 overflow-hidden text-ellipsis whitespace-nowrap w-[155px]" title={product.description || "No description"}>
                              {product.description || "No description"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">{product.mrp.toFixed(2)}</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">{product.totalMqty} <span className="text-[10px] text-muted-foreground">(BOX)</span></TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">{product.totalUnit}</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">{product.totalUnitsSold} <span className="text-[10px] text-muted-foreground">(PCS)</span></TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">{product.fQty}</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">0</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">{product.dQty}</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">0.00</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">{product.saleRate.toFixed(2)}</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">{product.finalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">0</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">0</TableCell>
                          <TableCell className="text-right px-2 py-1 text-sm">0</TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Detailed Footer Summary Panel */}
          {isLastPage && totals && (
            <div className="grid grid-cols-3 gap-8 py-4 px-2 border-t border-b mb-4 text-sm font-medium">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div>Total :</div><div className="text-right">{totals.finalAmount.toFixed(2)}</div>
                <div>Scheme :</div><div className="text-right">0.00</div>
                <div>Total Disc :</div><div className="text-right">0.00</div>
                <div>Dmg/Disp :</div><div className="text-right">0.00/0.00</div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div>Total Cash/ Bank :</div><div className="text-right">0.00/0.00</div>
                <div>Total Pending/RetValue :</div><div className="text-right">{(totals.finalAmount).toFixed(2)}/-0.00</div>
                <div>TCS TAX :</div><div className="text-right">0.00</div>
                <div>Round Off :</div><div className="text-right">0.00</div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground">
                <div>Total BOX :</div><div className="text-right">{totals.totalMqty}</div>
                <div>Total UNIT :</div><div className="text-right">{totals.totalUnit}</div>
                <div>Total QTY :</div><div className="text-right">{totals.totalUnitsSold}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          {pagination.totalPages > 1 && !isLastPage && (
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-2 pb-6">
              <span>{user.shop_name || "Your Shop"}</span>
              <span>
                Page {currentPage} of {pagination.totalPages}
              </span>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className=""
            >
              <CustomPagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={onPageChange}
              />
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
