import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search,
  X,
  RefreshCw,
  FileText,
  Check,
} from "lucide-react";
import { CustomDateInput } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { useDebounce } from "@/utils/debounce";
import { purchaseService } from "@/services/purchaseService";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import type {
  PurchaseReportItem,
  PurchaseReportFilters,
  PurchaseRegisterData,
} from "@/types/purchase";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";
import PurchaseRegisterPreviewModal from "./PurchaseRegisterPreviewModal";
import { useReportRowSelection } from "@/hooks/useReportRowSelection";
import { useInfiniteScrollList } from "@/hooks/useInfiniteScrollList";
import ReportInfiniteScrollFooter from "@/components/report/shared/ReportInfiniteScrollFooter";

const REPORT_PREVIEW_FETCH_LIMIT = 5000;

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function PurchaseRegister() {
  // State
  const [reportData, setReportData] = useState<PurchaseReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [registerData, setRegisterData] = useState<PurchaseRegisterData | null>(
    null,
  );
  const [registerLoading, setRegisterLoading] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<PurchaseReportFilters>({
    fromDate: undefined,
    toDate: undefined,
    invoiceNo: "",
    supplierId: undefined,
    gstDetails: undefined,
  });

  // Local inputs for debounced fields
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  const {
    selectedRowIds,
    handleSelectAll,
    handleSelectRow,
    applySelectedIds,
    isAllSelected,
    isSomeSelected,
    clearSelection,
  } = useReportRowSelection<PurchaseReportItem>((item) => item.id);

  // Hooks
  const { suppliers } = useActiveLists();

  // --------------------------------------------------------------------
  // Debounced filter setters
  // --------------------------------------------------------------------
  const debouncedSetInvoiceNo = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, invoiceNo: value }));
  }, 300);

  // --------------------------------------------------------------------
  // Input handlers
  // --------------------------------------------------------------------
  const handleInvoiceNoChange = (value: string) => {
    setInvoiceNoInput(value);
    debouncedSetInvoiceNo(value);
  };

  const handleFromDateChange = (value: string | null) => {
    setFromDateValue(value);
    setFilters((prev) => ({
      ...prev,
      fromDate: value ? new Date(`${value}T00:00:00`) : undefined,
    }));
  };

  const handleToDateChange = (value: string | null) => {
    setToDateValue(value);
    setFilters((prev) => ({
      ...prev,
      toDate: value ? new Date(`${value}T00:00:00`) : undefined,
    }));
  };

  const handleFilterChange = (
    field: keyof PurchaseReportFilters,
    value: PurchaseReportFilters[keyof PurchaseReportFilters],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fromDate: undefined,
      toDate: undefined,
      invoiceNo: "",
      supplierId: undefined,
      gstDetails: undefined,
    });
    setInvoiceNoInput("");
    setFromDateValue(null);
    setToDateValue(null);
  };

  const clearFilter = (filterName: keyof PurchaseReportFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "supplierId"
          ? undefined
          : filterName === "gstDetails"
            ? undefined
          : filterName === "fromDate" || filterName === "toDate"
            ? undefined
            : "",
    }));
    switch (filterName) {
      case "invoiceNo":
        setInvoiceNoInput("");
        break;
      case "fromDate":
        setFromDateValue(null);
        break;
      case "toDate":
        setToDateValue(null);
        break;
    }
  };

  // --------------------------------------------------------------------
  // Fetch report data
  // --------------------------------------------------------------------
  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const apiFilters: PurchaseReportFilters = {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        invoiceNo: filters.invoiceNo || undefined,
        supplierId: filters.supplierId,
        gstDetails: filters.gstDetails,
      };
      const data = await purchaseService.getPurchaseReport(apiFilters);
      setReportData(data);
      clearSelection();
    } catch (error) {
      console.error("Error fetching purchase report:", error);
      toast.error("Failed to fetch purchase report");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  // --------------------------------------------------------------------
  // Helper functions
  // --------------------------------------------------------------------
  const activeFiltersCount = Object.entries(filters).filter(
    ([, value]) =>
      value !== undefined &&
      value !== "" &&
      !(value instanceof Date && isNaN(value.getTime())),
  ).length;

  const { visibleItems, sentinelRef, hasMore, totalCount, visibleCount } =
    useInfiniteScrollList(reportData);

  const previewFilters = applySelectedIds({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    invoiceNo: filters.invoiceNo || undefined,
    supplierId: filters.supplierId,
    gstDetails: filters.gstDetails,
  });

  const getSupplierName = (id?: number) => {
    if (!id) return "";
    const supplier = suppliers.find((s) => s.id === id);
    return supplier ? supplier.name : "";
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const fetchRegister = async () => {
    setRegisterLoading(true);
    try {
      const data = await purchaseService.getPurchaseRegisterPDFData(
        previewFilters,
        1,
        REPORT_PREVIEW_FETCH_LIMIT,
      );
      setRegisterData(data);
    } catch {
      toast.error("Failed to load register");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleShowRegister = async () => {
    await fetchRegister();
    setIsPreviewOpen(true);
  };

    // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <motion.div
      className="min-h-screen bg-background p-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-8xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="flex flex-col gap-6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-end gap-4">
            <motion.div className="flex items-center gap-3">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleShowRegister}
                  disabled={isLoading || reportData.length === 0 || registerLoading}
                >
                  <FileText className="h-4 w-4" />
                  {registerLoading ? "Loading..." : "Show"}
                </Button>
              </motion.div>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={fetchReport}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Filter Section */}
        <motion.div className="mb-2" variants={itemVariants}>
          <div className="bg-white dark:bg-gray-900 border rounded-none p-2">
              <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-end gap-3 pt-2">
                        {/* Invoice No */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Invoice No"
                              className="pl-8 h-8 text-xs rounded-sm"
                              value={invoiceNoInput}
                              onChange={(e) =>
                                handleInvoiceNoChange(e.target.value)
                              }
                            />
                            {invoiceNoInput && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => clearFilter("invoiceNo")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Supplier */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <InlineSearchField
                            open={supplierOpen}
                            onOpenChange={setSupplierOpen}
                            displayValue={getSupplierName(filters.supplierId)}
                            placeholder="Supplier"
                            emptyMessage="No supplier found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange(
                                          "supplierId",
                                          undefined,
                                        );
                                        setSupplierOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !filters.supplierId
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      All Suppliers
                                    </CommandItem>
                                    {suppliers.map((supplier) => (
                                      <CommandItem
                                        key={supplier.id}
                                        value={supplier.id.toString()}
                                        onSelect={() => {
                                          handleFilterChange(
                                            "supplierId",
                                            supplier.id,
                                          );
                                          setSupplierOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.supplierId === supplier.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {supplier.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                          </InlineSearchField>
                        </div>

                        <GstDetailsFilter
                          value={filters.gstDetails}
                          onChange={(value) =>
                            handleFilterChange("gstDetails", value)
                          }
                          disabled={isLoading}
                        />

                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <CustomDateInput
                            value={fromDateValue}
                            onChange={handleFromDateChange}
                            placeholder="From Date"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <CustomDateInput
                            value={toDateValue}
                            onChange={handleToDateChange}
                            placeholder="To Date"
                            disabled={isLoading}
                          />
                        </div>

                      </div>
              </div>
            </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            Showing {visibleCount} of {totalCount} invoices
            {selectedRowIds.length > 0 && ` (${selectedRowIds.length} selected)`}
            {activeFiltersCount > 0 && " (filtered)"}
          </p>
        </motion.div>

        {/* Report Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          className="report-checkbox"
                          checked={
                            isAllSelected(reportData)
                              ? true
                              : isSomeSelected(reportData)
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll(checked as boolean, reportData)
                          }
                        />
                      </TableHead>
                      <TableHead className="font-semibold">
                        Invoice No
                      </TableHead>
                      <TableHead className="font-semibold">
                        Invoice Date
                      </TableHead>
                      <TableHead className="font-semibold">Supplier</TableHead>
                      <TableHead className="font-semibold text-right">
                        Amount (₹)
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Cash
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Cheque
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr
                          key="loading"
                        >
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading register...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : reportData.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No invoices found matching your filters.</p>
                              <Button
                                variant="link"
                                onClick={clearFilters}
                                className="mt-2"
                              >
                                Clear all filters
                              </Button>
                            </motion.div>
                          </TableCell>
                        </motion.tr>
                      ) : (
                        visibleItems.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              visible: { opacity: 1, y: 0 },
                              hover: { backgroundColor: "rgba(0,0,0,0.02)" },
                            }}
                            className={cn("group border", selectedRowIds.includes(item.id) && "report-row-selected")}
                            layout
                          >
                            <TableCell className="text-center">
                              <Checkbox
                                className="report-checkbox"
                                checked={selectedRowIds.includes(item.id)}
                                onCheckedChange={(checked) => handleSelectRow(item.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-mono font-medium text-primary">
                              {item.invoiceNo}
                            </TableCell>
                            <TableCell>
                              {formatDate(item.invoiceDate)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {item.supplier.name}
                                </p>
                                {item.supplier.phoneNo && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.supplier.phoneNo}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              ₹{item.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right font-bold text-green-700">
                              ₹{item.totalAmount.toFixed(2)}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
              {!isLoading && reportData.length > 0 && (
                <ReportInfiniteScrollFooter
                  sentinelRef={sentinelRef}
                  hasMore={hasMore}
                  loadedCount={visibleCount}
                  totalCount={totalCount}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <PurchaseRegisterPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={registerData}
        filters={previewFilters}
      />
    </motion.div>
  );
}
