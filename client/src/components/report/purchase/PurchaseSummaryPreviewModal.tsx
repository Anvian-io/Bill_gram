import React from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomPagination } from "@/components/custom_ui";
import { format } from "date-fns";
import { Download, X } from "lucide-react";
import { motion } from "framer-motion";
import type { PurchaseSummaryReportData } from "@/types/purchase";

interface PurchaseSummaryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PurchaseSummaryReportData | null;
  onPageChange: (page: number) => void;
  currentPage: number;
  isGeneratingPDF?: boolean;
  onGeneratePDF?: () => void;
}

export default function PurchaseSummaryPreviewModal({
  isOpen,
  onClose,
  data,
  onPageChange,
  currentPage,
  isGeneratingPDF = false,
  onGeneratePDF,
}: PurchaseSummaryPreviewModalProps) {
  if (!data) return null;

  const { user, dateRange, invoiceRange, areas, products, pagination } = data;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return "";
    }
  };

  const handlePDFClick = () => {
    if (onGeneratePDF) onGeneratePDF();
  };

  // Compute totals for numeric columns
  const totals = React.useMemo(() => {
    if (!products.length) return null;
    return products.reduce(
      (acc, product) => {
        acc.totalMqty += product.totalMqty || 0;
        acc.totalUnit += product.totalUnit || 0;
        acc.totalUnitsPurchased += product.totalUnitsPurchased || 0;
        acc.fQty += product.fQty || 0;
        acc.rep += (product as any).rep || 0; // fallback if rep exists, else 0
        acc.dQty += product.dQty || 0;
        acc.finalAmount += product.finalAmount || 0;
        return acc;
      },
      {
        totalMqty: 0,
        totalUnit: 0,
        totalUnitsPurchased: 0,
        fQty: 0,
        rep: 0,
        dQty: 0,
        finalAmount: 0,
      },
    );
  }, [products]);

  // Footer content
  const footerLeft = user.shop_name || "Your Shop";
  const footerRight =
    pagination.totalPages === 1
      ? `Total: ${pagination.total} products`
      : `${currentPage} of ${pagination.totalPages}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90vw] max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="relative p-6 pb-2 flex items-center justify-center">
          <DialogTitle className="text-2xl font-bold">
            Purchase Summary
          </DialogTitle>

          <div className="absolute right-6 flex items-center gap-2 mr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePDFClick}
              disabled={isGeneratingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? "Generating..." : "PDF"}
            </Button>
          </div>
          <div className="absolute right-32 flex items-center gap-2 mr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePDFClick}
              disabled={isGeneratingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? "Generating..." : "Excel"}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 flex-1 max-h-[calc(90vh-140px)]">
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

          {/* Product Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-md border overflow-hidden"
          >
            <Table>
              <TableHeader className="bg-secondary/50">
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
                          <TableCell className="group-hover:bg-secondary/30 cursor-pointer max-w-xs">
                            <div className="text-sm text-muted-foreground h-6 overflow-y-auto prose prose-sm text-wrap w-100">
                              {product.description || "No description"}
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
                            {product.totalUnitsPurchased}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.fQty}
                          </TableCell>
                          <TableCell className="text-right">0</TableCell>
                          <TableCell className="text-right">
                            {product.dQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.purchaseRate.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{product.finalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Total Row */}
                    {totals && (
                      <TableRow className="font-bold border-t-2 bg-secondary/10">
                        <TableCell className="text-center">
                          Total {products.length}
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
                          {totals.totalUnitsPurchased}
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
          </motion.div>

          {/* Pagination (if multiple pages) */}
          {pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4"
            >
              <CustomPagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={onPageChange}
              />
            </motion.div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between items-center text-sm text-muted-foreground bg-secondary/10">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
