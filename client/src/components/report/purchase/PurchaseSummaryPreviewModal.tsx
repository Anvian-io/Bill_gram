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

  // Footer content
  const footerLeft = user.shop_name || "Your Shop";
  const footerRight =
    pagination.totalPages === 1
      ? `Total: ${pagination.total} products`
      : `${currentPage} of ${pagination.totalPages}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90vw] max-h-[95vh]  p-0 flex flex-col">
        <DialogHeader className="p-6 pb-2 flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold">
            Loading Summary
          </DialogTitle>
          <div className="flex items-center gap-2">
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
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 flex-1 max-h-[calc(90vh-140px)]">
          {/* Header Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">From: </span>
                <span className="font-medium">
                  {formatDate(dateRange.from)} To: {formatDate(dateRange.to)}
                </span>
              </div>
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
              {/* Shop name moved to footer */}
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
                  products.map((product, idx) => {
                    const serial =
                      (currentPage - 1) * pagination.limit + idx + 1;
                    return (
                      <TableRow key={`${product.productCode}-${idx}`}>
                        <TableCell className="text-center">{serial}</TableCell>
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
                  })
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
