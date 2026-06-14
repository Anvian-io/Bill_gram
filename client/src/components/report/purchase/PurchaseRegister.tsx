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
  ChevronsUpDown,
  Check,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isValid } from "date-fns";
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
import GstDetailsFilter from "@/components/common/GstDetailsFilter";
import PurchaseRegisterPreviewModal from "./PurchaseRegisterPreviewModal";

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function PurchaseRegister() {
  // State
  const [reportData, setReportData] = useState<PurchaseReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
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
    gstDetails: undefined,
  });

  // Local inputs for debounced fields
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

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
          gstDetails: filters.gstDetails,
        },
        page,
        registerLimit,
      );
      setRegisterData(data);
      setRegisterPage(data.pagination.currentPage);
    } catch {
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
    ([, value]) =>
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

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(paginatedData.map(item => item.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRowIds(prev => [...prev, id]);
    } else {
      setSelectedRowIds(prev => prev.filter(rowId => rowId !== id));
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
          <div className="bg-white dark:bg-gray-900 border rounded-none p-2">
              <div className="flex flex-col gap-2">
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
                      <div className="flex flex-wrap items-end gap-3 pt-2">
                        {/* Invoice No */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">
                            Invoice No
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by invoice no..."
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
                          <Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">
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
                                className="w-full justify-between h-8 text-xs rounded-sm px-2"
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

                        <GstDetailsFilter
                          value={filters.gstDetails}
                          onChange={(value) =>
                            handleFilterChange("gstDetails", value)
                          }
                          disabled={isLoading}
                        />

                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <CustomDateInput
                            label="From Date"
                            value={fromDateValue}
                            onChange={handleFromDateChange}
                            placeholder="dd/mm/yyyy"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <CustomDateInput
                            label="To Date"
                            value={toDateValue}
                            onChange={handleToDateChange}
                            placeholder="dd/mm/yyyy"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
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
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          className="report-checkbox"
                          checked={selectedRowIds.length === paginatedData.length && paginatedData.length > 0}
                          onCheckedChange={handleSelectAll}
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
                          // initial={{ opacity: 0 }}
                          // animate={{ opacity: 1 }}
                          // exit={{ opacity: 0 }}
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
