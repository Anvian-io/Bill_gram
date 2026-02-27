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
      <DialogContent className="min-w-[65vw] max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="relative p-6 pb-2 flex items-center justify-center">
          <DialogTitle className="text-2xl font-bold">
            Sales Summary
          </DialogTitle>

          {/* PDF button */}
          <div className="absolute right-6 flex items-center gap-2 mr-8">
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
          <div className="absolute right-32 flex items-center gap-2 mr-8">
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
            <Table>
              <TableHeader className="bg-secondary/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 text-center">Sr.</TableHead>
                  <TableHead>P.Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="text-right">BOX</TableHead>
                  <TableHead className="text-right">UNIT</TableHead>
                  <TableHead className="text-right">QTY</TableHead>
                  <TableHead className="text-right">FR</TableHead>
                  <TableHead className="text-right">REP</TableHead>
                  <TableHead className="text-right">DMG</TableHead>
                  <TableHead className="text-right">RATE</TableHead>
                  <TableHead className="text-right">AMT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
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
                          <TableCell className="text-center">
                            {serial}
                          </TableCell>
                          <TableCell className="font-mono">
                            {product.productCode}
                          </TableCell>
                          <TableCell className="group-hover:bg-secondary/30 cursor-pointer max-w-[160px]">
                            <div className="text-sm text-muted-foreground h-6 overflow-y-auto prose prose-sm text-wrap w-[155px]">
                              {product.description
                                ? product.description.slice(0, 20) +
                                  (product.description.length > 20 ? "…" : "")
                                : "No description"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {product.mrp.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.totalMqty}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.totalUnit}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.totalUnitsSold}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.fQty}
                          </TableCell>
                          <TableCell className="text-right">0</TableCell>
                          <TableCell className="text-right">
                            {product.dQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.saleRate.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{product.finalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Total Row – only on the last page */}
                    {isLastPage && totals && (
                      <TableRow className="font-bold border-t-2 bg-secondary/10">
                        <TableCell className="text-center">
                          Total {pagination.total} products
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                          {totals.totalMqty}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.totalUnit}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.totalUnitsSold}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.fQty}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.rep}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.dQty}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                          ₹{totals.finalAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

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
