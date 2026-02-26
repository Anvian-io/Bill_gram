import React, { useState, useEffect, useMemo } from "react";
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
  Search,
  X,
  RefreshCw,
  FileText,
  Calendar,
  ChevronsUpDown,
  Check,
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
import { useDebounce } from "@/utils/debounce";
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
  PurchaseReportItem,
  PurchaseReportFilters,
  PurchaseRegisterData,
} from "@/types/purchase";
import PurchaseRegisterPreviewModal from "./PurchaseRegisterPreviewModal";

// ----------------------------------------------------------------------
// Date Utilities (same as Purchase component)
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
export default function PurchaseRegister() {
  // State
  const [reportData, setReportData] = useState<PurchaseReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [registerData, setRegisterData] = useState<PurchaseRegisterData | null>(
    null,
  );
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerPage, setRegisterPage] = useState(1);
  const [registerLimit] = useState(10);

  // Filters state
  const [filters, setFilters] = useState<PurchaseReportFilters>({
    fromDate: undefined,
    toDate: undefined,
    invoiceNo: "",
    supplierId: undefined,
  });

  // Local inputs for debounced fields
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const handleFromDateInputChange = (value: string) => {
    setFromDateInput(value);
    const parsed = parseDateFromString(value);
    if (parsed) {
      setFilters((prev) => ({ ...prev, fromDate: parsed }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, fromDate: undefined }));
    }
  };

  const handleFromDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, fromDate: date }));
    setFromDateInput(date ? formatDateToDisplay(date) : "");
  };

  const handleToDateInputChange = (value: string) => {
    setToDateInput(value);
    const parsed = parseDateFromString(value);
    if (parsed) {
      setFilters((prev) => ({ ...prev, toDate: parsed }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, toDate: undefined }));
    }
  };

  const handleToDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, toDate: date }));
    setToDateInput(date ? formatDateToDisplay(date) : "");
  };

  const handleFilterChange = (
    field: keyof PurchaseReportFilters,
    value: any,
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fromDate: undefined,
      toDate: undefined,
      invoiceNo: "",
      supplierId: undefined,
    });
    setInvoiceNoInput("");
    setFromDateInput("");
    setToDateInput("");
  };

  const clearFilter = (filterName: keyof PurchaseReportFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "supplierId"
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
        setFromDateInput("");
        break;
      case "toDate":
        setToDateInput("");
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
      };
      const data = await purchaseService.getPurchaseReport(apiFilters);
      setReportData(data);
      setCurrentPage(1);
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
  // Fetch register data for preview
  // --------------------------------------------------------------------
  const fetchRegister = async (page: number = 1) => {
    setRegisterLoading(true);
    try {
      const data = await purchaseService.getPurchaseRegisterPDFData(
        {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          invoiceNo: filters.invoiceNo || undefined,
          supplierId: filters.supplierId,
        },
        page,
        registerLimit,
      );
      setRegisterData(data);
      setRegisterPage(data.pagination.currentPage);
    } catch (error) {
      toast.error("Failed to load register");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleShowRegister = async () => {
    await fetchRegister(1);
    setIsPreviewOpen(true);
  };

  const handleRegisterPageChange = (newPage: number) => {
    fetchRegister(newPage);
  };

  // --------------------------------------------------------------------
  // Helper functions
  // --------------------------------------------------------------------
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== "" &&
      !(value instanceof Date && isNaN(value.getTime())),
  ).length;

  // Pagination for main table
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return reportData.slice(start, end);
  }, [reportData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, reportData.length);

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
          <div className="flex justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-heading">
                Purchase Register
              </h1>
              <motion.p
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                View purchase invoices with cash, cheque and balance details
              </motion.p>
            </div>

            {/* Export Buttons */}
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
                  disabled={
                    isLoading || reportData.length === 0 || registerLoading
                  }
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                        {/* Invoice No */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Invoice No
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by invoice no..."
                              className="pl-10"
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count and Pagination Controls */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            Showing {reportData.length > 0 ? startIndex : 0} to {endIndex} of{" "}
            {reportData.length} invoices
            {activeFiltersCount > 0 && " (filtered)"}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Report Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
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
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.tr
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
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
                        paginatedData.map((item, index) => (
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
                            className="group border"
                            layout
                          >
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {!isLoading && reportData.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </motion.div>
        )}
      </div>

      {/* Preview Modal */}
      <PurchaseRegisterPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={registerData}
        onPageChange={handleRegisterPageChange}
        currentPage={registerPage}
        filters={filters}
      />
    </motion.div>
  );
}
