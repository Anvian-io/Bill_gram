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
  Calendar,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import { CustomPagination } from "@/components/custom_ui";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { purchaseService } from "@/services/purchaseService";
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
  PurchaseGSTResponse,
  PurchaseGSTInvoice,
  PurchaseGSTFilters,
} from "@/types/purchase";

// ----------------------------------------------------------------------
// Date Utilities
// ----------------------------------------------------------------------
const parseDateFromString = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  const formats = [
    "dd/MM/yyyy",
    "dd-MM-yyyy",
    "dd.MM.yyyy",
    "dd/MM/yy",
    "yyyy-MM-dd",
  ];
  for (const fmt of formats) {
    try {
      const parsed = parse(dateString, fmt, new Date());
      if (isValid(parsed)) return parsed;
    } catch {
      // continue
    }
  }
  return undefined;
};

const formatDateToDisplay = (date: Date | undefined): string => {
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function PurchaseGST({ isCollapsed }: { isCollapsed: boolean }) {
  // State
  const [reportData, setReportData] = useState<PurchaseGSTInvoice[]>([]);
  const [summaryData, setSummaryData] = useState<
    PurchaseGSTResponse["summary"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<PurchaseGSTFilters>({
    supplierId: undefined,
    fromDate: undefined,
    toDate: undefined,
    sortBy: "invoiceDate",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });

  // Local inputs for debounced fields
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");

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
  const { suppliers } = useActiveLists();

  // ----------------------------------------------------------------------
  // Input handlers
  // ----------------------------------------------------------------------
  const handleFromDateInputChange = (value: string) => {
    setFromDateInput(value);
    const parsed = parseDateFromString(value);
    if (parsed) {
      setFilters((prev) => ({ ...prev, fromDate: parsed, page: 1 }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, fromDate: undefined, page: 1 }));
    }
  };

  const handleFromDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, fromDate: date, page: 1 }));
    setFromDateInput(date ? formatDateToDisplay(date) : "");
  };

  const handleToDateInputChange = (value: string) => {
    setToDateInput(value);
    const parsed = parseDateFromString(value);
    if (parsed) {
      setFilters((prev) => ({ ...prev, toDate: parsed, page: 1 }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, toDate: undefined, page: 1 }));
    }
  };

  const handleToDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, toDate: date, page: 1 }));
    setToDateInput(date ? formatDateToDisplay(date) : "");
  };

  const handleFilterChange = (field: keyof PurchaseGSTFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      supplierId: undefined,
      fromDate: undefined,
      toDate: undefined,
      sortBy: "invoiceDate",
      sortOrder: "desc",
      page: 1,
      limit: 10,
    });
    setFromDateInput("");
    setToDateInput("");
  };

  const clearFilter = (filterName: keyof PurchaseGSTFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "supplierId"
          ? undefined
          : filterName === "fromDate" || filterName === "toDate"
            ? undefined
            : prev[filterName],
      page: 1,
    }));
    switch (filterName) {
      case "fromDate":
        setFromDateInput("");
        break;
      case "toDate":
        setToDateInput("");
        break;
    }
  };

  // ----------------------------------------------------------------------
  // Fetch report data
  // ----------------------------------------------------------------------
  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await purchaseService.getPurchaseGST(filters);
      setReportData(response.purchases);
      setSummaryData(response.summary);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching purchase GST data:", error);
      toast.error("Failed to fetch purchase GST data");
      setReportData([]);
      setSummaryData(null);
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
      const blob = await purchaseService.downloadPurchaseGSTExcel({
        supplierId: filters.supplierId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = format(new Date(), "dd-MM-yyyy_HH-mm");
      link.href = url;
      link.setAttribute("download", `purchase-gst-report-${timestamp}.xlsx`);
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
    filters.supplierId,
    filters.fromDate,
    filters.toDate,
  ].filter((v) => v !== undefined && v !== null).length;

  const getSupplierName = (id?: number) => {
    if (!id) return "All Suppliers";
    const supplier = suppliers.find((s) => s.id === id);
    return supplier ? supplier.name : "Select Supplier";
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
            ? "max-w-5xl lg:max-w-2xl xl:max-w-7xl 2xl:max-w-9xl"
            : "max-w-9xl lg:max-w-xl xl:max-w-4xl 2xl:max-w-6xl"
        }`}
      >
        {/* Header Section */}
        <motion.div
          className="flex flex-col gap-6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-heading">
                Purchase GST Report
              </h1>
              <motion.p
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                View and export purchase invoices with GST details for tax
                reporting
              </motion.p>
            </div>

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
                        {/* Supplier */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Supplier
                          </Label>
                          <Popover
                            open={supplierOpen}
                            onOpenChange={setSupplierOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={supplierOpen}
                                className="w-full justify-between"
                                disabled={isLoading}
                              >
                                {getSupplierName(filters.supplierId)}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search suppliers..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No supplier found.
                                  </CommandEmpty>
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
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* From Date */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            From Date
                          </Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                value={fromDateInput}
                                onChange={(e) =>
                                  handleFromDateInputChange(e.target.value)
                                }
                                placeholder="dd/mm/yyyy or select"
                                className="pr-10"
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                                  >
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="end"
                                >
                                  <CalendarComponent
                                    mode="single"
                                    selected={filters.fromDate}
                                    onSelect={handleFromDateSelect}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            {fromDateInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("fromDate")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* To Date */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">To Date</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                value={toDateInput}
                                onChange={(e) =>
                                  handleToDateInputChange(e.target.value)
                                }
                                placeholder="dd/mm/yyyy or select"
                                className="pr-10"
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                                  >
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="end"
                                >
                                  <CalendarComponent
                                    mode="single"
                                    selected={filters.toDate}
                                    onSelect={handleToDateSelect}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            {toDateInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("toDate")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

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
                {/* ADDED min-w-[1400px] TO ENABLE HORIZONTAL SCROLLING */}
                <Table className="">
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">
                        Invoice No
                      </TableHead>
                      <TableHead className="font-semibold">Supplier</TableHead>
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
                      {/* NEW COLUMNS */}
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
                        <motion.tr
                          key="loading"
                          // initial={{ opacity: 0 }}
                          // animate={{ opacity: 1 }}
                          // exit={{ opacity: 0 }}
                        >
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
                            key={item.purchaseId}
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
                                    item.supplierDetails?.name ||
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
                              {formatCurrency(item.totalGSTAmount)}
                            </TableCell>
                            <TableCell className="text-right text-red-700">
                              {formatCurrency(item.cess)}
                            </TableCell>
                            {/* NEW DATA CELLS */}
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
