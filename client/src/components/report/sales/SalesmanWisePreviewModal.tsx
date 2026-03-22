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
  SalesmanWisePDFData,
  SalesReportFilters,
} from "@/types/sales-report";
import { salesService } from "@/services/salesService";
import { toast } from "sonner";

interface SalesmanWisePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SalesmanWisePDFData | null;
  onPageChange: (page: number) => void;
  currentPage: number;
  filters?: SalesReportFilters;
}

export default function SalesmanWisePreviewModal({
  isOpen,
  onClose,
  data,
  onPageChange,
  currentPage,
  filters,
}: SalesmanWisePreviewModalProps) {
  const [internalGeneratingPDF, setInternalGeneratingPDF] = useState(false);
  const [internalGeneratingExcel, setInternalGeneratingExcel] = useState(false);

  if (!data) return null;

  const {
    user,
    dateRange,
    invoiceRange,
    areas,
    salesmanData,
    pagination,
    grandTotals,
  } = data;

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
      const blob = await salesService.downloadSalesmanWisePDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fromDate = dateRange?.from
        ? format(new Date(dateRange.from), "yyyy-MM-dd")
        : "";
      const toDate = dateRange?.to
        ? format(new Date(dateRange.to), "yyyy-MM-dd")
        : "";
      link.download = `salesman-wise-sales-${fromDate}_to_${toDate}.pdf`;
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
      const blob = await salesService.downloadSalesmanWiseExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fromDate = dateRange?.from
        ? format(new Date(dateRange.from), "yyyy-MM-dd")
        : "";
      const toDate = dateRange?.to
        ? format(new Date(dateRange.to), "yyyy-MM-dd")
        : "";
      link.download = `salesman-wise-sales-${fromDate}_to_${toDate}.xlsx`;
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
            Salesman Wise Sales Report
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
            <Table>
              <TableHeader className="bg-secondary/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 text-center">Sr.</TableHead>
                  <TableHead>Salesman Name</TableHead>
                  <TableHead className="text-right">Total Discount</TableHead>
                  <TableHead className="text-right">Scheme Amount</TableHead>
                  <TableHead className="text-right">Total GST</TableHead>
                  <TableHead className="text-right">Final Amount</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesmanData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No salesmen found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {salesmanData.map((salesman, idx) => {
                      const serial =
                        (currentPage - 1) * pagination.limit + idx + 1;
                      return (
                        <TableRow key={salesman.salesmanId}>
                          <TableCell className="text-center">
                            {serial}
                          </TableCell>
                          <TableCell className="font-medium">
                            {salesman.salesmanName}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{salesman.totalDiscount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{salesman.totalSchemeAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{salesman.totalGST.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-700">
                            ₹{salesman.finalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {salesman.invoiceCount}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Total Row – only on the last page */}
                    {isLastPage && grandTotals && (
                      <TableRow className="font-bold border-t-2 bg-secondary/10">
                        <TableCell className="text-center">
                          Total {pagination.total} salesmen
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                          ₹{grandTotals.totalDiscount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{grandTotals.totalSchemeAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{grandTotals.totalGST.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-700">
                          ₹{grandTotals.finalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {grandTotals.invoiceCount}
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
