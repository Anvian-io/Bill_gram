import { useTheme } from "@/contexts/ThemeProvider";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Filter,
  RefreshCw,
  FileSpreadsheet,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import { CustomPagination, CustomDateInput } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// ----------------------------------------------------------------------
// Date Utilities
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function SalesGST({ isCollapsed }: { isCollapsed: boolean }) {
  const { layoutMode } = useTheme();
  // State
  const [reportData, setReportData] = useState<SalesGSTInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filters state
  const [filters, setFilters] = useState<SalesGSTFilters>({
    customerId: undefined,
    gstDetails: undefined,
    fromDate: undefined,
    toDate: undefined,
    sortBy: "invoiceDate",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });

  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  // Pagination state from API
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Hooks
  const { customers } = useActiveLists();

  // ----------------------------------------------------------------------
  // Input handlers
  // ----------------------------------------------------------------------
  const handleFromDateChange = (value: string | null) => {
    setFromDateValue(value);
    setFilters((prev) => ({
      ...prev,
      fromDate: value ? new Date(`${value}T00:00:00`) : undefined,
      page: 1,
    }));
  };

  const handleToDateChange = (value: string | null) => {
    setToDateValue(value);
    setFilters((prev) => ({
      ...prev,
      toDate: value ? new Date(`${value}T00:00:00`) : undefined,
      page: 1,
    }));
  };

  const handleFilterChange = <K extends keyof SalesGSTFilters>(
    field: K,
    value: SalesGSTFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      customerId: undefined,
      gstDetails: undefined,
      fromDate: undefined,
      toDate: undefined,
      sortBy: "invoiceDate",
      sortOrder: "desc",
      page: 1,
      limit: 10,
    });
    setFromDateValue(null);
    setToDateValue(null);
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
      page: 1,
    }));
    if (filterName === "fromDate") setFromDateValue(null);
    if (filterName === "toDate") setToDateValue(null);
  };

  // ----------------------------------------------------------------------
  // Fetch report data
  // ----------------------------------------------------------------------
  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await salesService.getSalesGST(filters);
      setReportData(response.sales);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching sales GST data:", error);
      toast.error("Failed to fetch sales GST data");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  // ----------------------------------------------------------------------
  // Download Excel
  // ----------------------------------------------------------------------
  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const blob = await salesService.downloadSalesGSTExcel({
        customerId: filters.customerId,
        gstDetails: filters.gstDetails,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

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
    if (!id) return "All Customers";
    const customer = customers.find((c) => c.id === id);
    return customer ? customer.name : "Select Customer";
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
          <Card className="overflow-hidden">
            <CardContent className="p-1">
              <div className="flex flex-col gap-4 p-1">
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Filters</h3>
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount} active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 text-muted-foreground"
                        disabled={isLoading}
                      >
                        Clear all
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="h-8"
                      disabled={isLoading}
                    >
                      {showFilters ? "Hide" : "Show"} Filters
                    </Button>
                  </div>
                </div>

                {/* Filter Controls */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                        {/* Customer */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Customer
                          </Label>
                          <InlineSearchField
                            open={customerOpen}
                            onOpenChange={setCustomerOpen}
                            displayValue={getCustomerName(filters.customerId)}
                            placeholder="Search customers..."
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
                          label="From Date"
                          value={fromDateValue}
                          onChange={handleFromDateChange}
                          placeholder="dd/mm/yyyy"
                          disabled={isLoading}
                        />

                        <CustomDateInput
                          label="To Date"
                          value={toDateValue}
                          onChange={handleToDateChange}
                          placeholder="dd/mm/yyyy"
                          disabled={isLoading}
                        />

                        {/* Sort Order */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Sort By</Label>
                          <Select
                            value={filters.sortBy}
                            onValueChange={(value) =>
                              handleFilterChange("sortBy", value)
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="invoiceDate">
                                Invoice Date
                              </SelectItem>
                              <SelectItem value="invoiceNo">
                                Invoice No
                              </SelectItem>
                              <SelectItem value="grossAmount">
                                Gross Amount
                              </SelectItem>
                              <SelectItem value="finalAmount">
                                Final Amount
                              </SelectItem>
                              <SelectItem value="createdAt">
                                Created At
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {reportData.length > 0
              ? (pagination.currentPage - 1) * pagination.limit + 1
              : 0}{" "}
            to{" "}
            {Math.min(
              pagination.currentPage * pagination.limit,
              pagination.total,
            )}{" "}
            of {pagination.total} invoices
            {activeFiltersCount > 0 && " (filtered)"}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
            <Select
              value={filters.limit?.toString()}
              onValueChange={(value) =>
                handleFilterChange("limit", Number(value))
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Report Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className={`overflow-x-auto w-full transition-normal`}>
                <Table className="">
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
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
                          <TableCell colSpan={14} className="text-center py-12">
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
                            colSpan={14}
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
                            className="group border"
                            layout
                          >
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {!isLoading && reportData.length > 0 && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CustomPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) => handleFilterChange("page", page)}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
