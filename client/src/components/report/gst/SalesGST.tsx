import { useTheme } from "@/contexts/ThemeProvider";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw,
  FileSpreadsheet,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import { CustomDateInput } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { salesService } from "@/services/salesService";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type {
  SalesGSTInvoice,
  SalesGSTFilters,
} from "@/types/sales-report";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";
import { useServerInfiniteScroll } from "@/hooks/useServerInfiniteScroll";
import ReportInfiniteScrollFooter from "@/components/report/shared/ReportInfiniteScrollFooter";
import { useReportRowSelection } from "@/hooks/useReportRowSelection";

// ----------------------------------------------------------------------
// Date Utilities
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function SalesGST({ isCollapsed }: { isCollapsed: boolean }) {
  const { layoutMode } = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);


  // Filters state
  const [filters, setFilters] = useState<SalesGSTFilters>({
    customerId: undefined,
    gstDetails: undefined,
    fromDate: undefined,
    toDate: undefined,
    sortBy: "invoiceNo",
    sortOrder: "desc",
  });

  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  const { customers } = useActiveLists();

  const {
    selectedRowIds,
    handleSelectAll,
    handleSelectRow,
    applySelectedIds,
    isAllSelected,
    isSomeSelected,
    clearSelection,
  } = useReportRowSelection<SalesGSTInvoice>((item) => item.saleId);

  const filterResetKey = JSON.stringify({
    customerId: filters.customerId,
    gstDetails: filters.gstDetails,
    fromDate: filters.fromDate?.toISOString(),
    toDate: filters.toDate?.toISOString(),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const {
    items: reportData,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
    refresh,
    total,
    loadedCount,
  } = useServerInfiniteScroll<SalesGSTInvoice>(
    async (page) => {
      try {
        const response = await salesService.getSalesGST({
          ...filters,
          page,
          limit: 50,
        });
        return {
          items: response.sales,
          pagination: {
            hasNextPage: response.pagination.hasNextPage,
            currentPage: response.pagination.currentPage,
            total: response.pagination.total,
          },
        };
      } catch (error) {
        console.error("Error fetching sales GST data:", error);
        toast.error("Failed to fetch sales GST data");
        return {
          items: [],
          pagination: { hasNextPage: false, currentPage: page, total: 0 },
        };
      }
    },
    filterResetKey,
  );

  // ----------------------------------------------------------------------
  // Input handlers
  // ----------------------------------------------------------------------
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

  const handleFilterChange = <K extends keyof SalesGSTFilters>(
    field: K,
    value: SalesGSTFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    clearSelection();
  };

  const clearFilters = () => {
    setFilters({
      customerId: undefined,
      gstDetails: undefined,
      fromDate: undefined,
      toDate: undefined,
      sortBy: "invoiceNo",
      sortOrder: "desc",
    });
    setFromDateValue(null);
    setToDateValue(null);
    clearSelection();
  };

  const clearFilter = (filterName: keyof SalesGSTFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "customerId" || filterName === "gstDetails"
          ? undefined
          : filterName === "fromDate" || filterName === "toDate"
            ? undefined
            : prev[filterName],
    }));
    if (filterName === "fromDate") setFromDateValue(null);
    if (filterName === "toDate") setToDateValue(null);
    clearSelection();
  };

  // ----------------------------------------------------------------------
  // Download Excel
  // ----------------------------------------------------------------------
  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const blob = await salesService.downloadSalesGSTExcel(applySelectedIds({
        customerId: filters.customerId,
        gstDetails: filters.gstDetails,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }));

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = format(new Date(), "dd-MM-yyyy_HH-mm");
      link.href = url;
      link.setAttribute("download", `sales-gst-report-${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel");
    } finally {
      setIsDownloading(false);
    }
  };

  // ----------------------------------------------------------------------
  // Helper functions
  // ----------------------------------------------------------------------
  const activeFiltersCount = [
    filters.customerId,
    filters.gstDetails,
    filters.fromDate,
    filters.toDate,
  ].filter((v) => v !== undefined && v !== null).length;

  const getCustomerName = (id?: number) => {
    if (!id) return "";
    const customer = customers.find((c) => c.id === id);
    return customer ? customer.name : "";
  };

  const getSortByLabel = (sortBy: string) => {
    const labels: Record<string, string> = {
      invoiceDate: "Invoice Date",
      invoiceNo: "Invoice No",
      grossAmount: "Gross Amount",
      finalAmount: "Final Amount",
      createdAt: "Created At",
    };
    return labels[sortBy] ?? "";
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <motion.div
      className="min-h-screen bg-background p-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div
        className={`mx-auto ${
          isCollapsed
            ? "max-w-5xl lg:max-w-2xl xl:max-w-7xl 1xl:max-w-8xl 2xl:max-w-9xl"
            : "max-w-9xl lg:max-w-xl xl:max-w-4xl 2xl:max-w-6xl"
        }`}
      >
        {/* Header Section */}
        <motion.div
          className="flex flex-col gap-6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-between gap-4">
            

            {/* Action Buttons */}
            <motion.div className="flex items-center gap-3">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={handleDownloadExcel}
                  disabled={
                    isLoading || isDownloading || reportData.length === 0
                  }
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {isDownloading ? "Downloading..." : "Download Excel"}
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
                  onClick={refresh}
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
          <Card className="overflow-hidden">
            <CardContent className="p-1">
              <div className="flex flex-col gap-4 p-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Customer */}
                        <div>
                          <InlineSearchField
                            open={customerOpen}
                            onOpenChange={setCustomerOpen}
                            displayValue={getCustomerName(filters.customerId)}
                            placeholder="Customer"
                            emptyMessage="No customer found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange(
                                          "customerId",
                                          undefined,
                                        );
                                        setCustomerOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !filters.customerId
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      All Customers
                                    </CommandItem>
                                    {customers.map((customer) => (
                                      <CommandItem
                                        key={customer.id}
                                        value={customer.id.toString()}
                                        onSelect={() => {
                                          handleFilterChange(
                                            "customerId",
                                            customer.id,
                                          );
                                          setCustomerOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.customerId === customer.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {customer.name}
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

                        <CustomDateInput
                          value={fromDateValue}
                          onChange={handleFromDateChange}
                          placeholder="From Date"
                          disabled={isLoading}
                        />

                        <CustomDateInput
                          value={toDateValue}
                          onChange={handleToDateChange}
                          placeholder="To Date"
                          disabled={isLoading}
                        />

                        {/* Sort Order */}
                        <div>
                          <InlineSearchField
                            open={sortOpen}
                            onOpenChange={setSortOpen}
                            displayValue={getSortByLabel(filters.sortBy ?? "")}
                            placeholder="Sort By"
                            emptyMessage="No sort option found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                              <CommandItem
                                value="invoiceDate"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "invoiceDate");
                                  setSortOpen(false);
                                }}
                              >
                                Invoice Date
                              </CommandItem>
                              <CommandItem
                                value="invoiceNo"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "invoiceNo");
                                  setSortOpen(false);
                                }}
                              >
                                Invoice No
                              </CommandItem>
                              <CommandItem
                                value="grossAmount"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "grossAmount");
                                  setSortOpen(false);
                                }}
                              >
                                Gross Amount
                              </CommandItem>
                              <CommandItem
                                value="finalAmount"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "finalAmount");
                                  setSortOpen(false);
                                }}
                              >
                                Final Amount
                              </CommandItem>
                              <CommandItem
                                value="createdAt"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "createdAt");
                                  setSortOpen(false);
                                }}
                              >
                                Created At
                              </CommandItem>
                            </CommandGroup>
                          </InlineSearchField>
                        </div>
                      </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <motion.div className="mb-4" variants={itemVariants}>
          <p className="text-sm text-muted-foreground">
            {loadedCount > 0
              ? `Loaded ${loadedCount}${total ? ` of ${total}` : ""} invoices`
              : "No invoices"}
            {selectedRowIds.length > 0 && ` (${selectedRowIds.length} selected)`}
            {activeFiltersCount > 0 && " (filtered)"}
          </p>
        </motion.div>

        {/* Report Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className={`overflow-x-auto w-full transition-normal`}>
                <Table className="">
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
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">
                        Invoice Date
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Taxable Value
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        CGST
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        SGST
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        IGST
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Cess
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Scheme Amt
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Discount Amt
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Damage Amt
                      </TableHead>
                      <TableHead className="font-semibold">Remarks</TableHead>
                      <TableHead className="font-semibold text-right">
                        Final Amount
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Items
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr key="loading">
                          <TableCell colSpan={15} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading GST data...
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
                            colSpan={15}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mb-2" />
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
                        reportData.map((item, index) => (
                          <motion.tr
                            key={item.saleId}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              visible: { opacity: 1, y: 0 },
                              hover: { backgroundColor: "rgba(0,0,0,0.02)" },
                            }}
                            className={cn(
                              "group border",
                              selectedRowIds.includes(item.saleId) &&
                                "report-row-selected",
                            )}
                            layout
                          >
                            <TableCell className="text-center">
                              <Checkbox
                                className="report-checkbox"
                                checked={selectedRowIds.includes(item.saleId)}
                                onCheckedChange={(checked) =>
                                  handleSelectRow(item.saleId, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-mono font-medium text-primary">
                              {item.invoiceId}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {item.customerName ||
                                    item.customerDetails?.companyName ||
                                    item.customerDetails?.personName ||
                                    "N/A"}
                                </p>
                                {item.gstin && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    GSTIN: {item.gstin}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(item.invoiceDate)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.taxableValue)}
                            </TableCell>
                            <TableCell className="text-right text-purple-700">
                              {formatCurrency(item.cgstAmount)}
                            </TableCell>
                            <TableCell className="text-right text-purple-700">
                              {formatCurrency(item.sgstAmount)}
                            </TableCell>
                            <TableCell className="text-right text-orange-700">
                              {formatCurrency(item.igstAmount)}
                            </TableCell>
                            <TableCell className="text-right text-red-700">
                              {formatCurrency(item.cess)}
                            </TableCell>
                            <TableCell className="text-right text-blue-700">
                              {formatCurrency(item.schemeAmount || 0)}
                            </TableCell>
                            <TableCell className="text-right text-yellow-700">
                              {formatCurrency(item.discountAmount || 0)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCurrency(item.damageAmount || 0)}
                            </TableCell>
                            <TableCell
                              className="max-w-[150px] truncate"
                              title={item.remarks}
                            >
                              {item.remarks || "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-700">
                              {formatCurrency(item.finalAmount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-mono">
                                {item.itemCount}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
              <ReportInfiniteScrollFooter
                sentinelRef={sentinelRef}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadedCount={loadedCount}
                totalCount={total}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
